'use strict'
// Daily Monster: opt-in, bounded, local health snapshots collected ONLY while the app runs.
// Never write processes, file paths, serial numbers, network addresses or raw diagnostics.
const fs=require('node:fs')
const path=require('node:path')
const VERSION=1
const MAX_DAYS=30
const CHECK_INTERVAL=30*60*1000
const MAX_SAMPLES_PER_DAY=48
const finite=(n)=>typeof n==='number'&&Number.isFinite(n)?n:null
const percent=(n)=>finite(n)===null?null:Math.round(Math.max(0,Math.min(100,n))*10)/10
const quantity=(n)=>finite(n)===null?null:Math.round(Math.max(0,n)*10)/10
const day=(t)=>{const d=new Date(t);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function defaults(){return {version:VERSION,enabled:false,notify:false,lastSavedAt:0,lastAlertDay:null,days:[]}}
function sanitizeDaily(row){
 if(!row||typeof row!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(row.day)||
   !Number.isInteger(row.samples)||row.samples<1||row.samples>MAX_SAMPLES_PER_DAY)return null
 return {day:row.day,samples:row.samples,
  lastCpu:percent(row.lastCpu),peakCpu:percent(row.peakCpu),
  lastRam:percent(row.lastRam),peakRam:percent(row.peakRam),
  lastGpu:percent(row.lastGpu),
  diskUsed:percent(row.diskUsed),diskFreeGiB:quantity(row.diskFreeGiB),
  peakTemperatureC:finite(row.peakTemperatureC)!==null&&row.peakTemperatureC>=0&&row.peakTemperatureC<=125?quantity(row.peakTemperatureC):null}
}
function load(file){
 try{
  const value=JSON.parse(fs.readFileSync(file,'utf8'))
  if(value?.version!==VERSION)return defaults()
  const rows=Array.isArray(value.days)?value.days.map(sanitizeDaily).filter(Boolean).slice(-MAX_DAYS):[]
  return {version:VERSION,enabled:value.enabled===true,notify:value.enabled===true&&value.notify===true,
   lastSavedAt:Number.isSafeInteger(value.lastSavedAt)&&value.lastSavedAt>0?value.lastSavedAt:0,
   lastAlertDay:typeof value.lastAlertDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.lastAlertDay)?value.lastAlertDay:null,
   days:rows}
 }catch{return defaults()}
}
function save(file,state){
 fs.mkdirSync(path.dirname(file),{recursive:true})
 const tmp=file+'.tmp'
 try{
  fs.writeFileSync(tmp,JSON.stringify(state),{mode:0o600,encoding:'utf8'})
  fs.renameSync(tmp,file)
 }catch(e){try{fs.rmSync(tmp,{force:true})}catch{}throw e}
}
function snapshot(metrics){
 if(!metrics||typeof metrics!=='object')return null
 return {
  cpu:percent(metrics.cpuPercent),ram:percent(metrics.ramPercent),gpu:percent(metrics.gpuPercent),
  disk:percent(metrics.diskPercent),free:quantity(metrics.diskFreeGiB),
  temperature:finite(metrics.temperatureC)!==null&&metrics.temperatureC>=0&&metrics.temperatureC<=125?quantity(metrics.temperatureC):null
 }
}
// A concrete free-space target is useful; this is not a performance guarantee.
function storageGoal(metrics){
 if(!metrics||typeof metrics!=='object')return null
 const free=finite(metrics.diskFreeGiB),total=finite(metrics.diskTotalGiB)
 if(free===null||total===null||total<=0||free<0||free>total)return null
 const target=Math.min(total,Math.max(20,total*0.15))
 return {freeGiB:quantity(free),totalGiB:quantity(total),targetFreeGiB:quantity(target),
  additionalGiB:quantity(Math.max(0,target-free)),basis:'Aim for at least 15% free, or 20 GiB on smaller drives. This is a practical maintenance target, not a guaranteed FPS improvement.'}
}
function warnings(metrics){
 const m=snapshot(metrics)
 if(!m)return []
 const list=[]
 if((m.free!==null&&m.free<10)||(m.disk!==null&&m.disk>=95)){
  list.push({id:'storage',severity:'critical',title:'Storage critically low',
   detail:(m.free===null?'Free capacity is not available.':m.free+' GiB free')+'. Review large downloads, installed apps and old temporary files.',
   action:'Review space',target:'boost'})
 }else if(m.disk!==null&&m.disk>=85){
  list.push({id:'storage',severity:'warning',title:'Storage getting full',
   detail:m.disk+'% used on the main reported volume.',action:'Review space',target:'boost'})
 }
 if(m.ram!==null&&m.ram>=90)list.push({id:'ram',severity:'warning',title:'High memory load',
  detail:'RAM usage is '+m.ram+'% in this snapshot; this can be normal while playing a game.',action:'Inspect RAM',target:'advisor'})
 if(m.cpu!==null&&m.cpu>=95)list.push({id:'cpu',severity:'info',title:'Processor busy',
  detail:'CPU usage is '+m.cpu+'% now. Check again when idle before acting.',action:'View performance',target:'performance'})
 return list
}
function updateDay(rows,m,time){
 const d=day(time),copy=rows.filter(x=>x.day!==d)
 const prev=rows.find(x=>x.day===d)
 const peak=(a,b)=>a===null?b:b===null?a:Math.max(a,b)
 const next={day:d,samples:Math.min(MAX_SAMPLES_PER_DAY,(prev?.samples||0)+1),
  lastCpu:m.cpu,peakCpu:peak(prev?.peakCpu??null,m.cpu),
  lastRam:m.ram,peakRam:peak(prev?.peakRam??null,m.ram),
  lastGpu:m.gpu,diskUsed:m.disk,diskFreeGiB:m.free,
  peakTemperatureC:peak(prev?.peakTemperatureC??null,m.temperature)}
 return [...copy,next].sort((a,b)=>a.day.localeCompare(b.day)).slice(-MAX_DAYS)
}
function createDailyMonster({file,monitor,now=()=>Date.now(),schedule=fn=>setInterval(fn,CHECK_INTERVAL),
 cancel=id=>clearInterval(id),notifier=()=>{}}={}){
 if(!file||!monitor||typeof monitor.sample!=='function')throw Error('Daily monitor dependencies missing')
 let timer=null,inFlight=null
 function status(){const prefs=load(file);return {ok:true,enabled:prefs.enabled,notify:prefs.notify,
  lastSavedAt:prefs.lastSavedAt||null,days:prefs.days,
  privacy:'Local summary percentages only, up to 30 local days. No process names, filenames, IPs, telemetry or cloud account.',
  runMode:'Collects at most once each 30 minutes while PC Doctor is open. Off by default.'}}
 async function check(){
  if(inFlight)return inFlight
  inFlight=(async()=>{
   let result
   try{result=await monitor.sample()}catch{return {ok:false,error:'Live sensors are unavailable. No history was saved.'}}
   if(!result?.ok||!result.metrics)return {ok:false,error:'Live sensor snapshot unavailable. No history was saved.'}
   const m=snapshot(result.metrics)
   if(!m)return {ok:false,error:'Metrics unavailable.'}
   const alerts=warnings(result.metrics),time=now(),prefs=load(file)
   let recorded=false,alerted=false
   if(prefs.enabled){
    if(!prefs.lastSavedAt || time-prefs.lastSavedAt>=CHECK_INTERVAL){
     prefs.days=updateDay(prefs.days,m,time);prefs.lastSavedAt=time
     recorded=true
    }
    const alertDay=day(time)
    if(prefs.notify && prefs.lastAlertDay!==alertDay && alerts.some(x=>x.id==='storage'&&x.severity==='critical')){
     prefs.lastAlertDay=alertDay;alerted=true
    }
    if(recorded||alerted){
     try{save(file,prefs)}catch{return {ok:true,metrics:m,alerts,recorded:false,warning:'Could not store local history or alert state.'}}
    }
    if(alerted)try{notifier({title:'PC Doctor: low disk space',body:'Your Windows drive is nearly full. Open PC Doctor to review safe cleanup options.'})}catch{}
   }
   return {ok:true,metrics:m,alerts,recorded,days:prefs.days}
  })()
  try{return await inFlight}finally{inFlight=null}
 }
 async function configure(options){
  if(!options||typeof options.enabled!=='boolean'||typeof options.notify!=='boolean')
   return {ok:false,error:'Choose monitoring and notifications explicitly.'}
  if(options.notify&&!options.enabled)return {ok:false,error:'Notifications require daily monitoring to be enabled.'}
  const prefs=load(file)
  prefs.enabled=options.enabled;prefs.notify=options.notify
  try{save(file,prefs)}catch{return {ok:false,error:'Could not save preferences. No monitoring enabled.'}}
  return status()
 }
 function clearHistory(){
  const prefs=load(file);prefs.days=[];prefs.lastSavedAt=0;prefs.lastAlertDay=null
  try{save(file,prefs);return status()}catch{return {ok:false,error:'Could not delete history.'}}
 }
 async function tick(){if(load(file).enabled)return check();return {ok:true,skipped:true}}
 function start(){
  if(timer)return
  timer=schedule(()=>{void tick()});timer?.unref?.()
 }
 function stop(){if(timer){cancel(timer);timer=null}}
 return {status,check,configure,clearHistory,tick,start,stop}
}
module.exports={createDailyMonster,snapshot,warnings,storageGoal,updateDay,load,save,MAX_DAYS,CHECK_INTERVAL}

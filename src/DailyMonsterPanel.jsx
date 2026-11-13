import React,{useEffect,useMemo,useState} from 'react'
import OneClickCare from './OneClickCare.jsx'
import OneClickBoost from './OneClickBoost.jsx'
import monsterArt from '../assets/pc-monster-core.svg'
import {Activity,ArrowRight,Bell,CheckCircle2,ClipboardCheck,Cpu,Gamepad2,HardDrive,MemoryStick,RefreshCcw,ShieldCheck,Trash2,TriangleAlert} from 'lucide-react'

const value=(n,suffix='')=>Number.isFinite(n)?Number(n).toFixed(Number.isInteger(n)?0:1)+suffix:'Unknown'
const sampleFromDiagnosis=data=>{
 if(!data)return null
 const disk=data.storage?.find(d=>String(d?.mount||'').toUpperCase().startsWith('C:'))||data.storage?.[0]
 const gb=n=>typeof n==='number'&&Number.isFinite(n)?Math.round(n/(1024**3)*10)/10:null
 const temperature=data.temperature?.main>0?data.temperature.main:data.temperature?.max>0?data.temperature.max:null
 return {cpu:data.cpu?.load??null,ram:data.memory?.total>0?Math.round(data.memory.used/data.memory.total*100):null,
  gpu:data.graphics?.[0]?.utilizationGpu??null,disk:disk?.use??null,free:gb(disk?.available),total:gb(disk?.size),temperature}
}
function findings(m){
 if(!m)return []
 const list=[]
 if((Number.isFinite(m.free)&&m.free<10)||(Number.isFinite(m.disk)&&m.disk>=95)){
  list.push({id:'storage',severity:'critical',title:'Low disk space',
   detail:'Your main drive is nearly full. Clearing real space is more useful than generic registry tweaks.',action:'Find space',target:'boost'})
 }else if(Number.isFinite(m.disk)&&m.disk>=85)list.push({
  id:'storage',severity:'warning',title:'Drive filling up',detail:'Review large files and Windows Storage recommendations.',action:'Review storage',target:'boost'})
 if(Number.isFinite(m.ram)&&m.ram>=90)list.push({id:'ram',severity:'warning',title:'Memory is busy',
  detail:'RAM is highly utilized in this snapshot. This may be normal while gaming.',action:'Inspect apps',target:'advisor'})
 if(Number.isFinite(m.cpu)&&m.cpu>=95)list.push({id:'cpu',severity:'info',title:'Processor is busy',
  detail:'One high-load reading is not evidence of damage.',action:'See performance',target:'performance'})
 return list
}
function Metric({Icon,label,current,note,accent}){
 return <div className={'monster-kpi '+(accent||'')}><div className="monster-kpi-label"><Icon size={16}/><span>{label}</span></div>
  <strong>{current}</strong><small>{note}</small></div>
}
function WeekBar({row}){
 const used=Number.isFinite(row.diskUsed)?Math.min(100,Math.max(0,row.diskUsed)):null
 return <div className="monster-day" aria-label={row.day+' disk used '+(used===null?'unknown':used+' percent')+'; '+row.samples+' readings'}>
  <div className="monster-day-track"><span style={{height:(used===null?5:Math.max(8,used))+'%'}}/></div>
  <small>{row.day.slice(5)}</small>
 </div>
}
export default function DailyMonsterPanel({demo,data,onNavigate,onRescan}){
 const supported=!demo&&!!window.doctor?.getDailyStatus&&!!window.doctor?.checkDailyHealth
 const [prefs,setPrefs]=useState({enabled:false,notify:false,days:[]})
 const [metrics,setMetrics]=useState(null)
 const [reportedGoal,setReportedGoal]=useState(null)
 const [busy,setBusy]=useState(false)
 const [status,setStatus]=useState('')
 const [confirmClear,setConfirmClear]=useState(false)
 const sample=useMemo(()=>sampleFromDiagnosis(data),[data])
 const current=metrics||sample
 const goal=useMemo(()=>{
  if(reportedGoal&&Number.isFinite(reportedGoal.additionalGiB))return reportedGoal
  const free=sample?.free,total=sample?.total
  if(!Number.isFinite(free)||!Number.isFinite(total)||total<=0||free<0||free>total)return null
  const target=Math.min(total,Math.max(20,total*0.15))
  return {additionalGiB:Math.round(Math.max(0,target-free)*10)/10,targetFreeGiB:Math.round(target*10)/10}
 },[reportedGoal,sample])
 const hasReadings=!!current && [current.cpu,current.ram,current.gpu,current.disk,current.free].some(Number.isFinite)
 const alerts=useMemo(()=>findings(current),[current])
 const top=alerts.find(x=>x.severity==='critical')||alerts[0]
 const history=Array.isArray(prefs.days)?prefs.days.slice(-14):[]
 const totalSamples=history.reduce((n,d)=>n+d.samples,0)
 async function load(){
  if(!supported)return
  try{
   const [p,r]=await Promise.all([window.doctor.getDailyStatus(),window.doctor.checkDailyHealth()])
   if(p.ok)setPrefs(p)
   if(r.ok){setMetrics(r.metrics);setReportedGoal(r.storageGoal||null)}
   if(!r.ok)setStatus(r.error||'Could not read current sensors.')
  }catch{setStatus('Local daily health information is temporarily unavailable.')}
 }
 useEffect(()=>{load()},[supported])
 async function refresh(){
  if(!supported||busy)return
  setBusy(true);setStatus('Reading current CPU, GPU, memory and storage…')
  try{
   const [r,p]=await Promise.all([window.doctor.checkDailyHealth(),window.doctor.getDailyStatus()])
   if(r.ok){setMetrics(r.metrics);setReportedGoal(r.storageGoal||null);setStatus(r.recorded?'New opt-in health snapshot saved locally.':'Checked. History is disabled or the sampling interval has not elapsed.')}
   else setStatus(r.error||'Could not check health.')
   if(p.ok)setPrefs(p)
  }catch{setStatus('Could not update health readings. No settings were changed.')}
  finally{setBusy(false)}
 }
 async function configure(enabled,notify){
  if(!supported||busy)return
  setBusy(true);setStatus('')
  try{
   const r=await window.doctor.configureDailyHealth({enabled,notify})
   if(r.ok){setPrefs(r);setStatus(enabled?'Local daily monitoring enabled. Readings are collected only while this app is open.':'Daily history monitoring disabled. Old summaries remain until deleted.')
     if(enabled){const check=await window.doctor.checkDailyHealth();if(check.ok){setMetrics(check.metrics);setReportedGoal(check.storageGoal||null)}const next=await window.doctor.getDailyStatus();if(next.ok)setPrefs(next)}
   }else setStatus(r.error||'Could not update daily monitoring.')
  }catch{setStatus('Monitoring settings were not saved.')}
  finally{setBusy(false)}
 }
 async function erase(){
  if(!confirmClear){setConfirmClear(true);return}
  if(!supported)return
  setConfirmClear(false);setBusy(true)
  try{
   const r=await window.doctor.clearDailyHistory()
   if(r.ok){setPrefs(r);setStatus('Saved daily performance summaries were deleted from this Windows profile.')}
   else setStatus(r.error||'Could not clear history.')
  }catch{setStatus('Could not clear history.')}
  finally{setBusy(false)}
 }
 function navigate(target){
  onNavigate(target)
  if(target==='boost'&&top?.id==='storage'){
   // The in-app Space Finder is on Boost & Play; user reviews and approves deletion.
  }
 }
 return <><section className="monster-panel" aria-label="Daily Monster performance overview">
  <div className="monster-top">
   <div><p className="eyebrow"><Activity size={15}/> DVILR PC MONSTER · DAILY CONTROL CENTER</p>
    <h2>Keep your PC ready for today.</h2>
    <p>One place for real resource pressure, gaming sessions and safe storage care. No fake FPS claims or hidden system tweaks.</p>
   </div>
   <img className="monster-dashboard-art" src={monsterArt} alt="PC Monster performance chip illustration" loading="lazy"/>
   <div className={'monster-status '+(hasReadings?(top?.severity||'okay'):'unknown')}>
    {top?.severity==='critical'?<TriangleAlert size={17}/>:<ShieldCheck size={17}/>}
    <strong>{!hasReadings?'Awaiting readings':top?.severity==='critical'?'Action needed':top?'Review suggestion':'No major threshold warning'}</strong>
    <small>Snapshot, not a hardware health certification</small>
   </div>
  </div>
  <div className="monster-metrics">
   <Metric Icon={Cpu} label="CPU" current={value(current?.cpu,'%')} note="Current load" accent={current?.cpu>=95?'warning':''}/>
   <Metric Icon={MemoryStick} label="RAM" current={value(current?.ram,'%')} note="Memory in use" accent={current?.ram>=90?'warning':''}/>
   <Metric Icon={Gamepad2} label="GPU" current={value(current?.gpu,'%')} note="Reported adapter activity"/>
   <Metric Icon={HardDrive} label="Free storage" current={value(current?.free,' GiB')} note="Main reported volume" accent={top?.id==='storage'?'warning':''}/>
  </div>
  <div className="monster-action-row">
   {!hasReadings?<div className="monster-advice neutral"><Activity size={19}/><div><strong>Run a health check</strong><p>Sensor readings are not available yet. An unknown value is not evidence that your computer is healthy.</p></div></div>:
   top?<div className="monster-advice"><TriangleAlert size={19}/><div><strong>{top.title}</strong><p>{top.detail}</p></div></div>:
    <div className="monster-advice neutral"><CheckCircle2 size={19}/><div><strong>Start with a real workload</strong><p>Play or work normally, then check whether CPU, memory or storage becomes a constraint.</p></div></div>}
   <div className="monster-buttons">
    {top?.id==='storage'&&goal&&goal.additionalGiB>0&&
      <div className="monster-storage-goal" role="note"><strong>Storage goal: free about {value(goal.additionalGiB,' GiB')}</strong>
       <small>Target: {value(goal.targetFreeGiB,' GiB')} available. A maintenance guideline, not an FPS guarantee. Review files before removal.</small></div>}
    <button type="button" className="monster-primary" onClick={()=>navigate(top?.target||'boost')}>
     {top?<ClipboardCheck size={17}/>:<Gamepad2 size={17}/>} {top?.action||'Boost & Play'} <ArrowRight size={15}/>
    </button>
    <button type="button" className="monster-secondary" onClick={()=>onNavigate('boost')}><HardDrive size={16}/> Boost & cleanup</button>
    <button type="button" className="monster-secondary" onClick={refresh} disabled={!supported||busy}><RefreshCcw size={15}/>{busy?'Checking…':'Check now'}</button>
   </div>
  </div>
  <details className="monster-daily" >
   <summary><span><Bell size={16}/> Daily monitoring & private trends</span><small>{prefs.enabled?'On — app open only':'Off by default'}</small></summary>
   <div className="monster-daily-content">
    <div className="monster-monitor-switches">
     <label><input type="checkbox" disabled={!supported||busy} checked={prefs.enabled} onChange={e=>configure(e.target.checked,false)}/>
      Save local daily summaries while PC Doctor is open</label>
     <label><input type="checkbox" disabled={!supported||busy||!prefs.enabled} checked={prefs.notify} onChange={e=>configure(true,e.target.checked)}/>
      One daily Windows notification for critically low storage</label>
    </div>
    <p>At most one saved reading every 30 minutes and 30 days of history. Saved data includes only numeric usage and free-space values—no personal filenames, process names, serial numbers, IP addresses or cloud sync.</p>
    {history.length?<div className="monster-history">
      <div><strong>Recent storage usage</strong><small>{history.length} local day{history.length===1?'':'s'} · {totalSamples} snapshot{totalSamples===1?'':'s'} · UTC-independent local day grouping</small></div>
      <div className="monster-bars">{history.map(r=><WeekBar key={r.day} row={r}/>)}</div>
      <div className="monster-history-actions"><button type="button" disabled={busy} onClick={erase}><Trash2 size={14}/>{confirmClear?'Confirm delete local history':'Delete history'}</button>
       {confirmClear&&<button type="button" onClick={()=>setConfirmClear(false)}>Cancel</button>}
      </div>
     </div>:<p className="monster-no-history">No daily history saved. Opt in to start recording future snapshots; your existing scans remain available.</p>}
    <p><ShieldCheck size={15}/> Monitoring ends when you close PC Doctor. No autonomous file removal or system-wide process termination.</p>
   </div>
  </details>
  {status&&<p className="monster-message" role="status">{status}</p>}
  {demo&&<p className="monster-message">Demo values are simulated. Daily monitoring is supported only in the Windows desktop app.</p>}
 </section>
 <OneClickCare demo={demo} onRescan={onRescan}/>
 <OneClickBoost demo={demo} onNavigate={onNavigate}/>
 </>
}

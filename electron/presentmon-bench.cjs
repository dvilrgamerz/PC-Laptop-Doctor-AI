'use strict'
// PresentMon CSV analysis. Locally imported CSVs only; no capture/elevation/cloud.
// This measures presented-frame intervals, not displayed frames or game latency.
const fs=require('node:fs')
const MAX_FILE_BYTES=32*1024*1024
const MAX_ROWS=350000
const MIN_FRAMES=180
function csvRows(text){
 const rows=[]
 let row=[],field='',quote=false
 for(let i=0;i<text.length;i++){
  const c=text[i]
  if(quote){
   if(c==='"'&&text[i+1]==='"'){field+='"';i++}
   else if(c==='"')quote=false
   else field+=c
  }else if(c==='"'){if(field!=='')throw Error('Malformed CSV quote');quote=true}
  else if(c===','){row.push(field);field=''}
  else if(c==='\n'||c==='\r'){
   if(c==='\r'&&text[i+1]==='\n')i++
   row.push(field);field=''
   if(row.some(s=>s.trim()))rows.push(row)
   row=[]
   if(rows.length>MAX_ROWS+1)throw Error('Capture has too many frames')
  }else field+=c
 }
 if(quote)throw Error('Unclosed CSV quote')
 if(field||row.length){row.push(field);if(row.some(s=>s.trim()))rows.push(row)}
 return rows
}
function percentile(sorted,p){
 const i=(sorted.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i)
 return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo)
}
function num(n,digits=2){return Number(n.toFixed(digits))}
function analyzePresentMonCsv(data){
 if(typeof data!=='string'||Buffer.byteLength(data,'utf8')>MAX_FILE_BYTES)
  throw Error('Capture exceeds 32 MB or is not valid text')
 const rows=csvRows(data.replace(/^\uFEFF/,''))
 if(rows.length<MIN_FRAMES+1)throw Error('Capture is too short: at least 180 frame samples required')
 const h=rows[0].map(s=>s.trim())
 const columns=['MsBetweenPresents','FrameTime']
 const ix=columns.map(k=>h.indexOf(k)).find(i=>i>=0)
 if(ix===undefined)throw Error('Missing PresentMon frame-interval column (MsBetweenPresents or FrameTime)')
 const appIx=h.indexOf('Application'),pidIx=h.indexOf('ProcessID'),chainIx=h.indexOf('SwapChainAddress')
 if(appIx<0)throw Error('Expected a PresentMon Application column')
 // Group by application, PID and swap chain; mixing processes invalidates FPS.
 const groups=new Map()
 let invalid=0
 for(const row of rows.slice(1)){
  if(row.length!==h.length){invalid++;continue}
  const interval=Number(row[ix])
  if(!Number.isFinite(interval)||interval<=0||interval>1500){invalid++;continue}
  const name=row[appIx].trim().slice(0,180)
  if(!/^[^\r\n]{1,180}[.]exe$/i.test(name)){invalid++;continue}
  const pid=pidIx>=0?row[pidIx].trim():'unknown'
  if(pidIx>=0&&!/^\d{1,10}$/.test(pid)){invalid++;continue}
  const chain=chainIx>=0?row[chainIx].trim():'default'
  const key=JSON.stringify([name.toLowerCase(),pid,chain])
  if(!groups.has(key))groups.set(key,{app:name,pid,intervals:[]})
  groups.get(key).intervals.push(interval)
 }
 const largest=[...groups.values()].sort((a,b)=>b.intervals.length-a.intervals.length)[0]
 if(!largest||largest.intervals.length<MIN_FRAMES)throw Error('No single game process/swap chain has 180 usable frames')
 const selected=largest.intervals
 const sorted=[...selected].sort((a,b)=>a-b)
 const sum=selected.reduce((n,x)=>n+x,0)
 const tail=(pct)=>{
  const n=Math.max(1,Math.ceil(sorted.length*pct))
  const slow=sorted.slice(-n)
  return 1000/(slow.reduce((a,b)=>a+b,0)/slow.length)
 }
 const median=percentile(sorted,0.5),p99=percentile(sorted,0.99)
 const groupsFrames=[...groups.values()].reduce((a,b)=>a+b.intervals.length,0)
 return Object.freeze({
  application:largest.app,processId:largest.pid,frameColumn:h[ix],frames:selected.length,
  ignoredOtherSwapChains:groupsFrames-selected.length,rejectedRows:invalid,
  durationSec:num(sum/1000,1),
  avgFPS:num(1000*selected.length/sum),
  medianFPS:num(1000/median),
  low1FPS:num(tail(0.01)),low01FPS:num(tail(0.001)),
  p95Ms:num(percentile(sorted,.95)),p99Ms:num(p99),
  medianMs:num(median),
  stutters:selected.filter(x=>x>Math.max(50,median*2)).length,
  warning:'Present intervals from one process/swap chain. Results are not displayed FPS or a causal boost measurement; use repeated matched A/B runs.'
 })
}
function compareCaptures(base,boost){
 if(!base||!boost)throw Error('Both captures are required')
 if(base.application.toLowerCase()!==boost.application.toLowerCase())throw Error('Captures must belong to the same game executable')
 const pct=(a,b)=>a>0?num((b-a)/a*100,2):null
 return {application:base.application,
  avgFPSPct:pct(base.avgFPS,boost.avgFPS),low1Pct:pct(base.low1FPS,boost.low1FPS),
  p99MsPct:pct(base.p99Ms,boost.p99Ms),
  baseline:base,boosted:boost,
  limitations:'Single-run difference only; thermal drift, game scenes and randomness are uncontrolled. Repeat A/B/A/B with the same scene before treating a change as real.'}
}
async function analyzeCsvFile(file){
 const stat=await fs.promises.stat(file)
 if(!stat.isFile()||stat.size>MAX_FILE_BYTES)throw Error('Select a PresentMon CSV file smaller than 32 MB')
 return analyzePresentMonCsv(await fs.promises.readFile(file,'utf8'))
}
function createBenchmarkService({choose,read=analyzeCsvFile}={}){
 if(typeof choose!=='function')throw Error('File-picker dependency required')
 let baseline=null,boosted=null
 return {
  status(){return {ok:true,baseline,boosted,comparison:baseline&&boosted?compareCaptures(baseline,boosted):null}},
  async import(mode){
   if(!['baseline','boosted'].includes(mode))return {ok:false,error:'Invalid capture mode'}
   try{
    const file=await choose()
    if(!file)return {ok:false,canceled:true,error:'No file selected'}
    if(typeof file!=='string'||!/\.csv$/i.test(file))return {ok:false,error:'Select a .csv capture'}
    const result=await read(file)
    if(mode==='baseline')baseline=result;else boosted=result
    const current=this.status()
    return current
   }catch(e){return {ok:false,error:String(e.message||e).slice(0,220)}}
  },
  reset(){baseline=null;boosted=null;return this.status()}
 }
}
module.exports={analyzePresentMonCsv,compareCaptures,createBenchmarkService,analyzeCsvFile,MIN_FRAMES}

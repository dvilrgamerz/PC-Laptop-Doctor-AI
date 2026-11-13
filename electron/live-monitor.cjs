'use strict'
// Live metrics are read-only, local and polled only while a user-facing panel is mounted.
// No process names, IP addresses, serial numbers, persistence, telemetry or remote requests.
const MIN_INTERVAL_MS=5500
const GIB=1024**3
const finite=n=>typeof n==='number'&&Number.isFinite(n)?n:null
const clampPercent=n=>finite(n)===null?null:Math.round(Math.max(0,Math.min(100,n))*10)/10
const decimals=n=>finite(n)===null?null:Math.round(n*10)/10
function summarize({load,mem,disks,temperature,network,graphics}={}){
 const total=finite(mem?.total),used=finite(mem?.used)
 const ram=total>0&&used!==null ? clampPercent(100*used/total) : null
 const allDisks=(Array.isArray(disks)?disks:[]).filter(d=>finite(d?.size)>0)
 const windowsSystem=(process.env.SystemDrive||'C:').replace(/[\\\/]+$/,'').toLowerCase()
 let disk=allDisks.find(d=>String(d.mount||'').replace(/[\\\/]+$/,'').toLowerCase()===windowsSystem)
 if(!disk)disk=allDisks.find(d=>String(d.mount||'').toLowerCase().startsWith('c:'))||allDisks[0]
 const driveTotal=finite(disk?.size),driveAvailable=finite(disk?.available)
 const diskUsed=driveTotal>0 ? (finite(disk?.use)!==null?clampPercent(disk.use):
   (driveAvailable!==null?clampPercent(100*(driveTotal-driveAvailable)/driveTotal):null)) : null
 const mainTemp=finite(temperature?.main)
 const maxTemp=finite(temperature?.max)
 const t=[mainTemp,maxTemp].find(v=>v!==null&&v>=0&&v<=125)||null
 const controllers=Array.isArray(graphics?.controllers)?graphics.controllers:[]
 const gpuReadings=controllers.map(g=>finite(g?.utilizationGpu)).filter(v=>v!==null&&v>=0&&v<=100)
 const gpuPercent=gpuReadings.length?clampPercent(Math.max(...gpuReadings)):null
 const net=Array.isArray(network)?network[0]:network
 const down=finite(net?.rx_sec),up=finite(net?.tx_sec)
 return {
  at:new Date().toISOString(),
  cpuPercent:clampPercent(load?.currentLoad),
  gpuPercent,
  ramPercent:ram,
  ramTotalGiB:total>0?decimals(total/GIB):null,
  ramAvailableGiB:finite(mem?.available)!==null?decimals(mem.available/GIB):null,
  diskPercent:diskUsed,
  diskFreeGiB:driveAvailable!==null?decimals(driveAvailable/GIB):null,
  diskTotalGiB:driveTotal!==null?decimals(driveTotal/GIB):null,
  temperatureC:t,
  networkDownKib:down!==null?decimals(Math.max(0,down)/1024):null,
  networkUpKib:up!==null?decimals(Math.max(0,up)/1024):null
 }
}
function classify(metrics){
 const findings=[]
 if(metrics.diskPercent!==null&&(metrics.diskPercent>=95||(metrics.diskFreeGiB!==null&&metrics.diskFreeGiB<10))) {
  findings.push({id:'storage',severity:'critical',title:'Very low free storage',
   message:'Your drive is '+metrics.diskPercent+'% used with '+(metrics.diskFreeGiB??'unknown')+' GiB free. Freeing substantial space matters more than speculative gaming tweaks.',
   action:'Review safe cleanup',target:'boost'})
 }else if(metrics.diskPercent!==null&&metrics.diskPercent>=85){
  findings.push({id:'storage',severity:'warning',title:'Storage is getting full',
   message:metrics.diskPercent+'% of your main drive is occupied.',action:'Review cleanup',target:'boost'})
 }
 if(metrics.ramPercent!==null&&metrics.ramPercent>=90){
  findings.push({id:'ram',severity:'warning',title:'High RAM usage',
   message:metrics.ramPercent+'% of memory is occupied in this snapshot. Check demanding apps and browser tabs.',
   action:'Inspect applications',target:'advisor'})
 }
 if(metrics.cpuPercent!==null&&metrics.cpuPercent>=95){
  findings.push({id:'cpu',severity:'warning',title:'CPU is near full load',
   message:'CPU usage is '+metrics.cpuPercent+'% right now; repeat readings under the same workload before drawing conclusions.',
   action:'Inspect performance',target:'performance'})
 }
 return findings.slice(0,3)
}
function createLiveMonitor({si,now=()=>Date.now(),intervalMs=MIN_INTERVAL_MS}={}){
 if(!si||typeof si.currentLoad!=='function'||typeof si.mem!=='function'||typeof si.fsSize!=='function')throw Error('Missing local hardware collector')
 let last=null,at=-Infinity,inFlight=null
 const readSafe=async fn=>{try{return await fn()}catch{return null}}
 async function sample(){
  if(last&&now()-at<intervalMs)return {ok:true,cached:true,...last}
  if(inFlight)return inFlight
  inFlight=(async()=>{
   const [load,mem,disks,temperature,network,graphics] = await Promise.all([
    readSafe(()=>si.currentLoad()),readSafe(()=>si.mem()),readSafe(()=>si.fsSize()),
    typeof si.cpuTemperature==='function'?readSafe(()=>si.cpuTemperature()):null,
    typeof si.networkStats==='function'?readSafe(()=>si.networkStats()):null,
    typeof si.graphics==='function'?readSafe(()=>si.graphics()):null
   ])
   const metrics=summarize({load,mem,disks,temperature,network,graphics})
   const result={metrics,findings:classify(metrics)}
   last=result;at=now()
   return {ok:true,cached:false,...result}
  })()
  try{return await inFlight}finally{inFlight=null}
 }
 return {sample}
}
module.exports={createLiveMonitor,summarize,classify,MIN_INTERVAL_MS}

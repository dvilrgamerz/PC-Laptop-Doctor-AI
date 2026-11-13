import React,{useEffect,useMemo,useState} from 'react'
import {Activity,AlertTriangle,CheckCircle2,Cpu,HardDrive,MemoryStick,Network,RefreshCcw,Thermometer} from 'lucide-react'

const PER=8_000
const fmt=(n,suffix)=>Number.isFinite(n)?Number(n).toFixed(Number.isInteger(n)?0:1)+suffix:'Not available'
function Trend({points,label}){
 return <div className="live-trend" aria-label={label+' trend over the last '+points.length+' samples'}>
  {points.slice(-18).map((v,i)=><div key={i} className="live-trend-bar" style={{height:(Number.isFinite(v)?Math.max(7,Math.min(100,v)):6)+'%'}}
   aria-hidden="true"/>)}
 </div>
}
function Metric({icon:Icon,label,value,sub,points,warning,critical}){
 return <article className={'live-metric '+(critical?'critical':warning?'warning':'')}>
  <div className="live-metric-header"><span><Icon size={17}/> {label}</span>{critical?<strong>Attention</strong>:null}</div>
  <div className="live-metric-body"><strong>{value}</strong><small>{sub}</small></div>
  <Trend points={points} label={label}/>
 </article>
}
export default function LiveMonitorPanel({demo,data,onNavigate}){
 const desktop=!demo&&!!window.doctor?.getLiveMonitor
 const [snapshot,setSnapshot]=useState(null)
 const [samples,setSamples]=useState([])
 const [status,setStatus]=useState('')
 const [busy,setBusy]=useState(false)
 useEffect(()=>{
  if(!desktop)return undefined
  let stopped=false,inFlight=false
  const fetch=async()=>{
   if(inFlight||stopped)return
   inFlight=true
   try{
    const r=await window.doctor.getLiveMonitor()
    if(stopped)return
    if(r.ok&&r.metrics){
     setSnapshot(r)
     setSamples(prev=>[...prev,r.metrics].slice(-20))
     setStatus('')
    } else setStatus(r.error||'Live metrics are unavailable.')
   }catch{if(!stopped)setStatus('Live readings are temporarily unavailable. No settings were changed.')}
   finally{inFlight=false}
  }
  fetch()
  const handle=setInterval(fetch,PER)
  return()=>{stopped=true;clearInterval(handle)}
 },[desktop])
 const m=snapshot?.metrics
 const sample=data&&demo?{
  cpuPercent:data.cpu?.load,ramPercent:data.memory?.total>0?100*data.memory.used/data.memory.total:null,
  diskPercent:data.storage?.[0]?.use,
  diskFreeGiB:Number.isFinite(data.storage?.[0]?.available)?data.storage[0].available/(1024**3):null,
  temperatureC:data.temperature?.main>0?data.temperature.main:null
 }:null
 const current=m||sample
 const alerts=snapshot?.findings||[]
 const progress=useMemo(()=>({
  cpu:samples.map(x=>x.cpuPercent),ram:samples.map(x=>x.ramPercent),
  storage:samples.map(x=>x.diskPercent),temperature:samples.map(x=>x.temperatureC!==null?x.temperatureC/100*100:null)
 }),[samples])
 function go(f){
  if(f.target==='boost'){
   const node=document.getElementById('space-finder')||document.getElementById('v7-cleanup')
   if(node){node.scrollIntoView({behavior:'smooth',block:'start'});return}
  }
  onNavigate(f.target)
 }
 return <section className="panel live-panel" aria-label="Local PC resource monitor">
  <div className="live-head">
   <div className="live-title"><div className="live-title-icon"><Activity size={21}/></div>
    <div><p className="eyebrow">YOUR COMPUTER · RIGHT NOW</p><h2>Live PC monitor</h2>
     <p>Current usage, pressure points and changes over time. Nothing is automatically modified.</p></div>
   </div>
   <span className={'live-status '+(desktop?'enabled':'')}><span className="live-dot"/>{desktop?'Refreshes every 8 seconds':demo?'Sample values':'Desktop only'}</span>
  </div>
  <div className="live-grid">
   <Metric icon={Cpu} label="CPU" value={fmt(current?.cpuPercent,'%')} sub="Processor load" points={progress.cpu} warning={current?.cpuPercent>=90}/>
   <Metric icon={MemoryStick} label="Memory" value={fmt(current?.ramPercent,'%')} sub="RAM in use" points={progress.ram} warning={current?.ramPercent>=85}/>
   <Metric icon={HardDrive} label="Storage" value={fmt(current?.diskPercent,'%')} sub={Number.isFinite(current?.diskFreeGiB)?fmt(current.diskFreeGiB,' GiB free'):'Drive capacity unknown'}
     points={progress.storage} warning={current?.diskPercent>=85} critical={current?.diskPercent>=95}/>
   <Metric icon={Thermometer} label="CPU temperature" value={fmt(current?.temperatureC,'°C')} sub="Only when sensor is available"
      points={progress.temperature} warning={current?.temperatureC>=90}/>
  </div>
  {desktop&&m&&<div className="live-traffic">
   <Network size={16}/><span>Network traffic</span>
   <strong>Down {fmt(m.networkDownKib,' KiB/s')}</strong><strong>Up {fmt(m.networkUpKib,' KiB/s')}</strong>
   <small>{new Date(m.at).toLocaleTimeString()} · readings stay on this PC</small>
  </div>}
  {!!alerts.length&&<div className="live-findings" role="status">
   {alerts.map(f=><div className={'live-finding '+f.severity} key={f.id}>
    <AlertTriangle size={18}/><div><strong>{f.title}</strong><p>{f.message}</p></div>
    <button type="button" onClick={()=>go(f)}>{f.action}</button>
   </div>)}
  </div>}
  {desktop&&!alerts.length&&m&&<p className="live-neutral"><CheckCircle2 size={16}/> No high-pressure CPU, RAM or storage thresholds detected in this snapshot. This does not rule out hardware faults.</p>}
  {status&&<p className="live-feedback" role="status">{status}</p>}
  {!desktop&&<p className="live-feedback">The browser preview uses example readings. Run the Windows application for live measurements.</p>}
  <p className="live-footnote">Readings are snapshots and can change rapidly. No network ping sweep, application termination, cloud upload or persistent monitoring history is performed here. Device temperature may be unavailable.</p>
 </section>
}

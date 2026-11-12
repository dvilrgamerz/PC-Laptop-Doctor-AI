import React, { useEffect, useMemo, useState } from 'react'
import MaintenancePanel from './MaintenancePanel.jsx'
import { AlertTriangle, ArrowUpRight, BatteryCharging, CheckCircle2, Cpu, Gamepad2, HardDrive, MemoryStick, MonitorCog, RotateCcw, ShieldCheck, SlidersHorizontal, Wrench } from 'lucide-react'

const GUIDED = [
  { id:'storage', icon:HardDrive, title:'Free up drive space', subtitle:'Review Windows cleanup recommendations. You choose what is removed.' },
  { id:'installedApps', icon:HardDrive, title:'Review installed apps', subtitle:'Uninstall only software you recognize and no longer need.' },
  { id:'startup', icon:MemoryStick, title:'Review startup programs', subtitle:'Disable unnecessary startup apps manually; never close essential services.' },
  { id:'taskManager', icon:Cpu, title:'Find demanding applications', subtitle:'Inspect CPU and RAM usage. Save work before ending any task.' },
  { id:'gameMode', icon:Gamepad2, title:'Windows Game Mode settings', subtitle:'Inspect the built-in gaming preferences in Windows.' },
  { id:'graphics', icon:MonitorCog, title:'Per-game graphics settings', subtitle:'Choose GPU preferences for individual games when available.' },
  { id:'power', icon:BatteryCharging, title:'Power settings', subtitle:'Review energy or power mode options available on this device.' },
  { id:'windowsUpdate', icon:SlidersHorizontal, title:'Windows Update', subtitle:'Review supported Windows, security and driver updates.' },
  { id:'networkStatus', icon:MonitorCog, title:'Network status', subtitle:'Inspect connection details and troubleshoot Windows network adapters.' },
  { id:'networkTroubleshoot', icon:Wrench, title:'Windows troubleshooters', subtitle:'Launch built-in repair guidance; no automatic network reset by PC Doctor.' },
  { id:'systemProtection', icon:ShieldCheck, title:'Create a restore point', subtitle:'Open System Protection. You choose whether to enable it and create a restore point.' },
  { id:'storageSense', icon:HardDrive, title:'Storage Sense settings', subtitle:'Review temporary-file cleanup choices before allowing Windows to remove files.' }
]
const AUTO = [
  {id:'enableGameMode',undo:'restoreGameMode',title:'Enable Windows Game Mode',icon:Gamepad2,
    summary:'Turn on the documented current-user Game Mode switch. Save the original setting so it can be restored.',
    risk:'This modifies one Windows Game Mode registry preference. It may already be on; enabling it does not guarantee higher FPS.'},
  {id:'enablePerformance',undo:'restorePerformance',title:'High performance power plan',icon:BatteryCharging,
    summary:'If the existing High performance plan is available, temporarily switch to it and save the previous plan.',
    risk:'Can use more electricity and increase heat or fan noise. Requires AC power on laptops. Restore after gaming.'}
]
const fmt=n=>Number.isFinite(Number(n))?Math.round(Number(n))+'%':'Unknown'
function priorities(data) {
  if(!data)return [{title:'Run a diagnosis first',detail:'Results will prioritize storage, memory and CPU before optional gaming tweaks.',kind:'info',action:null}]
  const result=[]
  const disks=Array.isArray(data.storage)?data.storage:[]
  const nearlyFull=disks.filter(d=>d?.size>0 && Number(d.use)>=90)
  if(nearlyFull.length){
    const worst=[...nearlyFull].sort((a,b)=>Number(b.use)-Number(a.use))[0]
    const free=Number.isFinite(Number(worst.available))?(Number(worst.available)/(1024**3)).toFixed(1)+' GiB free':'Free space not available'
    result.push({title:'Storage is nearly full',detail:(worst.mount||'A drive')+' is '+fmt(worst.use)+' used ('+free+'). Start here before gaming adjustments.',kind:'urgent',action:'storage'})
  }
  const mem=data.memory||{}
  const load=mem.total>0 ? mem.used/mem.total*100 : null
  if(load!==null&&load>=85)result.push({title:'High memory pressure',detail:fmt(load)+' of RAM used. Inspect running apps and restart unnecessary background software after saving work.',kind:'urgent',action:'taskManager'})
  const cpu=Number(data.cpu?.load)
  if(Number.isFinite(cpu)&&cpu>=90)result.push({title:'Heavy processor load',detail:'CPU was at '+fmt(cpu)+' in the last scan. Check Task Manager for sustained load; one snapshot cannot identify the cause.',kind:'warn',action:'taskManager'})
  const reportedTemp=Number(data.temperature?.main || data.temperature?.max)
  if(!Number.isFinite(reportedTemp)||reportedTemp<=0)result.push({title:'CPU temperature unavailable',detail:'This machine did not expose a temperature reading. Do not assume cooling is fine or enable aggressive tuning without monitoring.',kind:'info',action:null})
  if(result.length===0)result.push({title:'No major storage or memory alerts',detail:'Gaming switches may be useful for configuration, but a measured FPS increase is not guaranteed.',kind:'good',action:'gameMode'})
  return result
}
export default function FixCenter({data,demo}) {
  const [notice,setNotice]=useState('')
  const [waiting,setWaiting]=useState('')
  const [confirm,setConfirm]=useState(null)
  const [status,setStatus]=useState(null)
  const available = !demo && !!window.doctor?.getFixStatus && !!window.doctor?.runFix && !!window.doctor?.openSettings
  const tasks=useMemo(()=>priorities(data),[data])
  async function refresh(){
    if(!available)return
    try{const result=await window.doctor.getFixStatus();setStatus(result)}catch{setNotice('Could not read current Windows settings. No changes were made.')}
  }
  useEffect(()=>{refresh()},[available])
  async function openPage(id){
    if(!available){setNotice('Windows Settings shortcuts require the installed PC Laptop Doctor AI application.');return}
    setWaiting(id);setNotice('')
    try{const result=await window.doctor.openSettings(id);setNotice(result.ok?'Windows settings window requested.':'Unable to open Windows settings: '+(result.error||'Unknown error'))}
    catch{setNotice('Windows Settings could not be opened.')}
    finally{setWaiting('')}
  }
  async function apply(action){
    if(!available){setNotice('Changes are disabled in the sample web preview.');return}
    setWaiting(action);setNotice('');setConfirm(null)
    try{
      const result=await window.doctor.runFix(action)
      setNotice(result.ok ? result.message : 'No changes applied: '+(result.error||'Unknown error'))
      await refresh()
    }catch{setNotice('The Windows action failed. Check your current settings before retrying.')}
    finally{setWaiting('')}
  }
  return <div className="fix-center">
    <div className="fix-hero">
      <div><p className="eyebrow">FIX & GAMING CENTER</p><h2>Improve what actually limits your PC.</h2>
        <p>Start with the scan findings. Apply only the settings you approve. No registry cleaners, fake RAM boosters, automatic file deletion or forced process termination.</p>
        <div className="fix-badges"><span><ShieldCheck size={14}/> Consent required</span><span><RotateCcw size={14}/> Reversible changes</span><span><Wrench size={14}/> Windows-only</span></div>
      </div><div className="fix-hero-mark"><Gamepad2 size={38}/></div>
    </div>
    {demo && <p className="demo-warning"><AlertTriangle size={17}/> Demo mode: settings changes are disabled. Install the Windows application to use Fix & Gaming tools.</p>}
    <section className="panel fix-section"><div className="fix-title"><div><p className="eyebrow">RECOMMENDED ORDER</p><h2>{data?'Based on your latest scan':'Scan-first approach'}</h2></div></div>
      <div className="fix-priority-list">{tasks.map((task,i)=><div className={'fix-priority '+task.kind} key={i}>
        <div className="fix-number">{i+1}</div><div className="fix-priority-body"><h3>{task.title}</h3><p>{task.detail}</p></div>
        {task.action && <button type="button" disabled={!!waiting||!available} onClick={()=>openPage(task.action)}>Open fix <ArrowUpRight size={15}/></button>}
      </div>)}</div>
    </section>
    <section className="panel fix-section"><p className="eyebrow">ONE-CLICK CONFIGURATION</p><h2>Gaming preferences</h2>
      <p className="fix-section-intro">These are actual Windows settings changes, not FPS benchmarks. Each action asks for confirmation, saves its previous value, and offers Restore. Existing settings are not silently overwritten.</p>
      <div className="fix-action-grid">{AUTO.map(item=>{
        const saved=item.id==='enableGameMode'?status?.canRestore?.gameMode:status?.canRestore?.performance
        const known=item.id==='enableGameMode'?status?.gameMode?.available:status?.highPerformanceAvailable
        const enabled=item.id==='enableGameMode'?status?.gameMode?.value===1:status?.activePower==='8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
        const Icon=item.icon
        return <article className="fix-action-card" key={item.id}>
          <div className="fix-action-head"><span className="fix-action-icon"><Icon size={21}/></span><span className="fix-status">{saved?'Changed by PC Doctor':known===false?'Not available':enabled?'Already active':'Optional'}</span></div>
          <h3>{item.title}</h3><p>{item.summary}</p>
          <small>{item.risk}</small>
          {confirm===item.id&&<div className="fix-confirm" role="group" aria-label={'Confirm '+item.title}>
            <strong>Apply this Windows setting?</strong><p>{item.risk}</p>
            <div className="fix-confirm-buttons"><button type="button" disabled={!!waiting} onClick={()=>apply(item.id)}>Confirm & apply</button><button type="button" onClick={()=>setConfirm(null)}>Cancel</button></div>
          </div>}
          {confirm!==item.id&&<div className="fix-actions">
            {!saved&&<button type="button" disabled={!!waiting||!available||known===false||enabled} onClick={()=>setConfirm(item.id)}>{enabled?'Already enabled':'Enable setting'}</button>}
            {saved&&<button type="button" disabled={!!waiting||!available} onClick={()=>apply(item.undo)}><RotateCcw size={15}/> Restore original</button>}
          </div>}
        </article>
      })}</div>
    </section>
    <section className="panel fix-section"><p className="eyebrow">GUIDED WINDOWS FIXES</p><h2>Open the right setting in one click</h2>
      <p className="fix-section-intro">These shortcuts only open Windows tools; they do not perform cleanup, network resets, or create restore points automatically. Review the Windows prompts and select the actions yourself.</p>
      <div className="fix-guided-grid">{GUIDED.map(item=>{const Icon=item.icon;return <button type="button" className="fix-guided" key={item.id} disabled={!!waiting||!available} onClick={()=>openPage(item.id)}>
        <Icon size={19}/><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={18}/>
      </button>})}</div>
    </section>
    <MaintenancePanel demo={demo}/>
    <div className="fix-footer"><CheckCircle2 size={17}/><span>Changes require your confirmation. Game Mode and power-plan changes have Restore; DNS or HTTP cache clearing cannot be undone.</span></div>
    {notice && <div className="fix-toast" role="status" aria-live="polite">{notice}</div>}
  </div>
}

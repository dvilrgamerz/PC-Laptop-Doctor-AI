import React,{useEffect,useState} from 'react'
import {Check,CheckCircle2,Clock3,RefreshCw,ShieldCheck,Sparkles,StopCircle,TriangleAlert,Zap} from 'lucide-react'
import machineArt from '../assets/monster-machine.svg'
import autopilotArt from '../assets/monster-autopilot.svg'
import BackgroundBoostPanel from './BackgroundBoostPanel.jsx'
import PerformanceComparison from './PerformanceComparison.jsx'

export default function MonsterModePanel({demo}){
 const supported=!demo&&!!window.doctor?.getMonsterStatus&&!!window.doctor?.previewMonsterMode
 const [current,setCurrent]=useState(null)
 const [plan,setPlan]=useState(null)
 const [busy,setBusy]=useState(false)
 const [startWithWindows,setStartWithWindows]=useState(true)
 const [boostOnAC,setBoostOnAC]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')
 async function refresh(){
  if(!supported)return
  try{const r=await window.doctor.getMonsterStatus();if(r.ok)setCurrent(r);else setError(r.error||'Monster Mode unavailable')}
  catch{setError('Windows automation status could not be read.')}
 }
 useEffect(()=>{refresh();if(!supported)return;const timer=setInterval(refresh,20000);return()=>clearInterval(timer)},[supported])
 async function preview(){
  if(!supported||busy)return
  setBusy(true);setPlan(null);setError('');setMessage('Inspecting only safe old temporary files and current gaming state…')
  try{
   const r=await window.doctor.previewMonsterMode({startWithWindows:startWithWindows&&current?.startupSupported===true,boostOnAC})
   if(r.ok){setPlan(r);setMessage('Preview ready. Nothing has changed yet.')}
   else{setMessage('');setError(r.error||'Could not make a safe plan.')}
  }catch{setError('The preview failed. No changes were approved.')}
  finally{setBusy(false)}
 }
 async function activate(){
  if(!supported||!plan||busy)return
  const ticket=plan.token
  setPlan(null);setBusy(true);setError('');setMessage('Activating safe care…')
  try{
   const r=await window.doctor.activateMonsterMode(ticket)
   if(r.ok){setMessage(r.message);if(r.warning)setError(r.warning)}
   else{setMessage('');setError(r.error||'Monster Mode did not activate.')}
   await refresh()
  }catch{setError('Activation failed. Inspect automation status to see what changed.')}
  finally{setBusy(false)}
 }
 async function disable(){
  if(!supported||busy)return
  setBusy(true);setPlan(null);setError('');setMessage('')
  try{const r=await window.doctor.disableMonsterMode();if(r.ok){setMessage(r.message);if(r.warning)setError(r.warning)}else setError(r.error||'Unable to stop Monster Mode');await refresh()}
  catch{setError('Unable to disable Monster Mode; review the separate Autopilot controls.')}
  finally{setBusy(false)}
 }
 const enabled=!!current?.enabled
 return <section className="monster-mode" aria-label="Monster Mode automatic safe PC care">
   <div className="monster-mode-art"><img src={enabled?autopilotArt:machineArt} alt={enabled?"Original neon PC Monster automation shield":"Original neon PC Monster laptop illustration"}/></div>
   <div className="monster-mode-content">
     <div className="monster-mode-kicker"><Sparkles size={15}/> PC MONSTER · SMART CARE</div>
     <h2>Make your PC a Monster. Keep the changes safe.</h2>
     <p>One reviewed setup handles trusted-game Game Focus, optional V9 background EcoQoS for your approved apps, weekly recoverable Temp care, and an immediate eligible-file pass. No Windows Settings hopping, no fake RAM boosts, no forced app closing.</p>
     <div className="monster-mode-points">
       <span><Check size={15}/> Automatic Game Focus for recognized games</span>
       <span><Check size={15}/> Opt-in background app EcoQoS</span>
       <span><Check size={15}/> Safe weekly Temp care</span>
       <span><Check size={15}/> Game settings restored when supported games close</span>
     </div>
     {!enabled&&current?.startupSupported===true&&<label className="monster-login-option">
      <input type="checkbox" checked={startWithWindows} onChange={e=>{setStartWithWindows(e.target.checked);setPlan(null);setMessage('Startup preference changed. Preview again before approving.')}}/>
      <span><strong>Start PC Doctor with Windows</strong><small>Recommended for automatic care after sign-in. This is optional and can be disabled here.</small></span>
     </label>}
     {!enabled&&<label className="monster-login-option">
       <input type="checkbox" checked={boostOnAC} onChange={e=>{setBoostOnAC(e.target.checked);setPlan(null);setMessage('Power option changed. Preview again before approval.')}}/>
       <span><strong>Allow High Performance power mode on AC while gaming</strong><small>Optional, off by default. Only attempts the supported Windows power plan when the laptop is plugged in. Higher heat, fan noise and power consumption are possible. Previous mode is restored after a game.</small></span>
     </label>}
     {enabled&&<div className="monster-live-grid" aria-label="Live automation status">
      <div><small>Game Focus</small><strong>{current?.autoBoost?'Watching for trusted games':'Off'}</strong></div>
      <div><small>Gaming session</small><strong>{current?.activeGame||'No detected game'}</strong></div>
      <div><small>Weekly safe care</small><strong>{current?.weeklyCleanup?'Active':'Off'}</strong></div>
      <div><small>Optional AC power plan</small><strong>{current?.boostOnAC?'Allowed if supported':'Unchanged'}</strong></div>
      <div><small>Starts with Windows</small><strong>{current?.startupSupported===false?'Not available':current?.startWithWindows===true?'On':current?.startWithWindows===false?'Off':'Not verified'}</strong></div>
      <div><small>Last Temp care</small><strong>{current?.lastCleanupAt?new Date(current.lastCleanupAt).toLocaleDateString():'Not run yet'}</strong></div>
      <div><small>Files recycled last run</small><strong>{current?.lastCleanupCount??0}</strong></div>
     </div>}
     <div className="monster-mode-actions">
      {enabled?
       <><div className="monster-mode-enabled"><CheckCircle2 size={17}/> Monster Mode enabled</div>
        <button type="button" className="monster-mode-stop" disabled={busy||!supported} onClick={disable}><StopCircle size={16}/> Turn off automation</button></>:
       <button type="button" className="monster-mode-button" disabled={busy||!supported||!current} onClick={preview}><Zap size={20}/>{busy?'Checking PC…':'Power up Monster Mode'}</button>}
       <button type="button" className="monster-mode-refresh" disabled={busy||!supported} onClick={refresh} aria-label="Refresh Monster Mode status"><RefreshCw size={17}/></button>
     </div>
     {!supported&&<p className="monster-mode-note">The web demo shows a design preview only. Real care requires the Windows desktop application.</p>}
     <p className="monster-mode-fine"><ShieldCheck size={14}/> No arbitrary app closing, security disabling, overclocking, game-file changes or permanent deletion. Actual FPS gains require benchmarks; none are promised.</p>
     {!!message&&<p className="monster-mode-message" role="status">{message}</p>}
     {!!error&&<p className="monster-mode-error" role="alert"><TriangleAlert size={16}/>{error}</p>}
   </div>
   {!!plan&&<div className="monster-mode-preview" role="group" aria-label="Review automated care before activation">
    <div className="monster-mode-preview-head"><Clock3 size={18}/><strong>Approve exactly these actions</strong><small>Confirmation expires in 60 seconds</small></div>
    <ul>{plan.actions.map((a,i)=><li key={i}>{a}</li>)}</ul>
    <p>{plan.caution} Game Focus only runs while the app is open. If Windows startup is selected, the packaged app will launch on sign-in. No restart or administrator access is requested.</p>
    <div className="monster-mode-preview-actions">
      <button type="button" disabled={busy} className="monster-mode-button" onClick={activate}><Zap size={17}/> Approve and automate</button>
      <button type="button" disabled={busy} onClick={()=>{setPlan(null);setMessage('No changes made.')}}>Cancel</button>
    </div>
   </div>}
  <BackgroundBoostPanel demo={demo}/>
  <PerformanceComparison demo={demo}/>
 </section>
}

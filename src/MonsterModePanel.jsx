import React,{useEffect,useState} from 'react'
import {Check,CheckCircle2,Clock3,RefreshCw,ShieldCheck,Sparkles,StopCircle,TriangleAlert,Zap} from 'lucide-react'
import machineArt from '../assets/monster-machine.svg'

export default function MonsterModePanel({demo}){
 const supported=!demo&&!!window.doctor?.getMonsterStatus&&!!window.doctor?.previewMonsterMode
 const [current,setCurrent]=useState(null)
 const [plan,setPlan]=useState(null)
 const [busy,setBusy]=useState(false)
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
   const r=await window.doctor.previewMonsterMode()
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
  try{const r=await window.doctor.disableMonsterMode();if(r.ok)setMessage(r.message);else setError(r.error||'Unable to stop Monster Mode');await refresh()}
  catch{setError('Unable to disable Monster Mode; review the separate Autopilot controls.')}
  finally{setBusy(false)}
 }
 const enabled=!!current?.enabled
 return <section className="monster-mode" aria-label="Monster Mode automatic safe PC care">
   <div className="monster-mode-art"><img src={machineArt} alt="Illustration of a neon-lit laptop displaying a system pulse"/></div>
   <div className="monster-mode-content">
     <div className="monster-mode-kicker"><Sparkles size={15}/> PC MONSTER · SMART CARE</div>
     <h2>One approval. Your PC takes care of the basics.</h2>
     <p>Enable automatic gaming settings for recognized games, weekly recoverable Temp cleanup, and an immediate safe cleanup of eligible old files. All changes are local and limited.</p>
     <div className="monster-mode-points">
       <span><Check size={15}/> Automatic Game Focus for recognized games</span>
       <span><Check size={15}/> Safe weekly Temp care</span>
       <span><Check size={15}/> Game settings restored when supported games close</span>
     </div>
     <div className="monster-mode-actions">
      {enabled?
       <><div className="monster-mode-enabled"><CheckCircle2 size={17}/> Monster Mode enabled</div>
        <button type="button" className="monster-mode-stop" disabled={busy||!supported} onClick={disable}><StopCircle size={16}/> Turn off automation</button></>:
       <button type="button" className="monster-mode-button" disabled={busy||!supported} onClick={preview}><Zap size={20}/>{busy?'Checking PC…':'Power up Monster Mode'}</button>}
       <button type="button" className="monster-mode-refresh" disabled={busy||!supported} onClick={refresh} aria-label="Refresh Monster Mode status"><RefreshCw size={17}/></button>
     </div>
     {!supported&&<p className="monster-mode-note">The web demo shows a design preview only. Real care requires the Windows desktop application.</p>}
     <p className="monster-mode-fine"><ShieldCheck size={14}/> No arbitrary app closing, security disabling, overclocking, game-file changes or permanent deletion. No FPS improvement is promised.</p>
     {!!message&&<p className="monster-mode-message" role="status">{message}</p>}
     {!!error&&<p className="monster-mode-error" role="alert"><TriangleAlert size={16}/>{error}</p>}
   </div>
   {!!plan&&<div className="monster-mode-preview" role="group" aria-label="Review automated care before activation">
    <div className="monster-mode-preview-head"><Clock3 size={18}/><strong>Review once, then automate</strong><small>Confirmation expires in 60 seconds</small></div>
    <ul>{plan.actions.map((a,i)=><li key={i}>{a}</li>)}</ul>
    <p>{plan.caution} Your existing Autopilot preferences will be enabled, and work only while PC Doctor is open.</p>
    <div className="monster-mode-preview-actions">
      <button type="button" disabled={busy} className="monster-mode-button" onClick={activate}><Zap size={17}/> Approve and automate</button>
      <button type="button" disabled={busy} onClick={()=>{setPlan(null);setMessage('No changes made.')}}>Cancel</button>
    </div>
   </div>}
 </section>
}

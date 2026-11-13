import React,{useEffect,useState} from 'react'
import {Activity,CheckCircle2,RefreshCw,RotateCcw,ShieldCheck,TriangleAlert,Zap} from 'lucide-react'

// Consent is per exact executable path, never a broad process-name wildcard.
export default function BackgroundBoostPanel({demo}){
 const supported=!demo&&!!window.doctor?.getBackgroundBoostStatus&&!!window.doctor?.inspectBackgroundApps
 const [state,setState]=useState(null)
 const [inventory,setInventory]=useState(null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 async function refresh(){
  if(!supported)return
  try{const r=await window.doctor.getBackgroundBoostStatus();if(r.ok)setState(r);else setError(r.error||'Unavailable')}
  catch{setError('Background Boost status could not be read.')}
 }
 useEffect(()=>{void refresh();if(!supported)return;const interval=setInterval(()=>void refresh(),18000);return()=>clearInterval(interval)},[supported])
 async function inspect(){
  if(!supported||busy)return
  setBusy(true);setError('');setMessage('')
  try{const r=await window.doctor.inspectBackgroundApps();if(r.ok){setInventory(r);setMessage(r.eligibleCount+' eligible running applications found. No changes made.')}else setError(r.error||'Unable to inspect processes.')}
  catch{setError('Windows process inventory could not be read.')}
  finally{setBusy(false)}
 }
 async function setRule(exe,mode){
  if(!supported||busy)return
  setBusy(true);setError('');setMessage('')
  try{
   const r=await window.doctor.setBackgroundBoostRule(exe,mode)
   if(r.ok){setMessage(r.message||'Preference saved.');await refresh();const next=await window.doctor.inspectBackgroundApps();if(next.ok)setInventory(next)}
   else setError(r.error||'Consent change was not applied.')
  }catch{setError('Could not update the selected background application.')}
  finally{setBusy(false)}
 }
 async function restore(){
  if(!supported||busy)return
  setBusy(true);setError('');setMessage('')
  try{const r=await window.doctor.restoreBackgroundBoost();if(r.ok)setMessage(r.message||'Restored.');else setError(r.error||'Restore incomplete.');await refresh()}
  catch{setError('Could not complete recovery. Review the journal before retrying.')}
  finally{setBusy(false)}
 }
 return <section className="background-boost" aria-label="V9 background game boost">
   <div className="background-boost-head">
    <div className="background-boost-symbol"><Zap size={24}/></div>
    <div><p className="eyebrow">V9 GAME BOOST ENGINE · OPT-IN BETA</p><h3>Background Boost</h3>
     <p>Automatically reduce the power and scheduling impact of applications you explicitly approve while a trusted game is detected. Windows EcoQoS is reversible. This version does not close apps, stop services or promise FPS gains.</p></div>
   </div>
   <div className="background-boost-summary">
    <span><ShieldCheck size={15}/> System, anti-cheat and game processes protected</span>
    <span><CheckCircle2 size={15}/> Exact executable consent</span>
    <span><RotateCcw size={15}/> Recovery journal and Restore control</span>
   </div>
   {supported&&state&&<div className="background-boost-stats">
     <div><small>Approved applications</small><strong>{state.approvedCount}</strong></div>
     <div><small>Background actions recorded</small><strong>{state.modifiedCount}</strong></div>
     <div><small>Session</small><strong>{state.active?'Active':state.needsRecovery?'Recovery needed':'Standby'}</strong></div>
   </div>}
   <div className="background-boost-buttons">
    <button type="button" onClick={inspect} disabled={!supported||busy}><Activity size={16}/>{busy?'Working…':inventory?'Refresh applications':'Inspect running applications'}</button>
    {state?.needsRecovery&&<button type="button" className="background-restore" onClick={restore} disabled={!supported||busy}><RotateCcw size={16}/> Restore original QoS</button>}
   </div>
   {!supported&&<p className="background-boost-hint">App control is unavailable in the web demo. Open the Windows app to inspect your own processes.</p>}
   {inventory?.items?.length>0&&<>
     <p className="background-boost-hint">Pick <strong>Reduce during games</strong> only for programs you are comfortable running at lower background efficiency. No active process changes until a future trusted-game Auto-Boost session. {inventory.shownCount} of {inventory.eligibleCount} eligible apps shown, sorted by observed resource usage. Protected and unverifiable apps are not selectable.</p>
     <div className="background-boost-list">
      {inventory.items.slice(0,18).map(p=><div className="background-boost-process" key={p.exe}>
       <div><strong>{p.name||p.exe.split('\\').pop()}</strong><small>{p.cpu}% CPU · {p.memMB===null?'RAM unknown':p.memMB+' MB RAM'}</small></div>
       <button type="button" disabled={busy||!supported} className={p.mode==='reduce'?'background-mode-on':''}
        title={p.exe} onClick={()=>setRule(p.exe,p.mode==='reduce'?'keep':'reduce')}>
        {p.mode==='reduce'?'Reduce approved · Undo':'Reduce during games'}
       </button>
      </div>)}
     </div>
   </>}
   {!!message&&<p className="background-boost-message" role="status"><CheckCircle2 size={15}/>{message}</p>}
   {!!error&&<p className="background-boost-error" role="alert"><TriangleAlert size={15}/>{error}</p>}
   <p className="background-boost-hint"><ShieldCheck size={14}/> Only when Monster Mode Auto-Boost is enabled and the app is open. Changes are session-scoped; if Windows refuses an operation, the app reports it. App-crash recovery is attempted when you reopen PC Doctor.</p>
 </section>
}

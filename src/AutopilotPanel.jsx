import React,{useEffect,useState} from 'react'
import {Activity,CheckCircle2,Clock3,Gamepad2,ShieldCheck,Sparkles,Trash2,Zap} from 'lucide-react'

const initial={autoBoost:false,weeklyCleanup:false}
export default function AutopilotPanel({demo,onNavigate}){
 const desktop=!demo&&!!window.doctor?.getAutopilotStatus
 const [actual,setActual]=useState(null)
 const [options,setOptions]=useState(initial)
 const [dirty,setDirty]=useState(false)
 const [approved,setApproved]=useState(false)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 async function load(sync){
  if(!desktop)return
  try{
   const r=await window.doctor.getAutopilotStatus()
   if(r.ok){
    setActual(r)
    if(sync){setOptions({autoBoost:r.autoBoost,weeklyCleanup:r.weeklyCleanup});setDirty(false)}
   }
  }catch{setMessage('Could not read Autopilot settings; no background actions are enabled here.')}
 }
 useEffect(()=>{
  if(!desktop)return
  let stopped=false
  window.doctor.getAutopilotStatus().then(r=>{
   if(stopped||!r?.ok)return
   setActual(r);setOptions({autoBoost:r.autoBoost,weeklyCleanup:r.weeklyCleanup})
  }).catch(()=>{if(!stopped)setMessage('Could not read Autopilot settings.')})
  const t=setInterval(async()=>{
   if(stopped)return
   try{const r=await window.doctor.getAutopilotStatus();if(r.ok&&!stopped)setActual(r)}catch{}
  },15000)
  return()=>{stopped=true;clearInterval(t)}
 },[desktop])
 const newConsent=(options.autoBoost&&!actual?.autoBoost)||(options.weeklyCleanup&&!actual?.weeklyCleanup)
 async function save(){
  if(!desktop||busy||!dirty||(newConsent&&!approved))return
  setBusy(true);setMessage('')
  try{
   const r=await window.doctor.configureAutopilot(options)
   if(r.ok){setActual(r);setOptions({autoBoost:r.autoBoost,weeklyCleanup:r.weeklyCleanup});setDirty(false);setApproved(false)
    setMessage('Saved. Autopilot runs locally while PC Doctor is open and stops on app exit.')}
   else setMessage(r.error||'Settings were not saved.')
  }catch{setMessage('Could not apply Autopilot preferences. No additional changes were approved.')}
  finally{setBusy(false)}
 }
 function change(key,value){setOptions(p=>({...p,[key]:value}));setDirty(true);setApproved(false)}
 return <section className="panel v8-auto" aria-label="Autopilot controls">
  <div className="v8-auto-header">
   <div className="v8-auto-icon"><Zap size={25}/></div>
   <div><p className="eyebrow">AUTOPILOT · OPTIONAL</p><h2>Set it once. Let PC Doctor handle the basics.</h2>
    <p>Two local automations with fixed safety boundaries. No forced app closing, hidden registry tweaks, overclocking or Windows security changes.</p></div>
   <span className={'v8-auto-pill '+(actual?.autoBoost||actual?.weeklyCleanup?'on':'')}>{actual?.autoBoost||actual?.weeklyCleanup?'Enabled':'Off by default'}</span>
  </div>
  <div className="v8-auto-grid">
   <label className={'v8-auto-choice '+(options.autoBoost?'selected':'')}>
    <input type="checkbox" checked={options.autoBoost} disabled={!desktop||busy} onChange={e=>change('autoBoost',e.target.checked)}/>
    <span className="v8-auto-choice-content"><span className="v8-auto-choice-title"><Gamepad2 size={18}/> Auto Game Focus</span>
      <small>When a game you personally added is detected running, enable supported Windows Game Mode automatically. Restore after it exits or at the two-hour safety limit.</small>
      <span className="v8-auto-fine">Exact executable match required. Steam/Epic games use manual Boost & Play unless you add their trusted game EXE.</span></span>
   </label>
   <label className={'v8-auto-choice '+(options.weeklyCleanup?'selected':'')}>
    <input type="checkbox" checked={options.weeklyCleanup} disabled={!desktop||busy} onChange={e=>change('weeklyCleanup',e.target.checked)}/>
    <span className="v8-auto-choice-content"><span className="v8-auto-choice-title"><Trash2 size={18}/> Weekly Safe Temp Care</span>
      <small>Once every seven days, move eligible top-level .tmp files older than 30 days from your own user Temp folder to Recycle Bin.</small>
      <span className="v8-auto-fine">Recoverable. Does not empty Recycle Bin or immediately free disk space. Never scans Downloads, documents or games.</span></span>
   </label>
  </div>
  {desktop&&<div className="v8-auto-footer">
   <div className="v8-auto-status">
    {actual?.activeGame?<><Activity size={17}/><strong>Monitoring {actual.activeGame}</strong></>:
     <><ShieldCheck size={17}/><span>{actual?.message||'No automatic changes running.'}</span></>}
    {!!actual?.lastCleanupAt&&<small><Clock3 size={13}/> Last care: {new Date(actual.lastCleanupAt).toLocaleDateString()} · {actual.lastCleanupCount} files recycled</small>}
   </div>
   <div className="v8-auto-actions">
    {dirty&&newConsent&&<label className="v8-auto-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
       I understand these opt-in actions run automatically while the app is open and agree to the narrow scopes described above.</label>}
    <button className="v8-auto-save" type="button" disabled={!dirty||busy||(newConsent&&!approved)} onClick={save}>
      <CheckCircle2 size={17}/>{busy?'Saving…':dirty?'Save Autopilot settings':'Settings saved'}</button>
   </div>
  </div>}
  {!desktop&&<p className="v7-demo">Autopilot requires the Windows desktop app; browser demo changes no settings.</p>}
  <p className="v8-auto-bottom"><ShieldCheck size={15}/> Automatic gains are not guaranteed. A game that hides its process path will be skipped safely. Game files and anti-cheat are never modified.
    <button type="button" onClick={()=>onNavigate('boost')}>Open Boost & Play</button></p>
  {message&&<p className="v7-notice" role="status">{message}</p>}
 </section>
}

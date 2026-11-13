import React,{useEffect,useState} from 'react'
import {Gamepad2,Play,RotateCcw,ShieldCheck,Zap} from 'lucide-react'

// Direct controls reuse the same transactional Game Focus engine as Boost & Play.
// The UI never writes registry keys or runs commands itself.
export default function OneClickBoost({demo,onNavigate}){
 const available=!demo&&!!window.doctor?.getGameFocusStatus&&!!window.doctor?.previewGameFocus&&
   !!window.doctor?.startGameFocus&&!!window.doctor?.stopGameFocus
 const [state,setState]=useState(null)
 const [plan,setPlan]=useState(null)
 const [approved,setApproved]=useState(false)
 const [mode,setMode]=useState('standard')
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 async function refresh(){
  if(!available)return
  try{const result=await window.doctor.getGameFocusStatus();setState(result)}
  catch{setNotice('Could not read the current game session.')}
 }
 useEffect(()=>{
   refresh()
   if(!available)return undefined
   const interval=setInterval(refresh,15000)
   return ()=>clearInterval(interval)
 },[available])
 async function preview(){
  if(!available||busy)return
  setBusy(true);setApproved(false);setPlan(null);setNotice('Reading the supported Windows settings…')
  try{
   const r=await window.doctor.previewGameFocus(mode,120)
   if(r.ok){setPlan(r);setNotice('Review the exact settings. Nothing has changed yet.')}
   else setNotice(r.error||'Game Focus is unavailable for this computer.')
  }catch{setNotice('Could not prepare a safe game session.')}
  finally{setBusy(false)}
 }
 async function start(){
  if(!available||busy||!plan||!approved)return
  setBusy(true);const p=plan;setPlan(null);setApproved(false);setNotice('Applying only the approved Windows preferences…')
  try{
   const r=await window.doctor.startGameFocus(p.profile,p.token)
   setNotice(r.message||r.error||'Game Focus could not start.')
   await refresh()
  }catch{setNotice('Could not verify Game Focus. Check the session state before retrying.')}
  finally{setBusy(false)}
 }
 async function stop(){
  if(!available||busy)return
  setBusy(true)
  try{
   const r=await window.doctor.stopGameFocus()
   setNotice(r.message||r.error||'Restoration needs review.')
   await refresh()
  }catch{setNotice('Could not restore game preferences. Use Boost & Play recovery controls.')}
  finally{setBusy(false)}
 }
 return <section className="monster-boost" aria-label="PC Monster direct Game Focus">
   <div className="monster-boost-head">
    <div className="monster-boost-icon"><Gamepad2 size={21}/></div>
    <div><p className="eyebrow">DIRECT GAMING CONTROL</p><h3>Ready to play? Start Game Focus here.</h3>
      <p>Manage supported Windows Game Mode and, on compatible plugged-in PCs, the standard performance plan. The app applies and restores your approved changes automatically; it does not promise FPS gains.</p></div>
   </div>
   {state?.session?
     <div className="monster-boost-active"><ShieldCheck size={17}/><span>Game Focus {state.session.phase}. Previous settings are saved for restoration.</span>
      <button type="button" onClick={stop} disabled={!available||busy}><RotateCcw size={15}/>{busy?'Restoring…':'Stop & restore'}</button></div>:
     <>
      <div className="monster-boost-controls">
       <label><span>Profile</span><select value={mode} onChange={e=>{setMode(e.target.value);setPlan(null);setApproved(false)}} disabled={busy||!available}>
          <option value="standard">Standard — Game Mode</option>
          <option value="plugged">Plugged-in gaming — plus power plan if available</option>
        </select></label>
       <button type="button" className="monster-boost-primary" onClick={preview} disabled={!available||busy}>
        <Zap size={16}/>{busy?'Checking…':'Prepare Game Focus'}</button>
      </div>
      {!!plan&&<div className="monster-boost-plan">
       <strong>{plan.actions.length?'Planned Windows changes':'No new Windows settings need changing'}</strong>
       {plan.actions.length?<ul>{plan.actions.map(x=><li key={x}>{x}</li>)}</ul>:<p>Settings are already configured or not available; this session can still be tracked.</p>}
       {plan.skips?.map((s,i)=><p className="monster-boost-skip" key={i}>{s}</p>)}
       <p>Automatic restoration after 2 hours while PC Doctor is open, with recovery after interrupted sessions. High-performance plans may increase heat and power use.</p>
       <label><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
        Approve these specific temporary Windows setting changes.</label>
       <div className="monster-boost-actions"><button type="button" disabled={!approved||busy} onClick={start}><Play size={16}/> Approve & start</button>
       <button type="button" onClick={()=>{setPlan(null);setApproved(false);setNotice('Canceled; no changes applied.')}}>Cancel</button></div>
      </div>}
     </>}
   {notice&&<p className="monster-boost-status" role="status">{notice}</p>}
   <button type="button" className="monster-boost-link" onClick={()=>onNavigate('boost')}>Choose and launch a game from Steam, Epic or your added library</button>
   {!available&&<p className="monster-boost-status">This control is only available in the Windows desktop app.</p>}
 </section>
}

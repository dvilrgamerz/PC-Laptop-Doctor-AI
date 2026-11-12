import React,{useEffect,useMemo,useState} from 'react'
import {CheckCircle2,ClipboardCheck,Gamepad2,RefreshCcw,RotateCcw,ShieldCheck,SlidersHorizontal,TriangleAlert,Undo2} from 'lucide-react'

const PROFILES=[
 {id:'safe',title:'Safe defaults',text:'Read-only recommendations and Windows-guided options; no automatic changes.',ids:[]},
 {id:'balanced',title:'Balanced PC',text:'Small desktop visual preferences; no claimed gaming FPS increase.',ids:['transparency','taskbarAnimation']},
 {id:'gaming',title:'Gaming focus',text:'Game recording options only if you do NOT use background clips or streaming.',ids:['backgroundCapture','gameDvr']},
 {id:'battery',title:'Battery friendly',text:'Avoid increasing heat or power use; review battery/Power settings instead.',ids:[]}
]
const descriptions={available:'Available to preview',alreadySet:'Already set (not changed by PC Doctor)',unavailable:'Unavailable—unknown Windows value',restorable:'Changed by PC Doctor · undo available',needsReview:'Recovery journal requires review'}
export default function V6OptimizerPanel({demo,onNavigate}){
 const desktop=!demo&&!!window.doctor?.getV6Catalog&&!!window.doctor?.previewV6
 const [data,setData]=useState(null)
 const [profile,setProfile]=useState('safe')
 const [preview,setPreview]=useState(null)
 const [approved,setApproved]=useState(false)
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 async function refresh(){
  if(!desktop)return
  try{const r=await window.doctor.getV6Catalog();if(r.ok)setData(r);else setNotice(r.error||'Preferences unavailable')}
  catch{setNotice('Unable to read Windows preferences. No changes were made.')}
 }
 useEffect(()=>{refresh()},[desktop])
 const active=PROFILES.find(x=>x.id===profile)||PROFILES[0]
 const items=useMemo(()=>data?.items||[],[data])
 async function prepare(id,mode){
  if(!desktop||busy)return
  setBusy(true);setPreview(null);setApproved(false);setNotice('')
  try{const r=await window.doctor.previewV6(id,mode);if(r.ok)setPreview(r);else setNotice(r.error||'Cannot preview setting')}
  catch{setNotice('Windows did not return a safe current state; no action was taken.')}
  finally{setBusy(false)}
 }
 async function apply(){
  if(!desktop||busy||!approved||!preview)return
  setBusy(true)
  const req=preview
  setPreview(null);setApproved(false)
  try{
   const r=await window.doctor.confirmV6(req.id,req.mode,req.token)
   setNotice(r.ok?r.message:r.error||'Windows change was not verified.')
   await refresh()
  }catch{setNotice('The operation did not finish; inspect Restore/Recovery state before trying again.')}
  finally{setBusy(false)}
 }
 return <section className="panel v6-panel">
  <div className="v6-header"><div><p className="eyebrow">V6.0 / TRANSACTION-SAFE CHANGES</p><h2>Real Windows adjustments with restoration</h2><p>Each change previews its current value, records the original on disk, asks your permission, and reads Windows again to verify the result. No automatic preset applies changes behind your back.</p></div><ShieldCheck size={32}/></div>
  <div className="v6-profile-grid">{PROFILES.map(p=><button type="button" onClick={()=>{setProfile(p.id);setPreview(null);setApproved(false)}} key={p.id} aria-pressed={profile===p.id} className={'v6-profile '+(profile===p.id?'selected':'')}><strong>{p.title}</strong><small>{p.text}</small></button>)}</div>
  <div className="v6-preset-note"><SlidersHorizontal size={16}/> Selected: <strong>{active.title}</strong>. Profile selection changes recommendations only. You must approve each actual Windows modification.</div>
  {demo&&<p className="demo-warning"><TriangleAlert size={16}/> Windows preference changes are disabled in the sample browser demo.</p>}
  <div className="v6-action-grid">{items.map(item=>{
   const suggested=active.ids.includes(item.id)
   return <article className={'v6-action '+(suggested?'suggested':'')} key={item.id}>
    <div className="v6-card-top"><strong>{item.title}</strong>{suggested&&<span>Suggested in profile</span>}</div>
    <p>{item.risk}</p>
    <dl><dt>Current value</dt><dd>{item.currentKnown?(item.current===null?'Not explicitly configured':String(item.current)):'Unknown'}</dd><dt>Status</dt><dd>{descriptions[item.status]||item.status}</dd><dt>Measurement</dt><dd>{item.measure}</dd></dl>
    <small>{item.notes} {item.restart}</small>
    <a target="_blank" rel="noopener noreferrer" href={item.source}>Official reference</a>
    <div className="v6-card-actions">
     {item.status==='available'&&<button type="button" disabled={busy} onClick={()=>prepare(item.id,'apply')}><ClipboardCheck size={15}/> Preview change</button>}
     {(item.status==='restorable'||item.status==='needsReview')&&<button type="button" disabled={busy} onClick={()=>prepare(item.id,'restore')}><RotateCcw size={15}/> Review restore</button>}
     {item.status==='alreadySet'&&<span><CheckCircle2 size={15}/> Already configured; no edit needed</span>}
     {item.status==='unavailable'&&<span><TriangleAlert size={15}/> Disabled until Windows value is readable</span>}
    </div>
   </article>
  })}</div>
  {!data&&<p className="v6-note">Read current Windows settings to enable previews. In a browser demo, options are informational only.</p>}
  {!!preview&&<div className="v6-confirm" role="group" aria-label="Confirm Windows preference change">
    <h3>{preview.mode==='restore'?'Restore original: ':'Apply change: '}{preview.title}</h3>
    <p><strong>Planned change:</strong> {String(preview.before)} → {String(preview.after)}. {preview.effect}</p>
    <p>{preview.warning} {preview.restart}</p>
    <label><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> I approve this exact Windows value change and understand its effects.</label>
    <div className="v6-card-actions"><button type="button" disabled={!approved||busy} onClick={apply}>Confirm {preview.mode==='restore'?'restore':'apply'}</button><button type="button" onClick={()=>{setPreview(null);setApproved(false)}}>Cancel</button></div>
  </div>}
  {notice&&<p className="v6-notice" role="status">{notice}</p>}
  <div className="v6-bottom"><p><Undo2 size={16}/> Legacy Game Mode and power-plan controls still have their own saved-original Restore actions.</p><button type="button" onClick={()=>onNavigate('fixes')}>Open Fix & Gaming <Gamepad2 size={16}/></button></div>
 </section>
}

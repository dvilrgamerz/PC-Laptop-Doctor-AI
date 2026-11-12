import React,{useEffect,useState} from 'react'
import {AlertTriangle,CheckCircle2,ClipboardList,RotateCcw,ShieldCheck,Trash2,Wrench} from 'lucide-react'

const ITEMS=[
  {id:'flushDns',label:'Flush Windows DNS cache',note:'For stale hostname lookups. Does not reset Wi-Fi, renew IP addresses or increase FPS.'},
  {id:'clearAppCache',label:'Clear PC Doctor HTTP cache',note:'Only this application’s HTTP cache, not browser profiles, user files or your saved history.'}
]
export default function MaintenancePanel({demo}){
  const [preview,setPreview]=useState(null)
  const [busy,setBusy]=useState(false)
  const [note,setNote]=useState('')
  const [log,setLog]=useState([])
  const [askClear,setAskClear]=useState(false)
  const supported=!demo && !!window.doctor?.previewMaintenance && !!window.doctor?.applyMaintenance
  async function refresh(){
    if(!supported)return
    try{
      const r=await window.doctor.getMaintenanceHistory()
      if(r.ok)setLog(r.items||[])
    }catch{}
  }
  useEffect(()=>{refresh()},[supported])
  async function prepare(id){
    if(!supported||busy)return
    setBusy(true);setPreview(null);setNote('')
    try{
      const r=await window.doctor.previewMaintenance(id)
      if(r.ok)setPreview(r)
      else setNote(r.error||'Could not prepare the action.')
    }catch{setNote('Could not preview this action.')}
    finally{setBusy(false)}
  }
  async function apply(){
    if(!preview||!supported||busy)return
    setBusy(true);setNote('')
    const prepared=preview
    setPreview(null)
    try{
      const r=await window.doctor.applyMaintenance(prepared.action,prepared.token)
      setNote(r.ok?r.message:r.error||'Maintenance failed.')
      await refresh()
    }catch{setNote('Windows refused the maintenance operation or it timed out.')}
    finally{setBusy(false)}
  }
  async function clearAudit(){
    if(!askClear){setAskClear(true);return}
    setAskClear(false)
    try{
      const r=await window.doctor.clearMaintenanceLog()
      if(r.ok){setLog([]);setNote('Local maintenance audit history cleared.')}
      else setNote(r.error||'Could not clear the local audit log.')
    }catch{setNote('Could not clear audit history.')}
  }
  return <section className="panel pro-panel">
    <div className="pro-title"><Wrench size={21}/><div><p className="eyebrow">SAFE MAINTENANCE</p><h2>Specific, consent-gated operations</h2></div></div>
    <p>These operations are optional and not part of diagnosis. Review the preview, then explicitly approve. They do not delete documents or interfere with Windows security software.</p>
    <div className="pro-mini-list">{ITEMS.map(item=><div key={item.id}><ShieldCheck size={19}/><span><strong>{item.label}</strong><small>{item.note}</small></span>
      <button type="button" disabled={!supported||busy} onClick={()=>prepare(item.id)}>Preview</button>
    </div>)}</div>
    {!!preview&&<div className="pro-confirm" role="group" aria-label="Confirm maintenance">
      <h3><AlertTriangle size={16}/> {preview.title}</h3>
      <p>{preview.description}</p>
      {preview.approximateCacheBytes!==null&&<p>Reported app cache size: {(preview.approximateCacheBytes/1048576).toFixed(1)} MiB. Actual freed disk space may differ.</p>}
      <p>There is no direct undo for this cache clearing operation. Confirmation expires after 60 seconds.</p>
      <div className="pro-actions"><button type="button" className="pro-primary" disabled={busy} onClick={apply}>Confirm and run</button><button type="button" disabled={busy} onClick={()=>setPreview(null)}>Cancel</button></div>
    </div>}
    {!supported&&<p className="pro-alert">Actual maintenance actions are available only in the Windows desktop app.</p>}
    {note&&<p className="pro-status" role="status">{note}</p>}
    <div className="pro-audit"><h3><ClipboardList size={17}/> Maintenance activity (local only)</h3>
      <p>Stores only timestamps, action types and success/failure, up to 50 entries. No process names or hardware identifiers.</p>
      {log.length?<div className="pro-history-list">{log.slice(-8).reverse().map((x,i)=><div key={i}><span>{new Date(x.at).toLocaleString()} · {x.action}</span><strong>{x.success?'Succeeded':'Failed'}</strong></div>)}</div>:<p>No maintenance actions recorded.</p>}
      <div className="pro-actions">
        <button type="button" disabled={!supported||!log.length} onClick={clearAudit}><Trash2 size={15}/>{askClear?'Confirm clear audit log':'Clear audit history'}</button>
        {askClear&&<button type="button" onClick={()=>setAskClear(false)}>Cancel</button>}
      </div>
    </div>
  </section>
}

import React,{useState} from 'react'
import {HardDrive,ShieldCheck} from 'lucide-react'

export default function DiskPanel({demo}){
  const [approved,setApproved]=useState(false)
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState(null)
  const [note,setNote]=useState('')
  const supported=!demo&&!!window.doctor?.runDiskCheck
  async function run(){
    if(!approved||busy||!supported)return
    setBusy(true);setNote('Writing and reading a short temporary file. The app deletes it afterward.')
    try{
      const reply=await window.doctor.runDiskCheck()
      if(reply.ok){setResult(reply.result);setNote('Temporary-file check complete. This is NOT a standardized SSD benchmark.')}
      else setNote(reply.error||'The check did not complete.')
    }catch{setNote('Unable to perform the disk check.')}
    finally{setBusy(false)}
  }
  return <section className="panel pro-panel">
    <div className="pro-title"><HardDrive size={21}/><div><p className="eyebrow">LOCAL STORAGE TEST</p><h2>Bounded disk read/write check</h2></div></div>
    <p>Runs two small file-writing and reading samples in your Windows temporary directory. Requires at least 256 MiB of free-space headroom. Test files are removed in a cleanup step, even after most errors.</p>
    <p className="pro-note">A cached read can be much faster than the SSD. This test is a basic app and filesystem check, not a credible NVMe/SATA speed rating or an FPS predictor.</p>
    <label className="pro-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
      I understand this creates and deletes an 8 MiB temporary test file, and may briefly increase disk activity.
    </label>
    <button type="button" className="pro-primary" onClick={run} disabled={!supported||!approved||busy}>
      <HardDrive size={16}/>{busy?'Running…':'Run temporary disk check'}
    </button>
    {!supported&&<p className="pro-alert">Available only in the Windows desktop app.</p>}
    {result&&<div className="pro-summary-grid">
      <div><span>Write incl. flush</span><strong>{result.writeMiBs} MiB/s</strong></div>
      <div><span>Cached read estimate</span><strong>{result.cachedReadMiBs} MiB/s</strong></div>
      <div><span>Sample size</span><strong>{(result.bytes/1048576).toFixed(0)} MiB</strong></div>
      <div><span>Runs</span><strong>{result.runs}</strong></div>
    </div>}
    {note&&<p className="pro-status" role="status">{note}</p>}
    <p className="pro-note"><ShieldCheck size={15}/> No documents, installed programs, personal files, or partition settings are touched.</p>
  </section>
}

import React,{useState} from 'react'
import {Activity,CheckCircle2,HardDrive,ShieldCheck,ShieldAlert,RefreshCcw,Trash2,WandSparkles} from 'lucide-react'
const bytes=number=>Number.isFinite(number)?(number>=1048576?(number/1048576).toFixed(1)+' MiB':(number/1024).toFixed(1)+' KiB'):'Unknown'
const label=x=>typeof x==='string'?x:'Unavailable'

export default function OneClickCare({demo,onRescan}){
  const available=!demo&&!!window.doctor?.scanOldTempFiles&&!!window.doctor?.previewMaintenance&&
    !!window.doctor?.autoRecycleOldTemp&&!!window.doctor?.freeOldTempNow&&!!window.doctor?.applyMaintenance
  const [phase,setPhase]=useState('idle')
  const [preview,setPreview]=useState(null)
  const [mode,setMode]=useState('recycle')
  const [approved,setApproved]=useState(false)
  const [irreversible,setIrreversible]=useState(false)
  const [notice,setNotice]=useState('')
  const [report,setReport]=useState(null)

  async function inspect(){
    if(!available||phase==='busy')return
    setPhase('busy');setNotice('Checking eligible old user-Temp files and this app’s HTTP cache…')
    setPreview(null);setReport(null);setApproved(false);setIrreversible(false);setMode('recycle')
    try{
      const temp=await window.doctor.scanOldTempFiles()
      if(!temp.ok){setNotice(temp.error||'Safe cleanup unavailable.');setPhase('idle');return}
      // HTTP cache is strictly PC Doctor's own cache; never browsers or game caches.
      let cache=null
      try{
        const r=await window.doctor.previewMaintenance('clearAppCache')
        if(r.ok)cache=r
      }catch{}
      const permanent=(temp.files||[]).filter(x=>x.ageDays>=30&&/\.tmp$/i.test(x.name))
      const permanentBytes=permanent.reduce((sum,x)=>sum+x.sizeBytes,0)
      setPreview({temp,cache,permanentCount:permanent.length,permanentBytes})
      setPhase('review')
      setNotice('Review the exact cleanup scope, then approve. Nothing has been changed.')
    }catch{setPhase('idle');setNotice('Unable to inspect local cleanup candidates. Nothing was changed.')}
  }

  async function apply(){
    if(!available||phase!=='review'||!preview||!approved||(mode==='permanent'&&!irreversible))return
    const p=preview;setPhase('busy');setNotice('Cleaning only the approved app-cache and user-Temp scope…')
    setReport(null)
    const outcome={steps:[],reclaimedBytes:0,filesMoved:0,filesDeleted:0}
    try{
      if(p.cache){
        try{
          const r=await window.doctor.applyMaintenance('clearAppCache',p.cache.token)
          outcome.steps.push({name:'PC Doctor HTTP cache',ok:r.ok,detail:label(r.message||r.error)})
        }catch{outcome.steps.push({name:'PC Doctor HTTP cache',ok:false,detail:'Cache cleanup could not finish.'})}
      }
      if((p.temp.files||[]).length){
        try{
          const r=mode==='permanent'
            ? await window.doctor.freeOldTempNow(p.temp.token)
            : await window.doctor.autoRecycleOldTemp(p.temp.token)
          if(mode==='permanent'){
            outcome.filesDeleted=r.deletedCount||0
            outcome.reclaimedBytes=r.freedBytes||0
            outcome.steps.push({name:'Old .tmp files (permanent)',ok:r.ok,
              detail:label(r.message||r.error)})
          }else{
            outcome.filesMoved=r.movedCount||0
            outcome.steps.push({name:'Old .tmp/.log files (Recycle Bin)',ok:r.ok,
              detail:label(r.message||r.error)})
          }
        }catch{outcome.steps.push({name:'Temp cleanup',ok:false,detail:'Temp cleanup failed or the preview expired.'})}
      }
      if(!outcome.steps.length)outcome.steps.push({name:'Safe Care',ok:true,detail:'No eligible files or app-cache actions.'})
      // Refresh actual user hardware readings after the operations. Do not invent gains.
      try{await window.doctor.checkDailyHealth?.()}catch{}
      try{await onRescan?.()}catch{}
      setReport(outcome);setPhase('complete')
      setNotice('Safe Care completed. Check each result below. Recycle Bin moves do not free disk space.')
    }finally{
      setPreview(null);setApproved(false);setIrreversible(false)
    }
  }

  const temp=preview?.temp
  const noFiles=!temp?.files?.length
  return <section className="monster-care" aria-label="PC Monster one-review Safe Care">
    <div className="monster-care-title">
      <span className="monster-care-symbol"><WandSparkles size={21}/></span>
      <div><p className="eyebrow">ONE-REVIEW SAFE CARE</p><h3>Clean inside PC Monster, not Windows Settings.</h3>
      <p>Automatically check eligible old temporary files and PC Doctor’s own cache. Review once, approve once, and the app runs the supported actions.</p></div>
    </div>
    {phase==='idle'&&<button type="button" className="monster-care-primary" disabled={!available} onClick={inspect}>
      <Activity size={17}/> Inspect & prepare Safe Care</button>}
    {phase==='review'&&preview&&<div className="monster-care-review">
      <div className="monster-care-stats"><div><small>Old temporary files</small><strong>{temp?.files?.length||0}</strong></div>
        <div><small>Recoverable candidates</small><strong>{bytes(temp?.candidateBytes||0)}</strong></div>
        <div><small>PC Doctor HTTP cache</small><strong>{preview.cache?bytes(preview.cache.approximateCacheBytes):'Unavailable'}</strong></div></div>
      <p className="monster-care-caution"><ShieldCheck size={16}/> Only regular top-level files from your own user Temp folder are eligible; no subdirectories, Downloads, Windows files, saved games or personal folders. Each file is rechecked before cleanup.</p>
      <fieldset className="monster-care-choices">
        <legend>Choose what the app does</legend>
        <label><input type="radio" name="monster-care-mode" checked={mode==='recycle'} onChange={()=>{setMode('recycle');setIrreversible(false)}}/>
          <span><strong>Safe and recoverable — recommended</strong><small>Move eligible 14+ day .tmp/.log files to Recycle Bin. No immediate free-space increase.</small></span></label>
        <label><input type="radio" name="monster-care-mode" checked={mode==='permanent'} onChange={()=>setMode('permanent')}/>
          <span><strong>Free limited disk space (advanced)</strong><small>Permanently delete only {preview.permanentCount} eligible 30+ day .tmp files ({bytes(preview.permanentBytes)}). Cannot be undone.</small></span></label>
      </fieldset>
      <label className="monster-care-check"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
        I approve these listed PC Doctor cache and old user-Temp operations.</label>
      {mode==='permanent'&&<label className="monster-care-check danger"><input type="checkbox" checked={irreversible} onChange={e=>setIrreversible(e.target.checked)}/>
        I understand deleting old .tmp files is irreversible, may affect apps that still rely on them, and could free only a small amount.</label>}
      <div className="monster-care-buttons">
        <button type="button" className="monster-care-primary" disabled={!approved||(mode==='permanent'&&!irreversible)}
          onClick={apply}><Trash2 size={17}/>{mode==='permanent'?'Confirm permanent limited cleanup':'Approve and run Safe Care'}</button>
        <button type="button" className="monster-care-secondary" onClick={()=>{setPhase('idle');setPreview(null);setApproved(false);setIrreversible(false);setNotice('Canceled. No changes made.')}}>Cancel</button>
      </div>
      {noFiles&&<p className="monster-care-note">No eligible old Temp files found; the app-cache operation may still be available.</p>}
    </div>}
    {phase==='busy'&&<div className="monster-care-working"><RefreshCcw size={17}/> Inspecting or cleaning. No other actions are required.</div>}
    {phase==='complete'&&report&&<div className="monster-care-results">
      <div className="monster-care-summary"><CheckCircle2 size={20}/><strong>Safe Care finished</strong></div>
      {report.steps.map((step,i)=><div key={i} className="monster-care-result"><span>{step.ok?<CheckCircle2 size={17}/>:<ShieldAlert size={17}/>}</span>
        <div><strong>{step.name}</strong><small>{step.detail}</small></div></div>)}
      <p><HardDrive size={16}/> {report.filesMoved} moved to Recycle Bin · {report.filesDeleted} permanently removed · up to {bytes(report.reclaimedBytes)} reclaimed from deleted Temp files. App-cache space may differ from preview.</p>
      <button type="button" className="monster-care-secondary" onClick={()=>{setPhase('idle');setReport(null);setNotice('')}}>Run another check</button>
    </div>}
    {!!notice&&<p className="monster-care-status" role="status">{notice}</p>}
    {!available&&<p className="monster-care-note">Real Safe Care runs only in the installed Windows desktop app, not the browser demo.</p>}
  </section>
}

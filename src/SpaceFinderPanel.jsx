import React,{useState} from 'react'
import {CheckCircle2,FileSearch,FolderDown,HardDrive,RotateCcw,ShieldCheck,Trash2,TriangleAlert} from 'lucide-react'
const fmt=bytes=>bytes>=1024**3?(bytes/1024**3).toFixed(2)+' GiB':(bytes/1024**2).toFixed(0)+' MiB'
export default function SpaceFinderPanel({demo}){
 const supported=!demo&&!!window.doctor?.scanLargeDownloads&&!!window.doctor?.recycleSelectedDownloads
 const [scan,setScan]=useState(null)
 const [selected,setSelected]=useState([])
 const [approval,setApproval]=useState(false)
 const [working,setWorking]=useState(false)
 const [message,setMessage]=useState('')
 const chosen=scan?.files?.filter(x=>selected.includes(x.id))||[]
 const bytes=chosen.reduce((sum,f)=>sum+f.sizeBytes,0)
 const canMove=chosen.length>0&&chosen.length<=20&&bytes<=20*1024**3
 async function inspect(){
  if(!supported||working)return
  setWorking(true);setScan(null);setSelected([]);setApproval(false);setMessage('')
  try{const r=await window.doctor.scanLargeDownloads()
   if(r.ok){setScan(r);setMessage(r.files.length?
    'Largest Downloads files are listed below. Nothing was moved or deleted.':
    'No top-level Downloads files of at least 100 MiB were found.')}
   else setMessage(r.error||'Downloads inspection was unavailable.')
  }catch{setMessage('Could not inspect Downloads. Nothing was changed.')}
  finally{setWorking(false)}
 }
 async function recycle(){
  if(!supported||!approval||!canMove||working||!scan)return
  setWorking(true)
  const token=scan.token,ids=[...selected]
  setScan(null);setSelected([]);setApproval(false)
  try{
   const r=await window.doctor.recycleSelectedDownloads(token,ids)
   setMessage(r.message||r.error||'Recycle Bin operation was not completed.')
  }catch{setMessage('Could not move the selected files. Review Downloads and try again.')}
  finally{setWorking(false)}
 }
 const toggle=id=>{setApproval(false);setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}
 return <section className="panel space-panel" aria-label="Find large files in Downloads">
  <div className="space-head">
   <div className="space-symbol"><FileSearch size={22}/></div>
   <div><p className="eyebrow">SMART STORAGE · FILES YOU CHOOSE</p>
    <h2>Find what's filling your Downloads</h2>
    <p>PC Doctor finds large files for you and moves only your selected files to Recycle Bin after approval. It does not inspect file contents or silently remove personal downloads.</p>
   </div>
  </div>
  <div className="space-toolbar">
   <button type="button" disabled={!supported||working} onClick={inspect} className="space-primary">
    <FolderDown size={17}/>{working?'Checking…':scan?'Scan Downloads again':'Find large Downloads'}
   </button>
   <span><ShieldCheck size={16}/> Scans top-level files only · No upload · No automatic deletion</span>
  </div>
  {scan&&<>
   <div className="space-overview"><strong>{scan.files.length} large files</strong><span>{fmt(scan.listedBytes)} shown · minimum 100 MiB each</span></div>
   {scan.files.length>0&&<>
    <p className="space-note">Files are listed by size, not by whether they're safe to delete. Do not select important installers, game archives, work, or school files you need.</p>
    <div className="space-files">{scan.files.map(f=><label key={f.id} className="space-file">
     <input type="checkbox" checked={selected.includes(f.id)} onChange={()=>toggle(f.id)}/>
     <span title={f.name}>{f.name}</span>
     <strong>{fmt(f.sizeBytes)}</strong>
    </label>)}</div>
    <p className="space-selected">Selected {chosen.length} files · {fmt(bytes)}. Maximum 20 files / 20 GiB per operation.</p>
    <label className="space-confirm"><input type="checkbox" checked={approval} disabled={!canMove} onChange={e=>setApproval(e.target.checked)}/>
     I reviewed these exact file names and approve moving them to Recycle Bin. I understand space is not freed until the bin is emptied.</label>
    <button type="button" className="space-primary" disabled={!supported||!approval||!canMove||working} onClick={recycle}>
     <Trash2 size={17}/> Move {chosen.length} selected files to Recycle Bin
    </button>
    {!canMove&&chosen.length>0&&<p className="space-warning"><TriangleAlert size={15}/> Select no more than 20 files totaling 20 GiB.</p>}
   </>}
   <p className="space-note">{scan.note}</p>
  </>}
  {message&&<p className="space-message" role="status">{message}</p>}
  {!supported&&<p className="space-note">This feature works only in the installed Windows desktop app. The web demo cannot inspect Downloads.</p>}
  <div className="space-caution"><HardDrive size={17}/><p><strong>Want to actually free disk space?</strong> Recycle Bin moves are reversible but do not release storage yet. To reclaim capacity, review Recycle Bin yourself before emptying it, or use Windows Storage Sense for supported temporary files. PC Doctor does not empty Recycle Bin automatically.</p></div>
 </section>
}

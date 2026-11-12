import React,{useState} from 'react'
import {Activity,Router,ShieldCheck,TriangleAlert,Wifi} from 'lucide-react'

function Result({title,r}){
 return <div className="v6-path-card"><h3>{title}</h3>
  {!r?.ok?<p>Unmeasurable: {r?.error||'No result'}</p>:
   <div className="v6-path-stats"><span><strong>{r.avgMs}</strong> ms average</span><span><strong>{r.packetLossPercent??'Unknown'}</strong>{r.packetLossPercent===null?'':'%'} packet loss</span><span>Mean RTT delta {r.meanDeltaMs??'Unknown'} ms</span></div>}
 </div>
}
export default function V6NetworkPathPanel({demo}){
 const [approved,setApproved]=useState(false)
 const [busy,setBusy]=useState(false)
 const [result,setResult]=useState(null)
 const [notice,setNotice]=useState('')
 const available=!demo&&!!window.doctor?.runV6NetworkPath
 async function run(){
  if(!approved||!available||busy)return
  setBusy(true);setResult(null);setNotice('Testing the reported local default gateway and fixed Cloudflare 1.1.1.1. No settings are changed.')
  try{const r=await window.doctor.runV6NetworkPath();if(r.ok){setResult(r);setNotice('Short tests finished. Interpret ICMP carefully.')}else setNotice(r.error||'Network comparison unavailable.')}
  catch{setNotice('The network-path check failed.')}
  finally{setBusy(false)}
 }
 return <section className="panel v6-panel">
  <div className="v6-header"><div><p className="eyebrow">V6.3 / NETWORK EVIDENCE</p><h2>Router vs internet: where might lag begin?</h2>
    <p>Compare six ICMP responses to your Windows-reported default gateway and six to 1.1.1.1. This can suggest local versus upstream delay, but it cannot diagnose your game server, bufferbloat or ISP conclusively.</p></div><Router size={28}/></div>
  <label className="v6-confirm-label"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/> I approve bounded local gateway and external ICMP requests for this one test.</label>
  <div className="v6-row"><button type="button" onClick={run} disabled={!available||busy||!approved}><Wifi size={17}/>{busy?'Measuring…':'Compare network paths'}</button></div>
  {!available&&<p className="v6-error"><TriangleAlert size={16}/> The sample browser demo cannot measure your network.</p>}
  {result&&<>
   <div className="v6-path-grid"><Result title="Local gateway" r={result.local}/><Result title="Outside network (1.1.1.1)" r={result.external}/></div>
   <div className="v6-recommend"><Activity size={18}/><p>{result.classification}</p></div>
   <p className="v6-caption">{result.caution}</p>
  </>}
  {notice&&<p className="v6-notice" role="status">{notice}</p>}
  <p className="v6-caption"><ShieldCheck size={16}/> No automatic DNS, TCP/IP, firewall or adapter modification is involved.</p>
 </section>
}

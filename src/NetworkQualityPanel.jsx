import React,{useState} from 'react'
import {Activity,ShieldCheck,TriangleAlert,Wifi} from 'lucide-react'

export default function NetworkQualityPanel({demo}){
  const [approved,setApproved]=useState(false)
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState(null)
  const [note,setNote]=useState('')
  const supported=!demo&&!!window.doctor?.runNetworkQuality
  async function measure(){
    if(!approved||!supported||busy)return
    setBusy(true);setResult(null);setNote('Sending 8 ICMP requests to a fixed external address, 1.1.1.1…')
    try{
      const reply=await window.doctor.runNetworkQuality()
      if(reply.ok){setResult(reply);setNote('Measurements finished. Compare Wi-Fi and Ethernet under similar conditions.')}
      else setNote(reply.error||'Unable to finish the network check.')
    }catch{setNote('Windows network check failed.')}
    finally{setBusy(false)}
  }
  return <section className="panel network-check">
    <div className="network-check-header"><Wifi size={23}/><div><p className="eyebrow">USER-STARTED NETWORK MEASUREMENT</p><h2>Ping, consistency and packet loss</h2></div></div>
    <p>This test contacts <strong>Cloudflare 1.1.1.1</strong> using eight Windows ICMP echo requests. It does not measure your game server, internet download speed or Wi-Fi radio quality.</p>
    <label className="network-check-consent"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
      I approve sending eight short network requests to the external host 1.1.1.1.
    </label>
    <button type="button" disabled={!supported||!approved||busy} onClick={measure} className="network-check-go"><Activity size={17}/>{busy?'Measuring…':'Run network stability check'}</button>
    {!supported&&<p className="network-check-note"><TriangleAlert size={17}/> This test requires the installed Windows app; the web demo uses sample data.</p>}
    {result&&<div className="network-check-stats">
      <div><small>Average response</small><strong>{result.avgMs} ms</strong></div>
      <div><small>Minimum / maximum</small><strong>{result.minMs} / {result.maxMs} ms</strong></div>
      <div><small>Packet loss</small><strong>{result.packetLossPercent===null?'Unavailable':result.packetLossPercent+'%'}</strong></div>
      <div><small>Mean RTT change</small><strong>{result.meanDeltaMs===null?'Unavailable':result.meanDeltaMs+' ms'}</strong></div>
      <p>{result.caveat}</p>
    </div>}
    {note&&<p className="network-check-note" role="status">{note}</p>}
    <p className="network-check-caution"><ShieldCheck size={16}/> ICMP requests might be filtered by firewalls. Poor results do not prove a network fault, and a good result does not prove low game-server ping.</p>
  </section>
}

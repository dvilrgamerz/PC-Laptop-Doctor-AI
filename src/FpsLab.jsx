import React,{useState} from 'react'
import {BarChart3,FileBarChart,Info,UploadCloud} from 'lucide-react'
import {analyzeFpsCsv,compareFpsResults} from './fpsAnalyzer.mjs'

function Field({label,data}){
  if(!data)return <div className="pro-empty">No capture loaded</div>
  return <div className="pro-summary-grid">
    <div><span>Average FPS</span><strong>{data.avgFps}</strong></div>
    <div><span>1% low FPS</span><strong>{data.onePercentLowFps}</strong></div>
    <div><span>95th percentile frame time</span><strong>{data.p95FrameMs} ms</strong></div>
    <div><span>Frames analyzed</span><strong>{data.samples.toLocaleString()}</strong></div>
  </div>
}
export default function FpsLab(){
  const [before,setBefore]=useState(null)
  const [after,setAfter]=useState(null)
  const [comparable,setComparable]=useState(false)
  const [error,setError]=useState('')
  const delta=comparable?compareFpsResults(before,after):null
  async function load(file,set){
    if(!file)return
    setError('')
    if(file.size>5*1024*1024){set(null);setError('Maximum file size is 5 MB.');return}
    try{set(analyzeFpsCsv(await file.text()))}
    catch(err){set(null);setError(err?.message||'Could not parse the CSV.')}
  }
  return <section className="panel pro-panel">
    <div className="pro-title"><BarChart3 size={21}/><div><p className="eyebrow">GAME FRAME-TIME ANALYSIS</p><h2>Compare recorded FPS before and after</h2></div></div>
    <p>Import two CSV captures from a separate FPS/frame-time recording tool. PC Doctor does not hook games, inject overlays, or claim to record FPS itself.</p>
    <div className="pro-file-grid">
      <label><UploadCloud size={20}/><strong>Before capture</strong><small>CSV with frame-time milliseconds, msBetweenPresents, or FPS column</small>
        <input aria-label="Before frame-time CSV" type="file" accept=".csv,text/csv" onChange={e=>load(e.target.files?.[0],setBefore)}/>
      </label>
      <label><FileBarChart size={20}/><strong>After capture</strong><small>Same game, scene, resolution and graphics preset</small>
        <input aria-label="After frame-time CSV" type="file" accept=".csv,text/csv" onChange={e=>load(e.target.files?.[0],setAfter)}/>
      </label>
    </div>
    {before&&<><h3>Before capture</h3><Field data={before}/></>}
    {after&&<><h3>After capture</h3><Field data={after}/></>}
    {before&&after&&<label className="pro-consent"><input type="checkbox" checked={comparable} onChange={e=>setComparable(e.target.checked)}/>
      These captures used comparable conditions (same game scene, resolution, settings and capture method).
    </label>}
    {delta&&<div className="pro-summary-grid">
      <div><span>Average FPS difference</span><strong>{delta.avgFpsDelta>0?'+':''}{delta.avgFpsDelta}</strong></div>
      <div><span>1% low FPS difference</span><strong>{delta.lowFpsDelta>0?'+':''}{delta.lowFpsDelta}</strong></div>
      <div><span>P95 frame-time difference</span><strong>{delta.p95FrameMsDelta>0?'+':''}{delta.p95FrameMsDelta} ms</strong></div>
    </div>}
    {!!error&&<p className="pro-alert" role="alert">{error}</p>}
    <p className="pro-note"><Info size={16}/> Definition: 1% low = 1000 divided by mean of the slowest 1% of frame times. Some tools use other definitions; these numbers are not interchangeable. Files are parsed in this page and are not uploaded or saved to history.</p>
  </section>
}

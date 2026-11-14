import React,{useEffect,useState} from 'react'
import {Activity,BarChart3,Download,RefreshCcw,ShieldCheck,TriangleAlert} from 'lucide-react'

// Metrics come exclusively from local frame captures parsed in the Electron main process.
export default function PerformanceComparison({demo}){
 const supported=!demo&&!!window.doctor?.getBenchmarkStatus
 const [data,setData]=useState(null)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 async function refresh(){
  if(!supported)return
  try{const r=await window.doctor.getBenchmarkStatus();if(r.ok)setData(r)}catch{setError('Could not load benchmark status.')}
 }
 useEffect(()=>{void refresh()},[supported])
 async function importCsv(mode){
  if(!supported||busy)return
  setBusy(true);setError('')
  try{
   const r=await window.doctor.importBenchmarkCsv(mode)
   if(r.ok)setData(r)
   else if(!r.canceled)setError(r.error||'Capture cannot be analyzed.')
  }catch{setError('Local benchmark import failed.')}
  finally{setBusy(false)}
 }
 async function clear(){
  if(!supported||busy)return
  setBusy(true)
  try{setData(await window.doctor.resetBenchmark());setError('')}
  catch{setError('Could not clear current comparison.')}
  finally{setBusy(false)}
 }
 const fmt=(n,suffix='')=>Number.isFinite(n)?n.toFixed(2)+suffix:'—'
 const change=(n,invert=false)=>{
  if(!Number.isFinite(n))return '—'
  const direction=n===0?'No change':(n>0?'+':'')+n.toFixed(2)+'%'
  return direction+(n===0?'':(invert?n<0?' (lower)':' (higher)':n>0?' (higher)':' (lower)'))
 }
 const b=data?.baseline,c=data?.boosted,d=data?.comparison
 return <section className="performance-comparison" aria-label="Local PresentMon gaming benchmarks">
  <div className="performance-comparison-header"><BarChart3 size={25}/>
   <div><p className="eyebrow">GAME PERFORMANCE LAB · LOCAL DATA</p>
    <h3>Measure real FPS, not promised FPS</h3>
    <p>Capture one baseline run and one boosted run using Intel PresentMon, then import the two CSV files. PC Doctor never uploads them or fabricates benchmark data.</p>
   </div>
  </div>
  <div className="performance-compare-actions">
   <button type="button" disabled={!supported||busy} onClick={()=>importCsv('baseline')}><Download size={15}/> Import baseline CSV</button>
   <button type="button" disabled={!supported||busy} onClick={()=>importCsv('boosted')}><Activity size={15}/> Import boosted CSV</button>
   <button type="button" disabled={!supported||busy||!data?.baseline&&!data?.boosted} onClick={clear}><RefreshCcw size={15}/> Clear captures</button>
  </div>
  <p className="performance-compare-help">Use the same game, graphics settings, scene and power source for both captures. Warm up the game first. For credible results, repeat A/B/A/B rather than relying on a single comparison. <a href="https://github.com/GameTechDev/PresentMon" target="_blank" rel="noopener noreferrer">Intel PresentMon</a> provides local frame data. This version imports its CSV output; it does not yet launch a capture automatically.</p>
  {(b||c)&&<div className="performance-capture-grid">
   {[[b,'Baseline · without Monster Mode'],[c,'Boosted · Monster Mode enabled']].map(([x,title])=>
    <div key={title} className="performance-capture-card">
     <strong>{title}</strong>
     {x?<><span>{x.application} · PID {x.processId}</span>
      <dl><dt>Avg presented FPS</dt><dd>{fmt(x.avgFPS)}</dd><dt>1% low</dt><dd>{fmt(x.low1FPS)}</dd><dt>0.1% low</dt><dd>{fmt(x.low01FPS)}</dd><dt>99th-percentile frame time</dt><dd>{fmt(x.p99Ms,' ms')}</dd><dt>Samples</dt><dd>{x.frames.toLocaleString()}</dd></dl>
      <small>{x.ignoredOtherSwapChains?x.ignoredOtherSwapChains+' frames from other swap chains/processes excluded. ':''}Measured using {x.frameColumn}.</small>
     </>:<p>No capture selected</p>}
    </div>)}
  </div>}
  {d&&<div className="performance-compare-results" role="status">
   <strong>Observed differences (boosted versus baseline)</strong>
   <div><span>Average presented FPS</span><b>{change(d.avgFPSPct)}</b></div>
   <div><span>1% low FPS</span><b>{change(d.low1Pct)}</b></div>
   <div><span>99th-percentile frame time</span><b>{change(d.p99MsPct,true)}</b></div>
   <p>{d.limitations}</p>
  </div>}
  {error&&<p className="performance-compare-error" role="alert"><TriangleAlert size={15}/>{error}</p>}
  {!supported&&<p className="performance-compare-help">Open the Windows desktop edition to import your own PresentMon CSV captures.</p>}
  <p className="performance-compare-privacy"><ShieldCheck size={14}/> Files are processed locally. No PresentMon metrics are generated without real CSV input.</p>
 </section>
}

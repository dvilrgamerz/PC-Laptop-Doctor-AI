import React,{useState} from 'react'
import {BarChart3,Download,FileCheck2,Info,ShieldCheck} from 'lucide-react'
import {analyzeFpsCsv} from './fpsAnalyzer.mjs'
import {analyzeExperiment} from './v6Experiments.mjs'

const fmt=(n,s='')=>(n>0?'+':'')+n+s
export default function V6ExperimentPanel(){
 const [before,setBefore]=useState([])
 const [after,setAfter]=useState([])
 const [conditions,setConditions]=useState({game:'',scene:'',resolution:'',preset:'',power:'',notes:''})
 const [approved,setApproved]=useState(false)
 const [result,setResult]=useState(null)
 const [error,setError]=useState('')
 async function loadFiles(files,set){
  setError('');setResult(null);setApproved(false)
  if(!files?.length){set([]);return}
  if(files.length>8){set([]);setError('At most 8 recordings in each group.');return}
  try{
   const out=[]
   for(const file of files){
    if(file.size>5*1024*1024)throw Error('Each file must be 5 MiB or less.')
    out.push(analyzeFpsCsv(await file.text()))
   }
   set(out)
  }catch(e){set([]);setError(e?.message||'Could not read the recordings.')}
 }
 function analyze(){
  if(!approved)return
  try{
   if(!conditions.game.trim()||!conditions.scene.trim()||!conditions.resolution.trim())throw Error('Enter game, test scene and resolution to describe the experiment.')
   setResult(analyzeExperiment(before,after));setError('')
  }catch(e){setResult(null);setError(e?.message||'Cannot compare captures.')}
 }
 function save(){
  if(!result)return
  const report={schema:1,createdAt:new Date().toISOString(),scope:'user-provided benchmark data, no game injection',
   conditions,method:'3–8 per-condition frame-time CSV captures; mean of per-run FPS, approximate deterministic bootstrap interval',
   ...result}
  const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='pc-doctor-experiment.json';document.body.appendChild(a);a.click();a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
 }
 function field(id,label,placeholder){
  return <label key={id}>{label}<input maxLength={120} value={conditions[id]} placeholder={placeholder}
    onChange={e=>{setConditions(v=>({...v,[id]:e.target.value}));setResult(null)}}/></label>
 }
 return <section className="panel v6-panel">
  <div className="v6-header"><div><p className="eyebrow">V6.3 / EXPERIMENT LAB</p><h2>Measure gaming changes—not marketing promises</h2><p>Load 3–8 recordings from each condition, using the same capture tool and settings. We analyze average FPS, 1% lows, frame times, per-run variation and approximate uncertainty intervals.</p></div><BarChart3 size={29}/></div>
  <div className="v6-experiment-fields">
   {field('game','Game','Game name and version')}
   {field('scene','Repeatable test scene','Map, route or benchmark mission')}
   {field('resolution','Resolution','1920 × 1080')}
   {field('preset','Graphics preset','Medium, FSR off')}
   {field('power','Power / thermal conditions','Plugged in, warmed up')}
   {field('notes','One change tested','e.g. background recording on → off')}
  </div>
  <div className="v6-upload-grid"><label><FileCheck2 size={20}/><strong>Baseline (before) CSVs</strong><small>3–8 recordings, 100+ frames each, maximum 5 MiB each</small>
    <input type="file" accept=".csv,text/csv" multiple onChange={e=>loadFiles(e.target.files,setBefore)}/><span>{before.length} valid captures</span></label>
   <label><FileCheck2 size={20}/><strong>After optimization CSVs</strong><small>Same game scene, duration, settings and capture method</small>
    <input type="file" accept=".csv,text/csv" multiple onChange={e=>loadFiles(e.target.files,setAfter)}/><span>{after.length} valid captures</span></label>
  </div>
  <label className="v6-confirm-label"><input type="checkbox" checked={approved} onChange={e=>{setApproved(e.target.checked);setResult(null)}}/>
   These test runs used comparable scenes, game settings, driver, power supply and capture methods. I understand this comparison does not prove causation.
  </label>
  <div className="v6-row"><button type="button" disabled={!approved||before.length<3||before.length!==after.length}
    onClick={analyze}>Analyze 3–8 matched runs</button>
   {result&&<button type="button" onClick={save}><Download size={16}/> Export experiment JSON</button>}
  </div>
  {error&&<p className="v6-error" role="alert">{error}</p>}
  {!!result&&<div className="v6-experiment-results" aria-live="polite">
   <h3>{result.assessment}</h3><p>{result.runs} captures per condition. Intervals show bootstrap sampling variability, not guaranteed improvement.</p>
   <div className="v6-stats">{[['avgFps','Average FPS',' FPS'],['onePercentLowFps','1% low FPS',' FPS'],['p95FrameMs','P95 frame time',' ms']].map(([key,label,unit])=>{
    const m=result.metrics[key]
    return <div key={key}><small>{label}</small><strong>{fmt(m.delta,unit)}</strong>
      <span>Before {m.before} → after {m.after}</span><span>Approx. interval: {m.interval[0]} to {m.interval[1]}{unit}</span>
      <span>Variation: {m.beforeCv}% / {m.afterCv}%</span></div>
   })}</div>
   {result.notes.map((s,i)=><p className="v6-caption" key={i}>{s}</p>)}
  </div>}
  <p className="v6-caption"><ShieldCheck size={16}/> Files are parsed locally; PC Doctor does not inject overlays into games, upload logs, or store raw frame-time recordings. Use an external recorder such as PresentMon or CapFrameX.</p>
 </section>
}

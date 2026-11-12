import React, { useEffect, useMemo, useState } from 'react'
import { Activity, BookOpen, CheckCircle2, CircleHelp, Cpu, Download, HardDrive, History, Lightbulb, Monitor, Search, ShieldCheck, Trash2, Wrench } from 'lucide-react'
import {answerDoctor,hardwareAdvice} from './doctorEngine.mjs'
import {makeHistoryEntry,readHistory,isHistoryEnabled,setHistoryEnabled,appendHistory,clearHistory,compareHistory} from './history.mjs'
import {runQuickBenchmark,readBenchmarks,addBenchmark,clearBenchmarks} from './benchmark.mjs'

const safeStorage=()=>{try{return window.localStorage}catch{return null}}
const prompts=[
  'Why is my laptop slow?',
  'How can I improve gaming FPS?',
  'What should I upgrade first?',
  'Why is my drive almost full?',
  'How do I fix high ping?',
  'Why does my laptop get hot?'
]
const WORKLOADS=[['general','Everyday work'],['gaming','Gaming'],['creation','Creative software']]
function Button({children,onClick,disabled=false,className=''}) {return <button type="button" className={'hub-button '+className} onClick={onClick} disabled={disabled}>{children}</button>}
function saveCsv(filename,lines){
  const contents=lines.map(row=>row.join(',')).join('\r\n')+'\r\n'
  const url=URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function Assistant({data,demo}) {
  const [question,setQuestion]=useState('')
  const [response,setResponse]=useState(null)
  const [workload,setWorkload]=useState('general')
  function ask(value) {setQuestion(value);setResponse(answerDoctor(value,data,workload))}
  return <div className="hub-stack">
    <section className="hub-intro"><BookOpen size={24}/><div><h2>Ask PC Doctor</h2><p>Fully offline, explainable troubleshooting using the latest scan. This is a rule-based assistant, not a cloud LLM.</p></div></section>
    <section className="panel hub-panel"><p className="eyebrow">TROUBLESHOOT A SYMPTOM</p><div className="hub-query">
      <input aria-label="Ask about your computer" maxLength={400} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')ask(question)}} placeholder="Example: Why is my PC slow?"/>
      <Button disabled={!question.trim()} onClick={()=>ask(question)}><Search size={17}/> Analyze</Button>
    </div>
    <div className="hub-prompts">{prompts.map(x=><button type="button" key={x} onClick={()=>ask(x)}>{x}</button>)}</div>
    <div className="hub-select"><label htmlFor="doctor-workload">Main use</label><select id="doctor-workload" value={workload} onChange={e=>setWorkload(e.target.value)}>{WORKLOADS.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
    </section>
    {response&&<section className="panel hub-panel hub-answer" aria-live="polite"><p className="eyebrow">EVIDENCE-BASED ANSWER {demo?'· EXAMPLE SCAN':''}</p><h2>{response.title}</h2><p>{response.explanation}</p>
      {response.reasons?.length>0 && <div className="hub-reasons">{response.reasons.map((x,i)=><div key={i}><Activity size={15}/>{x}</div>)}</div>}
      <h3>Practical next steps</h3><ol>{response.steps.map((x,i)=><li key={i}>{x}</li>)}</ol>
      <p className="hub-disclaimer">{response.limits}</p>
    </section>}
  </div>
}
function Advisor({data,demo}) {
  const [workload,setWorkload]=useState('gaming')
  const advice=useMemo(()=>hardwareAdvice(data,workload),[data,workload])
  return <div className="hub-stack"><section className="hub-intro"><Monitor size={24}/><div><h2>Hardware Upgrade Advisor</h2><p>Spend only when there is evidence. Suggestions do not assume that your laptop has upgradeable RAM, GPU or storage.</p></div></section>
    <section className="panel hub-panel"><div className="hub-between"><div><p className="eyebrow">WORKLOAD</p><h2>Choose your target</h2></div><select aria-label="Your primary workload" value={workload} onChange={e=>setWorkload(e.target.value)}>{WORKLOADS.map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></div>
      <div className="hub-advice">{advice.map((x,i)=><article className="hub-advice-card" key={i}><div className="hub-between"><h3>{x.title}</h3><span className={'hub-priority '+x.priority}>{x.priority==='high'?'Address first':x.priority==='medium'?'Consider':'Check first'}</span></div><p><strong>Evidence:</strong> {x.reason}</p><p><strong>Next action:</strong> {x.action}</p><small>{x.caution}</small></article>)}</div>
      <p className="hub-disclaimer">{demo?'Example scan data, not recommendations for your actual hardware. ':' '}No compatibility, price, model-specific service manual or FPS result is verified. Check manufacturer documentation before purchasing.</p>
    </section>
  </div>
}
function HistoryLab({data,analysis,demo}){
  const [enabled,setEnabled]=useState(()=>isHistoryEnabled(safeStorage()))
  const [entries,setEntries]=useState(()=>readHistory(safeStorage()))
  const [benchmarks,setBenchmarks]=useState(()=>readBenchmarks(safeStorage()))
  const [latest,setLatest]=useState(null)
  const [running,setRunning]=useState(false)
  const [message,setMessage]=useState('')
  const [clearConfirm,setClearConfirm]=useState(false)
  useEffect(()=>setEntries(readHistory(safeStorage())),[data])
  const matching=entries.filter(x=>x.mode===(demo?'sample':'desktop'))
  const first=matching[0],last=matching[matching.length-1],delta=compareHistory(first,last)
  function toggle(next){
    try{setHistoryEnabled(safeStorage(),next);setEnabled(next);setMessage(next?'Future scans and CPU checks may be stored locally.':'Recording paused. Previously saved entries remain until you delete them.')}
    catch{setMessage('Local storage is unavailable. No history was recorded.')}
  }
  function saveCurrent(){
    if(!enabled||!data)return
    try{const next=appendHistory(safeStorage(),makeHistoryEntry(data,analysis,{demo}));setEntries(next);setMessage('Summary saved locally. No IP addresses, serials or startup app names were stored.')}
    catch{setMessage('Could not save summary. The scan remains available on screen.')}
  }
  function wipe(){
    if(!clearConfirm){setClearConfirm(true);return}
    try{clearHistory(safeStorage());clearBenchmarks(safeStorage());setEntries([]);setBenchmarks([]);setLatest(null);setMessage('Saved scan summaries and benchmark history deleted from this profile.')}
    catch{setMessage('Could not clear this profile storage.')}
    setClearConfirm(false)
  }
  async function benchmark(){
    if(running)return
    setRunning(true);setMessage('Running three short fixed-workload JavaScript CPU samples. You may notice a brief load increase.')
    try{
      const result=await runQuickBenchmark()
      setLatest(result)
      if(enabled){setBenchmarks(addBenchmark(safeStorage(),result,true))}
      setMessage('CPU check complete. This is a synthetic JS measurement, not game FPS or a standardized CPU score.')
    } catch(error){setMessage('CPU check failed: '+(error?.message||'Unknown error'))}
    finally{setRunning(false)}
  }
  function exportHistory(){
    const header=['date_utc','mode','health_score','cpu_percent','ram_percent','max_disk_percent','temperature_c','warnings']
    const rows=matching.map(x=>[x.at,x.mode,x.score??'',x.cpuPercent??'',x.ramPercent??'',x.maxStoragePercent??'',x.cpuTempC??'',x.warningCount])
    saveCsv('pc-doctor-history.csv',[header,...rows])
  }
  return <div className="hub-stack"><section className="hub-intro"><History size={24}/><div><h2>Before / After Lab</h2><p>Save summary-only snapshots with explicit consent. Compare changes across similar workloads; run a short synthetic JavaScript CPU check if you choose.</p></div></section>
    <section className="panel hub-panel"><div className="hub-between"><div><p className="eyebrow">PRIVATE LOCAL HISTORY</p><h2>Recording is {enabled?'enabled':'off'}</h2></div>
        <label className="hub-toggle"><input type="checkbox" checked={enabled} onChange={e=>toggle(e.target.checked)}/><span>Save future scans</span></label></div>
      <p className="hub-disclaimer">Off by default. At most 30 diagnostic summaries and 10 CPU checks are stored in this app/browser profile. No automatic cloud upload. Demo samples are marked separately. Local storage is not encrypted; use Delete if sharing a device.</p>
      <div className="hub-buttons">
        <Button onClick={saveCurrent} disabled={!enabled||!data}><CheckCircle2 size={15}/> Save this snapshot</Button>
        <Button onClick={exportHistory} disabled={!matching.length}><Download size={15}/> Export CSV</Button>
        <Button className="subtle" onClick={wipe} disabled={!entries.length&&!benchmarks.length}><Trash2 size={15}/>{clearConfirm?'Confirm delete all':'Delete saved history'}</Button>
        {clearConfirm&&<Button className="subtle" onClick={()=>setClearConfirm(false)}>Cancel</Button>}
      </div>
      <div className="hub-stat-row"><div><span>Saved snapshots</span><strong>{matching.length}</strong></div><div><span>Health-score change</span><strong>{delta?.score==null?'—':(delta?.score>0?'+':'')+delta?.score}</strong></div><div><span>RAM change</span><strong>{delta?.ramPercent==null?'—':(delta?.ramPercent>0?'+':'')+delta?.ramPercent+' pts'}</strong></div></div>
      <div className="hub-history">{matching.slice(-12).reverse().map((x,i)=><div key={i}><time>{new Date(x.at).toLocaleString()}</time><strong>Health {x.score??'—'}/100</strong><span>RAM {x.ramPercent??'—'}% · Disk {x.maxStoragePercent??'—'}% · CPU {x.cpuPercent??'—'}%</span></div>)}</div>
      {!matching.length&&<p className="hub-empty">Nothing saved yet. Enable recording and run a new scan, or save the current snapshot.</p>}
      <p className="hub-disclaimer">Changes in system load and health score alone do not prove that a repair worked. Snapshots are more useful when recorded under comparable workload conditions.</p>
    </section>
    <section className="panel hub-panel"><p className="eyebrow">LIGHTWEIGHT CPU MICROBENCHMARK</p><h2>Repeatable local workload</h2><p>Three fixed JavaScript integer-mixing runs; the median rate is reported in millions of operations per second. This briefly uses CPU and can vary with thermal, power and background conditions. It is not a standardized benchmark or FPS test.</p>
      <div className="hub-buttons"><Button disabled={running} onClick={benchmark}><Cpu size={16}/>{running?'Running CPU check…':'Run CPU quick check'}</Button></div>
      {latest&&<div className="hub-benchmark"><strong>{(latest.operationsPerSecond/1000000).toFixed(1)} Mops/s</strong><span>Median {latest.medianMs} ms · Algorithm {latest.version}</span></div>}
      {benchmarks.length>1&&<p className="hub-disclaimer">Earlier saved check: {(benchmarks[0].operationsPerSecond/1e6).toFixed(1)} Mops/s · Latest saved check: {(benchmarks[benchmarks.length-1].operationsPerSecond/1e6).toFixed(1)} Mops/s. Interpret differences cautiously.</p>}
    </section>
    {message&&<p className="hub-message" role="status">{message}</p>}
  </div>
}
export default function RoadmapHub({section,data,analysis,demo}){
  if(section==='assistant')return <Assistant data={data} demo={demo}/>
  if(section==='advisor')return <Advisor data={data} demo={demo}/>
  return <HistoryLab data={data} analysis={analysis} demo={demo}/>
}

import React,{useEffect,useState} from 'react'
import {Activity,Gamepad2,Info,Play,RefreshCcw,ShieldCheck,Square,TriangleAlert} from 'lucide-react'

export default function V6GameSession({demo,onNavigate}){
 const available=!demo&&!!window.doctor?.scanSteamLibrary&&!!window.doctor?.getTopProcesses
 const [games,setGames]=useState([])
 const [selected,setSelected]=useState('')
 const [active,setActive]=useState(false)
 const [samples,setSamples]=useState([])
 const [processes,setProcesses]=useState([])
 const [note,setNote]=useState('')
 const [loading,setLoading]=useState(false)
 async function detect(){
  if(!available||loading)return
  setLoading(true);setNote('Reading local Steam application manifests only…')
  try{
   const r=await window.doctor.scanSteamLibrary()
   if(r.ok){setGames(r.games||[]);setNote(r.games?.length?'Detected '+r.games.length+' Steam games. No game files were changed.':'No readable Steam game manifests found. Other launchers are not yet supported.')}
   else setNote(r.error||'Steam library detection unavailable.')
  }catch{setNote('Steam manifest discovery did not finish.')}
  finally{setLoading(false)}
 }
 useEffect(()=>{
  if(!active||!available)return undefined
  let cancelled=false,working=false
  async function sample(){
   if(cancelled||working)return
   working=true
   try{
    const r=await window.doctor.getTopProcesses()
    if(!cancelled && r.ok){
     const list=(r.processes||[]).slice(0,10)
     setProcesses(list)
     const top=list.slice(0,5).reduce((sum,p)=>sum+(Number.isFinite(p.memoryMiB)?p.memoryMiB:0),0)
     setSamples(v=>[...v,{at:Date.now(),topFiveMemoryMiB:top,topCount:list.length}].slice(-30))
    }
   }catch{if(!cancelled)setNote('Unable to read process snapshot; session monitoring may be incomplete.')}
   finally{working=false}
  }
  sample()
  const timer=setInterval(sample,8000)
  return ()=>{cancelled=true;clearInterval(timer)}
 },[active,available])
 function start(){setSamples([]);setProcesses([]);setNote('Monitoring starts only while this panel is open. It never closes applications or edits game files.');setActive(true)}
 function stop(){setActive(false);setNote('Session stopped. Snapshots stay on this page only and are cleared when the app closes.')}
 const chosen=games.find(g=>g.appid===selected)
 const highest=samples.length?Math.max(...samples.map(x=>x.topFiveMemoryMiB)):null
 return <section className="panel v6-panel">
  <div className="v6-header"><div><p className="eyebrow">V6.2 / GAME LIBRARY + SESSION MODE</p><h2>Find games. Monitor sessions. Keep control.</h2><p>Detect installed Steam games without modifying protected game files. A user-started monitor samples top RAM-consuming processes every 8 seconds. No forced process closing or performance claims.</p></div><Gamepad2 size={30}/></div>
  {demo&&<p className="demo-warning"><TriangleAlert size={16}/> Real games and processes require the installed Windows application.</p>}
  <div className="v6-session-controls">
   <button type="button" disabled={!available||loading||active} onClick={detect}><RefreshCcw size={16}/> {loading?'Scanning…':'Find Steam games'}</button>
   <label>Game or workload
    <select value={selected} onChange={e=>setSelected(e.target.value)} disabled={active}>
     <option value="">General gaming session</option>
     {games.map(game=><option key={game.appid} value={game.appid}>{game.name}</option>)}
    </select>
   </label>
   {!active?<button type="button" className="v6-primary" onClick={start} disabled={!available}><Play size={16}/> Start monitoring</button>:
    <button type="button" className="v6-stop" onClick={stop}><Square size={16}/> Stop session</button>}
  </div>
  {chosen&&<div className="v6-recommend"><Info size={18}/><div><strong>{chosen.name}</strong><p>For this game, start with baseline capture, GPU selection in Windows Graphics, background-app inspection and comparing the same scene. PC Doctor has no game-specific verified config adapter and will not edit game installation files or anti-cheat.</p></div></div>}
  {active&&<p className="v6-active"><Activity size={16}/> Active session. Closing this panel stops monitoring; background automation is disabled.</p>}
  {!!samples.length&&<div className="v6-stats"><div><small>Process snapshots</small><strong>{samples.length}</strong></div><div><small>Largest top-five process memory total</small><strong>{highest?.toLocaleString()} MiB</strong></div><div><small>Last check</small><strong>{new Date(samples[samples.length-1].at).toLocaleTimeString()}</strong></div></div>}
  {!!processes.length&&<div className="v6-process-table"><h3>Top memory-consuming processes (snapshot)</h3>
   {processes.slice(0,8).map((p,i)=><div key={i}><strong>{p.name}</strong><span>{p.memoryMiB??'Unknown'} MiB · CPU {p.cpuPercent??'Unknown'}%</span></div>)}
  </div>}
  <div className="v6-bottom"><p><ShieldCheck size={16}/> This is not an FPS capture, systemwide RAM measurement, or proof a process is unnecessary. Save work before manually closing any app in Task Manager.</p>
  <button type="button" onClick={()=>onNavigate('history')}>Analyze game FPS files</button></div>
  {note&&<p className="v6-notice" role="status">{note}</p>}
 </section>
}

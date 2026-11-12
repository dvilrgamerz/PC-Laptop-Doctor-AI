import React,{useEffect,useMemo,useState} from 'react'
import {Activity,CheckCircle2,ChevronRight,Download,ExternalLink,Gamepad2,HardDrive,Info,Play,RefreshCcw,RotateCcw,Rocket,ShieldCheck,Trash2,TriangleAlert,Wifi,Zap} from 'lucide-react'

const size=bytes=>bytes>=1073741824?(bytes/1073741824).toFixed(2)+' GiB':
 bytes>=1048576?(bytes/1048576).toFixed(1)+' MiB':bytes>=1024?(bytes/1024).toFixed(1)+' KiB':bytes+' B'
function Section({icon:Icon,eyebrow,title,description,children}){
 return <section className="panel v7-section">
  <div className="v7-section-head"><div className="v7-section-icon"><Icon size={22}/></div><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div></div>
  {children}
 </section>
}
export default function QuickControlCenter({demo,onNavigate,onScan,scanning,data}){
 const desktop=!demo && !!window.doctor?.getGameFocusStatus
 const [boost,setBoost]=useState(null)
 const [profile,setProfile]=useState('standard')
 const [plan,setPlan]=useState(null)
 const [approve,setApprove]=useState(false)
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 const [temp,setTemp]=useState(null)
 const [selected,setSelected]=useState([])
 const [cleanupApprove,setCleanupApprove]=useState(false)
 const [cleanupBusy,setCleanupBusy]=useState(false)
 const [cleanupNotice,setCleanupNotice]=useState('')
 const [games,setGames]=useState([])
 const [gameId,setGameId]=useState('')
 const [finding,setFinding]=useState(false)
 const [gameNotice,setGameNotice]=useState('')
 const ageSummary=useMemo(()=>temp?.files?.filter(f=>selected.includes(f.id))||[],[temp,selected])
 const selectedBytes=ageSummary.reduce((n,f)=>n+f.sizeBytes,0)
 async function status(){
  if(!desktop)return
  try{const r=await window.doctor.getGameFocusStatus();setBoost(r)}
  catch{setBoost({ok:false,error:'Game Focus status is unavailable.'})}
 }
 useEffect(()=>{status()},[desktop])
 async function preview(){
  if(!desktop||busy)return
  setBusy(true);setPlan(null);setApprove(false);setNotice('')
  try{const r=await window.doctor.previewGameFocus(profile);if(r.ok)setPlan(r);else setNotice(r.error||'Could not preview.')}
  catch{setNotice('Windows preferences could not be inspected safely.')}
  finally{setBusy(false)}
 }
 async function begin(){
  if(!plan||!approve||busy)return
  setBusy(true);setNotice('');const p=plan;setPlan(null);setApprove(false)
  try{
   const r=await window.doctor.startGameFocus(p.profile,p.token)
   setNotice(r.ok?r.message:r.error||'Game Focus could not start.')
  }catch{setNotice('Game Focus failed; use Stop & Restore to inspect or recover.')}
  finally{await status();setBusy(false)}
 }
 async function stop(){
  if(!desktop||busy)return
  setBusy(true);setPlan(null);setNotice('')
  try{const r=await window.doctor.stopGameFocus();setNotice(r.ok?r.message:r.error||'Restore is incomplete.')}
  catch{setNotice('Could not finish restoration; retry from this page.')}
  finally{await status();setBusy(false)}
 }
 async function scanTemp(){
  if(!desktop||cleanupBusy)return
  setCleanupBusy(true);setTemp(null);setSelected([]);setCleanupApprove(false);setCleanupNotice('')
  try{
   const r=await window.doctor.scanOldTempFiles()
   if(r.ok){setTemp(r);setCleanupNotice(r.files.length?'Review the files and select only the ones you want to recycle.':'No eligible old .tmp / .log files found. Use Windows Storage for other cleanup.')}
   else setCleanupNotice(r.error||'Windows user Temp was not readable.')
  }catch{setCleanupNotice('The temporary file preview failed. Nothing was changed.')}
  finally{setCleanupBusy(false)}
 }
 async function recycle(){
  if(!desktop||!temp||!cleanupApprove||!selected.length||cleanupBusy)return
  setCleanupBusy(true);setCleanupApprove(false)
  const ids=[...selected],token=temp.token
  setTemp(null);setSelected([])
  try{
   const r=await window.doctor.recycleOldTempFiles(token,ids)
   setCleanupNotice(r.message+(r.failedCount?' '+r.failedCount+' files were skipped because they changed or could not be recycled.':''))
  }catch{setCleanupNotice('Windows Recycle Bin could not process the selected files. Files that were skipped remain untouched.')}
  finally{setCleanupBusy(false)}
 }
 async function findGames(){
  if(!desktop||finding)return
  setFinding(true);setGameNotice('')
  try{const r=await window.doctor.scanSteamLibrary();if(r.ok){
   setGames(r.games||[]);setGameNotice(r.games?.length?r.games.length+' installed Steam games detected.':'No readable Steam game manifests found. Other launchers are not detected.')
  }else setGameNotice(r.error||'No game library access.')}
  catch{setGameNotice('Could not inspect Steam manifests.')}
  finally{setFinding(false)}
 }
 async function launch(){
  if(!desktop||!gameId||finding)return
  setFinding(true);setGameNotice('')
  try{const r=await window.doctor.launchSteamGame(gameId);setGameNotice(r.ok?r.message:r.error)}
  catch{setGameNotice('Windows could not hand this game to Steam.')}
  finally{setFinding(false)}
 }
 return <div className="v7-center">
   <section className="v7-lead">
    <div className="v7-lead-content"><span className="v7-kicker"><Rocket size={15}/> DVILR PERFORMANCE CENTER</span>
      <h2>Play smarter. Keep your PC in control.</h2>
      <p>One screen for Game Focus, game launching, safe cleanup and recovery. Changes are explained before you approve them. No hidden service shutdowns or guaranteed FPS claims.</p>
      <div className="v7-lead-actions">
       <button className="v7-main-button" type="button" disabled={scanning} onClick={onScan}><Activity size={18}/>{scanning?'Scanning…':'Diagnose my PC'}</button>
       <button className="v7-ghost-button" type="button" onClick={()=>onNavigate('history')}><Zap size={17}/> Compare FPS</button>
      </div>
    </div>
    <div className="v7-lead-visual"><div className="v7-circle"><Rocket size={43}/></div><span>SCAN <ChevronRight size={13}/> REVIEW <ChevronRight size={13}/> MEASURE</span></div>
   </section>
   {demo&&<p className="v7-demo"><Info size={16}/> Browser demo: real Windows changes, cleanup and Steam launching are disabled. Install the Windows desktop app to use them.</p>}
   {data&&<div className="v7-mini-stats">
    <div><small>Memory in use</small><strong>{data.memory?.total?Math.round(data.memory.used/data.memory.total*100)+'%':'Unknown'}</strong></div>
    <div><small>Drive space free</small><strong>{Number.isFinite(data.storage?.[0]?.available)?size(data.storage[0].available):'Unknown'}</strong></div>
    <div><small>CPU load</small><strong>{Number.isFinite(data.cpu?.load)?Math.round(data.cpu.load)+'%':'Unknown'}</strong></div>
   </div>}
   <Section icon={Rocket} eyebrow="01 · GAME FOCUS" title="Start a gaming session" description="Temporarily enable supported Windows Game Mode and, on AC power only, the standard High performance plan. No apps are killed or suspended.">
    <div className="v7-boost-status">
     <span className={'v7-state '+(boost?.session?'in-session':'')}>{boost?.session?'Active or awaiting recovery':'Not running'}</span>
     <p>{boost?.session?('Profile: '+boost.session.profile+' · '+boost.session.phase+'. Stop restores only the settings the session attempted.'):'These settings are optional. If Windows already has a preference enabled, PC Doctor leaves it unchanged.'}</p>
    </div>
    {!boost?.session&&<div className="v7-boost-controls">
      <label className={'v7-mode '+(profile==='standard'?'chosen':'')}>
       <input type="radio" name="boost-profile" checked={profile==='standard'} onChange={()=>{setProfile('standard');setPlan(null)}}/>
       <strong>Standard</strong><span>Game Mode only, when available</span>
      </label>
      <label className={'v7-mode '+(profile==='plugged'?'chosen':'')}>
       <input type="radio" name="boost-profile" checked={profile==='plugged'} onChange={()=>{setProfile('plugged');setPlan(null)}}/>
       <strong>Plugged-in gaming</strong><span>Game Mode + power plan if supported</span>
      </label>
    </div>}
    {boost?.session?
      <button type="button" className="v7-restore" disabled={!desktop||busy} onClick={stop}><RotateCcw size={18}/>{busy?'Restoring…':'Stop & restore my PC'}</button>:
      <button type="button" className="v7-primary" disabled={!desktop||busy} onClick={preview}><ShieldCheck size={17}/>{busy?'Inspecting…':'Review Game Focus changes'}</button>}
    {!!plan&&<div className="v7-preview">
      <h3>Changes planned for this session</h3>
      {plan.actions.length?<ul>{plan.actions.map(x=><li key={x}><CheckCircle2 size={16}/>{x}</li>)}</ul>:<p>There are no new Windows preferences to change. This session can still be tracked and stopped.</p>}
      {plan.skips.map((s,i)=><p key={i} className="v7-skipped">{s}</p>)}
      <p className="v7-caution">{plan.warning}</p>
      <label className="v7-consent"><input type="checkbox" checked={approve} onChange={e=>setApprove(e.target.checked)}/> I reviewed the listed changes and agree to temporary Game Focus settings.</label>
      <div className="v7-actions"><button type="button" className="v7-primary" disabled={!approve||busy} onClick={begin}><Play size={16}/> Start Game Focus</button><button type="button" className="v7-secondary" onClick={()=>{setPlan(null);setApprove(false)}}>Cancel</button></div>
    </div>}
    {notice&&<p className="v7-notice" role="status">{notice}</p>}
    <p className="v7-caption">After a normal app exit or restart, PC Doctor attempts to restore the saved settings. Unrecoverable changes are shown for manual review. Game Focus cannot guarantee a higher frame rate.</p>
   </Section>
   <div className="v7-pair">
    <Section icon={Gamepad2} eyebrow="02 · GAMES" title="Find and launch Steam games" description="Detect installed Steam titles without editing game files. Other game launchers aren't yet supported.">
     <div className="v7-actions"><button type="button" className="v7-secondary" disabled={!desktop||finding} onClick={findGames}><RefreshCcw size={16}/>{finding?'Scanning…':'Find my games'}</button></div>
     {!!games.length&&<div className="v7-game-select"><label htmlFor="v7-game">Installed games</label>
      <select id="v7-game" value={gameId} onChange={e=>setGameId(e.target.value)}><option value="">Select a Steam game</option>{games.map(g=><option key={g.appid} value={g.appid}>{g.name}</option>)}</select></div>}
     <button type="button" className="v7-primary" disabled={!desktop||finding||!gameId} onClick={launch}><Play size={16}/> Launch in Steam</button>
     {gameNotice&&<p className="v7-notice" role="status">{gameNotice}</p>}
     <p className="v7-caption">For session CPU/RAM monitoring, use <button className="v7-text-link" type="button" onClick={()=>onNavigate('optimize')}>Optimization Studio</button>.</p>
    </Section>
    <Section icon={HardDrive} eyebrow="03 · STORAGE" title="Clean safely, with a preview" description="Review stale .tmp and .log files in your own Windows user Temp folder. Select exactly which files should go to Recycle Bin.">
      <div className="v7-actions"><button type="button" className="v7-secondary" disabled={!desktop||cleanupBusy} onClick={scanTemp}><HardDrive size={16}/>{cleanupBusy?'Checking…':'Find old temporary files'}</button>
        <button type="button" className="v7-secondary" onClick={()=>onNavigate('fixes')}><ExternalLink size={15}/> Windows Storage tools</button></div>
      {!!temp&&<div className="v7-clean-preview">
       <p className="v7-caution">{temp.caution}</p>
       <div className="v7-clean-heading"><strong>{temp.files.length} eligible files · {size(temp.candidateBytes)} candidates</strong><span>Nothing selected by default</span></div>
       {!!temp.files.length&&<><div className="v7-actions">
        <button type="button" className="v7-text-link" onClick={()=>{setSelected(temp.files.map(f=>f.id));setCleanupApprove(false)}}>Select all shown</button>
        <button type="button" className="v7-text-link" onClick={()=>{setSelected([]);setCleanupApprove(false)}}>Clear selection</button>
       </div><div className="v7-file-list">
        {temp.files.map(f=><label key={f.id}>
         <input type="checkbox" checked={selected.includes(f.id)} onChange={e=>{setCleanupApprove(false);setSelected(p=>e.target.checked?[...p,f.id]:p.filter(x=>x!==f.id))}}/>
         <span title={f.name}>{f.name}</span><small>{size(f.sizeBytes)} · {f.ageDays} days old</small>
        </label>)}
       </div>
       <p className="v7-caution">Selected: {ageSummary.length} files ({size(selectedBytes)}). Moving to Recycle Bin does not reclaim storage until the bin is emptied. You may restore files there.</p>
       <label className="v7-consent"><input type="checkbox" checked={cleanupApprove} onChange={e=>setCleanupApprove(e.target.checked)}/> I approve moving only the selected files to Windows Recycle Bin.</label>
       <button type="button" className="v7-primary" disabled={!selected.length||!cleanupApprove||cleanupBusy} onClick={recycle}><Trash2 size={16}/> Move {ageSummary.length} selected files to Recycle Bin</button></>}
      </div>}
      {cleanupNotice&&<p className="v7-notice" role="status">{cleanupNotice}</p>}
      <p className="v7-caption">PC Doctor avoids Downloads, documents, Windows directories, game saves and all folders. Use Windows Storage Sense for broader system cleanup. <a target="_blank" rel="noopener noreferrer" href="https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/manage-drive-space-with-storage-sense">Microsoft's Storage Sense guide</a>.</p>
    </Section>
   </div>
   <section className="v7-outro"><ShieldCheck size={23}/><div><h3>Made for people who want results, not risky tweak packs.</h3><p>Your settings stay under your control. No forced app termination, overclocking, driver modification, Defender disabling or claims of universal FPS gains. Measure games before and after a change.</p></div><button type="button" onClick={()=>onNavigate('history')}>Open performance lab <ChevronRight size={16}/></button></section>
 </div>
}

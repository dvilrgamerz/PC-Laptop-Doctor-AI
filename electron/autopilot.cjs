'use strict'
// Optional local Autopilot. Both background actions are OFF by default.
// Game identification requires an exact previously user-selected EXE path.
// Cleanup only MOVES eligible 30+ day .tmp files to Recycle Bin and NEVER deletes files.
const fs=require('node:fs')
const path=require('node:path')
const {readStore}=require('./custom-games.cjs')
const WEEK=7*24*60*60*1000
const INTERVAL=5000
const VERSION=1

function loadPrefs(file){
 try{
  const v=JSON.parse(fs.readFileSync(file,'utf8'))
  if(v?.version!==VERSION)return defaults()
  return {version:VERSION,autoBoost:v.autoBoost===true,weeklyCleanup:v.weeklyCleanup===true,boostOnAC:v.boostOnAC===true,
   lastCleanupAt:Number.isSafeInteger(v.lastCleanupAt)&&v.lastCleanupAt>=0?v.lastCleanupAt:0,
   lastCleanupCount:Number.isInteger(v.lastCleanupCount)?Math.max(0,Math.min(300,v.lastCleanupCount)):0}
 }catch{return defaults()}
}
function defaults(){return {version:VERSION,autoBoost:false,weeklyCleanup:false,boostOnAC:false,lastCleanupAt:0,lastCleanupCount:0}}
function savePrefs(file,v){
 fs.mkdirSync(path.dirname(file),{recursive:true})
 const tmp=file+'.tmp'
 try{
  fs.writeFileSync(tmp,JSON.stringify(v),{encoding:'utf8',mode:0o600})
  fs.renameSync(tmp,file)
 }catch(e){try{fs.rmSync(tmp,{force:true})}catch{}throw e}
}
function cleanWinPath(value){
 if(typeof value!=='string'||!value||value.length>1024||!path.win32.isAbsolute(value))return null
 return path.win32.normalize(value).toLowerCase().replace(/[\\\/]+$/,'')
}
function processExecutable(proc){
 if(!proc||typeof proc!=='object'||typeof proc.path!=='string')return null
 const location=cleanWinPath(proc.path)
 if(!location)return null
 if(location.endsWith('.exe'))return location
 if(typeof proc.name!=='string'||!/^[^\\/:*?"<>|]{1,160}\.exe$/i.test(proc.name))return null
 return cleanWinPath(path.win32.join(proc.path,proc.name))
}
function gameForProcesses(processes,games,roots=[]){
 const known=new Map(games.filter(x=>typeof x.file==='string'&&typeof x.name==='string')
   .map(g=>[cleanWinPath(g.file),g]).filter(([k])=>k!==null))
 for(const proc of processes){
  const exe=processExecutable(proc)
  if(!exe)continue
  if(known.has(exe))return {key:exe,file:exe,name:known.get(exe).name.slice(0,90),source:'User-added game'}
  // For installed Steam/Epic games, match a process **inside** the exact
  // launcher-reported installation folder. Never match a title/process name.
  for(const game of roots){
   const root=cleanWinPath(game?.root)
   if(root&&exe.startsWith(root+'\\')&&typeof game.name==='string')
    return {key:root,file:exe,name:game.name.slice(0,90),source:game.source}
  }
 }
 return null
}
function createAutopilot({stateFile,customStoreFile,gameFocus,processes,tempCleaner,installedRoots=async()=>[],
 platform=process.platform,backgroundBoost=null,now=()=>Date.now(),schedule=fn=>setInterval(fn,INTERVAL),
 cancel=timer=>clearInterval(timer)}={}){
 if(!stateFile||!customStoreFile||!gameFocus||typeof processes!=='function'||!tempCleaner)throw Error('Missing Autopilot dependencies')
 let timer=null,working=false,owner=null,misses=0,seenFile=null,seenCount=0,blockedFile=null
 let message='Autopilot is off. No background actions occur until you enable a switch.'
 async function status(){
  const v=loadPrefs(stateFile)
  return {ok:true,supported:platform==='win32',autoBoost:v.autoBoost,weeklyCleanup:v.weeklyCleanup,
   lastCleanupAt:v.lastCleanupAt||null,lastCleanupCount:v.lastCleanupCount,boostOnAC:v.boostOnAC,activeGame:owner?.name||null,
   running:working,message,
   limits:'Auto-Boost recognizes exact user-added EXEs or running processes inside verified Steam/Epic game install folders. Weekly cleanup moves old .tmp files to Recycle Bin; it does not immediately free disk space.'}
 }
 async function configure(options){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(!options||typeof options.autoBoost!=='boolean'||typeof options.weeklyCleanup!=='boolean'||
   (options.boostOnAC!==undefined&&typeof options.boostOnAC!=='boolean'))
   return {ok:false,error:'Choose both automation switches explicitly.'}
  const prev=loadPrefs(stateFile)
  const next={...prev,autoBoost:options.autoBoost,weeklyCleanup:options.weeklyCleanup,
   boostOnAC:options.boostOnAC===undefined?prev.boostOnAC:options.boostOnAC}
  let restoreWarning=null
  try{savePrefs(stateFile,next)}catch{return {ok:false,error:'Could not save your local opt-in settings.'}}
  if(!next.autoBoost){
   seenFile=null;seenCount=0;blockedFile=null
   if(owner){
    const current=owner
    const background=backgroundBoost?await backgroundBoost.restore():{ok:true}
    const r=await gameFocus.stop()
    if(r.ok&&background.ok){owner=null;misses=0;message='Autopilot disabled and its game preferences/background QoS restored.'}
    else{restoreWarning='Autopilot disabled but '+current.name+' could not be fully restored. Use Restore in Game Boost and Stop & Restore in Boost & Play.';message=restoreWarning}
   } else if(backgroundBoost){
    const background=await backgroundBoost.restore()
    if(!background.ok){restoreWarning='Background QoS could not be fully restored. Use Restore in Game Boost.';message=restoreWarning}
   }
  }
  if(!next.weeklyCleanup)message='Weekly cleanup disabled. No background cleanup will run.'
  if(next.autoBoost||next.weeklyCleanup)message='Autopilot preferences saved. It runs only while PC Doctor is open.'
  if(restoreWarning)message=restoreWarning // Never erase a failed restoration with a success notice.
  const updated=await status()
  return restoreWarning?{...updated,warning:restoreWarning}:updated
 }
 // The initial user-approved Monster cleanup is a real cleanup run, not a
 // separate invisible pass. Record it to avoid a duplicate scheduled sweep.
 async function recordApprovedCleanup(count){
  if(platform!=='win32'||!Number.isSafeInteger(count)||count<0)return {ok:false,error:'Invalid cleanup record.'}
  const prefs=loadPrefs(stateFile)
  if(!prefs.weeklyCleanup)return {ok:false,error:'Automatic cleanup is not enabled.'}
  try{savePrefs(stateFile,{...prefs,lastCleanupAt:now(),lastCleanupCount:Math.min(300,count)})}
  catch{return {ok:false,error:'Could not persist the completed cleanup time.'}}
  return {ok:true}
 }
 async function handleGame(prefs){
  if(!prefs.autoBoost||platform!=='win32')return
  const games=readStore(customStoreFile)
  const roots=await installedRoots().catch(()=>[])
  if(!games.length&&(!Array.isArray(roots)||!roots.length))return
  let snapshot
  try{snapshot=await processes()}catch{message='Process inventory was unavailable; no automatic setting changes.';return}
  if(!Array.isArray(snapshot))return
  const found=gameForProcesses(snapshot,games,Array.isArray(roots)?roots:[])
  if(!found){
   if(!owner){blockedFile=null;seenFile=null;seenCount=0;return}
   misses++
   if(misses>=3){
    const active=await gameFocus.state()
    const background=backgroundBoost?await backgroundBoost.restore():{ok:true}
    const r=active.session?await gameFocus.stop():{ok:true}
    if(r.ok&&background.ok){message='Trusted game exited; game preferences and background QoS restored.';blockedFile=owner.key;owner=null;misses=0}
    else message='Automatic restore was incomplete. Use Restore in Game Boost and Boost & Play.'
   }
   return
  }
  misses=0
  if(owner){
   const state=await gameFocus.state()
   if(!state.session){
    const restored=backgroundBoost?await backgroundBoost.restore():{ok:true}
    if(!restored.ok){message='Game session ended but background QoS restore needs attention.';return}
    blockedFile=owner.key;owner=null
   }
   return
  }
  if(found.key===blockedFile)return
  if(seenFile===found.key)seenCount++
  else{seenFile=found.key;seenCount=1}
  if(seenCount<2)return
  const state=await gameFocus.state()
  if(state.session)return // Manual Game Focus takes precedence.
  const profile=prefs.boostOnAC?'plugged':'standard'
  const p=await gameFocus.preview(profile,120)
  if(!p.ok){message='Auto-Boost skipped: '+String(p.error||'Windows settings unavailable').slice(0,110);return}
  const r=await gameFocus.start(profile,p.token)
  if(r.ok){
   owner={file:found.file,key:found.key,name:found.name}
   const background=backgroundBoost?await backgroundBoost.begin(found):{ok:true,modifiedCount:0}
   message='Auto-Boost activated for '+owner.name+'. '+(prefs.boostOnAC?
    'AC-only High Performance was requested and is subject to Windows/AC availability. ':'')+
    (background.ok?
    background.modifiedCount+' approved background process adjustments attempted.':
    'Background QoS unavailable: '+String(background.error||'Unknown error').slice(0,135))+
    ' Restoration is attempted after the game exits, on quit or at next launch.'
  }else{blockedFile=found.key;message='Auto-Boost could not start. No game was modified.'}
 }
 async function handleCleanup(prefs){
  if(!prefs.weeklyCleanup||platform!=='win32'||(prefs.lastCleanupAt&&now()-prefs.lastCleanupAt<WEEK))return
  const focus=await gameFocus.state()
  if(focus.session||owner)return // Never clean during an active Game Focus session.
  // If we can see a trusted game running but have not yet enabled Game Focus,
  // avoid interfering with its temporary files. If enumeration fails, skip.
  try{
   const roots=await installedRoots().catch(()=>[])
   const active=gameForProcesses(await processes(),readStore(customStoreFile),Array.isArray(roots)?roots:[])
   if(active)return
  }catch{return}
  // Separate cleaner instance: cannot invalidate user-created file previews.
  const s=await tempCleaner.scan()
  let count=0,desc=''
  if(s.ok){
   const eligible=(s.files||[]).filter(x=>x.ageDays>=30&&/\.tmp$/i.test(x.name))
   if(eligible.length){
    const r=await tempCleaner.recycle(s.token,eligible.map(x=>x.id))
    count=r.movedCount||0
    desc='Auto Care moved '+count+' old .tmp files to Recycle Bin. '+(r.failedCount||0)+' skipped. Disk space is not freed until the bin is emptied.'
   }else desc='Weekly Auto Care: no eligible 30+ day .tmp files.'
  }else desc='Weekly Auto Care skipped: '+String(s.error).slice(0,110)
  try{
   const latest=loadPrefs(stateFile)
   if(latest.weeklyCleanup)savePrefs(stateFile,{...latest,lastCleanupAt:now(),lastCleanupCount:count})
  }catch{}
  message=desc
 }
 async function tick(){
  if(platform!=='win32'||working)return
  const prefs=loadPrefs(stateFile)
  if(!prefs.autoBoost&&!prefs.weeklyCleanup)return
  working=true
  try{
   await handleGame(prefs)
   await handleCleanup(prefs)
  }catch(e){message='Autopilot check was skipped: '+String(e?.message||e).slice(0,130)}
  finally{working=false}
 }
 function start(){
  if(platform!=='win32'||timer)return
  timer=schedule(()=>{void tick()})
  timer?.unref?.()
  // Reconcile immediately at startup; subsequent 5-second snapshots confirm identity.
  void tick()
 }
 function stop(){if(timer){cancel(timer);timer=null}}
 return {status,configure,recordApprovedCleanup,tick,start,stop,
  currentGame:()=>owner?{...owner}:null}
}
module.exports={createAutopilot,loadPrefs,savePrefs,processExecutable,gameForProcesses,WEEK,INTERVAL}

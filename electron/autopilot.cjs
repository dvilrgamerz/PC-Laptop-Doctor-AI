'use strict'
// Optional local Autopilot. Both background actions are OFF by default.
// Game identification requires an exact previously user-selected EXE path.
// Cleanup only MOVES eligible 30+ day .tmp files to Recycle Bin and NEVER deletes files.
const fs=require('node:fs')
const path=require('node:path')
const {readStore}=require('./custom-games.cjs')
const WEEK=7*24*60*60*1000
const INTERVAL=15000
const VERSION=1

function loadPrefs(file){
 try{
  const v=JSON.parse(fs.readFileSync(file,'utf8'))
  if(v?.version!==VERSION)return defaults()
  return {version:VERSION,autoBoost:v.autoBoost===true,weeklyCleanup:v.weeklyCleanup===true,
   lastCleanupAt:Number.isSafeInteger(v.lastCleanupAt)&&v.lastCleanupAt>=0?v.lastCleanupAt:0,
   lastCleanupCount:Number.isInteger(v.lastCleanupCount)?Math.max(0,Math.min(300,v.lastCleanupCount)):0}
 }catch{return defaults()}
}
function defaults(){return {version:VERSION,autoBoost:false,weeklyCleanup:false,lastCleanupAt:0,lastCleanupCount:0}}
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
function gameForProcesses(processes,games){
 const known=new Map(games.filter(x=>typeof x.file==='string'&&typeof x.name==='string')
   .map(g=>[cleanWinPath(g.file),g]).filter(([k])=>k!==null))
 for(const proc of processes){
  const exe=processExecutable(proc)
  if(exe&&known.has(exe))return {file:exe,name:known.get(exe).name.slice(0,90)}
 }
 return null
}
function createAutopilot({stateFile,customStoreFile,gameFocus,processes,tempCleaner,
 platform=process.platform,now=()=>Date.now(),schedule=fn=>setInterval(fn,INTERVAL),
 cancel=timer=>clearInterval(timer)}={}){
 if(!stateFile||!customStoreFile||!gameFocus||typeof processes!=='function'||!tempCleaner)throw Error('Missing Autopilot dependencies')
 let timer=null,working=false,owner=null,misses=0,seenFile=null,seenCount=0,blockedFile=null
 let message='Autopilot is off. No background actions occur until you enable a switch.'
 async function status(){
  const v=loadPrefs(stateFile)
  return {ok:true,supported:platform==='win32',autoBoost:v.autoBoost,weeklyCleanup:v.weeklyCleanup,
   lastCleanupAt:v.lastCleanupAt||null,lastCleanupCount:v.lastCleanupCount,activeGame:owner?.name||null,
   running:working,message,
   limits:'Auto-Boost detects only personally added trusted EXEs with exact Windows process paths. Weekly cleanup moves only old .tmp files to Recycle Bin; it does not free disk space.'}
 }
 async function configure(options){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(!options||typeof options.autoBoost!=='boolean'||typeof options.weeklyCleanup!=='boolean')
   return {ok:false,error:'Choose both automation switches explicitly.'}
  const prev=loadPrefs(stateFile)
  const next={...prev,autoBoost:options.autoBoost,weeklyCleanup:options.weeklyCleanup}
  try{savePrefs(stateFile,next)}catch{return {ok:false,error:'Could not save your local opt-in settings.'}}
  if(!next.autoBoost){
   seenFile=null;seenCount=0;blockedFile=null
   if(owner){
    const current=owner
    const r=await gameFocus.stop()
    if(r.ok){owner=null;misses=0;message='Autopilot disabled and its Game Focus preferences restored.'}
    else message='Autopilot disabled but '+current.name+' session may need manual Stop & Restore.'
   }
  }
  if(!next.weeklyCleanup)message='Weekly cleanup disabled. No background cleanup will run.'
  if(next.autoBoost||next.weeklyCleanup)message='Autopilot preferences saved. It runs only while PC Doctor is open.'
  return status()
 }
 async function handleGame(prefs){
  if(!prefs.autoBoost||platform!=='win32')return
  const games=readStore(customStoreFile)
  if(!games.length)return
  let snapshot
  try{snapshot=await processes()}catch{message='Process inventory was unavailable; no automatic setting changes.';return}
  if(!Array.isArray(snapshot))return
  const found=gameForProcesses(snapshot,games)
  if(!found){
   if(!owner){blockedFile=null;seenFile=null;seenCount=0;return}
   misses++
   if(misses>=3){
    const active=await gameFocus.state()
    if(!active.session){blockedFile=owner.file;owner=null;misses=0;return}
    const r=await gameFocus.stop()
    if(r.ok){message='Trusted game exited; Auto-Boost restored the Windows preferences.';blockedFile=owner.file;owner=null;misses=0}
    else message='Automatic restore was incomplete; use Stop & Restore in Boost & Play.'
   }
   return
  }
  misses=0
  if(owner){
   const state=await gameFocus.state()
   if(!state.session){blockedFile=owner.file;owner=null}
   return
  }
  if(found.file===blockedFile)return
  if(seenFile===found.file)seenCount++
  else{seenFile=found.file;seenCount=1}
  if(seenCount<2)return
  const state=await gameFocus.state()
  if(state.session)return // Manual Game Focus takes precedence.
  const p=await gameFocus.preview('standard',120)
  if(!p.ok){message='Auto-Boost skipped: '+String(p.error||'Windows settings unavailable').slice(0,110);return}
  const r=await gameFocus.start('standard',p.token)
  if(r.ok){
   owner={file:found.file,name:found.name}
   message='Auto-Boost activated for '+owner.name+'. It restores after the game exits or the two-hour safety limit.'
  }else{blockedFile=found.file;message='Auto-Boost could not start. No game was modified.'}
 }
 async function handleCleanup(prefs){
  if(!prefs.weeklyCleanup||platform!=='win32'||(prefs.lastCleanupAt&&now()-prefs.lastCleanupAt<WEEK))return
  const focus=await gameFocus.state()
  if(focus.session||owner)return // Never clean during an active Game Focus session.
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
 }
 function stop(){if(timer){cancel(timer);timer=null}}
 return {status,configure,tick,start,stop}
}
module.exports={createAutopilot,loadPrefs,savePrefs,processExecutable,gameForProcesses,WEEK,INTERVAL}

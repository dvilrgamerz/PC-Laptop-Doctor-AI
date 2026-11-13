'use strict'
// A single user-approved activation of existing, bounded safe automation.
// No arbitrary process termination, system security changes, or permanent file deletion.
const {randomBytes}=require('node:crypto')
const LIMIT_MS=60000
function createMonsterMode({autopilot,tempCleaner,gameFocus,loginStartup=null,platform=process.platform,now=()=>Date.now(),token=()=>randomBytes(24).toString('hex')}={}){
 // Login startup is an explicit, reversible opt-in and is never silently enabled.
 const startupSupported=platform==='win32'&&typeof loginStartup?.get==='function'&&typeof loginStartup?.set==='function'
 function startupState(){
  if(!startupSupported)return null
  try{return loginStartup.get()===true}catch{return null}
 }
 if(!autopilot||!tempCleaner||!gameFocus)throw Error('Monster Mode dependencies missing')
 let pending=null,busy=false
 async function status(){
  const state=await autopilot.status()
  return {ok:!!state.ok,enabled:!!(state.autoBoost&&state.weeklyCleanup),
   startupSupported,startWithWindows:startupState(),
   lastCleanupAt:state.lastCleanupAt||null,lastCleanupCount:state.lastCleanupCount||0,working:!!state.running,
   autoBoost:!!state.autoBoost,weeklyCleanup:!!state.weeklyCleanup,
   activeGame:state.activeGame||null,message:state.message||'',limits:'Works while PC Doctor is running. Only trusted installed games and old top-level Temp .tmp files are eligible.'}
 }
 async function preview(options={startWithWindows:false}){
  if(!options||typeof options!=='object'||Array.isArray(options)||typeof options.startWithWindows!=='boolean')
   return {ok:false,error:'Choose whether PC Doctor should start with Windows before previewing.'}
  if(options.startWithWindows&&!startupSupported)return {ok:false,error:'Windows startup registration is unavailable in this build.'}
  if(platform!=='win32')return {ok:false,error:'Monster Mode requires the Windows app.'}
  if(busy)return {ok:false,error:'Another Monster Mode task is running.'}
  busy=true;pending=null
  try{
   const session=await gameFocus.state()
   if(session?.session)return {ok:false,error:'End the current gaming session before enabling automatic care.'}
   const scan=await tempCleaner.scan()
   if(!scan?.ok)return {ok:false,error:'Safe cleanup inspection failed: '+String(scan?.error||'unknown').slice(0,180)}
   const files=(scan.files||[]).filter(x=>/\.tmp$/i.test(x.name)&&x.ageDays>=30)
   const bytes=files.reduce((n,x)=>n+x.sizeBytes,0)
   const key=token()
   pending={key,expires:now()+LIMIT_MS,scanToken:scan.token,ids:files.map(x=>x.id),count:files.length,bytes,
     startWithWindows:options.startWithWindows}
   return {ok:true,token:key,count:files.length,bytes,expiresInSeconds:60,startWithWindows:options.startWithWindows,
     actions:[
      'Enable automatic Game Focus for verified running Steam/Epic/user-added games while PC Doctor is open',
      'Enable weekly recycling of safe top-level user-Temp .tmp files aged 30+ days',
      'Immediately move '+files.length+' matching temporary files to Windows Recycle Bin (not permanently delete)',
      options.startWithWindows?'Start PC Doctor automatically when you sign into Windows':'Do not start PC Doctor automatically with Windows'
     ],
     caution:'PC Doctor will not permanently delete files. Recycle Bin files still occupy disk space. Game Focus may not improve FPS and automatically restores when supported game exits.'}
  }catch(e){pending=null;return {ok:false,error:'Could not safely preview Monster Mode: '+String(e?.message||e).slice(0,160)}}
  finally{busy=false}
 }
 async function activate(key){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Monster Mode is busy.'}
  if(!pending||typeof key!=='string'||pending.key!==key||now()>pending.expires)
   return {ok:false,error:'Review a fresh Monster Mode preview before confirming.'}
  const p=pending;pending=null;busy=true
  try{
   const focus=await gameFocus.state()
   if(focus?.session)return {ok:false,error:'A gaming session is active. No automation settings changed.'}
   const result=await autopilot.configure({autoBoost:true,weeklyCleanup:true})
   if(!result?.ok)return {ok:false,error:'Could not enable automatic care: '+String(result?.error||'unknown').slice(0,130)}
   let startupWarning=null
   if(startupSupported){
    try{loginStartup.set(p.startWithWindows);if(startupState()!==p.startWithWindows)
      startupWarning='Windows startup preference could not be verified. Check the current status.'}
    catch{startupWarning='Windows startup preference could not be changed. Automatic care still works while PC Doctor is open.'}
   }
   let cleanup={ok:true,movedCount:0,failedCount:0,movedBytes:0}
   if(p.ids.length){
    cleanup=await tempCleaner.recycle(p.scanToken,p.ids)
   }
   let cleanupRecordWarning=null
   if(cleanup.ok&&typeof autopilot.recordApprovedCleanup==='function'){
    const recorded=await autopilot.recordApprovedCleanup(cleanup.movedCount||0)
    if(!recorded?.ok)cleanupRecordWarning='Cleanup ran, but its time could not be saved; automatic care may check again soon.'
   }
   return {ok:true,enabled:true,autoBoost:true,weeklyCleanup:true,
    recycledFiles:cleanup.movedCount||0,failedFiles:cleanup.failedCount||0,
    bytesMoved:cleanup.movedBytes||0,
    startWithWindows:startupState(),
    warning:[startupWarning,cleanupRecordWarning,!cleanup.ok?'Automatic care enabled, but some old Temp files could not be moved. No further removal was attempted.':null].filter(Boolean).join(' ')||null,
    message:'Monster Mode enabled. Safe gaming and weekly Temp care run whenever PC Doctor is open. '+(p.startWithWindows?'Windows startup requested. ':'Windows startup not requested. ')+(cleanup.movedCount||0)+' temporary files moved to Recycle Bin; disk space was not freed.'}
  }catch(e){return {ok:false,error:'Monster Mode failed during activation. Review Autopilot status before trying again: '+String(e?.message||e).slice(0,150)}}
  finally{busy=false}
 }
 async function disable(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Monster Mode is busy.'}
  pending=null;busy=true
  try{
   const r=await autopilot.configure({autoBoost:false,weeklyCleanup:false})
   if(!r?.ok)return {ok:false,error:r?.error||'Unable to disable automation'}
   let warning=null
   if(startupSupported){
    try{loginStartup.set(false);if(startupState()!==false)warning='Windows startup registration could not be verified.'}
    catch{warning='Could not remove PC Doctor from Windows startup; disable it in Windows Startup Apps.'}
   }
   return {ok:true,enabled:false,startWithWindows:startupState(),warning,
    message:'Monster Mode automations disabled. Supported managed gaming settings are being restored.'}
  }finally{busy=false}
 }
 return {status,preview,activate,disable}
}
module.exports={createMonsterMode,LIMIT_MS}

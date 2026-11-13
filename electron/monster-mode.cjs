'use strict'
// A single user-approved activation of existing, bounded safe automation.
// No arbitrary process termination, system security changes, or permanent file deletion.
const {randomBytes}=require('node:crypto')
const LIMIT_MS=60000
function createMonsterMode({autopilot,tempCleaner,gameFocus,platform=process.platform,now=()=>Date.now(),token=()=>randomBytes(24).toString('hex')}={}){
 if(!autopilot||!tempCleaner||!gameFocus)throw Error('Monster Mode dependencies missing')
 let pending=null,busy=false
 async function status(){
  const state=await autopilot.status()
  return {ok:!!state.ok,enabled:!!(state.autoBoost&&state.weeklyCleanup),
   autoBoost:!!state.autoBoost,weeklyCleanup:!!state.weeklyCleanup,
   activeGame:state.activeGame||null,message:state.message||'',limits:'Works while PC Doctor is running. Only trusted installed games and old top-level Temp .tmp files are eligible.'}
 }
 async function preview(){
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
   pending={key,expires:now()+LIMIT_MS,scanToken:scan.token,ids:files.map(x=>x.id),count:files.length,bytes}
   return {ok:true,token:key,count:files.length,bytes,expiresInSeconds:60,
     actions:[
      'Enable automatic Game Focus for verified running Steam/Epic/user-added games while PC Doctor is open',
      'Enable weekly recycling of safe top-level user-Temp .tmp files aged 30+ days',
      'Immediately move '+files.length+' matching temporary files to Windows Recycle Bin (not permanently delete)'
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
   let cleanup={ok:true,movedCount:0,failedCount:0,movedBytes:0}
   if(p.ids.length){
    cleanup=await tempCleaner.recycle(p.scanToken,p.ids)
   }
   return {ok:true,enabled:true,autoBoost:true,weeklyCleanup:true,
    recycledFiles:cleanup.movedCount||0,failedFiles:cleanup.failedCount||0,
    bytesMoved:cleanup.movedBytes||0,
    warning:!cleanup.ok?'Automatic care enabled, but some old Temp files could not be moved. No further removal was attempted.':null,
    message:'Monster Mode enabled. Safe automatic gaming and weekly Temp care now run while PC Doctor is open. '+(cleanup.movedCount||0)+' temporary files moved to Recycle Bin; disk space was not freed.'}
  }catch(e){return {ok:false,error:'Monster Mode failed during activation. Review Autopilot status before trying again: '+String(e?.message||e).slice(0,150)}}
  finally{busy=false}
 }
 async function disable(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Monster Mode is busy.'}
  pending=null;busy=true
  try{
   const r=await autopilot.configure({autoBoost:false,weeklyCleanup:false})
   return r?.ok?{ok:true,enabled:false,message:'Monster Mode automations disabled. Any game setting managed by Autopilot is being restored.'}:{ok:false,error:r?.error||'Unable to disable automation'}
  }finally{busy=false}
 }
 return {status,preview,activate,disable}
}
module.exports={createMonsterMode,LIMIT_MS}

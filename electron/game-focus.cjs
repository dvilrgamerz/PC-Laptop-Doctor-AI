'use strict'
// PC Doctor Game Focus: only reverses Windows settings this session attempted.
// No process termination, suspended services, arbitrary registry values or game injection.
const fs=require('node:fs')
const path=require('node:path')
const {randomBytes}=require('node:crypto')
const ACTIONS=Object.freeze([
 Object.freeze({id:'gameMode',apply:'enableGameMode',undo:'restoreGameMode',title:'Windows Game Mode'}),
 Object.freeze({id:'performance',apply:'enablePerformance',undo:'restorePerformance',title:'High performance power plan'})
])
function load(file){
 try{
  const value=JSON.parse(fs.readFileSync(file,'utf8'))
  return value?.version===1 && ['starting','active','restoring'].includes(value.phase) &&
    ['standard','plugged'].includes(value.profile) && Array.isArray(value.attempted) &&
    value.attempted.every(a=>ACTIONS.some(x=>x.id===a))?
      {version:1,phase:value.phase,profile:value.profile,attempted:[...new Set(value.attempted)].slice(0,2),startedAt:value.startedAt||null,
      expiresAt:typeof value.expiresAt==='string'&&Number.isFinite(Date.parse(value.expiresAt))?value.expiresAt:null}:null
 }catch{return null}
}
function persist(file,data){
 fs.mkdirSync(path.dirname(file),{recursive:true})
 const tmp=file+'.tmp'
 try{
  fs.writeFileSync(tmp,JSON.stringify(data),{encoding:'utf8',mode:0o600})
  fs.renameSync(tmp,file)
 }catch(e){try{fs.rmSync(tmp,{force:true})}catch{}throw e}
}
function createGameFocus({fixes,stateFile,platform=process.platform,readBattery=async()=>({hasBattery:false}),
 now=()=>Date.now(),random=()=>randomBytes(20).toString('hex'),schedule=(fn,ms)=>setTimeout(fn,ms),cancel=(timer)=>clearTimeout(timer)}={}){
 if(!fixes||typeof fixes.perform!=='function'||typeof fixes.status!=='function'||!stateFile)throw Error('Missing Game Focus dependencies')
 let ticket=null,busy=false,scheduled=null,automaticOutcome=null
 const allowedDurations=new Set([0,30,60,120,240])
 async function state(){
  const journal=load(stateFile)
  if(platform!=='win32')return {ok:false,error:'Windows desktop required.',session:journal}
  let settings
  try{settings=await fixes.status()}catch{}
  return {ok:true,session:journal,
   needsRecovery:!!journal,
   canUseGameMode:settings?.gameMode?.available===true,
   gameModeEnabled:settings?.gameMode?.value===1,
   canUsePerformance:settings?.highPerformanceAvailable===true,
   canRestoreOtherSettings:settings?.canRestore||{},
   automaticOutcome}
 }
 async function preview(profile,stopAfterMinutes=120){
  if(platform!=='win32')return {ok:false,error:'Windows desktop required.'}
  if(!['standard','plugged'].includes(profile))return {ok:false,error:'Unknown Game Focus profile.'}
  if(!allowedDurations.has(stopAfterMinutes))return {ok:false,error:'Unsupported automatic session duration.'}
  if(busy||load(stateFile))return {ok:false,error:'A prior Game Focus session needs recovery or is already active.'}
  const status=await fixes.status()
  if(!status?.supported)return {ok:false,error:'Windows preferences are unavailable.'}
  const actions=[]
  const skips=[]
  if(status.canRestore?.gameMode)skips.push('Game Mode is managed by an existing PC Doctor change; leaving it alone.')
  else if(status.gameMode?.available!==true)skips.push('Game Mode setting could not be safely read.')
  else if(status.gameMode.value===1)skips.push('Game Mode is already enabled.')
  else if([null,0].includes(status.gameMode.value))actions.push('gameMode')
  if(profile==='plugged'){
   const battery=await readBattery().catch(()=>null)
   if(battery?.hasBattery && battery.acConnected!==true&&battery.isCharging!==true)
    skips.push('Connect the laptop to AC power before using the performance plan.')
   else if(status.canRestore?.performance)skips.push('Power plan already managed by another PC Doctor setting.')
   else if(!status.highPerformanceAvailable)skips.push('Standard High performance power plan is not available on this PC.')
   else if(status.activePower?.toLowerCase()==='8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c')
    skips.push('High performance power plan is already active.')
   else actions.push('performance')
  }
  const token=random()
  ticket={token,profile,actions,stopAfterMinutes,expires:now()+60000}
  return {ok:true,token,profile,stopAfterMinutes,actions:actions.map(a=>ACTIONS.find(x=>x.id===a)?.title),skips,
   warning:'Game Focus is temporary Windows preference management, not an FPS/RAM boost. Performance power plans can increase heat, fan noise and energy use; avoid on battery. No applications are closed.',
   expiresInSeconds:60}
 }
 async function start(profile,token){
  if(platform!=='win32')return {ok:false,error:'Windows desktop required.'}
  if(busy||load(stateFile))return {ok:false,error:'Session already running or needs recovery.'}
  if(!ticket||token!==ticket.token||profile!==ticket.profile||now()>ticket.expires)return {ok:false,error:'Review the Game Focus preview again.'}
  const plan=ticket;ticket=null;busy=true
  const journal={version:1,phase:'starting',profile,attempted:[],startedAt:new Date(now()).toISOString(),
    expiresAt:plan.stopAfterMinutes?new Date(now()+plan.stopAfterMinutes*60000).toISOString():null}
  try{
   // Re-check after user approval: never unexpectedly modify a setting changed in between.
   const current=await fixes.status()
   const battery=await readBattery().catch(()=>null)
   for(const action of plan.actions){
    if(action==='gameMode' && (current.canRestore?.gameMode || current.gameMode?.available!==true ||
        ![null,0].includes(current.gameMode.value)))return {ok:false,error:'Game Mode changed after preview. Review again.'}
    if(action==='performance' && (current.canRestore?.performance || !current.highPerformanceAvailable ||
       (battery?.hasBattery && battery.acConnected!==true && battery.isCharging!==true)))
       return {ok:false,error:'Power prerequisites changed after preview. Review again.'}
   }
   persist(stateFile,journal)
   const changed=[]
   for(const id of plan.actions){
    // Write-ahead journal: if power fails immediately after apply, its attempted action survives.
    journal.attempted.push(id)
    persist(stateFile,journal)
    const item=ACTIONS.find(x=>x.id===id)
    const result=await fixes.perform(item.apply)
    if(!result.ok)throw Error(result.error||('Could not activate '+item.title))
    if(result.changed)changed.push(item.title)
   }
   journal.phase='active'
   persist(stateFile,journal)
   automaticOutcome=null
   if(scheduled){cancel(scheduled);scheduled=null}
   if(plan.stopAfterMinutes){
     try{
       scheduled=schedule(()=>{
         Promise.resolve(stop(true)).catch(e=>{automaticOutcome='Automatic restore did not complete: '+String(e.message||e).slice(0,120)})
       },plan.stopAfterMinutes*60000)
       scheduled?.unref?.()
     }catch(e){
       return {ok:true,active:true,changed,
        warning:'Automatic timer could not start. Use Stop & Restore or exit the app.',
        message:'Game Focus enabled, but automatic time-limit restoration is unavailable.'}
     }
   }
   return {ok:true,active:true,changed,message:changed.length?
     'Game Focus active. Your selected Windows preferences were saved for restoration.':
     'Game Focus session started; no Windows preferences needed modification.'}
  }catch(e){
   // Preserve transaction for stop/recovery, even after partial action.
   return {ok:false,recoverable:true,error:'Could not complete Game Focus. Use Stop & restore. '+String(e.message).slice(0,190)}
  }finally{busy=false}
 }
 async function stop(automatic=false){
  if(platform!=='win32')return {ok:false,error:'Windows desktop required.'}
  if(busy)return {ok:false,error:'Another Game Focus operation is running.'}
  const journal=load(stateFile)
  if(!journal)return {ok:true,changed:false,message:'No Game Focus changes are awaiting restoration.'}
  busy=true
  if(scheduled){cancel(scheduled);scheduled=null}
  const errors=[],restored=[]
  try{
   journal.phase='restoring'
   persist(stateFile,journal)
   for(const id of [...journal.attempted].reverse()){
    const item=ACTIONS.find(x=>x.id===id)
    if(!item)continue
    try{
     const current=await fixes.status()
     const hadBackup=id==='gameMode'?current.canRestore?.gameMode:current.canRestore?.performance
     if(hadBackup){
      const result=await fixes.perform(item.undo)
      if(!result.ok)throw Error(result.error||'Restore rejected')
      restored.push(item.title)
     }
     journal.attempted=journal.attempted.filter(x=>x!==id)
     persist(stateFile,journal)
    }catch(e){errors.push(item.title+': '+String(e.message).slice(0,150))}
   }
   if(!journal.attempted.length){
    fs.rmSync(stateFile,{force:true})
    if(automatic)automaticOutcome='The session time limit ended. PC Doctor restored your prior supported Windows preferences.'
    return {ok:true,changed:restored.length>0,restored,
      message:automatic?'Time limit reached; supported Windows preferences restored.':'Game Focus stopped. Saved Windows preferences restored where supported.'}
   }
   if(automatic)automaticOutcome='Automatic restoration was incomplete. Open Boost & Play and use Stop & Restore.'
   return {ok:false,restored,error:'Some preferences need manual recovery: '+errors.join('; ')}
  }catch(e){if(automatic)automaticOutcome='Automatic restoration failed; review Windows preferences.'
   return {ok:false,error:'Restoration journal could not be saved: '+String(e.message).slice(0,150)}}
  finally{busy=false}
 }
 return {state,preview,start,stop}
}
module.exports={createGameFocus,ACTIONS,load,persist}

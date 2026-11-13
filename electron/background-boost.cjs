'use strict'
// V9 beta: consented, process-scoped EcoQoS. No killing, suspension, service or registry changes.
const fs=require('node:fs')
const path=require('node:path')
const {classify,protectedReason,cleanWinPath}=require('./boost-policy.cjs')
const MAX_RULES=24,MAX_ACTIONS=4
function save(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true})
 const tmp=file+'.tmp'
 try{
  fs.writeFileSync(tmp,JSON.stringify(value),{encoding:'utf8',mode:0o600})
  fs.renameSync(tmp,file)
 }catch(e){try{fs.rmSync(tmp,{force:true})}catch{}throw e}
}
function readJson(file){
 try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return null}
}
function loadRules(file){
 const data=readJson(file)
 if(data?.version!==1||!Array.isArray(data.rules))return []
 return data.rules.filter(r=>r&&r.mode==='reduce'&&typeof r.exe==='string'&&
  cleanWinPath(r.exe)===r.exe&&r.exe.toLowerCase().endsWith('.exe')).slice(0,MAX_RULES)
}
function validSnapshot(s){return !!s&&Number.isSafeInteger(s.controlMask)&&s.controlMask>=0&&s.controlMask<=4294967295&&
 Number.isSafeInteger(s.stateMask)&&s.stateMask>=0&&s.stateMask<=4294967295}
function loadJournal(file){
 const data=readJson(file)
 if(data?.version!==1||!Array.isArray(data.actions)||data.actions.length>MAX_ACTIONS)return null
 if(!data.actions.every(a=>a&&Number.isSafeInteger(a.pid)&&a.pid>4&&typeof a.exe==='string'&&
   typeof a.startTicks==='string'&&/^[0-9]{1,21}$/.test(a.startTicks)&&validSnapshot(a.before)&&validSnapshot(a.applied)))return null
 return data
}
function createBackgroundBoost({rulesFile,journalFile,processes,adapter,platform=process.platform,appExe=process.execPath,now=()=>Date.now()}={}){
 if(!rulesFile||!journalFile||typeof processes!=='function'||!adapter)throw Error('Missing Background Boost dependencies')
 let busy=false,game=null,lastMessage='No background applications are modified without explicit approval.'
 function hasJournal(){return fs.existsSync(journalFile)}
 function context(gameInfo=game){
  const exe=gameInfo?.file||null
  const key=gameInfo?.key||null
  const root=key&&cleanWinPath(key)!==cleanWinPath(exe)?key:exe?path.win32.dirname(exe):null
  return {gameExe:exe,gameRoot:root,appExe}
 }
 async function inventory(){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  try{
   const list=await processes()
   if(!Array.isArray(list))throw Error('Process inventory unavailable')
   const c=context()
   const candidates=list.map(p=>classify(p,c))
    .filter(p=>p.status==='eligible'&&p.exe&&p.pid>4)
    .sort((a,b)=>(b.cpu-a.cpu)||(b.memMB||0)-(a.memMB||0))
   const rules=loadRules(rulesFile)
   return {ok:true,items:candidates.slice(0,35).map(p=>({...p,mode:rules.some(x=>x.exe===p.exe)?'reduce':'keep'})),
    eligibleCount:candidates.length,shownCount:Math.min(35,candidates.length),
    protectedCount:list.length-candidates.length}
  }catch(e){return {ok:false,error:'Could not inspect running applications: '+String(e?.message||e).slice(0,130)}}
 }
 async function status(){
  const journal=loadJournal(journalFile)
  return {ok:true,supported:platform==='win32',active:!!journal&&journal.phase==='active',
   needsRecovery:hasJournal()&&(!journal||journal.actions.length>0),
   modifiedCount:journal?.actions.length||0,approvedCount:loadRules(rulesFile).length,
   game:game?.name||null,busy,message:lastMessage,
   limits:'Only user-approved, verified background EXEs can receive EcoQoS while an auto-detected game is active. No process is closed. Restore is attempted on game exit, app quit and next launch.'}
 }
 async function setRule(exe,mode){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  if(busy)return {ok:false,error:'Background Boost is busy.'}
  if(mode!=='keep'&&mode!=='reduce')return {ok:false,error:'Choose Keep or Reduce.'}
  const normalized=cleanWinPath(exe)
  if(!normalized||normalized!==exe||!exe.endsWith('.exe')||exe.length>1024)return {ok:false,error:'Invalid executable identity.'}
  // A renderer-provided path is NEVER authority: require it to match the live inventory.
  const snapshot=await inventory()
  if(!snapshot.ok)return snapshot
  const found=snapshot.items.find(p=>p.exe===exe)
  if(!found&&mode==='reduce')return {ok:false,error:'App must be a currently visible eligible user process before approval.'}
  const rules=loadRules(rulesFile).filter(x=>x.exe!==exe)
  if(mode==='reduce'){
   if(rules.length>=MAX_RULES)return {ok:false,error:'Maximum 24 explicitly approved applications.'}
   rules.push({exe,mode:'reduce'})
  }
  try{save(rulesFile,{version:1,rules})}
  catch{return {ok:false,error:'Could not save local app consent.'}}
  lastMessage=mode==='reduce'?'Approved EcoQoS for future detected game sessions. No app was closed.':'Consent removed. Active sessions must still be restored.'
  return {ok:true,mode,approvedCount:rules.length,message:lastMessage}
 }
 async function begin(gameInfo){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  if(busy||hasJournal())return {ok:false,error:'A prior session still needs restoration.'}
  if(!gameInfo||!cleanWinPath(gameInfo.file))return {ok:false,error:'A verified game executable is required.'}
  const rules=loadRules(rulesFile)
  if(!rules.length)return {ok:true,modifiedCount:0,message:'No background applications approved for EcoQoS.'}
  busy=true;game={name:String(gameInfo.name||'Game').slice(0,90),file:gameInfo.file,key:gameInfo.key}
  const journal={version:1,phase:'preparing',createdAt:now(),game:game.name,actions:[]}
  const skipped=[]
  try{
   save(journalFile,journal)
   const list=await processes()
   if(!Array.isArray(list))throw Error('Process list unavailable')
   const seen=new Set()
   for(const proc of list){
    if(journal.actions.length>=MAX_ACTIONS)break
    const item=classify(proc,context(game))
    if(item.status!=='eligible'||!item.exe||seen.has(item.exe)||!rules.some(r=>r.exe===item.exe))continue
    seen.add(item.exe)
    // Validate process identity and original QoS before writing any change.
    const before=await adapter.inspect({pid:item.pid,exe:item.exe})
    if(!before.ok||!validSnapshot(before)){skipped.push(item.name+': '+String(before.error||'EcoQoS unavailable'));continue}
    if(protectedReason(proc,context(game))!==null)continue
    const applied={controlMask:(before.controlMask|1)>>>0,stateMask:(before.stateMask|1)>>>0}
    const record={pid:item.pid,exe:item.exe,startTicks:String(before.startTicks),before:{
     controlMask:before.controlMask,stateMask:before.stateMask},applied}
    if(!/^[0-9]{1,21}$/.test(record.startTicks)){skipped.push(item.name+': missing process lifetime');continue}
    // Write-ahead: after a crash we know exactly what we MAY have applied.
    journal.actions.push(record);save(journalFile,journal)
    const result=await adapter.apply(record)
    if(!result.ok){
     // Do not claim success; leave the attempted record for recovery.
     skipped.push(item.name+': '+String(result.error||'Windows refused the change'))
    }
   }
   journal.phase='active';save(journalFile,journal)
   lastMessage=journal.actions.length+' user-approved process actions attempted; no apps closed.'+
    (skipped.length?' Some actions need review: '+skipped.join('; ').slice(0,250):'')
   return {ok:true,modifiedCount:journal.actions.length,warnings:skipped,message:lastMessage}
  }catch(e){
   lastMessage='Background Boost could not finish; the write-ahead journal is preserved for restoration: '+String(e.message||e).slice(0,150)
   return {ok:false,error:lastMessage}
  }finally{busy=false}
 }
 async function restore(){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  if(busy)return {ok:false,error:'Another Boost operation is running.'}
  if(!hasJournal()){game=null;return {ok:true,restored:0,message:'No QoS adjustments awaiting restoration.'}}
  const journal=loadJournal(journalFile)
  if(!journal)return {ok:false,error:'Recovery journal is invalid; no processes were touched. Inspect the local journal safely.'}
  busy=true;const failures=[];let restored=0
  try{
   journal.phase='restoring';save(journalFile,journal)
   for(const entry of [...journal.actions].reverse()){
    let result=await adapter.restore(entry)
    if(!result.ok&&typeof adapter.probe==='function'){
     // PID reuse and exited apps must not trap a journal forever. The Win32
     // helper checks the *original* executable and creation-time identity.
     const probe=await adapter.probe(entry)
     if(probe?.ok&&probe.same===false)result={ok:true,exited:true}
    }
    if(result.ok){
     journal.actions=journal.actions.filter(x=>x!==entry)
     save(journalFile,journal);restored++
    }else failures.push(path.win32.basename(entry.exe)+': '+String(result.error||'Could not restore').slice(0,110))
   }
   if(!journal.actions.length){fs.rmSync(journalFile,{force:true});game=null}
   lastMessage=failures.length?'Restore needs attention: '+failures.join('; ').slice(0,350):
    'Background process QoS restored or original processes already exited.'
   return {ok:failures.length===0,restored,remaining:journal.actions.length,
    error:failures.length?lastMessage:null,message:lastMessage}
  }catch(e){return {ok:false,error:'Recovery journal error: '+String(e.message||e).slice(0,150)}}
  finally{busy=false}
 }
 return {inventory,status,setRule,begin,restore}
}
module.exports={createBackgroundBoost,loadRules,loadJournal,validSnapshot,MAX_ACTIONS}

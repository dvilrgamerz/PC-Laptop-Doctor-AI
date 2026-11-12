'use strict'
// Explicit game-agnostic boost session. Uses only existing consented Windows Game Mode
// and power-plan actions. Never kills/suspends processes, services or security defenses.
const fs=require('node:fs')
const path=require('node:path')
const ALLOWED=['enableGameMode','enablePerformance']
const UNDO={enableGameMode:'restoreGameMode',enablePerformance:'restorePerformance'}
function load(file){
 try{
  const v=JSON.parse(fs.readFileSync(file,'utf8'))
  return v?.version===1&&Array.isArray(v.applied)
   ? {version:1,active:v.active===true,applied:v.applied.filter(x=>ALLOWED.includes(x)),startedAt:typeof v.startedAt==='string'?v.startedAt:null}
   : {version:1,active:false,applied:[],startedAt:null}
 }catch{return {version:1,active:false,applied:[],startedAt:null}}
}
function save(file,state){
 fs.mkdirSync(path.dirname(file),{recursive:true})
 const tmp=file+'.tmp'
 try{fs.writeFileSync(tmp,JSON.stringify(state),{mode:0o600,encoding:'utf8'});fs.renameSync(tmp,file)}
 catch(e){try{fs.unlinkSync(tmp)}catch{}throw e}
}
function createBoostSession({fixes,stateFile,platform=process.platform,now=()=>new Date().toISOString()}={}){
 if(!fixes||!stateFile)throw Error('Missing boost dependencies')
 let busy=false
 async function status(){
  const saved=load(stateFile),windows=await fixes.status()
  return {ok:true,active:saved.active,startedAt:saved.startedAt,
    applied:[...saved.applied],window:windows,canRestore:saved.applied.length>0,
    explanation:'Boost only changes supported Windows Game Mode and optional AC high-performance power plan. No apps or services are stopped.'}
 }
 async function start({gameMode=true,performance=false}={}){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Boost is already busy.'}
  const previous=load(stateFile)
  if(previous.active||previous.applied.length)return {ok:false,error:'A boost session or recovery exists. Restore it before starting another.'}
  if(gameMode!==true&&performance!==true)return {ok:false,error:'Choose at least one supported optimization.'}
  if(typeof gameMode!=='boolean'||typeof performance!=='boolean')return {ok:false,error:'Invalid optimization choices.'}
  busy=true
  const current={version:1,active:true,startedAt:now(),applied:[]}
  const outcomes=[]
  try{
   save(stateFile,current)
   for(const action of ALLOWED){
    if((action==='enableGameMode'&&!gameMode)||(action==='enablePerformance'&&!performance))continue
    // If the existing app recorded a separate user change, don't claim it or restore it.
    const r=await fixes.perform(action)
    if(r.ok&&r.changed===true){
     current.applied.push(action)
     save(stateFile,current)
    }
    outcomes.push({action,ok:r.ok,changed:r.changed===true,message:r.message||r.error||'Unknown result'})
   }
   const allOk=outcomes.every(x=>x.ok)
   if(!current.applied.length){
    current.active=false;current.startedAt=null
    save(stateFile,current)
   }
   return {ok:allOk,partial:!allOk,active:current.active,applied:[...current.applied],outcomes,
    message:current.applied.length
      ? 'Boost session activated. Restore original settings when you finish playing.'
      : allOk?'Chosen settings were already active; PC Doctor changed nothing.':'No new settings applied; see the individual reasons.'}
  }catch(e){
   // Underlying fix service preserves the backup if interrupted; never claim a clean state.
   return {ok:false,partial:true,error:'Boost was interrupted. Inspect Fix & Gaming backups before another session: '+String(e.message).slice(0,180)}
  }finally{busy=false}
 }
 async function stop(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'A boost action is in progress.'}
  const current=load(stateFile)
  if(!current.active&&!current.applied.length)return {ok:true,changed:false,message:'No boost session is active.'}
  busy=true
  const outcomes=[]
  try{
   // Restore in reverse application order; never overwrite changes made by other apps.
   for(const action of [...current.applied].reverse()){
    const r=await fixes.perform(UNDO[action])
    outcomes.push({action:UNDO[action],ok:r.ok,message:r.message||r.error||'Unknown result'})
    if(r.ok){
      current.applied=current.applied.filter(x=>x!==action)
      save(stateFile,current)
    }
   }
   current.active=current.applied.length>0
   if(!current.active)current.startedAt=null
   save(stateFile,current)
   return {ok:current.applied.length===0,active:current.active,remaining:[...current.applied],outcomes,
     message:current.active?'Some settings require manual review; saved originals remain.':'The Windows settings changed by this boost session were restored.'}
  }catch(e){
   return {ok:false,error:'Restore did not finish; saved originals remain. '+String(e.message).slice(0,140)}
  }finally{busy=false}
 }
 return {status,start,stop}
}
module.exports={createBoostSession,load,save,ALLOWED}

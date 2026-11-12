'use strict'
// Small audited maintenance actions: no arbitrary file paths, no process termination,
// no restore point creation and no changes to Windows firewall or security services.
const fs=require('node:fs')
const path=require('node:path')
const crypto=require('node:crypto')
const {execFile}=require('node:child_process')
const ACTIONS=Object.freeze({
  flushDns:{
    title:'Flush Windows DNS resolver cache',
    explanation:'Clears cached DNS name resolutions. A fresh lookup may be briefly slower. Does not reset your router or network adapter.',
    irreversible:true
  },
  clearAppCache:{
    title:'Clear PC Doctor HTTP cache only',
    explanation:'Deletes this app’s Electron HTTP cache. It does NOT free up other applications’ storage, remove documents, or clear saved scan history. Cached resources may be fetched again.',
    irreversible:true
  }
})
function runCommand(file,args){
  return new Promise((resolve,reject)=>{
    execFile(file,args,{windowsHide:true,timeout:15000,maxBuffer:65536},(error,stdout,stderr)=>{
      if(error){return reject(new Error((String(stderr||error.message)).trim().slice(0,200)))}
      resolve(String(stdout||'').slice(0,200))
    })
  })
}
function loadLog(file){
  try{
    const values=JSON.parse(fs.readFileSync(file,'utf8'))
    return Array.isArray(values)?values.filter(x=>x&&Object.hasOwn(ACTIONS,x.action)&&typeof x.at==='string').slice(-50).map(x=>({
      action:x.action,at:x.at,success:x.success===true
    })):[]
  }catch{return []}
}
function writeLog(file,items){
  fs.mkdirSync(path.dirname(file),{recursive:true})
  const temp=file+'.tmp'
  try{
    fs.writeFileSync(temp,JSON.stringify(items.slice(-50)),{encoding:'utf8',mode:0o600})
    fs.renameSync(temp,file)
  } catch(error){
    try{fs.unlinkSync(temp)}catch{}
    throw error
  }
}
function createMaintenance({platform=process.platform,command=runCommand,getSession,logFile,clock=()=>Date.now()}){
  if(!logFile || typeof getSession!=='function')throw new Error('Missing maintenance dependencies')
  let pending=null,busy=false
  async function preview(action){
    if(platform!=='win32')return {ok:false,error:'Windows desktop app required.'}
    if(!Object.hasOwn(ACTIONS,action))return {ok:false,error:'Unknown maintenance action.'}
    const info=ACTIONS[action]
    let approximateCacheBytes=null
    if(action==='clearAppCache'){
      try{approximateCacheBytes=await getSession().getCacheSize()}catch{}
    }
    const token=crypto.randomBytes(24).toString('hex')
    pending={action,token,expires:clock()+60000}
    return {ok:true,action,token,description:info.explanation,
      title:info.title,irreversible:info.irreversible,
      approximateCacheBytes:Number.isFinite(approximateCacheBytes)?approximateCacheBytes:null}
  }
  async function apply(action,token){
    if(platform!=='win32')return {ok:false,error:'Windows desktop app required.'}
    if(busy)return {ok:false,error:'Another maintenance task is still running.'}
    if(!Object.hasOwn(ACTIONS,action) ||
      typeof token!=='string' || !pending || pending.action!==action ||
      pending.expires<clock() || token!==pending.token) {
      return {ok:false,error:'Preview this action and confirm again before making changes.'}
    }
    pending=null
    busy=true
    let ok=false,error=null
    try {
      if(action==='flushDns') {
        await command('ipconfig.exe',['/flushdns'])
      } else if(action==='clearAppCache') {
        await getSession().clearCache()
      }
      ok=true
    } catch(e) {
      error='Windows maintenance could not complete: '+String(e.message||e).slice(0,160)
    } finally {
      busy=false
      try{writeLog(logFile,[...loadLog(logFile),{action,at:new Date(clock()).toISOString(),success:ok}])}
      catch { /* History failure must not hide whether maintenance ran. */ }
    }
    return ok
      ? {ok:true,message:ACTIONS[action].title+' completed. No FPS improvement is guaranteed.'}
      : {ok:false,error}
  }
  async function history(){
    return {ok:true,items:loadLog(logFile)}
  }
  function clearLog(){
    try {fs.unlinkSync(logFile)}catch(e){if(e.code!=='ENOENT')return {ok:false,error:'Could not clear audit history.'}}
    return {ok:true}
  }
  return {preview,apply,history,clearLog}
}
module.exports={ACTIONS,createMaintenance,loadLog}

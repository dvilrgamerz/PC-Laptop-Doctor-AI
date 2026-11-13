'use strict'
// Narrow non-elevated native bridge. No PowerShell, arbitrary command, or service API.
// Fails closed if compiled helper is missing. A beta.1 journal can still be restored
// because the helper understands the same .NET DateTime creation-time ticks.
const path=require('node:path')
const {execFile}=require('node:child_process')
const {promisify}=require('node:util')
const run=promisify(execFile)
const OPS=new Set(['inspect','apply','restore','probe'])
const U32_MAX=4294967295
const isU32=n=>Number.isSafeInteger(n)&&n>=0&&n<=U32_MAX
function validate(op,payload){
 if(!OPS.has(op))throw Error('Unknown native booster operation')
 if(!payload||!isU32(payload.pid)||payload.pid<=4 ||
  typeof payload.exe!=='string'||payload.exe.length>1024 ||
  !/^[a-z]:\\/i.test(payload.exe)||!/[.]exe$/i.test(payload.exe)||
  path.win32.normalize(payload.exe).toLowerCase()!==payload.exe.toLowerCase())
  throw Error('Invalid Windows process identity')
 if(op!=='inspect'&&(!/^[0-9]{1,21}$/.test(String(payload.startTicks||''))||
  !payload.before||!isU32(payload.before.controlMask)||!isU32(payload.before.stateMask)))
  throw Error('Missing valid QoS snapshot')
 if(op==='restore'&&(!payload.applied||!isU32(payload.applied.controlMask)||
  !isU32(payload.applied.stateMask)))throw Error('Missing applied QoS state')
}
function argsFor(op,payload){
 validate(op,payload)
 const args=[op,String(payload.pid),payload.exe]
 if(op!=='inspect')args.push(String(payload.startTicks))
 if(op==='apply'||op==='restore')args.push(String(payload.before.controlMask),String(payload.before.stateMask))
 if(op==='restore')args.push(String(payload.applied.controlMask),String(payload.applied.stateMask))
 return args
}
function defaultHelperPath(){
 return path.join(__dirname,'..','native','build','boost-helper.exe')
}
function createWindowsEcoQos({platform=process.platform,helperPath=defaultHelperPath(),execute=run}={}){
 async function invoke(op,payload){
  if(platform!=='win32')return {ok:false,error:'Native EcoQoS requires Windows.'}
  try{
   const args=argsFor(op,payload)
   const {stdout}=await execute(helperPath,args,{windowsHide:true,timeout:8000,maxBuffer:8192})
   const result=JSON.parse(String(stdout||'').trim())
   if(!result||typeof result.ok!=='boolean')throw Error('Invalid helper response')
   if(result.ok){
    if(op==='inspect'&&(!/^[0-9]{1,21}$/.test(result.startTicks)||!isU32(result.controlMask)||!isU32(result.stateMask)))
     throw Error('Invalid native process snapshot')
    if(op==='probe'&&typeof result.same!=='boolean')throw Error('Invalid process-lifetime probe')
    if((op==='apply'||op==='restore')&&!result.alreadyOriginal&&
      (!isU32(result.controlMask)||!isU32(result.stateMask)))throw Error('Native QoS confirmation missing')
   }
   return result
  }catch(e){return {ok:false,error:'Native EcoQoS unavailable: '+String(e.message||e).slice(0,160)}}
 }
 return {inspect:x=>invoke('inspect',x),apply:x=>invoke('apply',x),
  restore:x=>invoke('restore',x),probe:x=>invoke('probe',x)}
}
module.exports={createWindowsEcoQos,validate,argsFor,defaultHelperPath}

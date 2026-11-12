'use strict'
// V6: explicit, allowlisted, per-setting Windows optimizations.
// No arbitrary shell, paths, services, security mitigations or network tweaks.
const fs=require('node:fs')
const path=require('node:path')
const {execFile}=require('node:child_process')
const {randomBytes}=require('node:crypto')

const MANIFEST=Object.freeze([
  Object.freeze({id:'backgroundCapture',category:'Gaming',title:'Turn off background game capture',
    key:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR',value:'AppCaptureEnabled',desired:0,
    risk:'Disables Windows background game captures. If you use recordings or highlights, leave it enabled.',
    measure:'Game FPS and 1% lows in identical recorded scenes',restart:'Restart the game if it is running.',
    source:'https://support.microsoft.com/windows/record-a-game-clip-on-your-pc-with-game-bar',
    notes:'Not an FPS guarantee. Some Windows editions may ignore this preference.'}),
  Object.freeze({id:'gameDvr',category:'Gaming',title:'Turn off Windows Game DVR recording',
    key:'HKCU\\System\\GameConfigStore',value:'GameDVR_Enabled',desired:0,
    risk:'May disable or change game recording features. Not recommended when streaming or capturing clips.',
    measure:'CPU usage and consistent game frame times',restart:'Restart the game before comparing results.',
    source:'https://support.microsoft.com/windows/record-a-game-clip-on-your-pc-with-game-bar',
    notes:'A legacy Windows preference; some Windows 11 installations may manage recording differently.'}),
  Object.freeze({id:'transparency',category:'Windows',title:'Reduce desktop transparency',
    key:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',value:'EnableTransparency',desired:0,
    risk:'Changes the appearance of the Windows taskbar, Start and supported surfaces.',
    measure:'Desktop responsiveness, not game FPS',restart:'Some windows may need reopening.',
    source:'https://support.microsoft.com/windows/make-windows-easier-to-see',
    notes:'Cosmetic desktop setting; does not claim an FPS increase.'}),
  Object.freeze({id:'taskbarAnimation',category:'Windows',title:'Reduce taskbar animations',
    key:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced',value:'TaskbarAnimations',desired:0,
    risk:'Changes Windows taskbar animation appearance; may have no perceptible performance effect.',
    measure:'Subjective desktop response, not game FPS',restart:'Explorer may need to restart at the next sign-in.',
    source:'https://support.microsoft.com/windows/tips-to-improve-pc-performance-in-windows',
    notes:'Do not equate animation preference with CPU or GPU throughput.'})
])
const BY_ID=new Map(MANIFEST.map(x=>[x.id,x]))
function command(exe,args){
 return new Promise((resolve,reject)=>execFile(exe,args,{windowsHide:true,timeout:10000,maxBuffer:65536},(err,out,stderr)=>{
   if(err){const e=new Error(String(stderr||out||err.message).slice(0,250));e.code=err.code;return reject(e)}
   resolve(String(out||''))
 }))
}
function regValue(output,name){
 const row=String(output).split(/\r?\n/).find(line=>line.trim().startsWith(name+' ') && /\bREG_DWORD\b/i.test(line))
 if(!row)return undefined
 const m=row.match(/\bREG_DWORD\s+0x([0-9a-f]+)\b/i)
 if(!m)return undefined
 const n=parseInt(m[1],16)
 return n===0||n===1?n:undefined
}
function decodeStore(filename){
 try{
  const data=JSON.parse(fs.readFileSync(filename,'utf8'))
  if(data?.version!==1||typeof data.records!=='object'||!data.records||Array.isArray(data.records))return {version:1,records:{}}
  const records={}
  for(const [id,r] of Object.entries(data.records)){
   if(BY_ID.has(id)&&[null,0,1].includes(r.before)&&r.desired===BY_ID.get(id).desired&&
      ['pending','applied','restoring'].includes(r.phase))records[id]={before:r.before,desired:r.desired,phase:r.phase,at:String(r.at).slice(0,40)}
  }
  return {version:1,records}
 }catch{return {version:1,records:{}}}
}
function saveStore(filename,state){
 fs.mkdirSync(path.dirname(filename),{recursive:true})
 const tmp=filename+'.tmp'
 try{
  fs.writeFileSync(tmp,JSON.stringify(state),{encoding:'utf8',mode:0o600})
  fs.renameSync(tmp,filename)
 }catch(err){try{fs.unlinkSync(tmp)}catch{}throw err}
}
function createOptimizer({stateFile,exec=command,platform=process.platform,now=()=>Date.now(),random=()=>randomBytes(18).toString('hex')}={}){
 if(!stateFile)throw Error('Missing persistent state file')
 let pending=null,busy=false
 async function read(entry){
  try{
   const text=await exec('reg.exe',['query',entry.key,'/v',entry.value])
   const n=regValue(text,entry.value)
   if(n===undefined)throw Error('Unsupported or unreadable value')
   return {known:true,value:n}
  }catch(err){
   if((err.code===1||String(err.code)==='1')&&/unable to find|cannot find|not found|was unable/i.test(err.message))return {known:true,value:null}
   return {known:false,value:null}
  }
 }
 async function set(entry,value){
  if(value===null){
   await exec('reg.exe',['delete',entry.key,'/v',entry.value,'/f'])
  }else{
   await exec('reg.exe',['add',entry.key,'/v',entry.value,'/t','REG_DWORD','/d',String(value),'/f'])
  }
 }
 async function listing(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.',items:[]}
  const saved=decodeStore(stateFile)
  const items=[]
  for(const entry of MANIFEST){
   const actual=await read(entry),journal=saved.records[entry.id]
   let status='unavailable'
   if(journal)status=journal.phase==='applied'?'restorable':'needsReview'
   else if(actual.known)status=actual.value===entry.desired?'alreadySet':'available'
   items.push({...entry,status,current:actual.known?actual.value:null,currentKnown:actual.known,previous:journal?.before??null,
     recoveryRequired:!!journal&&journal.phase!=='applied'})
  }
  return {ok:true,items}
 }
 async function preview(id,mode='apply'){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  const entry=BY_ID.get(id)
  if(!entry||!['apply','restore'].includes(mode))return {ok:false,error:'Unknown optimization.'}
  if(busy)return {ok:false,error:'Another operation is running.'}
  const saved=decodeStore(stateFile),journal=saved.records[id],actual=await read(entry)
  if(!actual.known)return {ok:false,error:'Current Windows value cannot be read safely. No change made.'}
  if(mode==='apply'){
   if(journal)return {ok:false,error:'A previous change or incomplete transaction exists. Restore or review it first.'}
   if(actual.value===entry.desired)return {ok:false,error:'This preference is already set. PC Doctor did not change it.'}
  } else {
   if(!journal)return {ok:false,error:'No previous setting was saved by PC Doctor.'}
   if(actual.value===journal.before)return {ok:false,error:'The setting already matches its original value. No change is needed.'}
   if(actual.value!==journal.desired)return {ok:false,error:'Windows setting changed outside PC Doctor; refusing to overwrite it.'}
  }
  const token=random()
  pending={id,mode,token,expected:actual.value,expires:now()+60000}
  return {ok:true,id,mode,token,title:entry.title,
    before:actual.value,after:mode==='apply'?entry.desired:journal.before,
    effect:entry.risk,measure:entry.measure,restart:entry.restart,source:entry.source,
    warning:'This is a Windows preference, not a verified FPS boost. Confirm only if you understand the change.'}
 }
 async function perform(id,mode,token){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Another optimization is running.'}
  if(!pending||pending.id!==id||pending.mode!==mode||typeof token!=='string'||pending.token!==token||now()>pending.expires)
   return {ok:false,error:'Preview this exact change again before confirming.'}
  const ticket=pending;pending=null;busy=true
  try{
   const entry=BY_ID.get(id),saved=decodeStore(stateFile),journal=saved.records[id]
   const actual=await read(entry)
   if(!actual.known||actual.value!==ticket.expected)return {ok:false,error:'Windows changed since preview. No change made.'}
   if(mode==='apply'){
    if(journal)return {ok:false,error:'Existing journal prevents overwriting the prior setting.'}
    const record={before:actual.value,desired:entry.desired,phase:'pending',at:new Date(now()).toISOString()}
    saveStore(stateFile,{...saved,records:{...saved.records,[id]:record}})
    try{
     await set(entry,entry.desired)
     const verified=await read(entry)
     if(!verified.known||verified.value!==entry.desired)return {ok:false,error:'Windows did not confirm the new value; original is saved for recovery.'}
     saveStore(stateFile,{...saved,records:{...saved.records,[id]:{...record,phase:'applied'}}})
     return {ok:true,changed:true,message:entry.title+' applied. Previous value saved; verify effects with real measurements.'}
    }catch(e){return {ok:false,error:'Change was interrupted or rejected. Review/restore the saved original. '+String(e.message).slice(0,120)}}
   }
   if(!journal)return {ok:false,error:'No saved original setting.'}
   if(actual.value!==journal.desired)return {ok:false,error:'Windows preference differs from last applied value.'}
   saveStore(stateFile,{...saved,records:{...saved.records,[id]:{...journal,phase:'restoring'}}})
   try{
    await set(entry,journal.before)
    const verified=await read(entry)
    if(!verified.known||verified.value!==journal.before)return {ok:false,error:'Restore could not be verified. Original remains in recovery journal.'}
    const next={...saved.records};delete next[id]
    saveStore(stateFile,{version:1,records:next})
    return {ok:true,changed:true,message:'Previous preference restored.'}
   }catch(e){return {ok:false,error:'Restore incomplete; original value retained for another attempt. '+String(e.message).slice(0,120)}}
  }catch(e){return {ok:false,error:'Could not complete safe transaction: '+String(e.message).slice(0,150)}}
  finally{busy=false}
 }
 return {listing,preview,perform}
}
module.exports={createOptimizer,MANIFEST,regValue,decodeStore}

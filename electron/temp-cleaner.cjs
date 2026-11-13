'use strict'
// Non-destructive, explicitly selected cleanup of stale top-level user Temp files.
// Moves files to Windows Recycle Bin, NEVER permanent-delete or recurse into folders.
const fs=require('node:fs/promises')
const os=require('node:os')
const path=require('node:path')
const {randomBytes}=require('node:crypto')
const MIN_AGE_DAYS=14
const MAX_FILES=300
const MAX_FILE_BYTES=128*1024*1024
const MAX_TOTAL_BYTES=1024*1024*1024
const MATCH=/\.(tmp|log)$/i
const makeToken=()=>randomBytes(24).toString('hex')
const miB=bytes=>Math.round(bytes/1048576*10)/10
function safeRoot(root,platform='win32',allowTestRoot=false){
 if(platform!=='win32')return false
 const windowsPath=path.win32.isAbsolute(root)
 const absolute=windowsPath||path.isAbsolute(root)
 const volumeRoot=windowsPath?path.win32.parse(root).root:path.parse(root).root
 const normalized=windowsPath?path.win32.normalize(root):path.resolve(root)
 if(!absolute||volumeRoot.toLowerCase()===normalized.toLowerCase())return false
 if(allowTestRoot)return true
 // A non-standard TEMP override could point to documents, so decline and use Windows Storage.
 return /[\\/]appdata[\\/]local[\\/]temp[\\/]?$/i.test(root)
}
function createTempCleaner({platform=process.platform,root=os.tmpdir(),read=fs,trashItem,clock=()=>Date.now(),random=makeToken,allowTestRoot=false}={}){
 if(typeof trashItem!=='function')throw Error('Windows Recycle Bin service required')
 let snapshot=null,busy=false
 async function scan(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(!safeRoot(root,platform,allowTestRoot))return {ok:false,error:'Your TEMP directory is non-standard; use Windows Storage cleanup instead.'}
  if(busy)return {ok:false,error:'A cleanup operation is still running.'}
  busy=true
  try{
   // Refuse redirected user Temp roots (junctions/symlinks) outside the expected scope.
   if(!allowTestRoot){
    const real=await read.realpath(root)
    if(!safeRoot(real.replace(/^\\\\\?\\/,''),platform))
     return {ok:false,error:'Windows user Temp resolves outside the expected folder.'}
   }
   const entries=await read.readdir(root,{withFileTypes:true})
   const items=[]
   let skipped=0,totalBytes=0
   const now=clock()
   for(const entry of entries){
    if(items.length>=MAX_FILES)break
    if(!entry.isFile()||!MATCH.test(entry.name)){skipped++;continue}
    if(entry.name.includes('/')||entry.name.includes('\\')||entry.name==='.'||entry.name==='..'){skipped++;continue}
    const absolute=path.join(root,entry.name)
    let stat
    try{stat=await read.lstat(absolute)}catch{skipped++;continue}
    if(!stat.isFile()||stat.isSymbolicLink()||!Number.isFinite(stat.size)||stat.size<0||
       stat.size>MAX_FILE_BYTES||now-stat.mtimeMs<MIN_AGE_DAYS*86400000 ||
       now-stat.mtimeMs>3650*86400000 || totalBytes+stat.size>MAX_TOTAL_BYTES){skipped++;continue}
    const id=random()
    items.push({id,name:entry.name,sizeBytes:stat.size,ageDays:Math.floor((now-stat.mtimeMs)/86400000),
      verify:{size:stat.size,mtimeMs:stat.mtimeMs,ino:stat.ino,dev:stat.dev}})
    totalBytes+=stat.size
   }
   const token=random()
   snapshot={token,items,expires:now+180000}
   return {ok:true,token,files:items.map(({id,name,sizeBytes,ageDays})=>({id,name,sizeBytes,ageDays})),
     candidateBytes:totalBytes,skipped,category:'Top-level .tmp / .log files older than 14 days',
     caution:'Files are moved to Recycle Bin only after selecting each one. This does not free disk space until the bin is emptied. The app never touches Downloads, documents, directories, current files or Windows system locations.'}
  }catch(e){snapshot=null;return {ok:false,error:'Unable to inspect user Temp directory: '+String(e.message).slice(0,140)}}
  finally{busy=false}
 }
 async function recycle(token,ids){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy)return {ok:false,error:'Cleanup is still running.'}
  if(!snapshot||snapshot.token!==token||clock()>snapshot.expires)return {ok:false,error:'Rescan before selecting files to recycle.'}
  if(!Array.isArray(ids)||!ids.length||ids.length>MAX_FILES||
     ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length)
    return {ok:false,error:'Choose one or more distinct listed files.'}
  const lookup=new Map(snapshot.items.map(x=>[x.id,x]))
  if(ids.some(id=>!lookup.has(id)))return {ok:false,error:'File selection is not part of this preview.'}
  const selected=ids.map(id=>lookup.get(id))
  if(selected.reduce((n,x)=>n+x.sizeBytes,0)>MAX_TOTAL_BYTES)return {ok:false,error:'Too much selected for one cleanup.'}
  snapshot=null
  busy=true
  const moved=[],failed=[]
  try{
   for(const item of selected){
    const full=path.join(root,item.name)
    try{
     const st=await read.lstat(full)
     if(!st.isFile()||st.isSymbolicLink()||st.size!==item.verify.size||
       st.mtimeMs!==item.verify.mtimeMs||st.ino!==item.verify.ino||st.dev!==item.verify.dev ||
       clock()-st.mtimeMs<MIN_AGE_DAYS*86400000)throw Error('Changed since preview; skipped')
     await trashItem(full)
     moved.push({name:item.name,sizeBytes:item.sizeBytes})
    }catch(e){failed.push({name:item.name,reason:String(e.message||e).slice(0,100)})}
   }
   return {ok:failed.length===0,movedCount:moved.length,failedCount:failed.length,
     movedBytes:moved.reduce((n,x)=>n+x.sizeBytes,0),failed,
     message:'Moved '+moved.length+' old temporary files to the Windows Recycle Bin. Their disk space is NOT reclaimed until the bin is emptied. You can restore files from Recycle Bin.'}
  }finally{busy=false}
 }
 async function autoRecycle(token){
  if(!snapshot||snapshot.token!==token)return {ok:false,error:'Scan and confirm cleanup first.'}
  const ids=snapshot.items.map(x=>x.id)
  if(!ids.length)return {ok:true,movedCount:0,failedCount:0,movedBytes:0,message:'No old temporary files to recycle.'}
  return recycle(token,ids)
 }
 async function freeOldTmp(token){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  if(busy||!snapshot||snapshot.token!==token||clock()>snapshot.expires)
   return {ok:false,error:'Scan and confirm this cleanup first.'}
  const candidates=snapshot.items.filter(x=>/\.tmp$/i.test(x.name)&&x.ageDays>=30)
  if(candidates.reduce((n,x)=>n+x.sizeBytes,0)>MAX_TOTAL_BYTES)
   return {ok:false,error:'Cleanup exceeds the 1 GiB limit.'}
  snapshot=null;busy=true
  const deleted=[],failed=[]
  try{
   for(const item of candidates){
    try{
     const full=path.join(root,item.name)
     const st=await read.lstat(full)
     if(!st.isFile()||st.isSymbolicLink()||st.size!==item.verify.size||
        st.mtimeMs!==item.verify.mtimeMs||st.ino!==item.verify.ino||
        st.dev!==item.verify.dev||clock()-st.mtimeMs<30*86400000)
       throw Error('Changed after preview; skipped')
     await read.unlink(full)
     deleted.push({name:item.name,sizeBytes:item.sizeBytes})
    }catch(e){failed.push({name:item.name,reason:String(e.message||e).slice(0,100)})}
   }
   const freed=deleted.reduce((n,x)=>n+x.sizeBytes,0)
   return {ok:failed.length===0,deletedCount:deleted.length,failedCount:failed.length,
    freedBytes:freed,failed,irreversible:true,
    message:'Permanently removed '+deleted.length+' old .tmp files ('+miB(freed)+' MiB). This cannot be undone. '+failed.length+' files were skipped.'}
  }finally{busy=false}
 }
 return {scan,recycle,autoRecycle,freeOldTmp}
}
module.exports={createTempCleaner,safeRoot,MIN_AGE_DAYS,MAX_FILES,MAX_TOTAL_BYTES,miB}

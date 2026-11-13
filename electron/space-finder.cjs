'use strict'
// Read-only, top-level Downloads inspection; user-selected files may be moved to Recycle Bin.
// No recursion, file-content reading, arbitrary renderer paths, or silent deletion.
const fs=require('node:fs/promises')
const os=require('node:os')
const path=require('node:path')
const {randomBytes}=require('node:crypto')
const MIN_SIZE=100*1024*1024
const MAX_ENTRIES=1200
const MAX_DISPLAY=60
const MAX_SELECTION=20
const MAX_MOVE_BYTES=20*1024**3
const EXPIRY=5*60*1000
const SKIP=/\.(?:part|partial|crdownload|download|tmp|lock)$/i
const fmt=bytes=>(bytes/(1024**3)).toFixed(2)+' GiB'
function defaultRoot(){return path.join(os.homedir(),'Downloads')}
function validRoot(root,allowTestRoot=false){
 if(allowTestRoot)return typeof root==='string'&&path.isAbsolute(root)&&path.parse(root).root!==root
 if(process.platform!=='win32'||typeof root!=='string'||!path.win32.isAbsolute(root))return false
 // Only the current user profile's standard Downloads location. Redirected shell folders are unsupported.
 const expected=path.win32.resolve(os.homedir(),'Downloads').toLowerCase()
 return path.win32.normalize(root).toLowerCase()===expected
}
function sameRealRoot(actual,root,allowTestRoot){
 if(typeof actual!=='string')return false
 // Test-only injected roots use temporary directories whose canonical spelling varies across Windows runners.
 // Production never enables allowTestRoot, so real Downloads redirects remain blocked.
 if(allowTestRoot)return true
 const clean=x=>path.win32.normalize(x.replace(/^\\\\\?\\/,'')).toLowerCase()
 return clean(actual)===clean(root)
}
function createSpaceFinder({platform=process.platform,root=defaultRoot(),read=fs,trashItem,
  now=()=>Date.now(),random=()=>randomBytes(24).toString('hex'),allowTestRoot=false}={}){
 if(typeof trashItem!=='function')throw Error('Windows Recycle Bin action required.')
 let snapshot=null,busy=false
 async function safeDirectory(){
  if(platform!=='win32'||!validRoot(root,allowTestRoot))throw Error('Only the standard user Downloads directory is supported.')
  const st=await read.lstat(root)
  if(!st.isDirectory()||st.isSymbolicLink())throw Error('Downloads must be a regular directory.')
  if(!sameRealRoot(await read.realpath(root),root,allowTestRoot))throw Error('Downloads redirects to another location; inspection stopped.')
 }
 async function scan(){
  if(busy)return {ok:false,error:'Another storage operation is running.'}
  snapshot=null;busy=true
  try{
   await safeDirectory()
   const entries=await read.readdir(root,{withFileTypes:true})
   const files=[]
   let scanned=0
   for(const entry of entries){
    if(scanned++>=MAX_ENTRIES)break
    if(!entry?.isFile?.()||entry.isSymbolicLink?.()||typeof entry.name!=='string')continue
    if(entry.name.length>240||SKIP.test(entry.name)||entry.name==='.'||entry.name==='..')continue
    const full=path.join(root,entry.name)
    try{
     const s=await read.lstat(full)
     if(!s.isFile()||s.isSymbolicLink()||!Number.isFinite(s.size)||s.size<MIN_SIZE)continue
     files.push({name:entry.name,sizeBytes:s.size,modifiedAt:new Date(s.mtimeMs).toISOString(),
       verify:{size:s.size,mtimeMs:s.mtimeMs,ino:s.ino,dev:s.dev}})
    }catch{}
   }
   files.sort((a,b)=>b.sizeBytes-a.sizeBytes)
   const selected=files.slice(0,MAX_DISPLAY).map(x=>({...x,id:random()}))
   const token=random()
   snapshot={token,expires:now()+EXPIRY,files:selected}
   return {ok:true,token,files:selected.map(x=>({
      id:x.id,name:x.name,sizeBytes:x.sizeBytes,modifiedAt:x.modifiedAt
    })),scannedEntries:Math.min(scanned,MAX_ENTRIES),
    listedBytes:selected.reduce((n,x)=>n+x.sizeBytes,0),
    note:'Top-level Downloads only; no contents are read, no folders are searched, and nothing is deleted by a scan. Listing may omit files if more than 1,200 entries are present.'}
  }catch(e){
   return {ok:false,error:'Downloads inspection unavailable: '+String(e.message||e).slice(0,170)}
  }finally{busy=false}
 }
 async function recycle(token,ids){
  if(busy)return {ok:false,error:'Another storage operation is running.'}
  if(!snapshot||typeof token!=='string'||token!==snapshot.token||now()>snapshot.expires)
   return {ok:false,error:'Scan Downloads again and confirm your file selections.'}
  if(!Array.isArray(ids)||ids.length<1||ids.length>MAX_SELECTION||
     ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)
   return {ok:false,error:'Choose between 1 and 20 different displayed files.'}
  const chosen=ids.map(id=>snapshot.files.find(x=>x.id===id))
  if(chosen.some(x=>!x))return {ok:false,error:'One or more files were not shown by the scan.'}
  if(chosen.reduce((n,x)=>n+x.sizeBytes,0)>MAX_MOVE_BYTES)
   return {ok:false,error:'Select no more than 20 GiB in one operation.'}
  snapshot=null;busy=true
  const moved=[],failed=[]
  try{
   await safeDirectory()
   for(const item of chosen){
    try{
     const full=path.join(root,item.name)
     const st=await read.lstat(full)
     if(!st.isFile()||st.isSymbolicLink()||st.size!==item.verify.size||
        st.mtimeMs!==item.verify.mtimeMs||st.ino!==item.verify.ino||st.dev!==item.verify.dev)
      throw Error('File changed after preview; skipped.')
     // Electron shell.trashItem: no unlink/rm fallback. Some volumes may not support Trash.
     await trashItem(full)
     moved.push({name:item.name,sizeBytes:item.sizeBytes})
    }catch(e){failed.push({name:item.name,reason:String(e.message||e).slice(0,120)})}
   }
   return {ok:failed.length===0,movedCount:moved.length,failedCount:failed.length,failed,
     movedBytes:moved.reduce((n,x)=>n+x.sizeBytes,0),freedBytes:0,
     message:'Moved '+moved.length+' selected files ('+fmt(moved.reduce((n,x)=>n+x.sizeBytes,0))+') to Recycle Bin; '+failed.length+
       ' skipped. Disk space is NOT freed until the bin is emptied.'}
  }catch(e){return {ok:false,error:'Downloads location changed; no files moved: '+String(e.message).slice(0,150)}}
  finally{busy=false}
 }
 return {scan,recycle}
}
module.exports={createSpaceFinder,validRoot,sameRealRoot,MIN_SIZE,MAX_DISPLAY,MAX_SELECTION}

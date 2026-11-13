'use strict'
// V7.1: inspect only Epic Launcher-created .item manifests in ProgramData.
// Never enumerate arbitrary folders, open game executables, change game files or anti-cheat.
const fs=require('node:fs/promises')
const path=require('node:path')
const MAX_ITEMS=300, MAX_BYTES=256*1024
const SAFE_ID=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/
const SAFE_GUID=/^[a-fA-F0-9]{32}$/
function defaultDir(){
  const program=process.env.ProgramData||'C:\\ProgramData'
  // Refuse redirecting the scanner to a random path via an unusual environment override.
  if(!/^[a-zA-Z]:\\ProgramData\\?$/i.test(program))return null
  return path.win32.join(program,'Epic','EpicGamesLauncher','Data','Manifests')
}
function parseEpicManifest(raw){
 try{
  const m=typeof raw==='string'?JSON.parse(raw):raw
  if(!m||typeof m!=='object'||Array.isArray(m)||m.bIsIncompleteInstall===true)return null
  if(typeof m.DisplayName!=='string'||m.DisplayName.trim().length<2)return null
  const artifact=String(m.AppName||'')
  if(!SAFE_ID.test(artifact))return null
  const sandbox=String(m.CatalogNamespace||'')
  const catalog=String(m.CatalogItemId||'')
  // The official Epic activation format uses namespace:item:artifact (all validated).
  if(!SAFE_GUID.test(sandbox)||!SAFE_GUID.test(catalog))return null
  return {id:sandbox+':'+catalog+':'+artifact,name:m.DisplayName.trim().slice(0,120),platform:'Epic Games',launchable:true}
 }catch{return null}
}
function epicUri(id){
 if(typeof id!=='string'||id.length>240)return null
 const parts=id.split(':')
 if(parts.length!==3||!SAFE_GUID.test(parts[0])||!SAFE_GUID.test(parts[1])||!SAFE_ID.test(parts[2]))return null
 return 'com.epicgames.launcher://apps/'+parts.map(encodeURIComponent).join('%3A')+'?action=launch&silent=true'
}
function createEpicLibrary({platform=process.platform,dir=defaultDir(),read=fs}={}){
 async function inspect(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.',games:[]}
  if(!dir||typeof dir!=='string'||!path.win32.isAbsolute(dir)||
     !/\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests\\?$/i.test(dir))
   return {ok:false,error:'Epic manifest directory not recognized.',games:[]}
  let files
  try{files=await read.readdir(dir)}catch{return {ok:true,games:[],note:'Epic Games Launcher manifests are not available.'}}
  const map=new Map()
  for(const file of files.filter(f=>/^[a-fA-F0-9-]{8,64}\.item$/i.test(f)).slice(0,MAX_ITEMS)){
   try{
    const full=path.win32.join(dir,file)
    const st=await read.lstat(full)
    if(!st.isFile()||st.isSymbolicLink()||st.size>MAX_BYTES)continue
    const game=parseEpicManifest(await read.readFile(full,'utf8'))
    if(game&&!map.has(game.id))map.set(game.id,game)
   }catch{}
  }
  return {ok:true,games:[...map.values()].slice(0,150).sort((a,b)=>a.name.localeCompare(b.name)),
    note:'Read-only Epic installed-game manifests. Apps without verified catalog identifiers are excluded.'}
 }
 return {inspect}
}
module.exports={createEpicLibrary,parseEpicManifest,epicUri,defaultDir}

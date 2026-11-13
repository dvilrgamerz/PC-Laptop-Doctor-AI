'use strict'
// Read-only, cached installed-game ROOT detection for Steam and Epic manifests.
// Used exclusively to match Windows-reported running process paths; never returns
// installation paths to the renderer, launches a program, or changes a game file.
const fs=require('node:fs/promises')
const path=require('node:path')
const {defaultSteamRoots,parseLibraries,parseGameManifest}=require('./game-library.cjs')
const {defaultDir,parseEpicManifest}=require('./epic-library.cjs')
const MAX_STEAM=200,MAX_EPIC=150,REFRESH=5*60*1000

function safeFolder(value){
 if(typeof value!=='string'||value.length<7||value.length>1024||!path.win32.isAbsolute(value)||/^\\\\/.test(value))return null
 const n=path.win32.normalize(value)
 const root=path.win32.parse(n).root
 if(n.toLowerCase()===root.toLowerCase()||/\\windows(\\|$)/i.test(n)||
    /\\windowsapps(\\|$)/i.test(n)||/\\users\\[^\\]+\\(desktop|documents|downloads)(\\|$)/i.test(n))
   return null
 return n.replace(/\\+$/,'').toLowerCase()
}
function safeSteamInstallDir(name){
 if(typeof name!=='string'||name.length<1||name.length>140||/[\\/:*?"<>|\x00-\x1f]/.test(name)||
   name==='.'||name==='..'||name.includes('..'))return null
 return name.trim()
}
function getSteamInstalledFolder(raw,lib){
 const metadata=parseGameManifest(raw)
 if(!metadata)return null
 const name=String(raw).match(/"installdir"\s+"([^"\r\n]{1,160})"/i)?.[1]
 const safe=safeSteamInstallDir(name)
 if(!safe)return null
 const folder=safeFolder(path.win32.join(lib,'steamapps','common',safe))
 return folder?{root:folder,name:metadata.name,source:'Steam'}:null
}
function getEpicInstalledFolder(raw){
 try{
  const meta=JSON.parse(raw)
  const game=parseEpicManifest(meta)
  if(!game)return null
  const folder=safeFolder(meta.InstallLocation)
  return folder?{root:folder,name:game.name,source:'Epic Games'}:null
 }catch{return null}
}
function createInstalledGameRoots({platform=process.platform,steamRoots=defaultSteamRoots(),
 epicDir=defaultDir(),read=fs,now=()=>Date.now()}={}){
 let cache=[],last=0,working=null
 async function scan(){
  if(platform!=='win32')return []
  const result=[],seen=new Set(),libraries=new Set()
  for(const root of steamRoots){
   const safe=safeFolder(root)
   if(!safe)continue
   libraries.add(safe)
   try{
    const list=await read.readFile(path.win32.join(safe,'steamapps','libraryfolders.vdf'),'utf8')
    for(const folder of parseLibraries(list)){
     const candidate=safeFolder(folder)
     if(candidate)libraries.add(candidate)
    }
   }catch{}
  }
  let count=0
  for(const lib of [...libraries].slice(0,20)){
   let entries
   try{entries=await read.readdir(path.win32.join(lib,'steamapps'))}catch{continue}
   for(const file of entries){
    if(count>=MAX_STEAM)break
    if(!/^appmanifest_\d{1,15}\.acf$/i.test(file))continue
    count++
    try{
     const full=path.win32.join(lib,'steamapps',file)
     const st=await read.lstat(full)
     if(!st.isFile()||st.isSymbolicLink()||st.size>131072)continue
     const game=getSteamInstalledFolder(await read.readFile(full,'utf8'),lib)
     if(game&&!seen.has(game.root)){result.push(game);seen.add(game.root)}
    }catch{}
   }
  }
  if(epicDir&&safeFolder(epicDir)&&/\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests$/i.test(epicDir)){
   let files=[]
   try{files=await read.readdir(epicDir)}catch{}
   for(const file of files.filter(x=>/^[a-f0-9-]{8,64}\.item$/i.test(x)).slice(0,MAX_EPIC)){
    try{
     const full=path.win32.join(epicDir,file)
     const st=await read.lstat(full)
     if(!st.isFile()||st.isSymbolicLink()||st.size>262144)continue
     const game=getEpicInstalledFolder(await read.readFile(full,'utf8'))
     if(game&&!seen.has(game.root)){result.push(game);seen.add(game.root)}
    }catch{}
   }
  }
  return result.slice(0,250)
 }
 async function list(){
  if(platform!=='win32')return []
  if(last&&now()-last<REFRESH)return cache
  if(working)return working
  working=scan().then(rows=>{cache=rows;last=now();return rows}).catch(()=>cache).finally(()=>{working=null})
  return working
 }
 return {list}
}
module.exports={createInstalledGameRoots,safeFolder,safeSteamInstallDir,getSteamInstalledFolder,getEpicInstalledFolder}

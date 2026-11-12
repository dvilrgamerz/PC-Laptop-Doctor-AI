'use strict'
// Steam manifests only. Read-only: never launch, alter or enumerate arbitrary game data.
const fs=require('node:fs/promises')
const path=require('node:path')
const os=require('node:os')
const {execFile}=require('node:child_process')
const MAX_MANIFESTS=250
function command(exe,args){
 return new Promise(resolve=>execFile(exe,args,{windowsHide:true,timeout:4000,maxBuffer:8192},(err,stdout)=>resolve(err?'':String(stdout||''))))
}
function parseLibraries(text){
 const found=[]
 const re=/"path"\s+"([^"\r\n]+)"/gi
 let match
 while((match=re.exec(String(text))) && found.length<20){
  const p=match[1].replace(/\\\\/g,'\\').trim()
  if(path.win32.isAbsolute(p)&&!found.includes(p))found.push(p)
 }
 return found
}
function parseGameManifest(raw){
 const str=String(raw)
 const name=str.match(/"name"\s+"([^"\r\n]{1,160})"/i)?.[1]
 const appid=str.match(/"appid"\s+"(\d{1,15})"/i)?.[1]
 if(!name||!appid)return null
 return {appid,name:name.replace(/\\"/g,'"').replace(/[\x00-\x1f]/g,'').slice(0,110)}
}
function defaultSteamRoots(){
 const drive=process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)'
 return [path.join(drive,'Steam'),path.join(process.env.ProgramFiles||'C:\\Program Files','Steam'),
   path.join(process.env.LOCALAPPDATA||path.join(os.homedir(),'AppData','Local'),'Steam')]
}
function createGameLibrary({platform=process.platform,roots=defaultSteamRoots(),read=fs,exec=command}={}){
 async function inspect(){
  if(platform!=='win32')return {ok:false,games:[],error:'Steam detection is Windows-only.'}
  const allRoots=[...roots]
  try{
   const registry=await exec('reg.exe',['query','HKCU\\Software\\Valve\\Steam','/v','SteamPath'])
   const candidate=registry.match(/SteamPath\s+REG_SZ\s+(.+)/i)?.[1]?.trim()
   if(candidate&&path.win32.isAbsolute(candidate))allRoots.push(candidate)
  }catch{}
  const libraries=new Set()
  for(const root of allRoots){
   if(typeof root!=='string'||!path.win32.isAbsolute(root))continue
   libraries.add(root)
   try{
    const txt=await read.readFile(path.join(root,'steamapps','libraryfolders.vdf'),'utf8')
    for(const folder of parseLibraries(txt))libraries.add(folder)
   }catch{}
  }
  const games=new Map()
  let readCount=0
  for(const lib of [...libraries].slice(0,25)){
   let files
   try{files=await read.readdir(path.join(lib,'steamapps'))}catch{continue}
   for(const file of files){
    if(!/^appmanifest_\d{1,15}\.acf$/i.test(file)||readCount>=MAX_MANIFESTS)continue
    readCount++
    try{
     const filePath=path.join(lib,'steamapps',file)
     const meta=await read.stat(filePath)
     if(!meta.isFile()||meta.size>128*1024)continue
     const game=parseGameManifest(await read.readFile(filePath,'utf8'))
     if(game&&!games.has(game.appid))games.set(game.appid,{...game,platform:'Steam'})
    }catch{}
   }
  }
  return {ok:true,games:[...games.values()].sort((a,b)=>a.name.localeCompare(b.name)).slice(0,150),
    inspectedLibraries:libraries.size,partial:readCount>=MAX_MANIFESTS,
    note:'Read-only installed Steam app manifests. Games outside Steam or inaccessible library folders are not discovered. No game files or anti-cheat data are modified.'}
 }
 return {inspect}
}
module.exports={createGameLibrary,parseLibraries,parseGameManifest,defaultSteamRoots}

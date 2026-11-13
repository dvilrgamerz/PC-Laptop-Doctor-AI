'use strict'
// Only launch executables a user explicitly picks with a native Windows file dialog.
// Game paths remain in the local app profile and are not returned to the renderer.
const fs=require('node:fs')
const fsp=require('node:fs/promises')
const path=require('node:path')
const {randomBytes}=require('node:crypto')
const MAX_GAMES=30
function validExe(p){
 if(typeof p!=='string'||p.length>1024||!path.win32.isAbsolute(p)||/^[\\\/]{2}/.test(p)||!p.toLowerCase().endsWith('.exe'))
  return false
 const normalized=path.win32.normalize(p)
 const windows=path.win32.normalize(process.env.windir||'C:\\Windows')
 if(normalized.toLowerCase().startsWith(windows.toLowerCase()+'\\'))return false
 return !normalized.toLowerCase().includes('\\windowsapps\\')
}
function readStore(filename){
 try{
  const data=JSON.parse(fs.readFileSync(filename,'utf8'))
  if(data?.version!==1||!Array.isArray(data.games))return []
  return data.games.filter(x=>x&&/^[a-f0-9]{24}$/.test(x.id)&&validExe(x.file)&&typeof x.name==='string')
   .slice(0,MAX_GAMES).map(x=>({id:x.id,name:x.name.slice(0,100),file:x.file}))
 }catch{return []}
}
function saveStore(filename,games){
 fs.mkdirSync(path.dirname(filename),{recursive:true})
 const temp=filename+'.tmp'
 try{fs.writeFileSync(temp,JSON.stringify({version:1,games}),{encoding:'utf8',mode:0o600});fs.renameSync(temp,filename)}
 catch(e){try{fs.rmSync(temp,{force:true})}catch{}throw e}
}
function createCustomGames({platform=process.platform,stateFile,chooseFile,openFile,read=fsp,random=()=>randomBytes(12).toString('hex')}={}){
 if(!stateFile||typeof chooseFile!=='function'||typeof openFile!=='function')throw Error('Missing custom game dependencies')
 async function list(){
  if(platform!=='win32')return {ok:false,error:'Windows only.',games:[]}
  return {ok:true,games:readStore(stateFile).map(g=>({id:'custom:'+g.id,name:g.name,platform:'Added game'}))}
 }
 async function add(){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  let chosen
  try{chosen=await chooseFile()}catch{return {ok:false,error:'File picker failed.'}}
  if(!chosen)return {ok:false,cancelled:true,error:'No game selected.'}
  if(!validExe(chosen))return {ok:false,error:'Select a local installed .exe outside Windows system folders.'}
  try{
   const st=await read.lstat(chosen)
   if(!st.isFile()||st.isSymbolicLink())return {ok:false,error:'Choose a regular executable file, not a folder or shortcut.'}
  }catch{return {ok:false,error:'The selected game executable is not available.'}}
  const games=readStore(stateFile)
  if(games.some(g=>g.file.toLowerCase()===chosen.toLowerCase()))return {ok:true,added:false,message:'This game is already on your list.'}
  if(games.length>=MAX_GAMES)return {ok:false,error:'Custom game list is full (30). Remove an old entry first.'}
  const id=random()
  if(!/^[a-f0-9]{24}$/.test(id))return {ok:false,error:'Invalid generated game identifier.'}
  const name=path.win32.basename(chosen,'.exe').replace(/[_-]/g,' ').slice(0,100)
  saveStore(stateFile,[...games,{id,file:chosen,name}])
  return {ok:true,added:true,message:'Added '+name+' to this PC Doctor profile. Only open games you trust.'}
 }
 async function launch(ref){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  const id=String(ref||'').replace(/^custom:/,'')
  if(!/^[a-f0-9]{24}$/.test(id))return {ok:false,error:'Unknown custom game.'}
  const game=readStore(stateFile).find(g=>g.id===id)
  if(!game)return {ok:false,error:'Game was not added by this user.'}
  try{
   const st=await read.lstat(game.file)
   if(!st.isFile()||st.isSymbolicLink())throw Error('Executable changed or disappeared')
   const error=await openFile(game.file)
   if(error)return {ok:false,error:'Windows did not open the selected executable: '+String(error).slice(0,140)}
   return {ok:true,message:'Windows was asked to open the selected game executable. This does not verify game startup.'}
  }catch(e){return {ok:false,error:String(e.message||e).slice(0,170)}}
 }
 async function remove(ref){
  if(platform!=='win32')return {ok:false,error:'Windows only.'}
  const id=String(ref||'').replace(/^custom:/,'')
  if(!/^[a-f0-9]{24}$/.test(id))return {ok:false,error:'Unknown custom game.'}
  const games=readStore(stateFile),next=games.filter(g=>g.id!==id)
  if(games.length===next.length)return {ok:false,error:'Entry not found.'}
  saveStore(stateFile,next)
  return {ok:true,message:'Removed custom game entry. The game files were not touched.'}
 }
 return {list,add,launch,remove}
}
module.exports={createCustomGames,validExe,readStore,MAX_GAMES}

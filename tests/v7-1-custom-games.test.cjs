const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createCustomGames,validExe,readStore}=require('../electron/custom-games.cjs')

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-doctor-custom-'))
 const store=path.join(root,'games.json')
 const opened=[]
 let selected='D:\\TrustedGames\\Example Game\\example.exe'
 const api=createCustomGames({platform:'win32',stateFile:store,
  chooseFile:async()=>selected,openFile:async p=>{opened.push(p);return ''},
  read:{lstat:async p=>({isFile:()=>true,isSymbolicLink:()=>false})},
  random:()=> 'a'.repeat(24)})
 return {api,store,opened,select:s=>{selected=s},cleanup:()=>fs.rmSync(root,{recursive:true,force:true})}
}
test('only explicit Win32 EXE selections are accepted and system/UNC paths refused',()=>{
 for(const p of ['C:\\Windows\\System32\\cmd.exe','\\\\server\\share\\evil.exe','C:\\Users\\x\\file.lnk','../game.exe','C:\\Program Files\\WindowsApps\\system.exe'])
  assert.equal(validExe(p),false,p)
 assert.equal(validExe('D:\\Games\\Fortnite\\Binaries\\game.exe'),true)
})
test('selected installed game persists locally and only exposes name/opaque ID',async()=>{
 const f=fixture()
 try{
  const r=await f.api.add()
  assert.equal(r.ok,true)
  const list=await f.api.list()
  assert.equal(list.games.length,1)
  assert.equal(list.games[0].platform,'Added game')
  assert.equal(JSON.stringify(list).includes('D:\\TrustedGames'),false)
  assert.equal(readStore(f.store)[0].file,'D:\\TrustedGames\\Example Game\\example.exe')
  assert.equal((await f.api.add()).added,false)
  const ref=list.games[0].id
  assert.equal((await f.api.launch('custom:nonexistent')).ok,false)
  assert.equal((await f.api.launch(ref)).ok,true)
  assert.deepEqual(f.opened,['D:\\TrustedGames\\Example Game\\example.exe'])
  assert.equal((await f.api.remove(ref)).ok,true)
  assert.equal((await f.api.launch(ref)).ok,false)
 }finally{f.cleanup()}
})
test('unselected, unavailable and dangerous files do not launch',async()=>{
 const f=fixture()
 try{
  f.select('C:\\Windows\\System32\\cmd.exe')
  assert.equal((await f.api.add()).ok,false)
  assert.deepEqual(f.opened,[])
  f.select(null)
  const r=await f.api.add()
  assert.equal(r.cancelled,true)
  assert.deepEqual(f.opened,[])
 }finally{f.cleanup()}
})
test('non-Windows platforms never use picker or launch',async()=>{
 const f=fixture()
 try{
  const api=createCustomGames({platform:'linux',stateFile:f.store,chooseFile:async()=>{throw Error('should not open')},openFile:async()=>{throw Error('should not launch')}})
  assert.equal((await api.add()).ok,false)
  assert.equal((await api.launch('custom:'+'a'.repeat(24))).ok,false)
 }finally{f.cleanup()}
})

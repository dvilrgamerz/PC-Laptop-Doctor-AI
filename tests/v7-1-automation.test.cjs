const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const fsp=require('node:fs/promises')
const path=require('node:path')
const os=require('node:os')
const {createEpicLibrary,parseEpicManifest,epicUri}=require('../electron/epic-library.cjs')
const {createTempCleaner}=require('../electron/temp-cleaner.cjs')
const DAY=86400000

test('Epic manifests accept valid sandbox/catalog/artifact triples without exposing executable paths',()=>{
 const data={DisplayName:'Fortnite',AppName:'Fortnite',CatalogNamespace:'fn',
   CatalogItemId:'4fe75bbc5a674f4f9b356b5c90567da5',
   LaunchExecutable:'FortniteClient-Win64-Shipping.exe',
   InstallLocation:'C:\\Users\\Player\\Private\\Games',bIsIncompleteInstall:false}
 const game=parseEpicManifest(JSON.stringify(data))
 assert.ok(game)
 assert.equal(game.name,'Fortnite')
 assert.equal(game.platform,'Epic Games')
 assert.equal(JSON.stringify(game).includes('Private'),false)
 const uri=epicUri(game.id)
 assert.match(uri,/^com\.epicgames\.launcher:\/\/apps\/fn%3A/)
 assert.match(uri,/\?action=launch&silent=true$/)
 assert.equal(epicUri('fn:bad?cmd=malicious:Fortnite'),null)
 assert.equal(parseEpicManifest(JSON.stringify({...data,AppName:'evil & del'})),null)
 assert.equal(parseEpicManifest(JSON.stringify({...data,bIsIncompleteInstall:true})),null)
})
test('Epic reads only capped .item manifests from a constrained ProgramData directory',async()=>{
 const seen=[]
 const dir='C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'
 const manifest=JSON.stringify({DisplayName:'Game A',AppName:'A',CatalogNamespace:'namespace',CatalogItemId:'abcdef0123456789abcdef0123456789'})
 const read={
  readdir:async()=>['deadbeef-0000.item','private.txt','other.config','unverified.item'],
  lstat:async p=>{seen.push(p);return {isFile:()=>true,isSymbolicLink:()=>false,size:manifest.length}},
  readFile:async()=>manifest
 }
 const r=await createEpicLibrary({platform:'win32',dir,read}).inspect()
 assert.equal(r.ok,true)
 assert.equal(r.games.length,1)
 assert.equal(seen.length,1)
 assert.equal(createEpicLibrary({platform:'win32',dir:'C:\\Users\\x\\Downloads',read}).inspect instanceof Function,true)
 assert.equal((await createEpicLibrary({platform:'win32',dir:'C:\\Users\\x\\Downloads',read}).inspect()).ok,false)
})
function temp(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v7-1-clean-'))
 const recycle=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v7-1-bin-'))
 const now=Date.UTC(2026,10,12,0,0,0)
 let i=0
 const cleaner=createTempCleaner({platform:'win32',root,allowTestRoot:true,clock:()=>now,
  random:()=>String(++i),trashItem:async name=>fsp.rename(name,path.join(recycle,path.basename(name)))})
 const mk=(name,days)=>{
  const full=path.join(root,name)
  fs.writeFileSync(full,'sample')
  const dt=new Date(now-days*DAY)
  fs.utimesSync(full,dt,dt)
  return full
 }
 return {root,recycle,cleaner,mk,cleanup:()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(recycle,{recursive:true,force:true})}}
}
test('one approval auto-recycles all old eligible temp files without touching normal files or folders',async()=>{
 const f=temp()
 try{
  f.mk('old.tmp',40);f.mk('old.log',30);f.mk('recent.tmp',2);f.mk('work.docx',180)
  const preview=await f.cleaner.scan()
  assert.equal(preview.ok,true)
  assert.equal(preview.files.length,2)
  assert.equal((await f.cleaner.autoRecycle('guessed')).ok,false)
  assert.equal(fs.readdirSync(f.recycle).length,0)
  const result=await f.cleaner.autoRecycle(preview.token)
  assert.equal(result.ok,true)
  assert.equal(result.movedCount,2)
  assert.deepEqual(fs.readdirSync(f.root).sort(),['recent.tmp','work.docx'])
  assert.equal((await f.cleaner.autoRecycle(preview.token)).ok,false)
 }finally{f.cleanup()}
})
test('permanent cleanup frees only old top-level .tmp, never .log or recent files',async()=>{
 const f=temp()
 try{
  const file=f.mk('old.tmp',35)
  f.mk('old.log',60);f.mk('new.tmp',5);f.mk('document.pdf',70)
  const preview=await f.cleaner.scan()
  const r=await f.cleaner.freeOldTmp(preview.token)
  assert.equal(r.ok,true)
  assert.equal(r.deletedCount,1)
  assert.equal(r.irreversible,true)
  assert.equal(fs.existsSync(file),false)
  assert.deepEqual(fs.readdirSync(f.root).sort(),['document.pdf','new.tmp','old.log'])
  assert.equal((await f.cleaner.freeOldTmp(preview.token)).ok,false)
 }finally{f.cleanup()}
})
test('permanent cleanup does not delete files changed after the preview',async()=>{
 const f=temp()
 try{
  const file=f.mk('old.tmp',50)
  const preview=await f.cleaner.scan()
  fs.writeFileSync(file,'changed after preview')
  const result=await f.cleaner.freeOldTmp(preview.token)
  assert.equal(result.ok,false)
  assert.equal(result.deletedCount,0)
  assert.equal(fs.existsSync(file),true)
 }finally{f.cleanup()}
})

const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const fsp=require('node:fs/promises')
const os=require('node:os')
const path=require('node:path')
const {createSpaceFinder,MIN_SIZE,validRoot}=require('../electron/space-finder.cjs')
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pcdoctor-downloads-'))
 const bin=fs.mkdtempSync(path.join(os.tmpdir(),'pcdoctor-trash-'))
 const moved=[]
 let tick=0
 function create(name,bytes){
  const file=path.join(root,name),fd=fs.openSync(file,'w')
  try{fs.ftruncateSync(fd,bytes)}finally{fs.closeSync(fd)}
  return file
 }
 const f=createSpaceFinder({platform:'win32',root,allowTestRoot:true,read:fsp,now:()=>10000,
  random:()=>('token-'+(++tick)),
  trashItem:async p=>{moved.push(p);await fsp.rename(p,path.join(bin,path.basename(p)))}
 })
 return {root,bin,moved,create,f,clean:()=>{fs.rmSync(root,{force:true,recursive:true});fs.rmSync(bin,{force:true,recursive:true})}}
}
test('Downloads inspection lists only large top-level regular files; scan does not move anything',async()=>{
 const x=fixture()
 try{
  x.create('large_game_installer.exe',115*1024**2)
  x.create('very_large.zip',220*1024**2)
  x.create('tiny.txt',1024)
  x.create('unfinished.crdownload',300*1024**2)
  fs.mkdirSync(path.join(x.root,'folder'))
  x.create(path.join('folder','nested.iso'),450*1024**2)
  const r=await x.f.scan()
  assert.equal(r.ok,true,r.error)
  assert.deepEqual(r.files.map(v=>v.name),['very_large.zip','large_game_installer.exe'])
  assert.equal(x.moved.length,0)
  assert.equal(JSON.stringify(r).includes(x.root),false)
  assert.ok(r.files[0].sizeBytes>r.files[1].sizeBytes)
 }finally{x.clean()}
})
test('unknown/expired/replayed IDs are rejected; only explicitly selected file goes to Recycle Bin',async()=>{
 const x=fixture()
 try{
  x.create('a.zip',MIN_SIZE+1024)
  x.create('b.iso',MIN_SIZE+2048)
  const preview=await x.f.scan()
  assert.equal((await x.f.recycle('wrong',[preview.files[0].id])).ok,false)
  assert.equal((await x.f.recycle(preview.token,['made-up-id'])).ok,false)
  const chosen=preview.files.find(f=>f.name==='b.iso')
  const result=await x.f.recycle(preview.token,[chosen.id])
  assert.equal(result.ok,true,result.error)
  assert.equal(result.movedCount,1)
  assert.equal(result.freedBytes,0)
  assert.deepEqual(x.moved.map(x=>path.basename(x)),['b.iso'])
  assert.ok(fs.existsSync(path.join(x.root,'a.zip')))
  assert.equal((await x.f.recycle(preview.token,[chosen.id])).ok,false)
 }finally{x.clean()}
})
test('changed file, symlink, directories and invalid root never get trashed',async()=>{
 const x=fixture()
 try{
  const file=x.create('archive.iso',MIN_SIZE+2048)
  const link=path.join(x.root,'fake.iso')
  fs.symlinkSync(file,link)
  const preview=await x.f.scan()
  assert.equal(preview.files.length,1)
  fs.appendFileSync(file,'changed after preview')
  const r=await x.f.recycle(preview.token,[preview.files[0].id])
  assert.equal(r.ok,false)
  assert.equal(r.failedCount,1)
  assert.equal(x.moved.length,0)
  assert.ok(fs.existsSync(file))
  assert.equal(validRoot('/tmp'),false)
 }finally{x.clean()}
})
test('unapproved platform and abnormal Downloads roots fail safely',async()=>{
 const x=fixture()
 try{
  assert.equal((await createSpaceFinder({platform:'linux',root:x.root,allowTestRoot:true,trashItem:async()=>{}}).scan()).ok,false)
  const bad=createSpaceFinder({platform:'win32',root:'/tmp/unsafe',trashItem:async()=>{throw Error('should not run')}})
  assert.equal((await bad.scan()).ok,false)
 }finally{x.clean()}
})

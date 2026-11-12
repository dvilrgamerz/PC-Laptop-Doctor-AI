const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const fsp=require('node:fs/promises')
const path=require('node:path')
const os=require('node:os')
const {createTempCleaner,safeRoot,MAX_FILES}=require('../electron/temp-cleaner.cjs')
const DAY=86400000
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v7-clean-'))
 const bin=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v7-recycle-'))
 const date=Date.UTC(2026,10,12,12,0,0)
 const write=(name,days=30,text='sample')=>{
  const f=path.join(root,name)
  fs.writeFileSync(f,text)
  fs.utimesSync(f,new Date(date-days*DAY),new Date(date-days*DAY))
  return f
 }
 const moved=[]
 let count=0
 const cleaner=createTempCleaner({platform:'win32',root,allowTestRoot:true,clock:()=>date,
  random:()=>String(++count),
  trashItem:async full=>{
   moved.push(path.basename(full))
   await fsp.rename(full,path.join(bin,path.basename(full)))
  }})
 return {root,bin,date,write,cleaner,moved,cleanup:()=>{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(bin,{recursive:true,force:true})}}
}
test('cleanup scope only includes old top-level tmp/log, not docs, directories or recent files',async()=>{
 const f=fixture()
 try{
  f.write('old.tmp',30)
  f.write('old.log',28)
  f.write('recent.tmp',1)
  f.write('notes.docx',100)
  fs.mkdirSync(path.join(f.root,'folder.tmp'))
  f.write(path.join('folder.tmp','secret.log'),45)
  const scan=await f.cleaner.scan()
  assert.equal(scan.ok,true)
  assert.deepEqual(scan.files.map(x=>x.name).sort(),['old.log','old.tmp'])
  assert.equal(scan.files.some(x=>x.name==='secret.log'),false)
  assert.ok(scan.caution.includes('Recycle Bin'))
  assert.deepEqual(f.moved,[])
 }finally{f.cleanup()}
})
test('only explicitly selected IDs can be recycled, single-use approval and no hidden delete',async()=>{
 const f=fixture()
 try{
  f.write('A.tmp',30);f.write('B.log',40)
  const scan=await f.cleaner.scan()
  assert.equal((await f.cleaner.recycle(scan.token,['outside-selection'])).ok,false)
  assert.equal((await f.cleaner.recycle('guess',[scan.files[0].id])).ok,false)
  assert.equal(f.moved.length,0)
  const result=await f.cleaner.recycle(scan.token,[scan.files[0].id])
  assert.equal(result.ok,true)
  assert.equal(result.movedCount,1)
  assert.equal(f.moved.length,1)
  assert.equal((await f.cleaner.recycle(scan.token,[scan.files[1].id])).ok,false)
  assert.equal(fs.readdirSync(f.root).length,1)
  assert.equal(fs.readdirSync(f.bin).length,1)
 }finally{f.cleanup()}
})
test('files changed after preview are skipped instead of moved',async()=>{
 const f=fixture()
 try{
  const target=f.write('A.tmp',30)
  const scan=await f.cleaner.scan()
  fs.writeFileSync(target,'changed content')
  const result=await f.cleaner.recycle(scan.token,[scan.files[0].id])
  assert.equal(result.ok,false)
  assert.equal(result.movedCount,0)
  assert.equal(result.failedCount,1)
  assert.deepEqual(f.moved,[])
  assert.equal(fs.existsSync(target),true)
 }finally{f.cleanup()}
})
test('refuses dangerous temp overrides, absolute root and unsupported platform',async()=>{
 assert.equal(safeRoot('C:\\','win32'),false)
 assert.equal(safeRoot('C:\\Users\\A\\Documents','win32'),false)
 assert.equal(safeRoot('C:\\Users\\A\\AppData\\Local\\Temp','win32'),true)
 const cleaner=createTempCleaner({platform:'linux',root:os.tmpdir(),trashItem:async()=>{throw Error('never')}})
 assert.equal((await cleaner.scan()).ok,false)
 assert.equal((await cleaner.recycle('x',['a'])).ok,false)
})
test('large or malicious selections rejected and no directory recursion',async()=>{
 const f=fixture()
 try{
  f.write('A.tmp',21)
  const scan=await f.cleaner.scan()
  const id=scan.files[0].id
  assert.equal((await f.cleaner.recycle(scan.token,[id,id])).ok,false)
  assert.equal((await f.cleaner.recycle(scan.token,[])).ok,false)
  assert.equal((await f.cleaner.recycle(scan.token,Array(MAX_FILES+1).fill(id))).ok,false)
  assert.deepEqual(f.moved,[])
 }finally{f.cleanup()}
})

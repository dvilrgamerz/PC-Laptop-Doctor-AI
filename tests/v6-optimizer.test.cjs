const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const os=require('node:os')
const {createOptimizer,MANIFEST,regValue,decodeStore}=require('../electron/optimizer-v6.cjs')
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v6-optim-')),stateFile=path.join(root,'journal.json')
 const values=new Map(),calls=[]
 let failWrite=false
 const exec=async(exe,args)=>{
  assert.equal(exe,'reg.exe')
  const [mode,key]=args,value=args[args.indexOf('/v')+1]
  assert.ok(/^HKCU\\/.test(key))
  const id=key+'|'+value
  calls.push({mode,id,args})
  if(mode==='query'){
   if(!values.has(id)){const e=new Error('ERROR: The system was unable to find the specified registry key or value.');e.code=1;throw e}
   return '  '+value+'    REG_DWORD    0x'+values.get(id).toString(16)+'\r\n'
  }
  if(mode==='add'){
   values.set(id,Number(args[args.indexOf('/d')+1]))
   if(failWrite){failWrite=false;throw Error('Simulated interruption after registry change')}
   return ''
  }
  if(mode==='delete'){values.delete(id);return ''}
  throw Error('unexpected reg mode')
 }
 const make=()=>createOptimizer({platform:'win32',stateFile,exec,now:()=>Date.UTC(2026,10,12,12,0,0),random:()=>('fixed-'+calls.length)})
 return {values,calls,make,root,stateFile,failNextWrite:()=>{failWrite=true},
   clean:()=>fs.rmSync(root,{recursive:true,force:true})}
}
test('optimizations are bounded HKCU DWORD preferences; no security, service or arbitrary file actions',()=>{
 assert.ok(MANIFEST.length>=4)
 assert.equal(new Set(MANIFEST.map(m=>m.id)).size,MANIFEST.length)
 for(const m of MANIFEST){
  assert.match(m.key,/^HKCU\\/)
  assert.equal(m.desired,0)
  assert.ok(m.source.startsWith('https://'))
  assert.doesNotMatch(m.key+' '+m.value,/Defender|VBS|Secure Boot|anticheat|WindowsUpdate|HPET/i)
 }
 assert.equal(regValue(' AppCaptureEnabled   REG_DWORD    0x0','AppCaptureEnabled'),0)
 assert.equal(regValue(' AppCaptureEnabled   REG_DWORD    0x1','AppCaptureEnabled'),1)
 assert.equal(regValue(' AppCaptureEnabled   REG_SZ    0x0','AppCaptureEnabled'),undefined)
})
test('dry-run records original and verified apply/undo survive process restart',async()=>{
 const f=fixture()
 try{
  const first=await f.make().listing()
  assert.equal(first.ok,true)
  assert.equal(first.items.find(x=>x.id==='backgroundCapture').status,'available')
  const service=f.make()
  assert.equal((await service.perform('backgroundCapture','apply','madeup')).ok,false)
  let p=await service.preview('backgroundCapture','apply')
  assert.equal(p.ok,true)
  assert.equal(p.before,null)
  assert.equal(p.after,0)
  assert.equal((await service.perform(p.id,p.mode,p.token)).ok,true)
  assert.equal((await service.perform(p.id,p.mode,p.token)).ok,false)
  assert.equal(decodeStore(f.stateFile).records.backgroundCapture.phase,'applied')
  assert.equal((await f.make().listing()).items.find(x=>x.id==='backgroundCapture').status,'restorable')
  const restored=f.make()
  p=await restored.preview('backgroundCapture','restore')
  assert.equal(p.ok,true)
  assert.equal((await restored.perform(p.id,p.mode,p.token)).ok,true)
  assert.equal((await restored.listing()).items.find(x=>x.id==='backgroundCapture').status,'available')
  assert.equal(decodeStore(f.stateFile).records.backgroundCapture,undefined)
 }finally{f.clean()}
})
test('refuses overwrite after changes outside PC Doctor',async()=>{
 const f=fixture()
 try{
  const service=f.make()
  const p=await service.preview('gameDvr')
  await service.perform('gameDvr','apply',p.token)
  const key=MANIFEST.find(x=>x.id==='gameDvr'),id=key.key+'|'+key.value
  f.values.set(id,1)
  const attempt=await f.make().preview('gameDvr','restore')
  assert.equal(attempt.ok,false)
  assert.match(attempt.error,/outside/)
  assert.equal(f.values.get(id),1)
 }finally{f.clean()}
})
test('interrupted apply keeps durable recovery journal and restore works after restart',async()=>{
 const f=fixture()
 try{
  f.failNextWrite()
  const service=f.make(),p=await service.preview('transparency')
  const r=await service.perform(p.id,p.mode,p.token)
  assert.equal(r.ok,false)
  assert.equal(decodeStore(f.stateFile).records.transparency.phase,'pending')
  const recovery=f.make()
  assert.equal((await recovery.listing()).items.find(x=>x.id==='transparency').status,'needsReview')
  const undo=await recovery.preview('transparency','restore')
  assert.equal(undo.ok,true)
  assert.equal((await recovery.perform(undo.id,undo.mode,undo.token)).ok,true)
 }finally{f.clean()}
})
test('unsupported platforms, unknown actions and unavailable reads cannot change Windows',async()=>{
 const f=fixture()
 try{
  const wrong=createOptimizer({platform:'linux',stateFile:f.stateFile})
  assert.equal((await wrong.listing()).ok,false)
  assert.equal((await wrong.preview('backgroundCapture')).ok,false)
  const r=await f.make().preview('runPowerShell')
  assert.equal(r.ok,false)
  assert.equal(f.calls.filter(x=>x.mode!=='query').length,0)
 }finally{f.clean()}
})

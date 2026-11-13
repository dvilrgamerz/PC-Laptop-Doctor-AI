const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createGameFocus,load}=require('../electron/game-focus.cjs')
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-v72-'))
 const file=path.join(root,'session.json'),queued=[]
 let enabled=0,managed=false,cancelled=0
 const fixes={
  status:async()=>({supported:true,gameMode:{available:true,value:enabled},
    highPerformanceAvailable:false,activePower:null,canRestore:{gameMode:managed,performance:false}}),
  perform:async action=>{
   if(action==='enableGameMode'){enabled=1;managed=true;return {ok:true,changed:true}}
   if(action==='restoreGameMode'){enabled=0;managed=false;return {ok:true,changed:true}}
   return {ok:false,error:'Unknown action'}
  }
 }
 const create=()=>createGameFocus({
  fixes,stateFile:file,platform:'win32',readBattery:async()=>({hasBattery:false}),
  now:()=>Date.UTC(2026,10,12,12),random:()=> 'token',
  schedule:(fn,ms)=>{const obj={fn,ms,unref(){}};queued.push(obj);return obj},
  cancel:()=>{cancelled++}
 })
 return {root,file,queued,create,view:()=>({enabled,managed,cancelled}),
  cleanup:()=>fs.rmSync(root,{recursive:true,force:true})}
}
test('time-limit preview requires allowed duration and no change before approval',async()=>{
 const f=fixture()
 try{
  const service=f.create()
  assert.equal((await service.preview('standard',5)).ok,false)
  assert.equal((await service.preview('plugged',9999)).ok,false)
  const preview=await service.preview('standard',120)
  assert.equal(preview.stopAfterMinutes,120)
  assert.deepEqual(preview.actions,['Windows Game Mode'])
  assert.equal(f.view().enabled,0)
  assert.equal((await service.start('standard','bad')).ok,false)
  assert.equal(f.view().enabled,0)
 }finally{f.cleanup()}
})
test('approved session schedules 2-hour restoration and invokes existing rollback',async()=>{
 const f=fixture()
 try{
  const service=f.create(),preview=await service.preview('standard',120)
  assert.equal((await service.start('standard',preview.token)).ok,true)
  assert.equal(f.view().enabled,1)
  assert.equal(f.queued.length,1)
  assert.equal(f.queued[0].ms,120*60000)
  assert.ok(load(f.file).expiresAt)
  await f.queued[0].fn()
  // The scheduler callback intentionally uses Promise.resolve; flush microtasks.
  for(let i=0;i<15&&f.view().enabled;i++)await new Promise(resolve=>setImmediate(resolve))
  assert.equal(f.view().enabled,0)
  assert.equal(f.view().managed,false)
  assert.equal(load(f.file),null)
  assert.match((await service.state()).automaticOutcome,/time limit/i)
 }finally{f.cleanup()}
})
test('disabled timer retains manual Stop & Restore without scheduling',async()=>{
 const f=fixture()
 try{
  const service=f.create(),preview=await service.preview('standard',0)
  assert.equal((await service.start('standard',preview.token)).ok,true)
  assert.equal(f.queued.length,0)
  assert.equal(load(f.file).expiresAt,null)
  assert.equal((await service.stop()).ok,true)
  assert.equal(f.view().enabled,0)
 }finally{f.cleanup()}
})
test('normal manual Stop & Restore cancels active timer',async()=>{
 const f=fixture()
 try{
  const service=f.create(),preview=await service.preview('standard',30)
  assert.equal((await service.start('standard',preview.token)).ok,true)
  assert.equal((await service.stop()).ok,true)
  assert.equal(f.view().cancelled,1)
 }finally{f.cleanup()}
})

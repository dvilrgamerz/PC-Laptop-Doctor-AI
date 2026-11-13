const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createGameFocus,load}=require('../electron/game-focus.cjs')

function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'doctor-focus-'))
 const file=path.join(dir,'session.json')
 const commands=[]
 let game=0,performance=false,managedGame=false,managedPower=false,failPower=false
 const fixes={
  status:async()=>({
   supported:true,gameMode:{available:true,value:game},
   highPerformanceAvailable:true,
   activePower:performance?'8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c':'381b4222-f694-41f0-9685-ff5bb260df2e',
   canRestore:{gameMode:managedGame,performance:managedPower}
  }),
  perform:async action=>{
   commands.push(action)
   switch(action){
    case 'enableGameMode':
     if(managedGame)return {ok:false,error:'already managed'}
     game=1;managedGame=true;return {ok:true,changed:true}
    case 'restoreGameMode':
     if(!managedGame||game!==1)return {ok:false,error:'changed outside app'}
     game=0;managedGame=false;return {ok:true,changed:true}
    case 'enablePerformance':
     if(failPower)return {ok:false,error:'simulated power error'}
     performance=true;managedPower=true;return {ok:true,changed:true}
    case 'restorePerformance':
     if(!managedPower)return {ok:false,error:'no backup'}
     performance=false;managedPower=false;return {ok:true,changed:true}
   }
   return {ok:false,error:'unknown'}
  }
 }
 const make=(battery={hasBattery:false})=>createGameFocus({platform:'win32',fixes,stateFile:file,readBattery:async()=>battery,
  now:()=>Date.UTC(2026,10,12,12,0,0),random:()=> 'approved-token'})
 return {dir,file,fixes,make,commands,view:()=>({game,performance,managedGame,managedPower}),
  failPower:()=>{failPower=true},externalGame:v=>{game=v},cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})}
}
test('requires explicit per-session preview and rejects arbitrary profile/action tokens',async()=>{
 const f=fixture()
 try{
  const s=f.make()
  assert.equal((await s.start('standard','fake')).ok,false)
  assert.equal((await s.preview('overclock')).ok,false)
  assert.equal(f.commands.length,0)
  const p=await s.preview('standard')
  assert.equal(p.ok,true)
  assert.deepEqual(p.actions,['Windows Game Mode'])
  assert.equal((await s.start('plugged',p.token)).ok,false)
  assert.equal((await s.start('standard',p.token)).ok,true)
  assert.deepEqual(f.commands,['enableGameMode'])
  assert.equal((await s.start('standard',p.token)).ok,false)
  assert.equal((await f.make().stop()).ok,true)
  assert.deepEqual(f.commands,['enableGameMode','restoreGameMode'])
  assert.equal(load(f.file),null)
 }finally{f.cleanup()}
})
test('AC-only performance mode and restore after app restart',async()=>{
 const f=fixture()
 try{
  const battery={hasBattery:true,acConnected:false,isCharging:false}
  let s=f.make(battery),p=await s.preview('plugged')
  assert.equal(p.ok,true)
  assert.ok(p.skips.some(x=>/AC power/.test(x)))
  assert.deepEqual(p.actions,['Windows Game Mode'])
  s=f.make({hasBattery:true,acConnected:true})
  p=await s.preview('plugged')
  assert.equal(p.actions.length,2)
  assert.equal((await s.start('plugged',p.token)).ok,true)
  assert.equal(f.view().managedPower,true)
  assert.equal(load(f.file).phase,'active')
  const fresh=f.make({hasBattery:true,acConnected:true})
  assert.equal((await fresh.state()).needsRecovery,true)
  assert.equal((await fresh.stop()).ok,true)
  assert.equal(f.view().managedPower,false)
  assert.equal(f.view().game,0)
 }finally{f.cleanup()}
})
test('failed second action leaves recovery journal and safely rolls back applied first setting',async()=>{
 const f=fixture()
 try{
  f.failPower()
  const s=f.make()
  const p=await s.preview('plugged')
  const r=await s.start('plugged',p.token)
  assert.equal(r.ok,false)
  assert.equal(r.recoverable,true)
  assert.equal(load(f.file).phase,'starting')
  assert.deepEqual(load(f.file).attempted,['gameMode','performance'])
  const restored=await f.make().stop()
  assert.equal(restored.ok,true)
  assert.equal(f.view().game,0)
  assert.equal(load(f.file),null)
 }finally{f.cleanup()}
})
test('existing user-managed changes are excluded from Game Focus and never restored by it',async()=>{
 const f=fixture()
 try{
  await f.fixes.perform('enableGameMode')
  const before=f.commands.length
  const s=f.make()
  const p=await s.preview('standard')
  assert.deepEqual(p.actions,[])
  assert.equal((await s.start('standard',p.token)).ok,true)
  assert.equal((await s.stop()).ok,true)
  assert.equal(f.view().managedGame,true)
  assert.equal(f.commands.length,before)
 }finally{f.cleanup()}
})
test('unknown platform never applies Windows settings',async()=>{
 const f=fixture()
 try{
  const s=createGameFocus({platform:'linux',fixes:f.fixes,stateFile:f.file})
  assert.equal((await s.preview('standard')).ok,false)
  assert.equal((await s.start('standard','token')).ok,false)
  assert.equal((await s.stop()).ok,false)
  assert.equal(f.commands.length,0)
 }finally{f.cleanup()}
})

test('unknown power source fails closed for High Performance, including AC state changing after preview',async()=>{
 const f=fixture()
 try{
  const unknown=f.make(null),p=await unknown.preview('plugged')
  assert.equal(p.ok,true)
  assert.deepEqual(p.actions,['Windows Game Mode'])
  assert.ok(p.skips.some(x=>/unavailable/i.test(x)))
  await unknown.start('plugged',p.token)
  assert.ok(!f.commands.includes('enablePerformance'))
  await unknown.stop()
  let scans=0
  const agent=createGameFocus({platform:'win32',fixes:f.fixes,stateFile:f.file,
    readBattery:async()=>++scans===1?{hasBattery:true,acConnected:true}:null,
    now:()=>Date.UTC(2026,10,12),random:()=> 'changing-source'})
  const ready=await agent.preview('plugged')
  assert.equal(ready.actions.length,2)
  const result=await agent.start('plugged',ready.token)
  assert.equal(result.ok,false)
  assert.equal(f.commands.filter(x=>x==='enablePerformance').length,0)
 }finally{f.cleanup()}
})

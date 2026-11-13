const test=require('node:test')
const assert=require('node:assert/strict')
const {spawn}=require('node:child_process')
const {createWindowsEcoQos}=require('../electron/windows-eco-qos.cjs')

// One disposable child owned by this test. This never targets a user's programs.
test('Windows EcoQoS helper snapshots and restores a disposable process', {skip:process.platform!=='win32',timeout:45000}, async t=>{
 const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{windowsHide:true,stdio:'ignore'})
 try{
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject)})
  const eco=createWindowsEcoQos()
  const target={pid:child.pid,exe:process.execPath.toLowerCase()}
  const before=await eco.inspect(target)
  if(!before.ok){t.diagnostic('Original PowerThrottling state cannot be queried on this runner: '+before.error+'; no changes attempted.');return}
  const planned={...target,startTicks:before.startTicks,
   before:{controlMask:before.controlMask,stateMask:before.stateMask},
   applied:{controlMask:(before.controlMask|1)>>>0,stateMask:(before.stateMask|1)>>>0}}
  const applied=await eco.apply(planned)
  assert.equal(applied.ok,true,applied.error||'Cannot enable EcoQoS')
  try{
   const probe=await eco.probe(planned)
   assert.equal(probe.ok,true)
   assert.equal(probe.same,true)
   const current=await eco.inspect(target)
   assert.equal(current.ok,true,current.error)
   assert.equal(current.controlMask,planned.applied.controlMask)
   assert.equal(current.stateMask,planned.applied.stateMask)
  }finally{
   const restored=await eco.restore(planned)
   assert.equal(restored.ok,true,restored.error||'Failed to restore disposable child QoS')
  }
 }finally{child.kill()}
})

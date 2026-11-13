const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createDailyMonster,snapshot,warnings,load,updateDay,CHECK_INTERVAL}=require('../electron/daily-monster.cjs')
const GIB=1024**3
function fixture(initial={cpuPercent:35,ramPercent:55,gpuPercent:20,diskPercent:97,diskFreeGiB:5.1,temperatureC:null}){
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'pc-monster-test-'))
 const file=path.join(folder,'daily.json')
 let time=new Date('2026-11-13T08:00:00-06:00').getTime(),metric={...initial}
 let checks=0,notifications=0
 const poll={sample:async()=>{checks++;return {ok:true,metrics:{...metric}}}}
 let task=null
 const monster=createDailyMonster({file,monitor:poll,now:()=>time,
  notifier:()=>{notifications++},
  schedule:fn=>{task=fn;return {unref(){}}},
  cancel:()=>{task=null}})
 return {monster,file,setMetric:v=>{metric={...metric,...v}},advance:ms=>{time+=ms},checks:()=>checks,
  notifications:()=>notifications,task:()=>task,
  cleanup:()=>fs.rmSync(folder,{recursive:true,force:true})}
}
test('daily monitor is disabled by default and stores no personal data',async()=>{
 const f=fixture()
 try{
  f.monster.start()
  assert.equal(typeof f.task(),'function')
  assert.equal((await f.monster.tick()).skipped,true)
  assert.equal(fs.existsSync(f.file),false)
  const check=await f.monster.check()
  assert.equal(check.ok,true)
  assert.equal(check.recorded,false)
  assert.equal(check.alerts[0].id,'storage')
  assert.equal(fs.existsSync(f.file),false)
  assert.equal(f.notifications(),0)
 }finally{f.monster.stop();f.cleanup()}
})
test('explicit opt-in limits sampling to 30 minutes and 30 local days',async()=>{
 const f=fixture()
 try{
  assert.equal((await f.monster.configure({enabled:true,notify:false})).ok,true)
  assert.equal((await f.monster.check()).recorded,true)
  assert.equal((await f.monster.check()).recorded,false)
  assert.equal(load(f.file).days.length,1)
  f.advance(CHECK_INTERVAL+1000)
  f.setMetric({cpuPercent:95,ramPercent:92,diskPercent:96,diskFreeGiB:5})
  assert.equal((await f.monster.check()).recorded,true)
  assert.equal(load(f.file).days[0].peakCpu,95)
  assert.equal(load(f.file).days[0].peakRam,92)
  assert.equal(load(f.file).days[0].samples,2)
  for(let i=0;i<35;i++){
   f.advance(24*3600*1000)
   await f.monster.check()
  }
  assert.equal(load(f.file).days.length,30)
  const encoded=fs.readFileSync(f.file,'utf8')
  for(const secret of ['serial','path','startupApps','ip4','password'])assert.equal(encoded.includes(secret),false)
 }finally{f.cleanup()}
})
test('notifications are separately opted in and are at most once per local day',async()=>{
 const f=fixture()
 try{
  assert.equal((await f.monster.configure({enabled:false,notify:true})).ok,false)
  await f.monster.configure({enabled:true,notify:true})
  await f.monster.check()
  assert.equal(f.notifications(),1)
  f.advance(CHECK_INTERVAL)
  await f.monster.check()
  assert.equal(f.notifications(),1)
  f.advance(24*3600*1000)
  await f.monster.check()
  assert.equal(f.notifications(),2)
  await f.monster.configure({enabled:false,notify:false})
  f.advance(24*3600*1000)
  await f.monster.check()
  assert.equal(f.notifications(),2)
 }finally{f.cleanup()}
})
test('deleting daily summaries keeps monitoring consent, empties data and avoids untrusted writes',async()=>{
 const f=fixture()
 try{
  await f.monster.configure({enabled:true,notify:false})
  await f.monster.check()
  const after=f.monster.clearHistory()
  assert.equal(after.ok,true)
  assert.equal(after.enabled,true)
  assert.equal(after.days.length,0)
  assert.equal(after.lastSavedAt,null)
  assert.equal((await f.monster.configure({enabled:'yes',notify:false})).ok,false)
  fs.writeFileSync(f.file,'not-json')
  assert.deepEqual(load(f.file).days,[])
 }finally{f.cleanup()}
})
test('missing sensors are unknown, not false healthy or a fabricated zero',()=>{
 const s=snapshot({cpuPercent:NaN,ramPercent:undefined,diskFreeGiB:null,temperatureC:undefined})
 assert.equal(s.cpu,null)
 assert.equal(s.ram,null)
 assert.equal(s.free,null)
 assert.equal(s.temperature,null)
 assert.deepEqual(warnings({cpuPercent:null,diskPercent:null,diskFreeGiB:null}),[])
 const days=updateDay([],s,new Date('2026-11-13T12:00:00Z').getTime())
 assert.equal(days.length,1)
 assert.equal(days[0].peakCpu,null)
})

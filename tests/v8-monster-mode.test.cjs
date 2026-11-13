const test=require('node:test')
const assert=require('node:assert/strict')
const {createMonsterMode,LIMIT_MS}=require('../electron/monster-mode.cjs')

function fixture({files=[{id:'a',name:'old.tmp',ageDays:40,sizeBytes:2048},{id:'b',name:'recent.log',ageDays:20,sizeBytes:128}],session=null,scanError=null}={}){
 let prefs={autoBoost:false,weeklyCleanup:false},time=1000,cleaned=[],configurations=[]
 const autopilot={
  status:async()=>({ok:true,...prefs,message:'Local automation ready'}),
  configure:async o=>{configurations.push(o);prefs={...o};return {ok:true,...prefs}}
 }
 const tempCleaner={
  scan:async()=>scanError?{ok:false,error:scanError}:{ok:true,token:'scan-token',files},
  recycle:async(token,ids)=>{assert.equal(token,'scan-token');cleaned.push(ids);return {ok:true,movedCount:ids.length,movedBytes:2048,failedCount:0}}
 }
 const focus={state:async()=>({session})}
 let count=0
 const make=()=>createMonsterMode({autopilot,tempCleaner,gameFocus:focus,platform:'win32',now:()=>time,token:()=>('token-'+(++count))})
 return {make,autopilot,cleaned,configurations,advance:n=>time+=n,setSession:x=>session=x}
}
test('Monster Mode is initially off and preview has no side effects',async()=>{
 const f=fixture(),service=f.make()
 assert.equal((await service.status()).enabled,false)
 const p=await service.preview()
 assert.equal(p.ok,true)
 assert.equal(p.count,1)
 assert.equal(p.bytes,2048)
 assert.equal(f.configurations.length,0)
 assert.equal(f.cleaned.length,0)
 assert.match(p.caution,/(not permanently delete|Nothing is deleted permanently)/i)
})
test('one confirmed activation enables both automations and recycles old top-level tmp only',async()=>{
 const f=fixture(),service=f.make()
 const p=await service.preview()
 assert.equal((await service.activate('wrong')).ok,false)
 assert.equal(f.configurations.length,0)
 const a=await service.activate(p.token)
 assert.equal(a.ok,true)
 assert.equal(a.recycledFiles,1)
 assert.equal((await service.status()).enabled,true)
 assert.deepEqual(f.configurations,[{autoBoost:true,weeklyCleanup:true}])
 assert.deepEqual(f.cleaned,[['a']])
 assert.equal((await service.activate(p.token)).ok,false)
 const d=await service.disable()
 assert.equal(d.ok,true)
 assert.equal((await service.status()).enabled,false)
})
test('expired or active gaming session preview refuses all actions',async()=>{
 const f=fixture(),service=f.make()
 let p=await service.preview()
 f.advance(LIMIT_MS+1)
 assert.equal((await service.activate(p.token)).ok,false)
 assert.equal(f.cleaned.length,0)
 f.setSession({id:'active'})
 p=await service.preview()
 assert.equal(p.ok,false)
 assert.equal(f.configurations.length,0)
})
test('safe Temp scan failure means automation cannot be activated without a valid preview',async()=>{
 const f=fixture({scanError:'Unavailable user Temp'}),s=f.make()
 assert.equal((await s.preview()).ok,false)
 assert.equal((await s.activate('anything')).ok,false)
 assert.equal(f.configurations.length,0)
})
test('no eligible files still enables automation without touching storage',async()=>{
 const f=fixture({files:[{id:'safe',name:'recent.tmp',ageDays:7,sizeBytes:90}]}),s=f.make()
 const p=await s.preview()
 assert.equal(p.count,0)
 const result=await s.activate(p.token)
 assert.equal(result.ok,true)
 assert.equal(result.recycledFiles,0)
 assert.deepEqual(f.cleaned,[])
})
test('unsupported platforms reject activation, preview and disable',async()=>{
 const f=fixture(),s=createMonsterMode({autopilot:f.autopilot,tempCleaner:{scan:async()=>({ok:true})},gameFocus:{state:async()=>({session:null})},platform:'linux'})
 assert.equal((await s.preview()).ok,false)
 assert.equal((await s.activate('x')).ok,false)
 assert.equal((await s.disable()).ok,false)
})

test('Windows startup is separate, opt-in, preview-bound and reversible',async()=>{
 const f=fixture(),calls=[]
 let openAtLogin=false
 const loginStartup={
  get:()=>openAtLogin,
  set:enabled=>{calls.push(enabled);openAtLogin=enabled}
 }
 const s=createMonsterMode({autopilot:f.autopilot,tempCleaner:{
  scan:async()=>({ok:true,token:'scan-token',files:[]}),
  recycle:async()=>({ok:true,movedCount:0})
 },gameFocus:{state:async()=>({session:null})},loginStartup,platform:'win32'})
 const first=await s.preview({startWithWindows:true})
 assert.equal(first.ok,true)
 assert.equal(first.startWithWindows,true)
 assert.ok(first.actions.some(a=>a.includes('automatically')))
 assert.deepEqual(calls,[]) // preview cannot register login startup
 assert.equal((await s.activate('forged-token')).ok,false)
 assert.deepEqual(calls,[])
 assert.equal((await s.activate(first.token)).ok,true)
 assert.deepEqual(calls,[true])
 assert.equal((await s.status()).startWithWindows,true)
 assert.equal((await s.activate(first.token)).ok,false) // replay rejected
 const stopped=await s.disable()
 assert.equal(stopped.ok,true)
 assert.deepEqual(calls,[true,false])
 assert.equal((await s.status()).startWithWindows,false)
})
test('cannot silently enable login startup without a supported adapter',async()=>{
 const f=fixture(),s=f.make()
 assert.equal((await s.preview({startWithWindows:true})).ok,false)
 assert.equal((await s.preview({startWithWindows:'true'})).ok,false)
 assert.equal(f.configurations.length,0)
 assert.equal((await s.preview({startWithWindows:false})).ok,true)
})
test('login registration failure is disclosed without misreporting care activation',async()=>{
 const f=fixture()
 let getCount=0
 const s=createMonsterMode({autopilot:f.autopilot,tempCleaner:{
  scan:async()=>({ok:true,token:'scan-token',files:[]}),
  recycle:async()=>({ok:true,movedCount:0})
 },gameFocus:{state:async()=>({session:null})},platform:'win32',
 loginStartup:{get:()=>{getCount++;return false},set:()=>{throw Error('Blocked by Windows')}}})
 const p=await s.preview({startWithWindows:true})
 const started=await s.activate(p.token)
 assert.equal(started.ok,true)
 assert.match(started.warning,/startup/i)
 assert.equal((await s.status()).startWithWindows,false)
 const stopped=await s.disable()
 assert.equal(stopped.ok,true)
 assert.match(stopped.warning,/startup/i)
 assert.ok(getCount>0)
})
test('Monster Mode appears exactly once on dashboard',()=>{
 const fs=require('node:fs')
 const path=require('node:path')
 const app=fs.readFileSync(path.join(__dirname,'../src/App.jsx'),'utf8')
 const daily=fs.readFileSync(path.join(__dirname,'../src/DailyMonsterPanel.jsx'),'utf8')
 assert.match(app,/<MonsterModePanel demo=/)
 assert.doesNotMatch(daily,/<MonsterModePanel/)
})

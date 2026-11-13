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
 assert.match(p.caution,/not permanently delete/)
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

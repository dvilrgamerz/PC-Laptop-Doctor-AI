const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createAutopilot,loadPrefs,processExecutable,gameForProcesses,WEEK}=require('../electron/autopilot.cjs')

function fixture(roots=[],hasCustom=true){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-autopilot-'))
 const stateFile=path.join(root,'auto.json'),customStoreFile=path.join(root,'games.json')
 fs.writeFileSync(customStoreFile,JSON.stringify({version:1,games:hasCustom?
  [{id:'a'.repeat(24),name:'Chess Game',file:'D:\\Games\\Chess\\Chess.exe'}]:[]}))
 let now=Date.UTC(2026,10,12,12,0,0),active=false
 let processList=[]
 const calls=[],cleanCalls=[]
 const focus={
  state:async()=>({ok:true,session:active?{phase:'active'}:null}),
  preview:async(p,m)=>{calls.push(['preview',p,m]);return {ok:true,profile:p,token:'approved'}},
  start:async(p,t)=>{calls.push(['start',p,t]);active=true;return {ok:true}},
  stop:async()=>{calls.push(['stop']);active=false;return {ok:true}}
 }
 let filePreview=[{id:'old',name:'old.tmp',ageDays:45},{id:'recent',name:'recent.tmp',ageDays:18},
  {id:'log',name:'old.log',ageDays:70}]
 const cleaner={
  scan:async()=>{cleanCalls.push('scan');return {ok:true,token:'temp-preview',files:filePreview}},
  recycle:async(token,ids)=>{cleanCalls.push(['recycle',token,ids]);return {ok:true,movedCount:ids.length,failedCount:0}}
 }
 const agent=createAutopilot({stateFile,customStoreFile,gameFocus:focus,
  processes:async()=>processList,installedRoots:async()=>roots,tempCleaner:cleaner,platform:'win32',now:()=>now,
  schedule:()=>({unref(){}}),cancel:()=>{}})
 return {agent,calls,cleanCalls,stateFile,
  setProcesses:xs=>{processList=xs},
  setTime:t=>{now=t},
  jumpTime:ms=>{now+=ms},
  setPreview:xs=>{filePreview=xs},
  setActive:v=>{active=v},
  clean:()=>fs.rmSync(root,{recursive:true,force:true})}
}
const gameProcess={name:'Chess.exe',path:'D:\\Games\\Chess'}
test('exact trusted executable matching ignores same process names from different folders',()=>{
 assert.equal(processExecutable(gameProcess),'d:\\games\\chess\\chess.exe')
 assert.equal(processExecutable({name:'Chess.exe',path:'D:\\Other'}),'d:\\other\\chess.exe')
 assert.equal(gameForProcesses([{name:'Chess.exe',path:'C:\\Other'}],[{name:'Chess Game',file:'D:\\Games\\Chess\\Chess.exe'}]),null)
 assert.equal(gameForProcesses([gameProcess],[{name:'Chess Game',file:'D:\\Games\\Chess\\Chess.exe'}]).name,'Chess Game')
 assert.equal(processExecutable({name:'Chess.exe',command:'D:\\Games\\Chess\\Chess.exe'}),null)
})
test('Autopilot is off by default and requires explicit boolean choices',async()=>{
 const f=fixture()
 try{
  assert.equal((await f.agent.status()).autoBoost,false)
  assert.equal((await f.agent.status()).weeklyCleanup,false)
  assert.equal((await f.agent.configure({autoBoost:true})).ok,false)
  f.setProcesses([gameProcess]);await f.agent.tick();await f.agent.tick()
  assert.equal(f.calls.length,0)
  assert.equal(f.cleanCalls.length,0)
 }finally{f.clean()}
})
test('enabling Auto Game Focus starts after two exact detections and restores after three missing checks',async()=>{
 const f=fixture()
 try{
  assert.equal((await f.agent.configure({autoBoost:true,weeklyCleanup:false})).ok,true)
  f.setProcesses([gameProcess])
  await f.agent.tick()
  assert.equal(f.calls.length,0)
  await f.agent.tick()
  assert.deepEqual(f.calls,[['preview','standard',120],['start','standard','approved']])
  assert.equal((await f.agent.status()).activeGame,'Chess Game')
  f.setProcesses([])
  await f.agent.tick();await f.agent.tick()
  assert.equal(f.calls.filter(x=>x[0]==='stop').length,0)
  await f.agent.tick()
  assert.equal(f.calls.filter(x=>x[0]==='stop').length,1)
  assert.equal((await f.agent.status()).activeGame,null)
 }finally{f.clean()}
})
test('auto game boost never takes over an existing manual session',async()=>{
 const f=fixture()
 try{
  await f.agent.configure({autoBoost:true,weeklyCleanup:false})
  f.setActive(true);f.setProcesses([gameProcess])
  await f.agent.tick();await f.agent.tick();await f.agent.tick()
  assert.equal(f.calls.filter(x=>x[0]==='start').length,0)
  assert.equal(f.calls.filter(x=>x[0]==='stop').length,0)
 }finally{f.clean()}
})
test('disabling owned Auto Game Focus tries to restore immediately',async()=>{
 const f=fixture()
 try{
  await f.agent.configure({autoBoost:true,weeklyCleanup:false})
  f.setProcesses([gameProcess])
  await f.agent.tick();await f.agent.tick()
  assert.equal((await f.agent.configure({autoBoost:false,weeklyCleanup:false})).ok,true)
  assert.equal(f.calls.filter(x=>x[0]==='stop').length,1)
  assert.equal(loadPrefs(f.stateFile).autoBoost,false)
 }finally{f.clean()}
})
test('weekly Auto Care recycles only top-level 30+ day TMP candidates and runs once per 7 days',async()=>{
 const f=fixture()
 try{
  await f.agent.configure({autoBoost:false,weeklyCleanup:true})
  await f.agent.tick()
  assert.deepEqual(f.cleanCalls,['scan',['recycle','temp-preview',['old']]])
  assert.equal((await f.agent.status()).lastCleanupCount,1)
  assert.ok((await f.agent.status()).lastCleanupAt)
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,2)
  f.jumpTime(WEEK+1)
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,4)
 }finally{f.clean()}
})
test('automatic maintenance skips games and manual Game Focus sessions',async()=>{
 const f=fixture()
 try{
  await f.agent.configure({autoBoost:false,weeklyCleanup:true})
  f.setProcesses([gameProcess])
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,0)
  f.setProcesses([]);f.setActive(true)
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,0)
  f.setActive(false)
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,2)
 }finally{f.clean()}
})

test('Steam/Epic auto boost works without manually adding an EXE, but requires exact installed folder',async()=>{
 const f=fixture([{root:'D:\\EpicGames\\Fortnite',name:'Fortnite',source:'Epic Games'}],false)
 try{
  await f.agent.configure({autoBoost:true,weeklyCleanup:true})
  f.setProcesses([{name:'FortniteClient-Win64-Shipping.exe',path:'D:\\EpicGames\\Fortnite\\FortniteGame\\Binaries\\Win64'}])
  await f.agent.tick()
  assert.equal(f.cleanCalls.length,0,'weekly maintenance must skip installed running games')
  await f.agent.tick()
  assert.equal(f.calls.filter(x=>x[0]==='start').length,1)
  assert.equal((await f.agent.status()).activeGame,'Fortnite')
  f.setProcesses([])
  await f.agent.tick();await f.agent.tick();await f.agent.tick()
  assert.equal(f.calls.filter(x=>x[0]==='stop').length,1)
 }finally{f.clean()}
})

test('approved Monster cleanup is recorded and prevents immediate duplicate sweep',async()=>{
 const f=fixture()
 try{
  assert.equal((await f.agent.recordApprovedCleanup(1)).ok,false)
  assert.equal((await f.agent.configure({autoBoost:false,weeklyCleanup:true})).ok,true)
  const record=await f.agent.recordApprovedCleanup(2)
  assert.equal(record.ok,true)
  assert.equal((await f.agent.status()).lastCleanupCount,2)
  assert.ok((await f.agent.status()).lastCleanupAt)
  await f.agent.tick()
  assert.deepEqual(f.cleanCalls,[]) // no second sweep straight after activation
  f.jumpTime(WEEK+1)
  await f.agent.tick()
  assert.ok(f.cleanCalls.includes('scan')) // ordinary weekly schedule resumes
 }finally{f.clean()}
})

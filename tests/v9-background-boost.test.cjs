const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {classify,protectedReason}=require('../electron/boost-policy.cjs')
const {createBackgroundBoost,loadJournal}=require('../electron/background-boost.cjs')
const {createWindowsEcoQos,validate}=require('../electron/windows-eco-qos.cjs')
const game={pid:911,name:'Game.exe',path:'D:\\Games\\Example',cpu:70,memRss:400000000}
const chrome={pid:222,name:'chrome.exe',path:'D:\\Apps\\Browser',cpu:15,memRss:210000000}
const security={pid:555,name:'EasyAntiCheat.exe',path:'D:\\Games\\Example'}
const osProc={pid:432,name:'MsMpEng.exe',path:'C:\\ProgramData\\Microsoft\\Windows Defender'}
const exe='d:\\apps\\browser\\chrome.exe'
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'boost-v9-'))
 const calls=[],list=[game,chrome,security,osProc]
 const adapter={
  async inspect(i){calls.push(['inspect',i]);return {ok:true,...i,startTicks:'638664000000000000',controlMask:0,stateMask:0}},
  async apply(record){calls.push(['apply',record]);return {ok:true,controlMask:1,stateMask:1}},
  async restore(record){calls.push(['restore',record]);return {ok:true}}
 }
 const files={rulesFile:path.join(dir,'rules.json'),journalFile:path.join(dir,'journal.json')}
 const service=()=>createBackgroundBoost({...files,processes:async()=>list,adapter,platform:'win32',appExe:'C:\\Program Files\\PC Doctor\\doctor.exe'})
 return {files,adapter,service,calls,list,clean:()=>fs.rmSync(dir,{recursive:true,force:true})}
}
test('V9 protects Windows, security, anti-cheat, launcher, current game and unverified paths',()=>{
 assert.match(protectedReason({pid:80,path:'C:\\Windows\\System32\\svchost.exe',name:'svchost.exe'}),/Windows/)
 assert.match(protectedReason(security),/Security|anti-cheat/)
 assert.match(protectedReason(osProc),/Security|anti-cheat/)
 assert.match(protectedReason(game,{gameExe:'D:\\Games\\Example\\Game.exe'}),/game/i)
 assert.equal(classify({pid:3,path:'D:\\Tools',name:'tool.exe'}).status,'protected')
 assert.equal(classify({pid:400,path:'D:\\Tools',name:'tool.exe'}).status,'eligible')
 assert.equal(classify({pid:400,path:'',name:'tool.exe'}).status,'protected')
})
test('default mode is observation-only; explicit consent must match live eligible exact executable',async()=>{
 const f=fixture()
 try{
  const s=f.service()
  assert.equal((await s.status()).approvedCount,0)
  assert.equal((await s.inventory()).ok,true)
  assert.equal((await s.begin({file:'D:\\Games\\Example\\Game.exe',name:'Game'})).modifiedCount,0)
  assert.equal(f.calls.length,0)
  assert.equal((await s.setRule('c:\\windows\\system32\\svchost.exe','reduce')).ok,false)
  assert.equal((await s.setRule('d:\\evil\\chrome.exe','reduce')).ok,false)
  assert.equal((await s.setRule(exe,'close')).ok,false)
  assert.equal((await s.setRule(exe,'reduce')).ok,true)
  assert.equal((await s.status()).approvedCount,1)
  assert.equal((await s.setRule(exe,'keep')).ok,true)
  assert.equal((await s.status()).approvedCount,0)
 }finally{f.clean()}
})
test('write-ahead journal records identity and exact original QoS; restored on game exit',async()=>{
 const f=fixture()
 try{
  const s=f.service()
  assert.equal((await s.setRule(exe,'reduce')).ok,true)
  const start=await s.begin({file:'D:\\Games\\Example\\Game.exe',key:'D:\\Games\\Example',name:'Game'})
  assert.equal(start.ok,true)
  assert.equal(start.modifiedCount,1)
  const journal=loadJournal(f.files.journalFile)
  assert.equal(journal.actions.length,1)
  assert.equal(journal.actions[0].exe,exe)
  assert.deepEqual(journal.actions[0].before,{controlMask:0,stateMask:0})
  assert.deepEqual(journal.actions[0].applied,{controlMask:1,stateMask:1})
  assert.deepEqual(f.calls.map(c=>c[0]),['inspect','apply'])
  assert.equal((await s.status()).needsRecovery,true)
  const result=await s.restore()
  assert.equal(result.ok,true)
  assert.equal(result.remaining,0)
  assert.equal(fs.existsSync(f.files.journalFile),false)
  assert.deepEqual(f.calls.map(c=>c[0]),['inspect','apply','restore'])
 }finally{f.clean()}
})
test('new app instance repairs a prior crash from the persisted transaction',async()=>{
 const f=fixture()
 try{
  await f.service().setRule(exe,'reduce')
  await f.service().begin({file:'D:\\Games\\Example\\Game.exe',name:'Game'})
  assert.ok(fs.existsSync(f.files.journalFile))
  const rebooted=f.service()
  assert.equal((await rebooted.restore()).ok,true)
  assert.equal(fs.existsSync(f.files.journalFile),false)
 }finally{f.clean()}
})
test('failed rollback retains journal and reports error, retry succeeds',async()=>{
 const f=fixture()
 try{
  await f.service().setRule(exe,'reduce')
  const s=f.service()
  await s.begin({file:'D:\\Games\\Example\\Game.exe',name:'Game'})
  const original=f.adapter.restore
  f.adapter.restore=async()=>({ok:false,error:'Win32 access denied'})
  const fail=await s.restore()
  assert.equal(fail.ok,false)
  assert.equal(fail.remaining,1)
  assert.ok(fs.existsSync(f.files.journalFile))
  f.adapter.restore=original
  assert.equal((await s.restore()).ok,true)
 }finally{f.clean()}
})
test('Native Windows helper refuses arbitrary commands, PID 4, paths and missing snapshots',async()=>{
 for(const pid of [0,4,-4,NaN])assert.throws(()=>validate('inspect',{pid,exe}),/invalid/i)
 assert.throws(()=>validate('kill',{pid:100,exe}),/unknown/i)
 assert.throws(()=>validate('inspect',{pid:100,exe:'powershell.exe;exit'}),/invalid/i)
 assert.throws(()=>validate('apply',{pid:100,exe,startTicks:'1'}),/snapshot/i)
 assert.doesNotThrow(()=>validate('inspect',{pid:100,exe}))
 let called=0
 const bridge=createWindowsEcoQos({platform:'win32',execute:async(file,args)=>{
  called++
  assert.match(file,/boost-helper[.]exe$/i)
  assert.deepEqual(args,['inspect','100',exe])
  return {stdout:'{"ok":true,"pid":100,"startTicks":"123","controlMask":0,"stateMask":0}'}
 }})
 assert.equal((await bridge.inspect({pid:100,exe})).ok,true)
 assert.equal(called,1)
})
test('renderer gets restricted IPC calls; no arbitrary process-termination primitive',()=>{
 const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8')
 const preload=fs.readFileSync(path.join(__dirname,'../electron/preload.cjs'),'utf8')
 const mode=fs.readFileSync(path.join(__dirname,'../src/BackgroundBoostPanel.jsx'),'utf8')
 assert.match(main,/doctor:v9-background-rule/)
 assert.match(main,/trustedDoctorFrame/)
 assert.match(preload,/setBackgroundBoostRule/)
 assert.doesNotMatch(preload,/terminateProcess|suspendProcess|disableService/)
 assert.match(mode,/Reduce during games/)
})

test('Windows installation bundles the same locally compiled native helper used by the desktop bridge',()=>{
 const pkg=require('../package.json')
 assert.ok(pkg.build.extraResources.some(x=>x.from==='native/build/boost-helper.exe'&&x.to==='bin/pcdoctor-boost-helper.exe'))
 assert.ok(pkg.build.extraResources.some(x=>x.from==='native/build/game-events.exe'&&x.to==='bin/pcdoctor-game-events.exe'))
 assert.match(pkg.scripts['dist:win'],/build:helper/)
 const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8')
 assert.match(main,/process[.]resourcesPath/)
 assert.match(main,/pcdoctor-boost-helper[.]exe/)
 const wrapper=fs.readFileSync(path.join(__dirname,'../electron/windows-eco-qos.cjs'),'utf8')
 assert.doesNotMatch(wrapper,/powershell[.]exe|EncodedCommand|Add-Type/)
})

test('process inventory lists protected classes without exposing their executable paths',async()=>{
 const f=fixture()
 try{
  const snapshot=await f.service().inventory()
  assert.equal(snapshot.ok,true)
  assert.ok(snapshot.protectedCount>=2)
  assert.ok(snapshot.protectedSample.some(x=>/anti-cheat/i.test(x.reason)))
  assert.ok(snapshot.protectedSample.every(x=>!Object.hasOwn(x,'exe')))
 }finally{f.clean()}
})
test('revoking permission immediately restores current session changes',async()=>{
 const f=fixture()
 try{
  const s=f.service()
  assert.equal((await s.setRule(exe,'reduce')).ok,true)
  const result=await s.begin({file:'D:\\Games\\Example\\Game.exe',name:'Game'})
  assert.equal(result.modifiedCount,1)
  assert.equal((await s.status()).attemptedCount,1)
  assert.equal((await s.status()).modifiedCount,1)
  const revocation=await s.setRule(exe,'keep')
  assert.equal(revocation.ok,true,revocation.error)
  assert.equal((await s.status()).approvedCount,0)
  assert.equal((await s.status()).needsRecovery,false)
  assert.ok(f.calls.some(c=>c[0]==='restore'))
 }finally{f.clean()}
})
test('failed EcoQoS action is never shown as confirmed, but is preserved for recovery',async()=>{
 const f=fixture()
 try{
  const s=f.service()
  await s.setRule(exe,'reduce')
  f.adapter.apply=async record=>{f.calls.push(['apply-failed',record]);return {ok:false,error:'Rejected'}}
  const r=await s.begin({file:'D:\\Games\\Example\\Game.exe',name:'Game'})
  assert.equal(r.ok,true)
  assert.equal(r.modifiedCount,0)
  assert.equal(r.attemptedCount,1)
  assert.equal((await s.status()).modifiedCount,0)
  assert.equal(loadJournal(f.files.journalFile).actions[0].status,'uncertain')
  assert.equal((await s.restore()).ok,true)
 }finally{f.clean()}
})
test('native helper protects service and cross-session PIDs without process termination',()=>{
 const cpp=fs.readFileSync(path.join(__dirname,'../native/boost-helper/main.cpp'),'utf8')
 assert.match(cpp,/EnumServicesStatusExW/)
 assert.match(cpp,/ProcessIdToSessionId/)
 assert.match(cpp,/GetProcessTimes/)
 assert.match(cpp,/QueryFullProcessImageNameW/)
 assert.match(cpp,/SetProcessInformation/)
 assert.doesNotMatch(cpp,/TerminateProcess\s*\(|SuspendThread\s*\(|OpenSCManagerW\([^)]*,[^)]*,SC_MANAGER_ALL_ACCESS/)
})

test('manual request-close cannot be forged into process termination or service disabling',()=>{
 const {argsFor}=require('../electron/windows-eco-qos.cjs')
 assert.deepEqual(argsFor('request-close',{pid:700,exe,startTicks:'638664000000000000'}),
  ['request-close','700',exe,'638664000000000000'])
 assert.throws(()=>argsFor('request-close',{pid:0,exe,startTicks:'638664000000000000'}),/invalid/i)
 assert.throws(()=>argsFor('request-close',{pid:700,exe,startTicks:'bad'}),/creation time/i)
 const native=fs.readFileSync(path.join(__dirname,'../native/boost-helper/main.cpp'),'utf8')
 assert.match(native,/PostMessageW\(selected[.]hwnd,WM_CLOSE/)
 assert.match(native,/forbiddenServiceOrSession\(pid\)/)
 assert.doesNotMatch(native,/TerminateProcess\s*\(|SuspendThread\s*\(|PostMessageW\s*\([^,]+,\s*WM_QUIT/)
 const main=fs.readFileSync(path.join(__dirname,'../electron/main.cjs'),'utf8')
 assert.match(main,/doctor:v9-manual-close/)
 assert.match(main,/dialog[.]showMessageBox/)
 assert.match(main,/currentGame\(\)/)
 assert.match(main,/requestClose\(/)
})

const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const os=require('node:os')
const path=require('node:path')
const {createFixService,SETTING_PAGES,HIGH_PERFORMANCE,guid,getRegistryValue}=require('../electron/fixes.cjs')
const BALANCED='381b4222-f694-41f0-9685-ff5bb260df2e'

function fixture({charging=true,highAvailable=true}={}){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pc-doctor-fixes-'))
  const stateFile=path.join(root,'fixes.json')
  let power=BALANCED,gameMode=0
  const calls=[],opened=[]
  const exec=async (exe,args)=>{
    calls.push([exe,...args])
    if(exe==='powercfg.exe'){
      if(args[0]==='/getactivescheme')return 'Power Scheme GUID: '+power+' (Active)'
      if(args[0]==='/list')return 'Existing plans:\n'+BALANCED+' (Balanced)\n'+(highAvailable?HIGH_PERFORMANCE+' (High performance)':'')
      if(args[0]==='/setactive'){power=args[1];return ''}
    }
    if(exe==='reg.exe'){
      if(args[0]==='query')return 'AutoGameModeEnabled    REG_DWORD    0x'+gameMode.toString(16)
      if(args[0]==='add'){gameMode=Number(args[args.indexOf('/d')+1]);return ''}
      if(args[0]==='delete'){gameMode=null;return ''}
    }
    throw new Error('Unexpected command '+exe+' '+args.join(' '))
  }
  const create=()=>createFixService({
    platform:'win32',stateFile,exec,
    battery:async()=>({hasBattery:true,acConnected:charging,isCharging:charging}),
    openExternal:async target=>{opened.push(target)},
    openTaskManager:async()=>{opened.push('taskmgr')},
    openSystemProtection:async()=>{opened.push('systempropertiesprotection')}
  })
  return {
    create,root,stateFile,calls,opened,
    get power(){return power},
    set power(v){power=v},
    get gameMode(){return gameMode},
    set gameMode(v){gameMode=v},
    cleanup:()=>fs.rmSync(root,{recursive:true,force:true})
  }
}
test('Power plan identifier and documented registry reading are strictly parsed',()=>{
  assert.equal(guid('scheme: '+HIGH_PERFORMANCE),HIGH_PERFORMANCE)
  assert.equal(guid('garbage'),null)
  assert.equal(getRegistryValue('AutoGameModeEnabled REG_DWORD 0x1'),1)
  assert.equal(getRegistryValue('UnsupportedValue REG_DWORD 0x1'),null)
})
test('one-click power plan change is backed up and reversible after app restart',async()=>{
  const f=fixture(),service=f.create()
  try{
    const result=await service.perform('enablePerformance')
    assert.equal(result.ok,true)
    assert.equal(f.power,HIGH_PERFORMANCE)
    const status=await f.create().status()
    assert.equal(status.canRestore.performance,true)
    assert.equal((await f.create().perform('restorePerformance')).ok,true)
    assert.equal(f.power,BALANCED)
    assert.equal((await f.create().status()).canRestore.performance,false)
  } finally{f.cleanup()}
})
test('cannot alter laptop power plan while unplugged',async()=>{
  const f=fixture({charging:false})
  try{
    const result=await f.create().perform('enablePerformance')
    assert.equal(result.ok,false)
    assert.match(result.error,/AC power/)
    assert.equal(f.power,BALANCED)
    assert.equal(f.calls.some(x=>x[1]==='/setactive'),false)
  }finally{f.cleanup()}
})
test('unavailable high performance plan stays unchanged',async()=>{
  const f=fixture({highAvailable:false})
  try{
    const result=await f.create().perform('enablePerformance')
    assert.equal(result.ok,false)
    assert.equal(f.power,BALANCED)
  }finally{f.cleanup()}
})
test('Game Mode change records prior setting and restores',async()=>{
  const f=fixture()
  try{
    assert.equal((await f.create().perform('enableGameMode')).ok,true)
    assert.equal(f.gameMode,1)
    assert.equal((await f.create().status()).canRestore.gameMode,true)
    assert.equal((await f.create().perform('restoreGameMode')).ok,true)
    assert.equal(f.gameMode,0)
  }finally{f.cleanup()}
})
test('does not overwrite Windows changes made outside the app',async()=>{
  const f=fixture()
  try{
    await f.create().perform('enablePerformance')
    f.power=BALANCED
    const result=await f.create().perform('restorePerformance')
    assert.equal(result.ok,false)
    assert.equal(f.power,BALANCED)
  }finally{f.cleanup()}
})
test('renderer never supplies executable commands or arbitrary ms-settings destinations',async()=>{
  const f=fixture()
  try{
    const app=f.create()
    assert.equal((await app.perform('erase-my-files')).ok,false)
    assert.equal((await app.openPage('ms-settings:dangerous')).ok,false)
    assert.equal((await app.openPage('__proto__')).ok,false)
    assert.equal((await app.openPage('storage')).ok,true)
    assert.equal((await app.openPage('taskManager')).ok,true)
    assert.equal((await app.openPage('systemProtection')).ok,true)
    assert.equal((await app.openPage('networkStatus')).ok,true)
    assert.deepEqual(f.opened,['ms-settings:storagerecommendations','taskmgr','systempropertiesprotection','ms-settings:network-status'])
    assert.equal(Object.hasOwn(SETTING_PAGES,'storage'),true)
  }finally{f.cleanup()}
})
test('non-Windows renderer cannot alter system settings',async()=>{
  const f=fixture()
  try {
    const other=createFixService({platform:'linux',stateFile:f.stateFile})
    assert.equal((await other.perform('enableGameMode')).ok,false)
    assert.equal((await other.openPage('storage')).ok,false)
    assert.equal((await other.status()).supported,false)
  }finally{f.cleanup()}
})

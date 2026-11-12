// Explicitly scoped, reversible Windows adjustments. The renderer never supplies commands or paths.
const fs = require('node:fs')
const path = require('node:path')
const { execFile } = require('node:child_process')

const HIGH_PERFORMANCE = '8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'
const REGISTRY_KEY = 'HKCU\\Software\\Microsoft\\GameBar'
const SETTING_PAGES = Object.freeze({
  storage: 'ms-settings:storagerecommendations',
  storageSense: 'ms-settings:storagepolicies',
  startup: 'ms-settings:startupapps',
  installedApps: 'ms-settings:appsfeatures',
  gameMode: 'ms-settings:gaming-gamemode',
  graphics: 'ms-settings:display-advancedgraphics',
  power: 'ms-settings:powersleep',
  windowsUpdate: 'ms-settings:windowsupdate',
  taskManager: 'taskmgr',
  networkStatus: 'ms-settings:network-status',
  networkTroubleshoot: 'ms-settings:troubleshoot',
  systemProtection: 'systempropertiesprotection',
  recovery: 'ms-settings:recovery',
  gameCaptures: 'ms-settings:gaming-gamedvr',
  gameBar: 'ms-settings:gaming-gamebar',
  graphicsDefault: 'ms-settings:display-advancedgraphics-default',
  displayAdvanced: 'ms-settings:display-advanced',
  visualEffects: 'ms-settings:easeofaccess-visualeffects',
  notifications: 'ms-settings:notifications',
  wifi: 'ms-settings:network-wifi',
  ethernet: 'ms-settings:network-ethernet',
  energy: 'ms-settings:energyrecommendations'
})
const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const guid = text => (String(text).match(GUID) || [null])[0]?.toLowerCase() || null

function command(commandName, args) {
  return new Promise((resolve, reject) =>
    execFile(commandName, args, { windowsHide: true, timeout: 12000, maxBuffer: 128 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const e = new Error((String(stderr || stdout || err.message)).trim().slice(0, 500) || 'Windows command failed')
        e.code = err.code
        return reject(e)
      }
      resolve(String(stdout || ''))
    })
  )
}
function getRegistryValue(output) {
  const match = String(output).match(/AutoGameModeEnabled\s+REG_DWORD\s+0x([0-9a-f]+)/i)
  return match ? parseInt(match[1], 16) : null
}
function readStore(file) {
  try {
    const state = JSON.parse(fs.readFileSync(file, 'utf8'))
    return state && state.version === 1 ? state : {version:1}
  } catch { return {version:1} }
}
function saveStore(file, data) {
  const directory=path.dirname(file)
  fs.mkdirSync(directory,{recursive:true})
  const tmp = file+'.tmp'
  try {
    fs.writeFileSync(tmp,JSON.stringify(data,null,2),{encoding:'utf8',mode:0o600})
    fs.renameSync(tmp,file)
  } catch(error) {
    try { fs.unlinkSync(tmp) } catch {}
    throw error
  }
}

function createFixService({ stateFile, exec = command, battery = async () => ({hasBattery:false}), openExternal, openTaskManager, openSystemProtection, platform = process.platform }){
  if (!stateFile) throw new Error('Missing state file')
  let busy = false
  const run = (exe, args) => exec(exe, args)
  async function currentPower() {
    const value = guid(await run('powercfg.exe',['/getactivescheme']))
    if(!value) throw new Error('Windows did not report an active power plan.')
    return value
  }
  async function plans() {
    const output = await run('powercfg.exe',['/list'])
    return [...String(output).matchAll(new RegExp(GUID.source, 'gi'))].map(x=>x[0].toLowerCase())
  }
  async function gameMode() {
    try {
      const result=await run('reg.exe',['query',REGISTRY_KEY,'/v','AutoGameModeEnabled'])
      const value=getRegistryValue(result)
      if(value === null) throw new Error('Windows did not return the Game Mode setting.')
      return {available:true,value}
    } catch(error) {
      // Unset values are common; don't guess about access denied or other errors.
      if (error?.code === 1 && /unable to find|cannot find|not found/i.test(error.message)) return {available:true,value:null}
      return {available:false,value:null}
    }
  }
  async function status() {
    if(platform!=='win32')return {supported:false,reason:'Windows desktop features only'}
    const saved=readStore(stateFile)
    const result={supported:true,canRestore:{performance:!!saved.performance,gameMode:!!saved.gameMode}}
    try {result.activePower=await currentPower();result.highPerformanceAvailable=(await plans()).includes(HIGH_PERFORMANCE)}
    catch {result.activePower=null;result.highPerformanceAvailable=false}
    try {result.gameMode=await gameMode()}catch {result.gameMode={available:false,value:null}}
    return result
  }
  async function perform(action) {
    if(platform!=='win32')return {ok:false,error:'This action requires the installed Windows app.'}
    if(!['enableGameMode','restoreGameMode','enablePerformance','restorePerformance'].includes(action))
      return {ok:false,error:'Unknown fix action'}
    if(busy)return {ok:false,error:'Another fix is in progress.'}
    busy=true
    try {
      const saved=readStore(stateFile)
      if(action==='enableGameMode'){
        if(saved.gameMode)return {ok:false,error:'Game Mode was already changed by PC Doctor. Restore it first.'}
        const gm=await gameMode()
        if(!gm.available)return {ok:false,error:'Game Mode could not be read safely. Open Windows Game Mode settings instead.'}
        if(![null,0,1].includes(gm.value)) return {ok:false,error:'Windows reported an unexpected Game Mode value; use Settings instead.'}
        if(gm.value===1)return {ok:true,changed:false,message:'Windows Game Mode is already enabled.'}
        const backup={...saved,gameMode:{before:gm.value,applied:1}}
        saveStore(stateFile,backup) // Persist previous value before changing Windows.
        try {
          await run('reg.exe',['add',REGISTRY_KEY,'/v','AutoGameModeEnabled','/t','REG_DWORD','/d','1','/f'])
        } catch(err) {saveStore(stateFile,saved);throw err}
        return {ok:true,changed:true,message:'Windows Game Mode enabled. Your previous value is saved for restoration.'}
      }
      if(action==='restoreGameMode'){
        if(!saved.gameMode)return {ok:false,error:'No Game Mode change from this app is saved.'}
        const gm=await gameMode()
        if(!gm.available||gm.value!==saved.gameMode.applied)
          return {ok:false,error:'The Game Mode value changed outside this app. Open Windows settings rather than overwriting it.'}
        if(saved.gameMode.before===null){
          await run('reg.exe',['delete',REGISTRY_KEY,'/v','AutoGameModeEnabled','/f'])
        } else {
          await run('reg.exe',['add',REGISTRY_KEY,'/v','AutoGameModeEnabled','/t','REG_DWORD','/d',String(saved.gameMode.before),'/f'])
        }
        const next={...saved};delete next.gameMode;saveStore(stateFile,next)
        return {ok:true,changed:true,message:'Restored your previous Game Mode preference.'}
      }
      if(action==='enablePerformance'){
        if(saved.performance)return {ok:false,error:'A power-plan change is already saved. Restore it first.'}
        const info=await battery()
        if(info?.hasBattery && info?.acConnected!==true && info?.isCharging!==true)
          return {ok:false,error:'Connect this laptop to AC power first. High performance can increase heat and battery use.'}
        const available=await plans()
        if(!available.includes(HIGH_PERFORMANCE))
          return {ok:false,error:'This Windows device does not offer the standard High performance plan. Use Power settings instead.'}
        const before=await currentPower()
        if(before===HIGH_PERFORMANCE)return {ok:true,changed:false,message:'High performance plan is already active.'}
        saveStore(stateFile,{...saved,performance:{before,applied:HIGH_PERFORMANCE}})
        try {await run('powercfg.exe',['/setactive',HIGH_PERFORMANCE])}
        catch(err){saveStore(stateFile,saved);throw err}
        return {ok:true,changed:true,message:'High performance power plan activated. Restore the previous plan after gaming.'}
      }
      if(action==='restorePerformance'){
        if(!saved.performance)return {ok:false,error:'No saved power-plan change to restore.'}
        const actual=await currentPower()
        if(actual!==saved.performance.applied)
          return {ok:false,error:'The power plan changed outside this app. Open Windows power settings rather than overwriting it.'}
        await run('powercfg.exe',['/setactive',saved.performance.before])
        const next={...saved};delete next.performance;saveStore(stateFile,next)
        return {ok:true,changed:true,message:'Previous Windows power plan restored.'}
      }
    } catch(error) {
      return {ok:false,error:'Windows could not complete that action: '+String(error.message||error).slice(0,230)}
    } finally {busy=false}
  }
  async function openPage(id){
    if(platform!=='win32')return {ok:false,error:'Open settings is available in the Windows app.'}
    const target=Object.prototype.hasOwnProperty.call(SETTING_PAGES,id) ? SETTING_PAGES[id] : null
    if(!target)return {ok:false,error:'Unknown Windows settings shortcut'}
    try{
      if(target==='taskmgr'){
        await openTaskManager()
      } else if(target==='systempropertiesprotection') {
        await openSystemProtection()
      } else await openExternal(target)
      return {ok:true}
    }catch{return {ok:false,error:'Windows could not open this settings page.'}}
  }
  return {status,perform,openPage}
}
module.exports={createFixService,SETTING_PAGES,HIGH_PERFORMANCE,guid,getRegistryValue}

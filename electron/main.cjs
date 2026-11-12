const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const { secureDoctorWindow } = require('./security.cjs')
const path = require('path')
const { execFile, spawn } = require('child_process')
const { createFixService } = require('./fixes.cjs')
const { createLocalDoctor } = require('./local-llm.cjs')
const { createHardwareInspector } = require('./hardware.cjs')
const { runDiskCheck } = require('./disk-check.cjs')
const { createMaintenance } = require('./maintenance.cjs')
const {runNetworkQuality} = require('./network-quality.cjs')
const {createOptimizer} = require('./optimizer-v6.cjs')
const {createGameLibrary} = require('./game-library.cjs')
const {createNetworkPath} = require('./network-path.cjs')
const {createGameFocus} = require('./game-focus.cjs')
const {createTempCleaner} = require('./temp-cleaner.cjs')
const si = require('systeminformation')

// Windows taskbar identity should match the packaged product.
if (process.platform === 'win32') app.setAppUserModelId('com.dvilr.pclaptopdoctor')

function run(command, args = []) {
  return new Promise((resolve) => {
    execFile(command, args, { windowsHide: true, timeout: 8000 }, (error, stdout) => {
      if (error) return resolve(null)
      resolve(stdout)
    })
  })
}

async function getStartupApps() {
  if (process.platform !== 'win32') return []
  const script = "Get-CimInstance Win32_StartupCommand | Select-Object Name,Location | ConvertTo-Json -Compress"
  const stdout = await run('powershell.exe', ['-NoProfile', '-Command', script])
  if (!stdout) return []
  try {
    const parsed = JSON.parse(stdout.trim())
    return Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  } catch {
    return []
  }
}

async function getPing() {
  const args = process.platform === 'win32' ? ['-n', '2', '1.1.1.1'] : ['-c', '2', '1.1.1.1']
  const stdout = await run('ping', args)
  if (!stdout) return null
  const matches = [...stdout.matchAll(/time[=<]?(\d+(?:\.\d+)?)\s*ms/gi)]
  if (!matches.length) return null
  const values = matches.map((m) => Number(m[1])).filter(Number.isFinite)
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
}

async function collectDiagnostics() {
  const [
    cpu,
    load,
    mem,
    graphics,
    disks,
    battery,
    temp,
    time,
    os,
    networkIfaces,
    startupApps,
    ping
  ] = await Promise.all([
    si.cpu(),
    si.currentLoad(),
    si.mem(),
    si.graphics(),
    si.fsSize(),
    si.battery(),
    si.cpuTemperature(),
    si.time(),
    si.osInfo(),
    si.networkInterfaces(),
    getStartupApps(),
    getPing()
  ])

  const network = Array.isArray(networkIfaces)
    ? networkIfaces.find((n) => !n.internal && n.operstate === 'up') ||
      networkIfaces.find((n) => !n.internal) ||
      null
    : null

  let networkStats = null
  if (network?.iface) {
    try {
      const stats = await si.networkStats(network.iface)
      networkStats = Array.isArray(stats) ? stats[0] : stats
    } catch {
      networkStats = null
    }
  }

  return {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    os,
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      speed: cpu.speed,
      load: Math.round(load.currentLoad || 0)
    },
    memory: {
      total: mem.total,
      used: mem.used,
      available: mem.available,
      active: mem.active
    },
    graphics: (graphics.controllers || []).map((g) => ({
      model: g.model,
      vendor: g.vendor,
      vram: g.vram,
      utilizationGpu: g.utilizationGpu,
      temperatureGpu: g.temperatureGpu
    })),
    storage: (disks || []).map((d) => ({
      fs: d.fs,
      type: d.type,
      size: d.size,
      used: d.used,
      available: d.available,
      use: d.use,
      mount: d.mount
    })),
    battery: {
      hasBattery: battery.hasBattery,
      percent: battery.percent,
      isCharging: battery.isCharging,
      designedCapacity: battery.designedCapacity,
      maxCapacity: battery.maxCapacity,
      currentCapacity: battery.currentCapacity,
      cycleCount: battery.cycleCount,
      manufacturer: battery.manufacturer,
      model: battery.model
    },
    temperature: {
      main: temp.main,
      max: temp.max,
      cores: temp.cores || []
    },
    uptimeSeconds: time.uptime,
    startupApps,
    network: network
      ? {
          iface: network.iface,
          type: network.type,
          ip4: network.ip4,
          speed: network.speed,
          ping,
          rxSec: networkStats?.rx_sec || 0,
          txSec: networkStats?.tx_sec || 0
        }
      : { ping }
  }
}

ipcMain.handle('doctor:run-diagnostics', async event => {
  if (!trustedDoctorFrame(event)) return {ok:false,error:'Untrusted renderer'}
  try {
    const data = await collectDiagnostics()
    return { ok: true, data }
  } catch (error) {
    return { ok: false, error: error?.message || 'Diagnostics failed' }
  }
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#07111f',
    title: 'PC Laptop Doctor AI',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  secureDoctorWindow(win, shell)

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }
}

function trustedDoctorFrame(event) {
  const frame = event.senderFrame
  if (!frame || frame !== event.sender.mainFrame) return false
  const page = String(frame.url || '')
  if (app.isPackaged) {
    try {
      return new URL(page).protocol === 'file:' &&
        decodeURIComponent(new URL(page).pathname).toLowerCase().endsWith('/dist/index.html')
    } catch { return false }
  }
  return page === 'http://localhost:5173/' || page === 'http://localhost:5173/index.html'
}

function openSystemProtection() {
  return new Promise((resolve, reject) => {
    const child = spawn('SystemPropertiesProtection.exe', [], {detached:true, windowsHide:false, stdio:'ignore'})
    child.once('error',reject)
    child.once('spawn',()=>{child.unref();resolve()})
  })
}

function openTaskManager() {
  return new Promise((resolve, reject) => {
    const task = spawn('taskmgr.exe', [], { detached: true, windowsHide: false, stdio: 'ignore' })
    task.once('error', reject)
    task.once('spawn', () => { task.unref(); resolve() })
  })
}

app.whenReady().then(async () => {
  const fixes = createFixService({
    stateFile: path.join(app.getPath('userData'), 'safe-fix-backups.json'),
    battery: () => si.battery(),
    openExternal: target => shell.openExternal(target),
    openTaskManager,
    openSystemProtection
  })
  const gameFocus=createGameFocus({
    fixes,
    stateFile:path.join(app.getPath('userData'),'game-focus-session-v1.json'),
    readBattery:()=>si.battery()
  })
  const tempCleaner=createTempCleaner({
    trashItem:(target)=>shell.trashItem(target)
  })
  const localDoctor = createLocalDoctor()
  const inspector = createHardwareInspector({si})
  const maintenance = createMaintenance({
    platform: process.platform,
    getSession: () => session.defaultSession,
    logFile: path.join(app.getPath('userData'), 'maintenance-audit.json')
  })
  const optimizer=createOptimizer({stateFile:path.join(app.getPath('userData'),'optimization-v6-journal.json')})
  const gameLibrary=createGameLibrary()
  const networkPath=createNetworkPath({si})
  const guard = (event) => trustedDoctorFrame(event)
  ipcMain.handle('doctor:v7-boost-status', event=>guard(event)
    ? gameFocus.state() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-boost-preview', (event,profile)=>guard(event)
    ? gameFocus.preview(profile) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-boost-start', (event,profile,token)=>guard(event)
    ? gameFocus.start(profile,token) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-boost-stop', event=>guard(event)
    ? gameFocus.stop() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-temp-scan', event=>guard(event)
    ? tempCleaner.scan() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-temp-recycle', (event,token,ids)=>guard(event)
    ? tempCleaner.recycle(token,ids) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v7-launch-steam', async (event,appid)=>{
    if(!guard(event))return {ok:false,error:'Untrusted renderer'}
    if(typeof appid!=='string'||!/^\d{1,15}$/.test(appid))return {ok:false,error:'Invalid game ID'}
    const games=await gameLibrary.inspect()
    if(!games.ok||!games.games?.some(g=>g.appid===appid))return {ok:false,error:'Selected game is not in the detected Steam library.'}
    try{await shell.openExternal('steam://rungameid/'+appid);return {ok:true,message:'Passed the selected Steam game to its registered launcher. Windows/Steam may ask for confirmation.'}}
    catch{return {ok:false,error:'Steam did not accept the launch request. No game files were modified.'}}
  })
  ipcMain.handle('doctor:v6-catalog', event => guard(event) ? optimizer.listing():{ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v6-preview', (event,id,mode) => guard(event) ? optimizer.preview(id,mode):{ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v6-confirm', (event,id,mode,token) => guard(event) ? optimizer.perform(id,mode,token):{ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v6-games', event => guard(event) ? gameLibrary.inspect():{ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:v6-network-path', event => guard(event) ? networkPath.run():{ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:local-models', event => guard(event)
    ? localDoctor.models() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:local-question', (event, payload) => guard(event)
    ? localDoctor.ask(payload || {}) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:hardware-inventory', event => guard(event)
    ? inspector.getInventory() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:top-processes', event => guard(event)
    ? inspector.getProcesses() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:disk-check', event => guard(event)
    ? runDiskCheck() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:network-quality', event => guard(event)
    ? runNetworkQuality() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:maintenance-preview', (event, action) => guard(event)
    ? maintenance.preview(action) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:maintenance-apply', (event, action,token) => guard(event)
    ? maintenance.apply(action,token) : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:maintenance-history', event => guard(event)
    ? maintenance.history() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:maintenance-clear-log', event => guard(event)
    ? maintenance.clearLog() : {ok:false,error:'Untrusted renderer'})
  ipcMain.handle('doctor:fix-status', event => {
    if (!trustedDoctorFrame(event)) return { supported: false, reason: 'Untrusted renderer' }
    return fixes.status()
  })
  ipcMain.handle('doctor:apply-fix', (event, action) => {
    if (!trustedDoctorFrame(event)) return { ok: false, error: 'Untrusted renderer' }
    return fixes.perform(action)
  })
  ipcMain.handle('doctor:open-settings', (event, pageId) => {
    if (!trustedDoctorFrame(event)) return { ok: false, error: 'Untrusted renderer' }
    return fixes.openPage(pageId)
  })
  // A prior crash could leave app-managed Windows preferences in effect.
  // Never overwrite external changes: the existing fix service verifies state before restoring.
  try { await gameFocus.stop() } catch { /* Recovery remains visible in the app. */ }
  let quitting=false
  app.on('before-quit',event=>{
    if(quitting)return
    event.preventDefault()
    quitting=true
    Promise.resolve(gameFocus.stop()).catch(()=>{}).finally(()=>app.quit())
  })
  createWindow()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

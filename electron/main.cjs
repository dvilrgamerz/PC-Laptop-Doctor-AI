const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { execFile } = require('child_process')
const si = require('systeminformation')

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
  const script = "Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location | ConvertTo-Json -Compress"
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

ipcMain.handle('doctor:run-diagnostics', async () => {
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
    title: 'PC Doctor AI',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

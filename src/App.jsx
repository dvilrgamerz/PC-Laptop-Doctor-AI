import React, { useMemo, useState } from 'react'
import {
  Activity, Battery, Cpu, Gauge, HardDrive, Laptop, MemoryStick,
  Network, Play, RefreshCw, ShieldCheck, Thermometer, TriangleAlert, Zap
} from 'lucide-react'

const gb = (bytes) => bytes ? (bytes / 1024 / 1024 / 1024).toFixed(1) : '0.0'
const pct = (n) => Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0


const DEMO_DATA = {
  timestamp: new Date().toISOString(),
  platform: 'win32',
  os: { distro: 'Windows 11 Pro', release: '24H2' },
  cpu: {
    manufacturer: 'Intel',
    brand: 'Intel Core i7-12700H',
    cores: 20,
    physicalCores: 14,
    speed: 2.3,
    load: 82
  },
  memory: {
    total: 16 * 1024 ** 3,
    used: 13.7 * 1024 ** 3,
    available: 2.3 * 1024 ** 3,
    active: 12.9 * 1024 ** 3
  },
  graphics: [
    {
      model: 'NVIDIA GeForce RTX 3060 Laptop GPU',
      vendor: 'NVIDIA',
      vram: 6144,
      utilizationGpu: 34,
      temperatureGpu: 63
    }
  ],
  storage: [
    {
      fs: 'C:',
      type: 'NTFS',
      size: 476 * 1024 ** 3,
      used: 438 * 1024 ** 3,
      available: 38 * 1024 ** 3,
      use: 92,
      mount: 'C:'
    }
  ],
  battery: {
    hasBattery: true,
    percent: 67,
    isCharging: false,
    designedCapacity: 60000,
    maxCapacity: 43800,
    currentCapacity: 29346,
    cycleCount: 381,
    manufacturer: 'Demo Battery',
    model: 'PCD-V1'
  },
  temperature: {
    main: 84,
    max: 87,
    cores: []
  },
  uptimeSeconds: 9 * 86400 + 6 * 3600,
  startupApps: Array.from({ length: 18 }, (_, i) => ({ name: `Demo Startup App ${i + 1}` })),
  network: {
    iface: 'Wi-Fi',
    type: 'wireless',
    ip4: '192.168.1.24',
    speed: 866,
    ping: 42,
    rxSec: 4200000,
    txSec: 950000
  }
}

function analyze(data) {
  if (!data) return { score: 0, issues: [], status: 'Not scanned' }

  let score = 100
  const issues = []
  const ram = data.memory?.total ? (data.memory.used / data.memory.total) * 100 : 0
  const cpu = data.cpu?.load || 0
  const temp = Number(data.temperature?.main || data.temperature?.max || 0)
  const disks = data.storage || []
  const lowestFree = disks.length ? Math.min(...disks.map(d => 100 - Number(d.use || 0))) : 100
  const startup = data.startupApps?.length || 0
  const days = (data.uptimeSeconds || 0) / 86400
  const ping = data.network?.ping

  let batteryHealth = null
  if (data.battery?.designedCapacity > 0 && data.battery?.maxCapacity > 0) {
    batteryHealth = (data.battery.maxCapacity / data.battery.designedCapacity) * 100
  }

  if (ram >= 90) { score -= 20; issues.push({ level:'high', title:'Very high memory usage', detail:`${pct(ram)}% of RAM is currently in use. Close heavy apps or consider more RAM.` }) }
  else if (ram >= 80) { score -= 12; issues.push({ level:'medium', title:'High memory usage', detail:`${pct(ram)}% of RAM is currently in use.` }) }
  else if (ram >= 70) { score -= 6; issues.push({ level:'low', title:'Memory pressure detected', detail:`${pct(ram)}% of RAM is currently in use.` }) }

  if (cpu >= 90) { score -= 15; issues.push({ level:'high', title:'CPU is under very heavy load', detail:`CPU load is ${cpu}%. Check for a runaway process or heavy workload.` }) }
  else if (cpu >= 75) { score -= 8; issues.push({ level:'medium', title:'CPU usage is high', detail:`CPU load is ${cpu}% right now.` }) }

  if (temp >= 90) { score -= 20; issues.push({ level:'high', title:'CPU temperature is very high', detail:`${temp}°C can cause throttling. Check airflow, fans, and dust.` }) }
  else if (temp >= 80) { score -= 10; issues.push({ level:'medium', title:'CPU is running hot', detail:`CPU temperature is around ${temp}°C.` }) }

  if (lowestFree < 5) { score -= 20; issues.push({ level:'high', title:'Storage is critically low', detail:'At least one drive has less than 5% free space.' }) }
  else if (lowestFree < 10) { score -= 10; issues.push({ level:'medium', title:'Storage is almost full', detail:'At least one drive has less than 10% free space.' }) }
  else if (lowestFree < 20) { score -= 5; issues.push({ level:'low', title:'Storage is getting full', detail:'At least one drive has less than 20% free space.' }) }

  if (batteryHealth !== null && batteryHealth < 60) { score -= 15; issues.push({ level:'high', title:'Battery wear is significant', detail:`Estimated battery health is ${pct(batteryHealth)}% of design capacity.` }) }
  else if (batteryHealth !== null && batteryHealth < 80) { score -= 8; issues.push({ level:'medium', title:'Battery wear detected', detail:`Estimated battery health is ${pct(batteryHealth)}% of design capacity.` }) }

  if (startup > 20) { score -= 8; issues.push({ level:'medium', title:'Many startup apps', detail:`${startup} startup entries were detected. Disabling unneeded ones may improve boot time.` }) }
  else if (startup > 12) { score -= 4; issues.push({ level:'low', title:'Several startup apps', detail:`${startup} startup entries were detected.` }) }

  if (days > 7) { score -= 3; issues.push({ level:'low', title:'Long system uptime', detail:`This PC has been up for about ${Math.floor(days)} days. A restart may clear stuck processes and updates.` }) }

  if (ping !== null && ping !== undefined && ping > 150) { score -= 8; issues.push({ level:'medium', title:'High network latency', detail:`Internet latency measured about ${ping} ms.` }) }
  else if (ping !== null && ping !== undefined && ping > 80) { score -= 4; issues.push({ level:'low', title:'Network latency could be better', detail:`Internet latency measured about ${ping} ms.` }) }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const status = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 55 ? 'Needs attention' : 'Poor'
  return { score, issues, status, ram, batteryHealth }
}

function MetricCard({ icon: Icon, label, value, sub, warning }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${warning ? 'warn' : ''}`}><Icon size={20}/></div>
      <div>
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-sub">{sub}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Ready to scan')
  const [error, setError] = useState('')

  const analysis = useMemo(() => analyze(data), [data])
  const isDemoMode = !window.doctor?.runDiagnostics

  async function runScan() {
    setScanning(true)
    setError('')
    setProgress(8)
    const steps = [
      [18, 'Checking processor…'],
      [34, 'Analyzing memory…'],
      [49, 'Inspecting storage…'],
      [63, 'Checking battery and thermals…'],
      [77, 'Inspecting startup apps…'],
      [89, 'Testing network…']
    ]

    let i = 0
    const timer = setInterval(() => {
      if (i < steps.length) {
        setProgress(steps[i][0])
        setStep(steps[i][1])
        i += 1
      }
    }, 380)

    let result
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 2550))
      result = { ok: true, data: { ...DEMO_DATA, timestamp: new Date().toISOString() } }
    } else {
      result = await window.doctor.runDiagnostics()
    }

    clearInterval(timer)

    if (result?.ok) {
      setProgress(100)
      setStep(isDemoMode ? 'Demo diagnosis complete' : 'Diagnosis complete')
      setData(result.data)
    } else {
      setError(result?.error || 'Scan failed.')
      setStep('Scan failed')
    }
    setScanning(false)
  }

  const ram = data?.memory?.total ? (data.memory.used / data.memory.total) * 100 : 0
  const mainDisk = data?.storage?.[0]
  const gpu = data?.graphics?.[0]
  const batteryText = data?.battery?.hasBattery ? `${pct(data.battery.percent)}%` : 'Desktop'
  const temp = Number(data?.temperature?.main || data?.temperature?.max || 0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={23}/></div><div><strong>PC Doctor</strong><span>AI</span></div></div>
        <nav>
          <button className="nav-active"><Gauge size={18}/> Dashboard</button>
          <button><Cpu size={18}/> Performance</button>
          <button><HardDrive size={18}/> Storage</button>
          <button><Battery size={18}/> Battery</button>
          <button><Network size={18}/> Network</button>
        </nav>
        <div className="privacy"><ShieldCheck size={18}/><div><strong>Local-first</strong><span>Diagnostics stay on your PC.</span></div></div>
      </aside>

      <main>
        <header>
          <div><p className="eyebrow">SYSTEM DIAGNOSTICS {isDemoMode && <span className="demo-badge">LIVE WEB DEMO</span>}</p><h1>PC & Laptop Doctor AI</h1><p>{isDemoMode ? 'Interactive GitHub demo using sample diagnostics. Install the desktop app to scan your real PC.' : 'Find what is slowing down your Windows computer and understand what to fix first.'}</p></div>
          <button className="scan-btn" onClick={runScan} disabled={scanning}>{scanning ? <RefreshCw className="spin" size={18}/> : <Play size={18}/>} {scanning ? 'Scanning…' : data ? 'Scan Again' : 'Run Full Diagnosis'}</button>
        </header>

        {error && <div className="error-box"><TriangleAlert size={18}/>{error}</div>}

        <section className="hero-grid">
          <div className="health-card">
            <div>
              <p className="eyebrow">OVERALL HEALTH</p>
              <div className="score-row"><div className="score">{data ? analysis.score : '--'}</div><span>/100</span></div>
              <h2>{data ? analysis.status : 'Not scanned yet'}</h2>
              <p>{data ? (analysis.issues.length ? `${analysis.issues.length} item${analysis.issues.length === 1 ? '' : 's'} need attention.` : 'No major problems detected.') : 'Run a diagnosis to inspect this computer.'}</p>
            </div>
            <div className="ring" style={{'--score': data ? analysis.score : 0}}><Laptop size={34}/></div>
          </div>

          <div className="scan-card">
            <div className="scan-head"><div><p className="eyebrow">LIVE SCAN</p><h3>{step}</h3></div><span>{progress}%</span></div>
            <div className="progress"><div style={{width:`${progress}%`}}/></div>
            <div className="scan-items">
              <span className={progress >= 18 ? 'done' : ''}>CPU</span>
              <span className={progress >= 34 ? 'done' : ''}>RAM</span>
              <span className={progress >= 49 ? 'done' : ''}>SSD</span>
              <span className={progress >= 63 ? 'done' : ''}>Thermals</span>
              <span className={progress >= 77 ? 'done' : ''}>Startup</span>
              <span className={progress >= 89 ? 'done' : ''}>Network</span>
            </div>
          </div>
        </section>

        <section className="metrics">
          <MetricCard icon={Cpu} label="CPU" value={data ? `${data.cpu.load}%` : '--'} sub={data ? data.cpu.brand : 'Current load'} warning={data && data.cpu.load >= 80}/>
          <MetricCard icon={MemoryStick} label="RAM" value={data ? `${pct(ram)}%` : '--'} sub={data ? `${gb(data.memory.used)} / ${gb(data.memory.total)} GB` : 'Memory usage'} warning={data && ram >= 80}/>
          <MetricCard icon={HardDrive} label="Storage" value={data && mainDisk ? `${pct(mainDisk.use)}%` : '--'} sub={data && mainDisk ? `${gb(mainDisk.available)} GB free` : 'Primary drive'} warning={data && mainDisk && mainDisk.use >= 90}/>
          <MetricCard icon={Thermometer} label="CPU Temp" value={data && temp ? `${temp}°C` : 'N/A'} sub="Thermal reading" warning={data && temp >= 80}/>
          <MetricCard icon={Battery} label="Battery" value={data ? batteryText : '--'} sub={data?.battery?.isCharging ? 'Charging' : data?.battery?.hasBattery ? 'On battery' : 'No battery detected'}/>
          <MetricCard icon={Network} label="Ping" value={data?.network?.ping != null ? `${data.network.ping} ms` : 'N/A'} sub={data?.network?.iface || 'Network latency'} warning={data?.network?.ping > 100}/>
        </section>

        <section className="details-grid">
          <div className="panel">
            <div className="panel-title"><div><p className="eyebrow">DOCTOR REPORT</p><h2>{data ? `${analysis.issues.length} problem${analysis.issues.length === 1 ? '' : 's'} found` : 'Waiting for diagnosis'}</h2></div><Zap size={22}/></div>
            {!data && <div className="empty-state">Run a full diagnosis and PC Doctor will prioritize the issues that matter most.</div>}
            {data && analysis.issues.length === 0 && <div className="all-good"><ShieldCheck size={20}/> Your system looks healthy. No major warnings were detected.</div>}
            <div className="issue-list">
              {analysis.issues.map((issue, index) => (
                <div className="issue" key={index}>
                  <div className={`severity ${issue.level}`}>{index + 1}</div>
                  <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel specs">
            <p className="eyebrow">SYSTEM SNAPSHOT</p>
            <h2>Your machine</h2>
            <div className="spec-row"><span>OS</span><strong>{data ? `${data.os?.distro || data.os?.platform || 'Unknown'} ${data.os?.release || ''}` : '--'}</strong></div>
            <div className="spec-row"><span>Processor</span><strong>{data?.cpu?.brand || '--'}</strong></div>
            <div className="spec-row"><span>CPU cores</span><strong>{data ? `${data.cpu.cores} logical / ${data.cpu.physicalCores} physical` : '--'}</strong></div>
            <div className="spec-row"><span>Memory</span><strong>{data ? `${gb(data.memory.total)} GB` : '--'}</strong></div>
            <div className="spec-row"><span>Graphics</span><strong>{gpu?.model || '--'}</strong></div>
            <div className="spec-row"><span>Startup entries</span><strong>{data ? data.startupApps.length : '--'}</strong></div>
            <div className="spec-row"><span>Uptime</span><strong>{data ? `${Math.floor(data.uptimeSeconds / 86400)}d ${Math.floor((data.uptimeSeconds % 86400)/3600)}h` : '--'}</strong></div>
          </div>
        </section>

        <footer>PC Doctor AI V1 • {isDemoMode ? 'Web demo with sample data' : 'Windows-first • Read-only diagnostics'}</footer>
      </main>
    </div>
  )
}

import React, { useEffect, useMemo, useRef, useState } from 'react'
import DiagnosticView from './DiagnosticView.jsx'
import FixCenter from './FixCenter.jsx'
import OptimizationStudio from './OptimizationStudio.jsx'
import QuickControlCenter from './QuickControlCenter.jsx'
import LiveMonitorPanel from './LiveMonitorPanel.jsx'
import DailyMonsterPanel from './DailyMonsterPanel.jsx'
import RoadmapHub from './RoadmapHub.jsx'
import {appendHistory,isHistoryEnabled,makeHistoryEntry} from './history.mjs'
import { buildSummaryReport, compareScans } from './report.mjs'
import {
  Activity, Battery, Cpu, Gauge, HardDrive, Laptop, MemoryStick,
  Network, Play, RefreshCw, ShieldCheck, Thermometer, TriangleAlert, Zap, Download, ArrowUpRight, Clock3, Wrench, BookOpen, MonitorUp, History, SlidersHorizontal, Rocket
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
  const status = score >= 90 ? 'Few warnings' : score >= 75 ? 'Mostly stable' : score >= 55 ? 'Several warnings' : 'High diagnostic priority'
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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', Icon: Gauge },
  { id: 'boost', label: 'Boost & Play', Icon: Rocket },
  { id: 'performance', label: 'Performance', Icon: Cpu },
  { id: 'storage', label: 'Storage', Icon: HardDrive },
  { id: 'battery', label: 'Battery', Icon: Battery },
  { id: 'network', label: 'Network', Icon: Network },
  { id: 'fixes', label: 'Fix & Gaming', Icon: Wrench },
  { id: 'optimize', label: 'Advanced tuning', Icon: SlidersHorizontal },
  { id: 'assistant', label: 'Ask Doctor', Icon: BookOpen },
  { id: 'advisor', label: 'Upgrade Advisor', Icon: MonitorUp },
  { id: 'history', label: 'History & Bench', Icon: History },
]
const ESSENTIAL_IDS = new Set(['dashboard','boost','performance','storage','battery','network'])
const INSTALL_URL = 'https://github.com/dvilrgamerz/PC-Laptop-Doctor-AI/releases/tag/v8.0.0-beta.1'

export default function App() {
  const [activeTab, setActiveTab] = useState('boost')
  const didInitialScan=useRef(false)
  const [advancedOpen,setAdvancedOpen] = useState(false)
  useEffect(()=>{if(!ESSENTIAL_IDS.has(activeTab))setAdvancedOpen(true)},[activeTab])
  const [data, setData] = useState(null)
  const [previousData, setPreviousData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Ready to scan')
  const [error, setError] = useState('')

  const analysis = useMemo(() => analyze(data), [data])
  const previousAnalysis = useMemo(() => previousData ? analyze(previousData) : null, [previousData])
  const comparison = useMemo(() => previousAnalysis ? compareScans(analysis, previousAnalysis) : null, [analysis, previousAnalysis])
  const isDemoMode = !window.doctor?.runDiagnostics

  function downloadReport() {
    if (!data) return
    // Export a summary, not raw scans containing IP addresses or startup entries.
    const report = buildSummaryReport(data, analysis, {
      demo: isDemoMode,
      previous: previousAnalysis
    })
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pc-doctor-summary-' + new Date().toISOString().slice(0, 10) + '.json'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

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
    try {
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 2550))
        result = { ok: true, data: { ...DEMO_DATA, timestamp: new Date().toISOString() } }
      } else {
        result = await window.doctor.runDiagnostics()
      }
    } catch (error) {
      result = { ok: false, error: error?.message || 'Diagnosis failed' }
    } finally {
      clearInterval(timer)
    }

    if (result?.ok) {
      setProgress(100)
      setStep(isDemoMode ? 'Demo diagnosis complete' : 'Diagnosis complete')
      if (data) setPreviousData(data)
      setData(result.data)
      try {
        if (isHistoryEnabled(window.localStorage)) {
          appendHistory(window.localStorage, makeHistoryEntry(result.data, analyze(result.data), {demo:isDemoMode}))
        }
      } catch { /* Scans remain usable even if local history storage is blocked. */ }
    } else {
      setError(result?.error || 'Scan failed.')
      setStep('Scan failed')
    }
    setScanning(false)
  }

  useEffect(()=>{
    if(didInitialScan.current)return
    didInitialScan.current=true
    void runScan() // Read-only: open the main control center with actual PC evidence.
  },[])

  const ram = data?.memory?.total ? (data.memory.used / data.memory.total) * 100 : 0
  const mainDisk = data?.storage?.[0]
  const gpu = data?.graphics?.[0]
  const batteryText = data?.battery?.hasBattery ? `${pct(data.battery.percent)}%` : 'Desktop'
  const temp = Number(data?.temperature?.main || data?.temperature?.max || 0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={23}/></div><div><strong>PC Doctor</strong><span>AI</span></div></div>
        <p className="sidebar-section-label">SYSTEM WORKSPACE</p>
        <nav aria-label="Quick tools">
          {NAV_ITEMS.filter(item=>ESSENTIAL_IDS.has(item.id)).map(({id,label,Icon}) => (
            <button type="button" key={id} onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={activeTab === id ? 'nav-active' : ''}>
              <Icon size={18}/> {label}
            </button>
          ))}
        </nav>
        <button className="sidebar-advanced-toggle" type="button" aria-expanded={advancedOpen}
          onClick={()=>setAdvancedOpen(v=>!v)}><SlidersHorizontal size={16}/> Advanced tools <span>{advancedOpen?'−':'+'}</span></button>
        {advancedOpen&&<nav aria-label="Advanced diagnostic tools" className="sidebar-advanced">
          {NAV_ITEMS.filter(item=>!ESSENTIAL_IDS.has(item.id)).map(({id,label,Icon}) => (
            <button type="button" key={id} onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              className={activeTab === id ? 'nav-active' : ''}>
              <Icon size={18}/> {label}
            </button>
          ))}
        </nav>}
        <div className="sidebar-install">
          <p className="eyebrow">WINDOWS APP · V8.0</p>
          <strong>Private diagnostics without subscriptions</strong>
          <a href={INSTALL_URL} target="_blank" rel="noopener noreferrer">
            Get Windows installer <ArrowUpRight size={15}/>
          </a>
        </div>
        <div className="privacy"><ShieldCheck size={18}/><div><strong>Local-first</strong><span>Diagnostics stay on your PC.</span></div></div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">DVILR / SYSTEM WORKSPACE <span className="version-pill">V8.0</span> {isDemoMode && <span className="demo-badge">WEB PREVIEW · SAMPLE DATA</span>}</p>
            <h1>{activeTab === 'dashboard' ? 'PC & Laptop Doctor AI' : activeTab === 'fixes' ? 'Fix & Gaming Center' : ['assistant','advisor','history','optimize','boost'].includes(activeTab) ? NAV_ITEMS.find(item => item.id===activeTab)?.label : NAV_ITEMS.find(item => item.id === activeTab)?.label + ' diagnostics'}</h1>
            <p>{isDemoMode ? 'Explore an interactive sample or download the Windows installer for real hardware readings.' : 'Understand the current state of your computer. Read-only, local-first, and under your control.'}</p>
          </div>
          <div className="header-actions">
            {data && <button className="export-btn" onClick={downloadReport} disabled={scanning} title="Export a local summary without IP addresses or startup app names"><Download size={17}/> Export summary</button>}
            <button className="scan-btn" onClick={runScan} disabled={scanning}>{scanning ? <RefreshCw className="spin" size={18}/> : <Play size={18}/>} {scanning ? 'Scanning…' : data ? 'Scan Again' : 'Run Full Diagnosis'}</button>
          </div>
        </header>

        {error && <div className="error-box"><TriangleAlert size={18}/>{error}</div>}

        {!data && <section className="welcome-panel">
          <div>
            <p className="eyebrow">THREE SIMPLE STEPS</p>
            <h2>Understand your computer in minutes.</h2>
            <p>Run a read-only diagnosis. Review issues by category. Export a private summary.</p>
          </div>
          {isDemoMode && <a className="welcome-download" href={INSTALL_URL} target="_blank" rel="noopener noreferrer"><Download size={17}/> Download Windows .exe <ArrowUpRight size={15}/></a>}
        </section>}

        <div className="scan-notice">
          <span><ShieldCheck size={16}/> {isDemoMode ? 'Sample measurements — not your computer' : 'Local diagnostics — no automatic system changes'}</span>
          <span><Clock3 size={15}/> {data?.timestamp ? 'Snapshot: ' + new Date(data.timestamp).toLocaleString() : 'Not yet scanned'}</span>
        </div>

        {activeTab === 'dashboard' ? <>
        <DailyMonsterPanel demo={isDemoMode} data={data} onNavigate={setActiveTab}/>
        <LiveMonitorPanel demo={isDemoMode} data={data} onNavigate={setActiveTab}/>
        <details className="monster-technical"><summary>Technical report, detailed hardware specs and scan comparison</summary>
        <section className="hero-grid">
          <div className="health-card">
            <div>
              <p className="eyebrow">HEURISTIC DIAGNOSTIC SCORE</p>
              <div className="score-row"><div className="score">{data ? analysis.score : '--'}</div><span>/100</span></div>
              <h2>{data ? analysis.status : 'Not scanned yet'}</h2>
              <p>{data ? (analysis.issues.length ? `${analysis.issues.length} item${analysis.issues.length === 1 ? '' : 's'} flagged in this snapshot. High load may be expected while gaming.` : 'No threshold warnings in this snapshot.') : 'Run a diagnosis to inspect this computer.'}</p>
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

        {comparison && <section className="comparison-card" aria-live="polite">
          <div><p className="eyebrow">BEFORE / AFTER</p><strong>{comparison.delta > 0 ? '+' : ''}{comparison.delta} health-score points</strong><span> Compared with the previous scan in this session. A change in load alone does not prove a repair worked.</span></div>
          <div><strong>{comparison.resolved.length} warnings cleared</strong><span>{comparison.resolved.slice(0, 3).join(' · ') || 'None yet'}</span></div>
          <div><strong>{comparison.added.length} new warnings</strong><span>{comparison.added.slice(0, 3).join(' · ') || 'None'}</span></div>
        </section>}

        {data && <section className="repair-entry">
          <div><p className="eyebrow">YOUR NEXT STEP</p><h3>Fix the problems behind your score</h3>
          <p>Prioritized storage, memory and gaming adjustments—with guided Windows settings and reversible one-click changes.</p></div>
          <div className="repair-actions"><button type="button" onClick={() => setActiveTab('optimize')}><SlidersHorizontal size={17}/> Optimization Studio <ArrowUpRight size={16}/></button>
          <button type="button" onClick={() => setActiveTab('fixes')}><Wrench size={17}/> Fix & Gaming <ArrowUpRight size={16}/></button></div>
        </section>}
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
        </details>

        </> : activeTab === 'boost' ? <QuickControlCenter demo={isDemoMode} data={data} onNavigate={setActiveTab} onScan={runScan} scanning={scanning}/> : activeTab === 'fixes' ? <FixCenter data={data} demo={isDemoMode}/> : activeTab === 'optimize' ? <OptimizationStudio data={data} demo={isDemoMode} onNavigate={setActiveTab}/> : ['assistant','advisor','history'].includes(activeTab) ? <RoadmapHub section={activeTab} data={data} analysis={analysis} demo={isDemoMode}/> : <DiagnosticView tab={activeTab} data={data} analysis={analysis} demo={isDemoMode}/>}

        <footer>PC Doctor AI V8.0 · Daily Monster dashboard & offline advice, opt-in history & safe repair · {isDemoMode ? 'Sample data, not real hardware' : 'Read-only Windows diagnostics'} · <a href={INSTALL_URL} target="_blank" rel="noopener noreferrer">Windows downloads</a></footer>
      </main>
    </div>
  )
}

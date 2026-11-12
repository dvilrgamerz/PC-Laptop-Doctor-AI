import React from 'react'
import { Activity, Battery, Cpu, HardDrive, MemoryStick, Network, ShieldCheck, Thermometer, Info, Gauge, TriangleAlert } from 'lucide-react'

const valid = n => n !== undefined && n !== null && n !== '' && Number.isFinite(Number(n))
const pct = n => valid(n) ? Math.round(Number(n)) + '%' : 'Unavailable'
const gb = bytes => valid(bytes) ? (Number(bytes) / (1024 ** 3)).toFixed(1) + ' GB' : 'Unavailable'
const temp = c => valid(c) && Number(c) > 0 ? Math.round(Number(c)) + '°C' : 'Unavailable'
function Meter({ label, used, total, hint }) {
  const ratio = valid(used) && valid(total) && Number(total) > 0 ? Math.max(0,Math.min(100, Number(used)/Number(total)*100)) : null
  return <div className="detail-meter"><div className="detail-meter-heading"><span>{label}</span><b>{ratio === null ? 'Unavailable' : Math.round(ratio)+'%'}</b></div><div className="detail-track"><div style={{width:(ratio??0)+'%'}}/></div><small>{hint}</small></div>
}
function Stat({ icon: Icon, title, number, hint }) {
  return <div className="detail-stat"><Icon size={20}/><span>{title}</span><strong>{number}</strong><small>{hint}</small></div>
}
function Section({ label, title, children }) { return <section className="panel detail-panel"><p className="eyebrow">{label}</p><h2>{title}</h2>{children}</section> }
function Note({ children }) { return <div className="detail-note"><Info size={17}/><p>{children}</p></div> }
function Lines({ rows }) {return <div className="detail-lines">{rows.map(([name,value],i)=><div key={i}><span>{name}</span><strong>{value??'Unavailable'}</strong></div>)}</div>}
export default function DiagnosticView({tab,data,analysis,demo}) {
  if (!data) return <div className="panel detail-empty"><Activity size={32}/><h2>Start with a diagnosis</h2><p>Press Run Full Diagnosis above to {demo?'load the clearly labeled sample data':'inspect the current Windows machine'}.</p></div>
  const cpu=data.cpu||{}, memory=data.memory||{}, drives=Array.isArray(data.storage)?data.storage:[],
    gpus=Array.isArray(data.graphics)?data.graphics:[], battery=data.battery||{},net=data.network||{}
  const cpuTemp=valid(data.temperature?.main)&&Number(data.temperature.main)>0?data.temperature.main:data.temperature?.max
  const batteryHealth=valid(battery.maxCapacity)&&valid(battery.designedCapacity)&&battery.designedCapacity>0
    ?battery.maxCapacity/battery.designedCapacity*100:null
  const warnings=(analysis?.issues||[]).filter(issue=>{
    const title=issue.title.toLowerCase()
    return (tab==='performance' && /cpu|memory|temperature|uptime/.test(title)) ||
      (tab==='storage' && /storage/.test(title)) ||
      (tab==='battery' && /battery/.test(title)) ||
      (tab==='network' && /network/.test(title))
  })
  return <div className="diagnostic-pages">
    {demo && <p className="demo-warning"><TriangleAlert size={17}/> This page shows example measurements, not your computer's real hardware.</p>}
    {tab==='performance' && <>
      <div className="detail-stats"><Stat icon={Cpu} title="CPU load" number={pct(cpu.load)} hint="One point-in-time reading"/><Stat icon={MemoryStick} title="RAM utilization" number={memory.total>0?pct(memory.used/memory.total*100):'Unavailable'} hint={gb(memory.used)+' used'}/><Stat icon={Thermometer} title="CPU temperature" number={temp(cpuTemp)} hint="Depends on accessible sensors"/><Stat icon={Activity} title="GPU adapters" number={String(gpus.length)} hint="Reported by Windows"/></div>
      <Section label="PROCESSOR & RAM" title="Performance details">
        <Lines rows={[[ 'Processor',cpu.brand ],['Physical cores',cpu.physicalCores],['Logical processors',cpu.cores],['CPU reported speed',valid(cpu.speed)?cpu.speed+' GHz':null],['Installed RAM',gb(memory.total)],['Available RAM',gb(memory.available)]]}/>
        <Meter label="Physical memory in use" used={memory.used} total={memory.total} hint="A busy program can temporarily use most RAM without a hardware fault."/>
        <Note>High CPU temperature is workload- and device-dependent. A single sample is not proof of thermal throttling.</Note>
      </Section>
      <Section label="GRAPHICS" title="Detected graphics hardware">
        {gpus.length?gpus.map((g,i)=><div className="drive-item" key={i}><h3>{g.model||'Unknown graphics adapter'}</h3><p>{g.vendor||'Unknown vendor'} · {valid(g.vram)?g.vram+' MB reported VRAM':'VRAM unavailable'} · {temp(g.temperatureGpu)}</p></div>):<p>Windows did not report graphics adapters.</p>}
      </Section>
    </>}
    {tab==='storage' && <>
      <div className="detail-stats"><Stat icon={HardDrive} title="Volumes" number={String(drives.length)} hint="Detected Windows volumes"/><Stat icon={ShieldCheck} title="Safety mode" number="Read-only" hint="No files are modified"/></div>
      <Section label="STORAGE" title="Capacity and free space">
        {drives.length?drives.map((d,i)=><div className="drive-item" key={i}><h3>{d.mount||d.fs||'Volume '+(i+1)}</h3><p>{d.type||'Unknown file system'} · {gb(d.available)} free of {gb(d.size)}</p><Meter label="Used capacity" used={d.used} total={d.size} hint="Low available space may affect application updates and temporary files."/></div>):<p>Storage data was not available.</p>}
        <Note>Cleanup is not automated. Check files manually with Windows Storage Settings before deleting anything.</Note>
      </Section>
    </>}
    {tab==='battery' && <>
      <div className="detail-stats"><Stat icon={Battery} title="Charge" number={battery.hasBattery?pct(battery.percent):'No battery'} hint={battery.isCharging?'Charging':'Not charging'}/><Stat icon={Gauge} title="Estimated battery health" number={batteryHealth===null?'Unavailable':pct(batteryHealth)} hint="Firmware capacity estimate"/></div>
      <Section label="BATTERY" title="Power diagnostics">
        {battery.hasBattery?<><Lines rows={[[ 'Manufacturer',battery.manufacturer],['Battery model',battery.model],['Cycle count',battery.cycleCount],['Design capacity',battery.designedCapacity],['Max charge capacity',battery.maxCapacity]]}/><Meter label="Full charge compared with design" used={battery.maxCapacity} total={battery.designedCapacity} hint="The available device firmware numbers determine this estimate."/></>:<p>No battery detected. Desktop PCs will normally show this state.</p>}
        <Note>Capacity health depends on firmware units and reporting. Unknown information is labeled unavailable rather than guessed.</Note>
      </Section>
    </>}
    {tab==='network' && <>
      <div className="detail-stats"><Stat icon={Network} title="Ping target" number="1.1.1.1" hint="ICMP echo"/><Stat icon={Activity} title="Average response" number={valid(net.ping)?Math.round(net.ping)+' ms':'Unavailable'} hint="Two requests per scan"/></div>
      <Section label="NETWORK" title="Adapter details">
        <Lines rows={[[ 'Adapter',net.iface],['Connection type',net.type],['Link speed',valid(net.speed)?net.speed+' Mbps':null],['Receive traffic',valid(net.rxSec)?(net.rxSec*8/1e6).toFixed(2)+' Mbps':null],['Send traffic',valid(net.txSec)?(net.txSec*8/1e6).toFixed(2)+' Mbps':null]]}/>
        <Note>Link speed does not equal internet download speed. Firewalls sometimes block ICMP ping while normal websites still work.</Note>
      </Section>
    </>}
    <Section label="DOCTOR FINDINGS" title="Relevant recommendations">
      {warnings.length?warnings.map((issue,i)=><div className="issue" key={i}><div className={'severity '+issue.level}>{i+1}</div><div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>):<div className="all-good"><ShieldCheck size={20}/> No threshold-based warnings in this category for the latest scan.</div>}
      <Note>This app currently uses explicit rules and thresholds, not a trained AI model. The 0–100 number is a heuristic, not proof of hardware health.</Note>
    </Section>
  </div>
}

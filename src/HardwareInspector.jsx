import React,{useState} from 'react'
import {Cpu,HardDrive,Info,MemoryStick,RefreshCcw} from 'lucide-react'

export default function HardwareInspector({demo}){
  const [inventory,setInventory]=useState(null)
  const [top,setTop]=useState(null)
  const [busy,setBusy]=useState('')
  const [note,setNote]=useState('')
  const supported=!demo&&!!window.doctor?.getHardwareInventory
  async function readHardware(){
    if(!supported)return
    setBusy('hardware')
    try{
      const result=await window.doctor.getHardwareInventory()
      if(result?.ok){setInventory(result.inventory);setNote('Detected hardware identifiers only. Serial numbers, UUIDs and asset tags are excluded.')}
      else setNote(result?.error||'Could not read inventory')
    }catch{setNote('The hardware inventory is unavailable.')}
    finally{setBusy('')}
  }
  async function readProcesses(){
    if(!supported)return
    setBusy('process')
    try{
      const result=await window.doctor.getTopProcesses()
      if(result?.ok){setTop(result.processes||[]);setNote('Process names are displayed locally only. PC Doctor does not end running applications.')}
      else setNote(result.error||'Process list unavailable')
    }catch{setNote('Could not inspect processes.')}
    finally{setBusy('')}
  }
  const machine=inventory?.machine||{}
  const modules=inventory?.ramModules||[],disks=inventory?.physicalDrives||[]
  const empty=x=>x===null||x===undefined||x===''?'Not reported':x
  return <section className="panel pro-panel">
    <div className="pro-title"><Cpu size={21}/><div><p className="eyebrow">DEVICE HARDWARE</p><h2>Hardware identification & upgrade research</h2></div></div>
    <p>Inspect system model, motherboard, detected memory modules, and physical drives. **Installed modules do not prove how many slots are available**, and this report cannot certify upgrade compatibility.</p>
    {demo?<p className="pro-alert">Detailed inventory is available only from the Windows app, not the sample web demo.</p>:<>
      <div className="pro-actions">
        <button type="button" disabled={!!busy} onClick={readHardware}><RefreshCcw size={16}/> Inspect hardware</button>
        <button type="button" disabled={!!busy} onClick={readProcesses}><MemoryStick size={16}/> Show top memory processes</button>
      </div>
      {inventory&&<>
        <div className="pro-summary-grid">
          <div><span>PC manufacturer</span><strong>{empty(machine.manufacturer)}</strong></div>
          <div><span>Model</span><strong>{empty(machine.model)}</strong></div>
          <div><span>Motherboard</span><strong>{empty(machine.boardModel)}</strong></div>
          <div><span>BIOS</span><strong>{empty(machine.biosVersion)}</strong></div>
        </div>
        <h3>Detected memory modules ({modules.length})</h3>
        {modules.length?<div className="pro-mini-list">{modules.map((m,i)=><div key={i}>
          <MemoryStick size={17}/><span><strong>{m.capacityGiB??'Unknown'} GiB {empty(m.type)}</strong><small>{empty(m.bank)} · {m.speedMhz?m.speedMhz+' MHz':'Clock unknown'} · {empty(m.formFactor)}</small></span>
        </div>)}</div>:<p>No individual memory module details were reported.</p>}
        <h3>Reported physical storage ({disks.length})</h3>
        {disks.length?<div className="pro-mini-list">{disks.map((d,i)=><div key={i}>
          <HardDrive size={17}/><span><strong>{empty(d.name)}</strong><small>{d.capacityGiB??'Unknown'} GiB · {empty(d.interfaceType)} · {empty(d.type)}</small></span>
        </div>)}</div>:<p>No physical storage inventory was reported.</p>}
        <p className="pro-note"><Info size={16}/> {inventory.certainty} Verify your exact model in the manufacturer’s service manual before purchasing RAM or SSDs. Serial numbers are intentionally not shown.</p>
      </>}
      {top&&<><h3>Memory-heavy processes in this snapshot</h3>
        <div className="pro-processes">{top.length?top.map((p,i)=><div key={i}><strong>{p.name}</strong><span>{p.memoryMiB===null?'Memory unknown':p.memoryMiB+' MiB'} · CPU {p.cpuPercent??'—'}%</span></div>):<p>No process data available.</p>}</div>
        <p className="pro-note">Displayed process names may be sensitive. They are not saved to exported reports. You choose what to close in Task Manager.</p>
      </>}
    </>}
    {note&&<p className="pro-status" role="status">{note}</p>}
  </section>
}

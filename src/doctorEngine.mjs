// Deterministic, local, explainable troubleshooting. No remote model or inference claims.
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value : null
const gb = bytes => numeric(bytes) === null ? null : bytes / (1024 ** 3)
const memPercent = scan => {
  const total=numeric(scan?.memory?.total),used=numeric(scan?.memory?.used)
  return total>0 && used!==null ? 100*used/total : null
}
const storage = scan => {
  const disks=Array.isArray(scan?.storage)?scan.storage:[]
  return disks.filter(x=>numeric(x?.size)>0).sort((a,b)=>(b.use||0)-(a.use||0))[0]||null
}
export function hardwareAdvice(scan, workload='general') {
  if (!scan) return [{priority:'info',title:'Scan required',reason:'No hardware snapshot is available.',action:'Run Full Diagnosis before buying anything.',caution:'Compatibility and prices have not been checked.'}]
  const results=[]
  const ramGb=gb(scan.memory?.total),ramUse=memPercent(scan),drive=storage(scan)
  if (drive && (drive.use>=90 || gb(drive.available)<20)) {
    results.push({
      priority:'high',title:'Solve the storage shortage first',
      reason:'The fullest volume reports '+Math.round(drive.use)+'% usage'+(gb(drive.available)!==null?' and '+gb(drive.available).toFixed(1)+' GiB available.':'.'),
      action:'Review Windows Storage recommendations and uninstall unused software. If space remains insufficient, investigate a larger SSD.',
      caution:'SSD format, interface, drive bays and upgrade access cannot be confirmed from this scan.'
    })
  }
  if (ramGb!==null && (ramGb<12 || ramUse>=85)){
    results.push({
      priority:ramUse>=85?'high':'medium',title:'Consider memory capacity after checking upgradeability',
      reason:ramGb.toFixed(1)+' GiB installed'+(ramUse!==null?'; '+Math.round(ramUse)+'% used in this snapshot.':'.'),
      action:ramGb<12?'For heavy multitasking or games, 16 GB can be a useful target if the device supports it.':'If the same workload persistently exhausts memory, check whether 32 GB is supported.',
      caution:'Some laptops have soldered RAM or strict firmware limits. Verify the exact model and manufacturer service manual before buying.'
    })
  }
  if ((workload==='gaming'||workload==='creation') && !results.some(x=>x.title.includes('memory')) && ramGb!==null && ramGb>=16){
    results.push({priority:'info',title:'Avoid unnecessary RAM purchases',reason:'The scan reports '+ramGb.toFixed(1)+' GiB installed.',action:'Measure sustained memory use while running the actual workload before considering more.',caution:'More RAM does not automatically increase FPS or solve a CPU/GPU bottleneck.'})
  }
  const graphics=Array.isArray(scan.graphics)?scan.graphics:[]
  const integrated=graphics.length>0 && graphics.every(g=>/intel (uhd|iris|hd)|radeon graphics/i.test(String(g.model||'')))
  if(workload==='gaming' && integrated){
    results.push({priority:'medium',title:'Integrated graphics may constrain 3D gaming',reason:'The detected adapters appear to use integrated graphics.',action:'Try lower in-game settings, reduced resolution and an FPS cap; benchmark in the game itself.',caution:'Most laptop GPUs cannot be replaced. External GPU support requires compatible hardware.'})
  } else if(workload==='gaming'){
    results.push({priority:'info',title:'Measure the gaming bottleneck',reason:'The hardware scan alone does not establish GPU saturation or FPS.',action:'Use a game benchmark or frame-time overlay to compare before and after changes.',caution:'Do not claim gains without identical settings and test conditions.'})
  }
  if (scan?.battery?.hasBattery && numeric(scan.battery.designedCapacity)>0 && numeric(scan.battery.maxCapacity)>0){
    const health=100*scan.battery.maxCapacity/scan.battery.designedCapacity
    if(health<75) results.push({priority:'medium',title:'Battery capacity has declined',reason:'Estimated remaining full-charge capacity is '+Math.round(health)+'% of design.',action:'Check official manufacturer diagnostics and replacement options.',caution:'Capacity measurements depend on device firmware; an unknown reading is not a failure.'})
  }
  if(results.length===0)results.push({priority:'info',title:'No clear hardware purchase indicated',reason:'This snapshot does not show a capacity constraint that justifies an upgrade.',action:'Measure real workload performance before spending.',caution:'Thermal throttling, device-specific compatibility and hardware wear cannot be ruled out.'})
  return results
}
export function answerDoctor(question, scan, workload='general') {
  const q=String(question||'').toLowerCase().trim().slice(0,400)
  if(!q)return {title:'Ask a troubleshooting question',explanation:'Enter a question about your PC or select a suggestion.',steps:[],limits:'No question supplied.'}
  if(!scan)return {title:'Scan your PC first',explanation:'A current diagnostic snapshot is needed for personalized troubleshooting.',steps:['Click Run Full Diagnosis.','Ask the question again after the scan.'],limits:'The offline assistant cannot see your system until the app collects diagnostics.'}
  const ram=memPercent(scan),drive=storage(scan),cpu=numeric(scan.cpu?.load)
  const temp=numeric(scan.temperature?.main)>0?scan.temperature.main:numeric(scan.temperature?.max)>0?scan.temperature.max:null
  const ramGb=gb(scan.memory?.total)
  const reasonStorage=drive && drive.use>=90
  const reasonRam=ram!==null && ram>=85
  const reasons=[]
  const steps=[]
  let title='Check the diagnostic evidence',explanation='This question is not recognized precisely. The suggestions below cover the available hardware snapshot.'
  const upgrade=/upgrade|new ram|new ssd|new drive|hardware upgrade|replace|buy/.test(q)
  const storageQuery=/space|disk|ssd|storage|drive|full/.test(q)
  const memQuery=/memory|ram|freeze|lag|slow|stutter|multitask/.test(q)
  const gaming=/game|fps|gaming|frame|valorant|fortnite|roblox/.test(q)
  const network=/wifi|wi-fi|internet|ping|network|latency/.test(q)
  const battery=/battery|charge|power drain/.test(q)
  const thermal=/heat|hot|fan|temperature|thermal|overheat/.test(q)
  const startup=/boot|startup|launch|turn on/.test(q)
  if(upgrade){
    const suggestions=hardwareAdvice(scan,workload)
    title='What to upgrade first'
    explanation='Hardware changes should follow observed constraints, not a generic product list.'
    for(const item of suggestions.slice(0,3)){reasons.push(item.reason);steps.push(item.action+' '+item.caution)}
  } else if(storageQuery){
    title='Storage space troubleshooting'
    explanation=reasonStorage?'The fullest reported drive is '+Math.round(drive.use)+'% occupied, which warrants attention.':'The current storage snapshot alone does not establish a shortage.'
    steps.push('Open Fix & Gaming → Storage recommendations and review large apps and temporary files.','Review each item before deleting; do not erase unknown system folders.','Aim for adequate free space for Windows updates and the games you use, then re-scan.')
  } else if(network){
    title='Network troubleshooting'
    explanation='A short ping test checks one destination; it cannot establish Wi-Fi radio quality or your internet speed.'
    if(numeric(scan.network?.ping)!==null)reasons.push('Last sampled ICMP ping: '+scan.network.ping+' ms to 1.1.1.1.')
    steps.push('Open Network status and Windows troubleshooters from Fix & Gaming.','Compare both Ethernet and Wi-Fi under the same conditions if available.','Run a longer latency and packet-loss test; avoid assuming an adapter setting fixes an ISP issue.')
  } else if(battery){
    title='Battery and power troubleshooting'
    explanation=scan.battery?.hasBattery?'Last reported charge: '+Math.round(scan.battery.percent||0)+'%.':'No battery was reported in the snapshot.'
    steps.push('Open Windows Power settings and review energy use.','For gaming, plug the laptop into the supplied power adapter when appropriate.','If battery capacity is declining, validate with the manufacturer before ordering a replacement.')
  } else if(thermal){
    title='Temperature and cooling troubleshooting'
    explanation=temp===null?'Windows did not expose a usable CPU temperature sensor.': 'The last available CPU temperature is '+Math.round(temp)+'°C.'
    steps.push('Check airflow and keep vents unblocked.','Compare temperatures at idle and during a typical workload with a trusted hardware monitor.','Do not automatically overclock, disable thermal controls, or assume sensor absence means no overheating.')
  } else if(gaming){
    title='Gaming performance troubleshooting'
    explanation='FPS depends on the game, graphics settings, CPU, GPU, memory, temperatures and storage.'
    if(reasonStorage)reasons.push('Storage reports '+Math.round(drive.use)+'% used.')
    if(reasonRam)reasons.push('RAM utilization was '+Math.round(ram)+'% in the latest scan.')
    steps.push('Resolve severe storage or memory pressure before experimenting with Game Mode.','Close unnecessary applications manually after saving work.','Run the same game scene, resolution and graphics preset before and after changes; compare FPS and frame times.')
  } else if(startup){
    title='Slow startup troubleshooting'
    explanation='Startup entries count can indicate background software, but does not measure boot time.'
    reasons.push('The last scan found '+(Array.isArray(scan.startupApps)?scan.startupApps.length:0)+' startup entries.')
    steps.push('Open Startup Apps in Fix & Gaming and review impact labels.','Disable only applications you recognize and do not need at sign-in.','Restart and measure the actual startup time; do not disable Windows security or driver services.')
  } else if(memQuery){
    title='Slowness, freezing and memory pressure'
    explanation=reasonRam?'The latest scan reports '+Math.round(ram)+'% RAM usage, so memory pressure is a plausible contributor.':'A single scan cannot prove whether memory is limiting your system.'
    if(ramGb!==null)reasons.push('Installed RAM: '+ramGb.toFixed(1)+' GiB.')
    if(cpu!==null)reasons.push('CPU load at scan: '+Math.round(cpu)+'%.')
    steps.push('Open Task Manager to identify which applications are using memory and CPU.','Save work, then close unnecessary apps or browser tabs.','Repeat the scan during the same workload; if utilization remains high, check upgradeability.')
  } else {
    if(reasonStorage)reasons.push('A drive is over 90% full.')
    if(reasonRam)reasons.push('RAM utilization exceeded 85%.')
    if(cpu!==null && cpu>=90)reasons.push('CPU was heavily loaded at scan time.')
    steps.push('Review your Doctor Report for warnings.','Ask about storage, RAM, gaming FPS, Wi-Fi, battery or overheating for a focused troubleshooting guide.')
  }
  return {title,explanation,reasons,steps,limits:'Offline rule-based guidance; not a generative language model or verified repair. Hardware readings are snapshots, not proof of a cause.'}
}

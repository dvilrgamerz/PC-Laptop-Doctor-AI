// Reviewed Windows Settings catalog. GUIDED means it opens a supported Windows UI,
// never that the action was applied or measured. All changes require user choice.
// Sources: https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings
// and https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows
export const OPTIMIZATIONS = Object.freeze([
  {
    id:'storageCleanup',category:'Storage',title:'Review cleanup recommendations',
    summary:'See temporary files, large apps and suggestions from Windows Storage.',
    detail:'Use Windows’ own storage categories. The app does not delete any user file.',
    action:'storage',kind:'guided',risk:'Low',undo:'Windows controls what is removed. Deleted files may not be recoverable; review each checkbox.',
    evidence:'Microsoft recommends managing low disk space to support updates and normal application operation.',
    source:'https://support.microsoft.com/en-us/windows/experience/storage-filemanagement/storage-settings-in-windows',
    keywords:'disk full SSD storage free cleanup temporary'
  },
  {
    id:'storageSense',category:'Storage',title:'Configure Storage Sense',
    summary:'Choose how Windows automatically handles eligible temporary files.',
    detail:'Open Storage Sense to review policy before Windows deletes anything.',
    action:'storageSense',kind:'guided',risk:'Moderate',undo:'Turn off the Windows Storage Sense policy; already deleted files are not restored.',
    evidence:'Windows provides a user-controlled cleanup facility; no universal FPS benefit established.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'storage sense cleanup full disk temporary'
  },
  {
    id:'uninstallApps',category:'Storage',title:'Review installed applications',
    summary:'Find unused software consuming SSD storage.',
    detail:'Windows will ask before uninstalling. Do not remove unknown drivers or system software.',
    action:'installedApps',kind:'guided',risk:'Moderate',undo:'An uninstalled app may need reinstallation, and its data may be lost.',
    evidence:'Microsoft lists unused software removal as a way to free space.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'uninstall installed unused applications disk'
  },
  {
    id:'startupApps',category:'Windows',title:'Reduce unnecessary startup load',
    summary:'Inspect apps that launch with Windows; change only those you recognize.',
    detail:'Disable unneeded non-essential startup apps yourself. Leave antivirus, drivers and accessibility components alone.',
    action:'startup',kind:'guided',risk:'Low',undo:'Re-enable the same startup entries in Windows Settings.',
    evidence:'Microsoft documents that startup applications affect boot and background resource use.',
    source:'https://support.microsoft.com/en-us/windows/experience/startup-boot/configure-startup-applications-in-windows',
    keywords:'startup boot auto launch background processes'
  },
  {
    id:'taskManager',category:'Windows',title:'Inspect memory and CPU consumers',
    summary:'See which applications currently use resources.',
    detail:'Task Manager lets you identify high-load apps. Save work before closing anything.',
    action:'taskManager',kind:'guided',risk:'Low',undo:'Inspection makes no change. Closing an app can discard unsaved work.',
    evidence:'A process snapshot helps identify plausible causes, but not necessarily a hardware fault.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'RAM CPU process memory usage task manager'
  },
  {
    id:'windowsUpdates',category:'Windows',title:'Check Windows and driver updates',
    summary:'Review official Windows Update and optional supported driver updates.',
    detail:'Updates can contain security, stability and compatibility fixes. Review before installing.',
    action:'windowsUpdate',kind:'guided',risk:'Moderate',undo:'Windows manages rollback for eligible updates; some updates are not easy to reverse.',
    evidence:'Microsoft recommends installing applicable Windows updates as a standard troubleshooting step.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'windows update drivers security software'
  },
  {
    id:'notifications',category:'Windows',title:'Reduce distracting notifications',
    summary:'Customize application notifications and interruptions.',
    detail:'Review Windows Notification settings; this is a focus/usability adjustment, not a measured FPS boost.',
    action:'notifications',kind:'guided',risk:'Low',undo:'Re-enable the preferred notification settings.',
    evidence:'Microsoft lists turning off unneeded notifications as a performance and distraction-management option.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'notifications focus alerts distraction'
  },
  {
    id:'visualEffects',category:'Windows',title:'Review Windows visual effects',
    summary:'Adjust animations and transparency if desktop responsiveness matters.',
    detail:'Use the Windows Accessibility > Visual effects page. Disabling effects can alter appearance.',
    action:'visualEffects',kind:'guided',risk:'Low',undo:'Return to Visual effects and restore your previous preferences.',
    evidence:'Visual-effect choices can change Windows responsiveness, not necessarily game FPS.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'visual effects animations transparency desktop'
  },
  {
    id:'gameMode',category:'Gaming',title:'Review Windows Game Mode',
    summary:'Check whether Windows Game Mode is configured for your gaming preferences.',
    detail:'This opens the official Windows setting. An optional reversible app-managed switch is separately available in Fix & Gaming.',
    action:'gameMode',kind:'guided',risk:'Low',undo:'Return to Game Mode settings.',
    evidence:'Game Mode is a supported Windows preference; results depend on workload.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'gaming game mode FPS'
  },
  {
    id:'enableGameMode',category:'Gaming',title:'Enable Game Mode with restore option',
    summary:'Optional app-managed Windows Game Mode setting with the previous value saved.',
    detail:'Use the existing Fix & Gaming confirmation panel. No silent registry changes.',
    action:'fixes',kind:'confirmed',risk:'Low',undo:'Fix & Gaming → Restore original Game Mode setting.',
    evidence:'Windows Game Mode is documented, but no FPS increase is guaranteed.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'one click gaming FPS game mode rollback'
  },
  {
    id:'gameCaptures',category:'Gaming',title:'Review background game recording',
    summary:'Inspect Windows game-capture settings and decide which recording features to use.',
    detail:'Background capture may compete for resources on some machines; leave enabled if you rely on highlights.',
    action:'gameCaptures',kind:'guided',risk:'Low',undo:'Restore your previous capture preferences.',
    evidence:'Windows provides a dedicated Game Captures settings page; performance impact is workload-specific.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'DVR recording capture background xbox gamebar'
  },
  {
    id:'gameBar',category:'Gaming',title:'Review Game Bar options',
    summary:'Set capture, overlay and shortcut preferences for Windows gaming.',
    detail:'Review Game Bar settings yourself instead of disabling game services blindly.',
    action:'gameBar',kind:'guided',risk:'Low',undo:'Re-enable the desired Game Bar features.',
    evidence:'This is a supported Windows Gaming settings page; performance improvements are not guaranteed.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'gamebar game bar xbox overlay'
  },
  {
    id:'graphics',category:'Gaming',title:'Per-game GPU selection',
    summary:'Select the preferred GPU for specific games when multiple adapters are supported.',
    detail:'This opens Graphics settings. Windows may offer Power saving / High performance per application.',
    action:'graphics',kind:'guided',risk:'Low',undo:'Set the game preference back to Windows default.',
    evidence:'Microsoft documents per-app graphics selection where a device has multiple GPUs.',
    source:'https://support.microsoft.com/en-us/windows/hardware/display-graphics/optimizations-for-windowed-games-in-windows-11',
    keywords:'graphics GPU RTX Intel gaming dedicated integrated'
  },
  {
    id:'graphicsDefault',category:'Gaming',title:'Windowed-game graphics options',
    summary:'Review graphics presentation optimizations for eligible DirectX games on Windows 11.',
    detail:'Windowed game optimizations may reduce presentation latency in supported DX10/DX11 games. Restart the game after changing.',
    action:'graphicsDefault',kind:'guided',risk:'Low',undo:'Return to the default graphics page and restore the prior option.',
    evidence:'Microsoft documents a flip-model presentation path for supported windowed DirectX games on Windows 11.',
    source:'https://support.microsoft.com/en-us/windows/hardware/display-graphics/optimizations-for-windowed-games-in-windows-11',
    keywords:'windowed games directx DX11 DX10 latency optimization graphics',
    windows11:true
  },
  {
    id:'displayAdvanced',category:'Gaming',title:'Check display refresh rate',
    summary:'Verify that the display is set to the intended supported refresh rate.',
    detail:'Windows Advanced display shows supported rates. Higher Hz may improve perceived smoothness but not render FPS.',
    action:'displayAdvanced',kind:'guided',risk:'Low',undo:'Choose the previous supported refresh rate.',
    evidence:'Display settings depend on the panel, connection and GPU capabilities.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'refresh rate display Hz monitor laptop'
  },
  {
    id:'power',category:'Gaming',title:'Review Windows power settings',
    summary:'Review performance versus heat and battery use.',
    detail:'Performance modes may increase power draw, battery drain and temperatures; laptops should monitor thermals.',
    action:'power',kind:'guided',risk:'Moderate',undo:'Return to the prior Windows power mode.',
    evidence:'Microsoft warns that performance settings increase power use and heat.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'power high performance balanced battery AC'
  },
  {
    id:'performancePlan',category:'Gaming',title:'Switch to available High performance plan',
    summary:'Optional confirmed power-plan switch with saved previous plan and Restore.',
    detail:'Only offered if Windows has the standard High performance plan; on laptops the PC Doctor action requires AC power.',
    action:'fixes',kind:'confirmed',risk:'Moderate',undo:'Fix & Gaming → Restore previous power plan.',
    evidence:'Performance plans may cost more energy and heat; they do not guarantee FPS gains.',
    source:'https://support.microsoft.com/en-us/windows/experience/performance-optimization/tips-to-improve-pc-performance-in-windows',
    keywords:'one click performance plan AC gaming battery'
  },
  {
    id:'networkStatus',category:'Network',title:'Check active network connection',
    summary:'Review adapter, Wi-Fi or Ethernet status and Windows diagnostics.',
    detail:'Investigate a real problem before changing low-level network parameters.',
    action:'networkStatus',kind:'guided',risk:'Low',undo:'Opening settings changes nothing.',
    evidence:'A single short ICMP ping cannot identify ISP, wireless or game-server latency sources.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'network internet connection status'
  },
  {
    id:'wifi',category:'Network',title:'Review Wi-Fi signal and properties',
    summary:'Inspect Wi-Fi settings, band choices and network connection.',
    detail:'Wi-Fi radio quality is often more important than speculative registry tweaks. Use wired Ethernet to compare if possible.',
    action:'wifi',kind:'guided',risk:'Low',undo:'Opening Wi-Fi settings changes nothing.',
    evidence:'Windows provides a Wi-Fi settings page on devices with a supported adapter.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'wifi wireless internet signal band ping'
  },
  {
    id:'ethernet',category:'Network',title:'Check Ethernet adapter',
    summary:'Inspect the wired connection and link properties.',
    detail:'Use Windows Ethernet settings to confirm link status before attributing delay to your ISP.',
    action:'ethernet',kind:'guided',risk:'Low',undo:'Opening Ethernet settings changes nothing.',
    evidence:'Windows provides an Ethernet settings page for wired adapters.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'ethernet wired network cable gigabit'
  },
  {
    id:'networkTroubleshoot',category:'Network',title:'Launch Windows network troubleshooters',
    summary:'Use built-in guided troubleshooting for network connection problems.',
    detail:'Some Microsoft troubleshooters may suggest changing settings. Review each Windows prompt.',
    action:'networkTroubleshoot',kind:'guided',risk:'Low',undo:'App only opens troubleshooters. Windows may have its own changes and recovery instructions.',
    evidence:'Windows supports separate built-in troubleshooters.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'network troubleshooting ping connection'
  },
  {
    id:'dnsFlush',category:'Network',title:'Clear stale DNS resolver cache',
    summary:'Only useful for suspected stale name resolution; does not directly lower game latency.',
    detail:'Use the existing Fix & Gaming maintenance panel for explicit preview and one-use confirmation.',
    action:'fixes',kind:'confirmed',risk:'Moderate',undo:'DNS entries rebuild automatically. There is no one-click undo for the flush.',
    evidence:'DNS cache flushing is a troubleshooting action, not a proven FPS or ping booster.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'dns resolver cache troubleshoot hostname ping'
  },
  {
    id:'energy',category:'Windows',title:'Review energy recommendations',
    summary:'Balance performance with battery life and heat for laptops.',
    detail:'On supported Windows 11 versions, Windows offers energy recommendations.',
    action:'energy',kind:'guided',risk:'Low',undo:'Review any change in its original Windows settings page.',
    evidence:'This is a Windows 11 Settings feature on supported versions.',
    source:'https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-settings',
    keywords:'battery energy recommendations laptop heat',
    windows11:true
  }
])

export const PROFILE_IDS=Object.freeze(['balanced','esports','lowMemory','visual','streaming'])
export const PROFILES=Object.freeze([
  {id:'balanced',name:'Balanced gaming',subtitle:'Basic Windows and GPU review; no aggressive tweaks',ids:['gameMode','graphics','power','windowsUpdates','gameCaptures']},
  {id:'esports',name:'Competitive FPS',subtitle:'Frame pacing and low-latency guidance, not a guaranteed FPS boost',ids:['gameMode','graphics','graphicsDefault','displayAdvanced','gameCaptures','taskManager']},
  {id:'lowMemory',name:'Low-memory PC',subtitle:'Start by reducing RAM pressure and freeing storage',ids:['taskManager','startupApps','storageCleanup','uninstallApps','gameMode']},
  {id:'visual',name:'Visual quality',subtitle:'GPU selection and image quality first; do not disable useful effects blindly',ids:['graphics','displayAdvanced','gameBar','power']},
  {id:'streaming',name:'Gaming + streaming',subtitle:'Preserve captures; investigate background load and GPU choice',ids:['gameCaptures','gameBar','taskManager','graphics','power']}
])

const percent=(used,total)=>Number.isFinite(used)&&Number.isFinite(total)&&total>0?100*used/total:null
export function getBottlenecks(scan) {
  if (!scan) return [{severity:'info',title:'Run a diagnosis to prioritize options',detail:'All options remain available, but personal recommendations require a real scan.',actions:[]}]
  const results=[]
  const disks=Array.isArray(scan.storage)?scan.storage:[]
  const fullest=disks.filter(d=>Number.isFinite(d.use)).sort((a,b)=>b.use-a.use)[0]
  if(fullest?.use>=90)results.push({severity:'high',title:'Low disk headroom',detail:Math.round(fullest.use)+'% occupied on '+String(fullest.mount||'a Windows volume')+'. Prioritize space before optional gaming tweaks.',actions:['storageCleanup','storageSense','uninstallApps']})
  const ram=percent(scan.memory?.used,scan.memory?.total)
  if(ram!==null && ram>=85)results.push({severity:'high',title:'High memory usage',detail:Math.round(ram)+'% RAM in use at last scan; investigate active processes.',actions:['taskManager','startupApps']})
  if(Number.isFinite(scan.cpu?.load)&&scan.cpu.load>=85)results.push({severity:'medium',title:'Heavy CPU workload',detail:Math.round(scan.cpu.load)+'% CPU use at scan time. One snapshot does not establish sustained saturation.',actions:['taskManager','startupApps']})
  const temp=Number(scan.temperature?.main||scan.temperature?.max||0)
  if(temp>=85)results.push({severity:'medium',title:'CPU temperature is elevated',detail:Math.round(temp)+'°C reported. Check ventilation and power/thermal behavior before performance-mode changes.',actions:['power']})
  if(!results.length)results.push({severity:'good',title:'No obvious RAM or disk pressure detected',detail:'Use game-specific benchmarks before applying performance tweaks.',actions:['gameMode','graphics','gameCaptures']})
  return results
}
export function sortOptimizations(options,scan,filterIds=null) {
  const high=new Set(getBottlenecks(scan).flatMap(x=>x.actions))
  return options.filter(x=>!filterIds||filterIds.includes(x.id))
    .map((x,i)=>({x,i,rank:high.has(x.id)?0:1}))
    .sort((a,b)=>a.rank-b.rank||a.i-b.i).map(x=>x.x)
}
export function validateProfiles(){
  const known=new Set(OPTIMIZATIONS.map(x=>x.id))
  return PROFILES.every(x=>x.ids.every(id=>known.has(id))&&x.ids.length>0)
}

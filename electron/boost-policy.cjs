'use strict'
const path=require('node:path')
const {processExecutable,cleanWinPath}=(()=>{
 const {processExecutable}=require('./autopilot.cjs')
 function cleanWinPath(value){
  if(typeof value!=='string'||!value||value.length>1024||!path.win32.isAbsolute(value))return null
  return path.win32.normalize(value).toLowerCase().replace(/[\\/]+$/,'')
 }
 return {processExecutable,cleanWinPath}
})()
// Exclusion is defense-in-depth, not an exhaustive list of protected software.
// Unknown apps remain untouched until the user explicitly opts in.
const PROTECTED_NAMES=/(?:^|[_.-])(anticheat|easyanticheat|battleye|beservice|vgc|vgk|vanguard|riotclient|msmpeng|securityhealth|defender|sense|windefend|audiodg|lsass|csrss|winlogon|services|smss|svchost|dwm|explorer|system|registry|fontdrvhost|nvcontainer|amdrss|amdfendrsr|igfx|hidd|logonui|credential|bitlocker|password|backup)(?:[_.-]|$)/i
const PROTECTED_TERMS=/anticheat|easyanticheat|battleye|vanguard|xigncode|punkbuster|faceit|nprotect|epicgameslauncher|steamwebhelper|steamservice|vgtray|securityhealth|msmpeng|windowsdefender|malwarebytes|crowdstrike|sentinelone|sophos|bitdefender|kaspersky/i
function protectedReason(proc,{gameExe=null,gameRoot=null,appExe=null}={}){
 if(!proc||!Number.isSafeInteger(Number(proc.pid))||Number(proc.pid)<=4)return 'System or invalid process'
 const exe=processExecutable(proc)
 if(!exe)return 'Unknown or unverifiable executable path'
 const file=path.win32.basename(exe)
 if(exe.startsWith('c:\\windows\\')||/^[a-z]:\\windowsapps\\/i.test(exe)||exe.includes('\\windowsapps\\'))return 'Windows protected installation'
 if(PROTECTED_NAMES.test(file)||PROTECTED_TERMS.test(file))return 'Security, anti-cheat, device or system component'
 if(gameExe&&cleanWinPath(gameExe)===exe)return 'Active game'
 const root=cleanWinPath(gameRoot)
 if(root&&exe.startsWith(root+'\\'))return 'Game installation'
 if(appExe&&cleanWinPath(appExe)===exe)return 'PC Doctor'
 if(proc.pid===process.pid)return 'PC Doctor process'
 return null
}
function classify(proc,opts={}){
 const exe=processExecutable(proc)
 const reason=protectedReason(proc,opts)
 return {pid:Number(proc?.pid)||0,name:String(proc?.name||'').slice(0,130),
  exe:reason?null:exe,status:reason?'protected':'eligible',reason:reason||'Can be reduced only after explicit user approval',
  cpu:Number.isFinite(proc?.cpu)?Math.max(0,Math.round(proc.cpu*10)/10):0,
  memMB:Number.isFinite(proc?.memRss)?Math.max(0,Math.round(proc.memRss/1048576)):null}
}
function isEligible(proc,opts={}){return protectedReason(proc,opts)===null}
module.exports={classify,isEligible,protectedReason,cleanWinPath}

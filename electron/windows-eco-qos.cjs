'use strict'
// Windows 10/11 built-in EcoQoS; no driver, code injection, elevation or service changes.
// A separate PowerShell process is used per fixed operation, not a persistent privileged daemon.
const {execFile}=require('node:child_process')
const {promisify}=require('node:util')
const run=promisify(execFile)
const PS=String.raw`
$ErrorActionPreference='Stop'
try {
 $q=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('__PAYLOAD__')) | ConvertFrom-Json
 Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)]
public struct PowerThrottling { public uint Version; public uint ControlMask; public uint StateMask; }
public static class EcoNative {
 [DllImport("kernel32.dll", SetLastError=true)] public static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);
 [DllImport("kernel32.dll", SetLastError=true)] public static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetProcessInformation(IntPtr handle, int cls, out PowerThrottling state, uint size);
 [DllImport("kernel32.dll", SetLastError=true)] public static extern bool SetProcessInformation(IntPtr handle, int cls, ref PowerThrottling state, uint size);
}
'@
 $pidValue=[int]$q.pid
 if($pidValue -le 4){throw 'Protected or invalid PID'}
 $proc=Get-Process -Id $pidValue -ErrorAction SilentlyContinue
 if($q.op -eq 'probe' -and $null -eq $proc){
  @{ok=$true;same=$false;exists=$false} | ConvertTo-Json -Compress
  return
 }
 if($null -eq $proc){throw 'Process no longer running'}
 $exe=$proc.Path
 if([string]::IsNullOrWhiteSpace($exe)){throw 'Process executable unavailable'}
 if($q.op -ne 'probe' -and -not [string]::Equals([IO.Path]::GetFullPath($exe),[IO.Path]::GetFullPath([string]$q.exe),[StringComparison]::OrdinalIgnoreCase)){throw 'Process executable changed'}
 $ticks=$proc.StartTime.ToUniversalTime().Ticks.ToString()
 if($q.op -eq 'probe'){
  $same=([string]::Equals([IO.Path]::GetFullPath($exe),[IO.Path]::GetFullPath([string]$q.exe),[StringComparison]::OrdinalIgnoreCase) -and [string]$q.startTicks -eq $ticks)
  @{ok=$true;same=$same;exists=$true} | ConvertTo-Json -Compress
  return
 }
 if($q.op -ne 'inspect' -and [string]$q.startTicks -ne $ticks){throw 'Process lifetime changed; refusing PID reuse'}
 $handle=[EcoNative]::OpenProcess(0x1200,$false,[uint32]$pidValue)
 if($handle -eq [IntPtr]::Zero){throw 'Unable to open process for QoS; permission denied'}
 try {
  $original=New-Object PowerThrottling
  if(-not [EcoNative]::GetProcessInformation($handle,4,[ref]$original,12)){throw ('Unable to query EcoQoS: '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
  if($q.op -eq 'inspect'){
   @{ok=$true;pid=$pidValue;exe=$exe;startTicks=$ticks;controlMask=[int64]$original.ControlMask;stateMask=[int64]$original.StateMask} | ConvertTo-Json -Compress
  } else {
   if($q.op -eq 'apply'){
    if([int64]$original.ControlMask -ne [int64]$q.before.controlMask -or [int64]$original.StateMask -ne [int64]$q.before.stateMask){throw 'QoS changed after snapshot'}
    $target=New-Object PowerThrottling
    $target.Version=1
    $target.ControlMask=$original.ControlMask -bor [uint32]1
    $target.StateMask=$original.StateMask -bor [uint32]1
   } elseif($q.op -eq 'restore'){
    if([int64]$original.ControlMask -eq [int64]$q.before.controlMask -and [int64]$original.StateMask -eq [int64]$q.before.stateMask){
     @{ok=$true;alreadyOriginal=$true} | ConvertTo-Json -Compress
     return
    }
    if([int64]$original.ControlMask -ne [int64]$q.applied.controlMask -or [int64]$original.StateMask -ne [int64]$q.applied.stateMask){throw 'QoS changed outside PC Doctor; refusing to overwrite'}
    $target=New-Object PowerThrottling
    $target.Version=1
    $target.ControlMask=[uint32]$q.before.controlMask
    $target.StateMask=[uint32]$q.before.stateMask
   } else {throw 'Unknown operation'}
   if(-not [EcoNative]::SetProcessInformation($handle,4,[ref]$target,12)){throw ('SetProcessInformation failed: '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
   @{ok=$true;pid=$pidValue;controlMask=[int64]$target.ControlMask;stateMask=[int64]$target.StateMask} | ConvertTo-Json -Compress
  }
 }finally{[void][EcoNative]::CloseHandle($handle)}
} catch {
 @{ok=$false;error=[string]$_.Exception.Message} | ConvertTo-Json -Compress
}
`
function validate(op,payload){
 if(!['inspect','apply','restore','probe'].includes(op))throw Error('Unknown EcoQoS operation')
 if(!payload||!Number.isSafeInteger(payload.pid)||payload.pid<=4||
  typeof payload.exe!=='string'||payload.exe.length>1024||!/^[a-z]:\\/i.test(payload.exe)||!/[.]exe$/i.test(payload.exe))
  throw Error('Invalid Windows process identity')
 if(op!=='inspect'&&(!/^[0-9]{1,21}$/.test(String(payload.startTicks||''))||!payload.before||
  !Number.isSafeInteger(payload.before.controlMask)||!Number.isSafeInteger(payload.before.stateMask)))
  throw Error('Missing validated QoS snapshot')
 if(op==='restore'&&(!payload.applied||!Number.isSafeInteger(payload.applied.controlMask)||
  !Number.isSafeInteger(payload.applied.stateMask)))throw Error('Missing applied QoS state')
}
function createWindowsEcoQos({platform=process.platform,execute=run}={}){
 async function invoke(op,payload){
  if(platform!=='win32')return {ok:false,error:'EcoQoS is only available on Windows.'}
  try{
   validate(op,payload)
   const data=Buffer.from(JSON.stringify({op,...payload}),'utf8').toString('base64')
   const encoded=Buffer.from(PS.replace('__PAYLOAD__',data),'utf16le').toString('base64')
   const {stdout}=await execute('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',encoded],
    {windowsHide:true,timeout:12000,maxBuffer:65536})
   const line=String(stdout||'').trim().split(/\r?\n/).filter(Boolean).at(-1)
   const result=JSON.parse(line||'null')
   if(!result||typeof result.ok!=='boolean')throw Error('PowerShell returned no valid result')
   return result
  }catch(e){return {ok:false,error:'EcoQoS operation unavailable: '+String(e.message||e).slice(0,180)}}
 }
 return {inspect:identity=>invoke('inspect',identity),
  apply:record=>invoke('apply',record),restore:record=>invoke('restore',record),
  probe:record=>invoke('probe',record)}
}
module.exports={createWindowsEcoQos,validate}

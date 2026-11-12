'use strict'
// User-triggered, bounded local-gateway vs upstream ICMP comparison.
// Gateway derived from OS only; renderer cannot supply a host.
const {execFile}=require('node:child_process')
const {parseWindowsPing}=require('./network-quality.cjs')
const PROBES=6
const UPSTREAM='1.1.1.1'
function isIpv4(value){
 if(typeof value!=='string'||!/^(\d{1,3}\.){3}\d{1,3}$/.test(value))return false
 const parts=value.split('.').map(Number)
 return parts.every(x=>x>=0&&x<=255)&&parts[0]!==0&&parts[0]!==127&&parts[0]!==255
}
function execPing(exe,args){
 return new Promise(resolve=>execFile(exe,args,{windowsHide:true,timeout:14000,maxBuffer:32768},(_err,stdout)=>resolve(String(stdout||''))))
}
function classify(gateway,external){
 if(!gateway?.ok)return 'Gateway echo data was unavailable or ICMP filtered. Cannot isolate the cause.'
 if(!external?.ok)return 'External echo data was unavailable. Internet or firewall behavior cannot be distinguished.'
 if((gateway.packetLossPercent??0)>0 || gateway.avgMs>35)
  return 'Gateway echo delay/loss suggests a possible local router/Wi-Fi/LAN issue; verify over Ethernet.'
 if((external.packetLossPercent??0)>0 || external.avgMs>130)
  return 'Local gateway echo was relatively stable, but external echo degraded; possible upstream/congestion/routing issue.'
 return 'Both short ICMP paths responded without obvious severe delay or loss; intermittent faults remain possible.'
}
function createNetworkPath({platform=process.platform,si,exec=execPing}={}){
 if(!si||typeof si.networkGatewayDefault!=='function')throw Error('Network inventory source required')
 async function run(){
  if(platform!=='win32')return {ok:false,error:'Windows desktop only.'}
  let gateway=null
  try{gateway=await si.networkGatewayDefault()}catch{}
  if(!isIpv4(gateway))return {ok:false,error:'No usable IPv4 default gateway was reported; cannot safely compare paths.'}
  async function measure(host){
   try{
    const output=await exec('ping.exe',['-4','-n',String(PROBES),'-w','1200',host])
    return {...parseWindowsPing(output,PROBES),target:host}
   }catch{return {ok:false,target:host,error:'Windows ICMP test failed.'}}
  }
  const local=await measure(gateway)
  const external=await measure(UPSTREAM)
  return {ok:true,local,external,classification:classify(local,external),
    caution:'Only six ICMP attempts per destination. Firewalls can block echo; this is neither a bufferbloat test nor proof of an ISP or PC fault. No network setting was changed.'}
 }
 return {run}
}
module.exports={createNetworkPath,isIpv4,classify,PROBES,UPSTREAM}

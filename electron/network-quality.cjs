'use strict'
// Short user-started Windows ICMP measurement; not game-server ping or speedtest.
// Sends eight ICMP echo requests to the fixed Cloudflare resolver 1.1.1.1.
// No arbitrary destinations and no background polling.
const {execFile}=require('node:child_process')
const TARGET='1.1.1.1'
const PACKETS=8
function rounded(n){return Math.round(n*10)/10}
function parseWindowsPing(output,expected=PACKETS) {
  const lines=String(output||'').split(/\r?\n/)
  const times=[]
  for(const line of lines){
    if(!/\bTTL[=\s:]|\btime\s*[=<]/i.test(line))continue
    const less=/\btime\s*<\s*1\s*ms/i.test(line)
    const match=line.match(/\btime\s*[=<]\s*([\d.]+)\s*ms\b/i)
    if(less)times.push(0.5)
    else if(match&&Number.isFinite(Number(match[1]))&&Number(match[1])>=0)times.push(Number(match[1]))
  }
  // The summary is locale-sensitive. Do not fabricate loss if it cannot be parsed.
  const summary=String(output||'').match(/Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)/i)
  const sent=summary?Number(summary[1]):expected
  const received=summary?Number(summary[2]):times.length
  const lost=summary?Number(summary[3]):null
  if(!Number.isInteger(sent)||sent<1||sent>expected||received<0||received>sent||lost!==null&&(lost<0||lost>sent)){
    return {ok:false,error:'Unexpected Windows ping response. No network result reported.'}
  }
  if(!times.length) {
    return {ok:false,error:'No measurable ICMP echo responses. A firewall or connection can block ping even when websites work.'}
  }
  const sum=times.reduce((a,b)=>a+b,0)
  const gaps=times.slice(1).map((n,i)=>Math.abs(n-times[i]))
  return {
    ok:true,
    target:TARGET,requested:expected,
    received,
    packetLossPercent:lost===null?null:rounded(100*lost/sent),
    minMs:rounded(Math.min(...times)),
    avgMs:rounded(sum/times.length),
    maxMs:rounded(Math.max(...times)),
    meanDeltaMs:gaps.length?rounded(gaps.reduce((a,b)=>a+b,0)/gaps.length):null,
    timingSamples:times.length,
    caveat:'Short external ICMP echo to Cloudflare only. Time delta is NOT a professional jitter or game server latency metric. Firewalls and congestion can distort results.'
  }
}
function runNetworkQuality({platform=process.platform,exec=execFile}={}){
  if(platform!=='win32')return Promise.resolve({ok:false,error:'Windows desktop only.'})
  return new Promise(resolve=>{
    exec('ping.exe',['-4','-n',String(PACKETS),'-w','1200',TARGET],{
      windowsHide:true,timeout:20000,maxBuffer:32768
    },(err,stdout)=>{
      const result=parseWindowsPing(stdout,PACKETS)
      if(!result.ok&&err&&String(err.code)==='ENOENT')return resolve({ok:false,error:'Windows ping.exe was not found.'})
      resolve(result)
    })
  })
}
module.exports={parseWindowsPing,runNetworkQuality,TARGET,PACKETS}

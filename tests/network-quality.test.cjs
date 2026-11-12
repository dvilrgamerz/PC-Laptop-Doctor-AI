const test=require('node:test')
const assert=require('node:assert/strict')
const {parseWindowsPing,runNetworkQuality,TARGET,PACKETS}=require('../electron/network-quality.cjs')
const output=`Pinging 1.1.1.1 with 32 bytes of data:
Reply from 1.1.1.1: bytes=32 time=10ms TTL=57
Reply from 1.1.1.1: bytes=32 time=14ms TTL=57
Reply from 1.1.1.1: bytes=32 time=12ms TTL=57
Reply from 1.1.1.1: bytes=32 time=15ms TTL=57
Reply from 1.1.1.1: bytes=32 time=11ms TTL=57
Reply from 1.1.1.1: bytes=32 time=10ms TTL=57
Reply from 1.1.1.1: bytes=32 time=10ms TTL=57
Reply from 1.1.1.1: bytes=32 time=10ms TTL=57
Ping statistics for 1.1.1.1:
    Packets: Sent = 8, Received = 8, Lost = 0 (0% loss)
`
test('short ICMP test parses actual packet time, variation and loss without inventing FPS or ISP quality',()=>{
 const r=parseWindowsPing(output)
 assert.equal(r.ok,true)
 assert.equal(r.avgMs,11.5)
 assert.equal(r.minMs,10)
 assert.equal(r.maxMs,15)
 assert.equal(r.packetLossPercent,0)
 assert.equal(r.timingSamples,8)
 assert.match(r.caveat,/NOT/)
})
test('missing summaries do not fabricate packet loss and less-than-1ms responses remain below 1ms',()=>{
 const r=parseWindowsPing('Reply from 1.1.1.1: bytes=32 time<1ms TTL=64\n'.replace('\\n','
'))
 assert.equal(r.ok,true)
 assert.equal(r.avgMs,0.5)
 assert.equal(r.packetLossPercent,null)
 assert.equal(r.timingSamples,1)
})
test('blocked ICMP does not claim 100% network outage',()=>{
 const r=parseWindowsPing('Request timed out.\nPackets: Sent = 8, Received = 0, Lost = 8 (100% loss)')
 assert.equal(r.ok,false)
 assert.match(r.error,/ICMP/)
})
test('only fixed external IPv4 target and bounded Windows ping arguments are permitted',async()=>{
 const calls=[]
 const exec=(cmd,args,options,cb)=>{calls.push({cmd,args,options});cb(null,output,'')}
 const result=await runNetworkQuality({platform:'win32',exec})
 assert.equal(result.ok,true)
 assert.deepEqual(calls[0].args,['-4','-n','8','-w','1200','1.1.1.1'])
 assert.equal(TARGET,'1.1.1.1')
 assert.equal(PACKETS,8)
 assert.equal((await runNetworkQuality({platform:'linux',exec})).ok,false)
})

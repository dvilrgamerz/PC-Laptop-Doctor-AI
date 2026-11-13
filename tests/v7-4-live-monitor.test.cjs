const test=require('node:test')
const assert=require('node:assert/strict')
const {summarize,classify,createLiveMonitor,MIN_INTERVAL_MS}=require('../electron/live-monitor.cjs')
const GiB=1024**3
const reading={
 load:{currentLoad:97.1},mem:{total:8*GiB,used:7.3*GiB,available:.7*GiB},
 disks:[{mount:'C:',size:236.6*GiB,available:5.1*GiB,use:97.8},{mount:'D:',size:100*GiB,available:80*GiB,use:20}],
 temperature:{main:0,max:0},network:[{rx_sec:250*1024,tx_sec:25*1024,iface:'SECRET'}]
}
test('summarize returns sanitized bounded numeric data and no private metadata',()=>{
 const metrics=summarize(reading)
 assert.equal(metrics.cpuPercent,97.1)
 assert.equal(metrics.ramPercent,91.3)
 assert.equal(metrics.diskPercent,97.8)
 assert.equal(metrics.diskFreeGiB,5.1)
 assert.equal(metrics.temperatureC,null)
 assert.equal(metrics.networkDownKib,250)
 assert.equal(metrics.networkUpKib,25)
 const serialized=JSON.stringify(metrics)
 assert.equal(serialized.includes('SECRET'),false)
 assert.equal(serialized.includes('C:'),false)
 assert.deepEqual(Object.keys(metrics).sort(),[
 'at','cpuPercent','gpuPercent','diskFreeGiB','diskPercent','diskTotalGiB','networkDownKib','networkUpKib','ramAvailableGiB','ramPercent','ramTotalGiB','temperatureC'
 ].sort())
})
test('severe storage pressure is first and never presented as verified gaming repair',()=>{
 const items=classify(summarize(reading))
 assert.equal(items[0].id,'storage')
 assert.equal(items[0].severity,'critical')
 assert.equal(items[0].target,'boost')
 assert.ok(items.some(x=>x.id==='ram'))
 assert.ok(items.some(x=>x.id==='cpu'))
 assert.match(items[0].message,/Freeing substantial space matters more/)
})
test('unavailable sensor readings remain unknown, never zero or healthy',()=>{
 const metrics=summarize({load:{},mem:{},disks:[],temperature:{main:0,max:null}})
 assert.equal(metrics.cpuPercent,null)
 assert.equal(metrics.ramPercent,null)
 assert.equal(metrics.temperatureC,null)
 assert.equal(metrics.diskPercent,null)
 assert.deepEqual(classify(metrics),[])
})
test('cache prevents repeat scan more often than 5.5 seconds',async()=>{
 let clock=100000,loadCalls=0,ramCalls=0,diskCalls=0
 const si={
  currentLoad:async()=>{loadCalls++;return reading.load},
  mem:async()=>{ramCalls++;return reading.mem},
  fsSize:async()=>{diskCalls++;return reading.disks},
  cpuTemperature:async()=>reading.temperature,
  networkStats:async()=>reading.network
 }
 const monitor=createLiveMonitor({si,now:()=>clock})
 const first=await monitor.sample()
 assert.equal(first.ok,true)
 assert.equal(first.cached,false)
 const second=await monitor.sample()
 assert.equal(second.cached,true)
 assert.equal(loadCalls,1)
 clock+=MIN_INTERVAL_MS+1
 assert.equal((await monitor.sample()).cached,false)
 assert.equal(loadCalls,2)
 assert.equal(ramCalls,2)
 assert.equal(diskCalls,2)
})
test('concurrent requests share one sample; individual sensor errors do not crash the panel',async()=>{
 let currentCalls=0
 const si={
  currentLoad:async()=>{currentCalls++;await new Promise(resolve=>setTimeout(resolve,5));throw Error('Access denied')},
  mem:async()=>reading.mem,
  fsSize:async()=>reading.disks,
  cpuTemperature:async()=>{throw Error('sensor unavailable')}
 }
 const x=createLiveMonitor({si})
 const [a,b]=await Promise.all([x.sample(),x.sample()])
 assert.equal(currentCalls,1)
 assert.equal(a.ok,true)
 assert.equal(a.metrics.cpuPercent,null)
 assert.equal(a.metrics.temperatureC,null)
 assert.deepEqual(a.metrics,b.metrics)
})
test('GPU load appears only when a usable adapter reading is available',async()=>{
 const report=summarize({...reading,graphics:{controllers:[
  {model:'Secret graphics model',utilizationGpu:73.5},
  {model:'Second adapter',utilizationGpu:null}
 ]}})
 assert.equal(report.gpuPercent,73.5)
 assert.equal(JSON.stringify(report).includes('Secret graphics model'),false)
 assert.equal(summarize({...reading,graphics:{controllers:[{utilizationGpu:undefined}]}}).gpuPercent,null)
 const si={currentLoad:async()=>reading.load,mem:async()=>reading.mem,fsSize:async()=>reading.disks,
  graphics:async()=>({controllers:[{utilizationGpu:57.2}]})}
 const result=await createLiveMonitor({si}).sample()
 assert.equal(result.metrics.gpuPercent,57.2)
})
test('read service requires actual systeminformation dependencies',()=>{
 assert.throws(()=>createLiveMonitor({si:{}}),/Missing local hardware collector/)
})

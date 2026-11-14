const test=require('node:test')
const assert=require('node:assert/strict')
const {analyzePresentMonCsv,compareCaptures,createBenchmarkService}=require('../electron/presentmon-bench.cjs')
function capture({game='sample-game.exe',ms=16.7,frames=600,modern=true,pid=403}={}){
 const header=modern?'Application,ProcessID,SwapChainAddress,MsBetweenPresents,MsCPUBusy':
  'Application,ProcessID,SwapChainAddress,FrameTime,CPUBusy'
 const rows=Array.from({length:frames},(_,i)=>game+','+pid+',0x42,'+(typeof ms==='function'?ms(i):ms)+',9')
 return [header,...rows].join('\r\n')+'\r\n'
}
test('recent PresentMon CSV computes FPS, lows, percentiles and correct frame duration',()=>{
 const r=analyzePresentMonCsv(capture())
 assert.equal(r.application,'sample-game.exe')
 assert.equal(r.frames,600)
 assert.ok(Math.abs(r.avgFPS-59.88)<0.1)
 assert.equal(r.p99Ms,16.7)
 assert.equal(r.low1FPS,r.avgFPS)
 assert.equal(r.stutters,0)
 assert.equal(r.durationSec,10)
})
test('legacy FrameTime can be imported but timestamp-only TimeInMs cannot',()=>{
 assert.equal(analyzePresentMonCsv(capture({modern:false})).frameColumn,'FrameTime')
 assert.throws(()=>analyzePresentMonCsv(capture().replace('MsBetweenPresents','TimeInMs')),/Missing PresentMon frame-interval/)
})
test('does not combine other games or separate swap chains into a false FPS',()=>{
 const csv=capture({frames:650})+capture({game:'another.exe',frames:650}).split('\r\n').slice(1).join('\r\n')
 const r=analyzePresentMonCsv(csv)
 assert.equal(r.frames,650)
 assert.equal(r.ignoredOtherSwapChains,650)
})
test('1 percent low represents slowest one percent of frame intervals',()=>{
 const r=analyzePresentMonCsv(capture({frames:1000,ms:i=>i>=990?100:10}))
 assert.ok(r.low1FPS<r.avgFPS)
 assert.equal(r.low1FPS,10)
 assert.ok(r.p99Ms>=10)
 assert.equal(r.stutters,10)
})
test('rejects invalid rows, tiny datasets, malformed CSV and wrong game comparisons',()=>{
 assert.throws(()=>analyzePresentMonCsv('Application,FrameTime\nexample.exe,10'),/short/)
 assert.throws(()=>analyzePresentMonCsv(capture({frames:180}).replace(/,16\.7,/g,',0,')),/180 usable/)
 assert.throws(()=>analyzePresentMonCsv(capture({frames:190}).replace('sample-game.exe','"unterminated')),/quote/)
 const a=analyzePresentMonCsv(capture()),b=analyzePresentMonCsv(capture({game:'other.exe'}))
 assert.throws(()=>compareCaptures(a,b),/same game/)
})
test('reports observed change without pretending a single A/B pair is proof of causality',()=>{
 const a=analyzePresentMonCsv(capture()),b=analyzePresentMonCsv(capture({ms:14}))
 const c=compareCaptures(a,b)
 assert.ok(c.avgFPSPct>0)
 assert.ok(c.p99MsPct<0)
 assert.match(c.limitations,/Single-run/)
})
test('file selection is main-process controlled, mode-checked, and resettable',async()=>{
 const a=analyzePresentMonCsv(capture()),b=analyzePresentMonCsv(capture({ms:14}))
 let selected='/some/local/benchmark.csv'
 const service=createBenchmarkService({choose:async()=>selected,read:async()=>selected.endsWith('benchmark.csv')?a:b})
 assert.equal((await service.import('force')).ok,false)
 assert.equal((await service.import('baseline')).ok,true)
 selected='/some/local/faster.csv'
 const r=await service.import('boosted')
 assert.ok(r.comparison)
 assert.equal(service.reset().comparison,null)
})

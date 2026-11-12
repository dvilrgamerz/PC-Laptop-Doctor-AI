import test from 'node:test'
import assert from 'node:assert/strict'
import {analyzeExperiment} from '../src/v6Experiments.mjs'
const run=(avgFps,low=avgFps*.6,p95=1000/avgFps*1.3)=>({avgFps,onePercentLowFps:low,p95FrameMs:p95,samples:2000})
test('requires 3 to 8 genuine valid captures per condition',()=>{
 assert.throws(()=>analyzeExperiment([run(60)],[run(65)]),/3–8/)
 assert.throws(()=>analyzeExperiment([run(60),run(60),run(60)],[run(65)]),/3–8/)
 assert.throws(()=>analyzeExperiment([run(60),run(60),run(60)],[run(65),run(65),{...run(65),samples:5}]),/100/)
})
test('measured consistent uplift produces positive mean and repeated-run interval',()=>{
 const before=[run(60),run(59.9),run(60.2),run(60.1),run(60)]
 const after=[run(66),run(65.8),run(66.1),run(66.2),run(66)]
 const result=analyzeExperiment(before,after)
 assert.equal(result.runs,5)
 assert.ok(result.metrics.avgFps.delta>5)
 assert.ok(result.metrics.avgFps.interval[0]>0)
 assert.ok(result.metrics.onePercentLowFps.delta>0)
 assert.equal(result.noisy,false)
 assert.match(result.assessment,/positive signal/)
 assert.deepEqual(result,analyzeExperiment(before,after))
})
test('inconsistent trials are labeled noisy rather than claiming reliable gain',()=>{
 const before=[run(40),run(65),run(45)]
 const after=[run(50),run(80),run(30)]
 const r=analyzeExperiment(before,after)
 assert.equal(r.noisy,true)
 assert.match(r.assessment,/Inconclusive/)
 assert.ok(r.notes.some(s=>s.includes('5%')))
})

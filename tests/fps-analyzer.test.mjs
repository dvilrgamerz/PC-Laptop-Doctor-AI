import test from 'node:test'
import assert from 'node:assert/strict'
import {analyzeFpsCsv,compareFpsResults} from '../src/fpsAnalyzer.mjs'

const make=(values,header='FrameTimeMs')=>header+'\n'+values.map(v=>String(v)).join('\n')
test('FPS analysis uses measured frame times, not a guessed performance score',()=>{
 const steady=analyzeFpsCsv(make(Array(100).fill(10)))
 assert.equal(steady.samples,100)
 assert.equal(steady.avgFps,100)
 assert.equal(steady.onePercentLowFps,100)
 assert.equal(steady.p95FrameMs,10)
 const slow=analyzeFpsCsv(make([...Array(90).fill(10),...Array(10).fill(50)]))
 assert.equal(slow.avgFps,71.4)
 assert.equal(slow.onePercentLowFps,20)
 assert.equal(slow.p95FrameMs,50)
 assert.equal(slow.stutterFrames,10)
 const delta=compareFpsResults(slow,steady)
 assert.equal(delta.avgFpsDelta,28.6)
 assert.equal(delta.lowFpsDelta,80)
})
test('recognizes FPS-only CSV and msBetweenPresents without external processing',()=>{
 const fromFps=analyzeFpsCsv(make(Array(120).fill(50),'fps'))
 assert.equal(fromFps.avgFps,50)
 const fromPresent=analyzeFpsCsv(make(Array(120).fill(20),'msBetweenPresents'))
 assert.equal(fromPresent.onePercentLowFps,50)
})
test('rejects missing frames, unsupported columns, invalid samples and oversized input',()=>{
 assert.throws(()=>analyzeFpsCsv('fps\n10\n20'),/At least 100/)
 assert.throws(()=>analyzeFpsCsv(make(Array(101).fill(10),'fakeData')),/needs a frame-time/)
 assert.throws(()=>analyzeFpsCsv(make(Array(101).fill(-1))),/Fewer than 100/)
 assert.throws(()=>analyzeFpsCsv('x'.repeat(5*1024*1024+1)),/too large/)
})

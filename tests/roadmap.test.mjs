import test from 'node:test'
import assert from 'node:assert/strict'
import {answerDoctor,hardwareAdvice} from '../src/doctorEngine.mjs'
import {makeHistoryEntry,readHistory,isHistoryEnabled,setHistoryEnabled,appendHistory,clearHistory,compareHistory,HISTORY_KEY,MAX_ENTRIES} from '../src/history.mjs'
import {cpuWork,runQuickBenchmark,addBenchmark,readBenchmarks,clearBenchmarks,BENCHMARK_VERSION} from '../src/benchmark.mjs'
const GiB=1024**3
const scan={
  memory:{total:8*GiB,used:7.4*GiB},
  cpu:{load:95,brand:'Test CPU'},
  storage:[{mount:'C:',size:240*GiB,available:5*GiB,use:98}],
  graphics:[{model:'Intel UHD Graphics'}],
  temperature:{main:0,max:0},
  network:{ping:24,ip4:'192.168.123.45',iface:'PRIVATE_DEVICE'},
  startupApps:[{name:'SECRET_STARTUP_PROGRAM'}],
  battery:{hasBattery:true,designedCapacity:100,maxCapacity:73}
}
function storage(){
 const map=new Map()
 return {setItem:(k,v)=>map.set(k,String(v)),getItem:k=>map.has(k)?map.get(k):null,removeItem:k=>map.delete(k)}
}
test('offline Doctor explains high memory, storage, gaming and network limits',()=>{
 const slow=answerDoctor('Why is my laptop slow?',scan)
 assert.match(slow.explanation,/92% RAM usage/i)
 assert.match(answerDoctor('How to fix full SSD?',scan).explanation,/98% occupied/)
 assert.match(answerDoctor('Improve FPS gaming',scan).reasons.join(' '),/RAM utilization/)
 assert.match(answerDoctor('network ping',scan).limits,/rule-based/)
 assert.match(answerDoctor('What should I upgrade?',scan,'gaming').title,/upgrade/)
 assert.match(answerDoctor('anything',null).explanation,/snapshot/)
})
test('advisor is conditional and avoids guaranteed compatibility',()=>{
 const cards=hardwareAdvice(scan,'gaming')
 assert.equal(cards[0].priority,'high')
 assert.ok(cards.some(x=>/memory/i.test(x.title)))
 assert.ok(cards.some(x=>/integrated graphics/i.test(x.title)))
 assert.ok(cards.some(x=>/manufacturer|firmware|cannot|compatible|compatibility|support/i.test(x.caution)))
 assert.equal(hardwareAdvice(null)[0].priority,'info')
})
test('opt-in history does not store raw scans and respects cap',()=>{
 const mem=storage(),analysis={score:30,issues:[{level:'high',title:'Memory',detail:'SECRET DETAILS'}]}
 const entry=makeHistoryEntry(scan,analysis)
 assert.equal(entry.ramPercent,92.5)
 assert.equal(appendHistory(mem,entry).length,0)
 assert.equal(mem.getItem(HISTORY_KEY),null)
 setHistoryEnabled(mem,true)
 assert.equal(isHistoryEnabled(mem),true)
 for(let i=0;i<MAX_ENTRIES+8;i++)appendHistory(mem,entry)
 const read=readHistory(mem)
 assert.equal(read.length,MAX_ENTRIES)
 const serialized=JSON.stringify(read)
 for(const secret of ['192.168.123.45','PRIVATE_DEVICE','SECRET_STARTUP_PROGRAM','SECRET DETAILS'])assert.equal(serialized.includes(secret),false)
 assert.equal(compareHistory(read[0],read[read.length-1]).score,0)
 clearHistory(mem)
 assert.equal(readHistory(mem).length,0)
})
test('corrupt history does not break the app',()=>{
 const s=storage()
 s.setItem(HISTORY_KEY,'not-json')
 assert.deepEqual(readHistory(s),[])
 assert.equal(isHistoryEnabled(s),false)
})
test('synthetic CPU algorithm is deterministic and rejects unchecked work sizes',()=>{
 assert.equal(cpuWork(1000),cpuWork(1000))
 assert.throws(()=>cpuWork(20000000),/Invalid workload/)
 assert.throws(()=>cpuWork(-1),/Invalid workload/)
})
test('quick CPU sample reports measurable work, without claiming FPS',async()=>{
 const result=await runQuickBenchmark()
 assert.equal(result.version,BENCHMARK_VERSION)
 assert.equal(result.iterations,6000000)
 assert.ok(result.operationsPerSecond>0)
 assert.ok(result.medianMs>0)
 const s=storage()
 assert.equal(addBenchmark(s,result,false).length,0)
 assert.equal(addBenchmark(s,result,true).length,1)
 assert.equal(readBenchmarks(s)[0].checksum,result.checksum)
 clearBenchmarks(s)
 assert.equal(readBenchmarks(s).length,0)
})

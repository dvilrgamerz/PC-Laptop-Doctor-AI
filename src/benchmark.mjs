// Fixed-workload synthetic JavaScript CPU check, not an FPS, GPU or standardized benchmark.
export const BENCHMARK_VERSION='integer-mix-v1'
export const BENCH_KEY='pcdoctor.cpu.benchmark.v1'
export function cpuWork(count){
  if(!Number.isInteger(count)||count<1||count>15_000_000)throw new Error('Invalid workload')
  let result=0
  for(let i=1;i<=count;i++){
    result=(result ^ Math.imul(i,48271) ^ (i>>>3))|0
  }
  return result>>>0
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]
export async function runQuickBenchmark(){
  const count=6_000_000
  const trials=[]
  let checksum=null
  // Separate samples by an event-loop yield so UI can paint and controls can update.
  for(let i=0;i<3;i++){
    await new Promise(resolve=>setTimeout(resolve,0))
    const start=performance.now()
    const result=cpuWork(count)
    const ms=performance.now()-start
    if(checksum!==null && result!==checksum)throw new Error('Workload result changed')
    checksum=result
    trials.push(Math.max(ms,0.01))
  }
  const medianMs=median(trials)
  return {
    version:BENCHMARK_VERSION,
    timestamp:new Date().toISOString(),
    iterations:count,
    medianMs:Math.round(medianMs*100)/100,
    operationsPerSecond:Math.round(count*1000/medianMs),
    checksum
  }
}
export function readBenchmarks(storage){
  try{
    const raw=JSON.parse(storage.getItem(BENCH_KEY)||'[]')
    return Array.isArray(raw)?raw.filter(x=>x?.version===BENCHMARK_VERSION && Number.isFinite(x.operationsPerSecond) && x.operationsPerSecond>0 && typeof x.timestamp==='string').slice(-10):[]
  }catch{return []}
}
export function addBenchmark(storage,point,enabled){
  if(!enabled)return readBenchmarks(storage)
  if(point?.version!==BENCHMARK_VERSION||!Number.isFinite(point.operationsPerSecond)||point.operationsPerSecond<=0)throw new Error('Invalid benchmark')
  const next=[...readBenchmarks(storage),{
    version:BENCHMARK_VERSION,
    timestamp:point.timestamp,
    operationsPerSecond:point.operationsPerSecond,
    medianMs:point.medianMs,
    iterations:point.iterations,
    checksum:point.checksum
  }].slice(-10)
  storage.setItem(BENCH_KEY,JSON.stringify(next))
  return next
}
export function clearBenchmarks(storage){storage.removeItem(BENCH_KEY)}

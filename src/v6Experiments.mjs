// Repeated external frame-time captures only, not first-party FPS acquisition.
// Small-sample bootstrap intervals are approximate, not proof of causation.
const minRuns=3,maxRuns=8
const round=(x,n=1)=>Number(x.toFixed(n))
const avg=xs=>xs.reduce((a,b)=>a+b,0)/xs.length
const sd=xs=>xs.length<2?0:Math.sqrt(xs.reduce((a,x)=>a+(x-avg(xs))**2,0)/(xs.length-1))
function bootstrapCI(before,after,key){
 let seed=0x835ac923
 function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296}
 const draws=[]
 for(let i=0;i<2000;i++){
  let a=0,b=0
  for(let j=0;j<before.length;j++){a+=before[Math.floor(rand()*before.length)][key];b+=after[Math.floor(rand()*after.length)][key]}
  draws.push((b-a)/before.length)
 }
 draws.sort((a,b)=>a-b)
 return [round(draws[49],2),round(draws[1949],2)]
}
export function analyzeExperiment(before,after){
 if(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length||
   before.length<minRuns||before.length>maxRuns)throw new Error('Use 3–8 matched runs per condition.')
 const props=['avgFps','onePercentLowFps','p95FrameMs']
 for(const result of [...before,...after]){
  if(!result||result.samples<100||props.some(k=>!Number.isFinite(result[k])||result[k]<=0))
   throw new Error('Every capture needs at least 100 valid frames and measured timing results.')
 }
 const metrics={}
 for(const key of props){
  const a=before.map(x=>x[key]),b=after.map(x=>x[key])
  const baseline=avg(a),updated=avg(b),delta=updated-baseline
  metrics[key]={before:round(baseline,2),after:round(updated,2),delta:round(delta,2),
    percent:round(100*delta/baseline,2),interval:bootstrapCI(before,after,key),
    beforeCv:round(sd(a)/baseline*100,1),afterCv:round(sd(b)/updated*100,1)}
 }
 const noisy=props.some(k=>metrics[k].beforeCv>5||metrics[k].afterCv>5)
 const interval=metrics.avgFps.interval
 const stablePositive=interval[0]>0&&!noisy,stableNegative=interval[1]<0&&!noisy
 return {
  runs:before.length,metrics,
  assessment:stablePositive?'Repeatable measured positive signal':stableNegative?'Repeatable measured regression signal':'Inconclusive; noise or mixed results',
  noisy,
  notes:[
   noisy?'At least one FPS/frame-time metric varies more than 5% between repeated captures. Consider matching loads, temperature and scene.':'Run-to-run coefficients of variation were at most 5% for the reported metrics.',
   '95% intervals are deterministic within-run bootstrap approximations, not calibrated statistical proof or causal effects.',
   'Results compare user-supplied captures; background software, thermal state, driver changes or measurement bias can distort them.'
  ]
 }
}

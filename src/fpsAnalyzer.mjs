// Offline CSV frame-time analyzer for user-recorded game captures.
// Does not capture FPS itself or infer benchmark comparability.
const MAX_BYTES=5*1024*1024
const MAX_SAMPLES=150000
function parseRow(line){
  const fields=[]
  let current='',quoted=false
  for(let i=0;i<line.length;i++){
    const ch=line[i]
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){current+='"';i++}
      else quoted=!quoted
    }else if(ch===','&&!quoted){fields.push(current.trim());current=''}
    else current+=ch
  }
  fields.push(current.trim())
  return fields
}
function key(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
const COLUMNS=[
  ['frametimems',1],['frametimeinms',1],['msbetweenpresents',1],
  ['frameintervalms',1],['frametimeseconds',1000],
  ['frametimes',1000],['fps',-1],['framerate',-1]
]
const median=x=>{const a=[...x].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2}
function round(n){return Math.round(n*10)/10}
export function analyzeFpsCsv(text){
  if(typeof text!=='string'||BufferSize(text)>MAX_BYTES)throw new Error('CSV is too large (maximum 5 MB).')
  const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim())
  if(lines.length<101)throw new Error('At least 100 measured frames plus a header are required.')
  const headers=parseRow(lines[0]).map(key)
  const selected=COLUMNS.find(([name])=>headers.includes(name))
  if(!selected)throw new Error('CSV needs a frame-time-ms, msBetweenPresents, or FPS column.')
  const index=headers.indexOf(selected[0]),scale=selected[1]
  const values=[]
  for(let i=1;i<lines.length&&values.length<MAX_SAMPLES;i++){
    const raw=parseRow(lines[i])[index]
    const n=Number(raw)
    if(raw===''||!Number.isFinite(n)||n<=0)continue
    const ms=scale===-1?1000/n:n*scale
    if(ms>0.01&&ms<5000)values.push(ms)
  }
  if(values.length<100)throw new Error('Fewer than 100 valid positive frame samples.')
  const totalMs=values.reduce((a,b)=>a+b,0)
  const slowest=[...values].sort((a,b)=>b-a).slice(0,Math.max(1,Math.ceil(values.length*.01)))
  const slowMean=slowest.reduce((a,b)=>a+b,0)/slowest.length
  const sorted=[...values].sort((a,b)=>a-b)
  const p95=sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]
  return {
    kind:'user-supplied-csv',
    samples:values.length,
    avgFps:round(values.length*1000/totalMs),
    onePercentLowFps:round(1000/slowMean),
    medianFps:round(1000/median(values)),
    p95FrameMs:round(p95),
    stutterFrames:values.filter(x=>x>33.33).length,
    sourceColumn:headers[index],
    note:'1% low = 1000 / mean of the slowest 1% frame times. Different capture tools use different definitions.'
  }
}
function BufferSize(s){return new TextEncoder().encode(s).length}
export function compareFpsResults(before,after){
  if(!before||!after)return null
  return {
    avgFpsDelta:round(after.avgFps-before.avgFps),
    lowFpsDelta:round(after.onePercentLowFps-before.onePercentLowFps),
    p95FrameMsDelta:round(after.p95FrameMs-before.p95FrameMs)
  }
}

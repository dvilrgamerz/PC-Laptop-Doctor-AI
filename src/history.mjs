// Opt-in summary-only local history. Never persist raw scans or network addresses.
export const HISTORY_KEY='pcdoctor.summary.history.v1'
export const HISTORY_OPTIN_KEY='pcdoctor.summary.history.enabled'
export const MAX_ENTRIES=30
const finite=value=>typeof value==='number' && Number.isFinite(value)?value:null
const round=value=>finite(value)===null?null:Math.round(value*10)/10
export function makeHistoryEntry(scan,analysis,{demo=false}={}){
  if(!scan||!analysis)throw new Error('A diagnosis is required')
  const drives=Array.isArray(scan.storage)?scan.storage:[]
  const use=drives.filter(d=>finite(d?.use)!==null).map(d=>d.use)
  const mainTemperature=scan.temperature?.main>0?scan.temperature.main:scan.temperature?.max>0?scan.temperature.max:null
  return {
    schema:1,
    at:new Date().toISOString(),
    mode:demo?'sample':'desktop',
    score:finite(analysis.score)===null?null:Math.max(0,Math.min(100,Math.round(analysis.score))),
    cpuPercent:round(scan.cpu?.load),
    ramPercent:scan.memory?.total>0?round(100*scan.memory.used/scan.memory.total):null,
    maxStoragePercent:use.length?round(Math.max(...use)):null,
    cpuTempC:round(mainTemperature),
    warningCount:Array.isArray(analysis.issues)?analysis.issues.length:0
  }
}
export function readHistory(storage) {
  try {
    const parsed=JSON.parse(storage.getItem(HISTORY_KEY)||'[]')
    if(!Array.isArray(parsed))return []
    return parsed.filter(x=>x&&x.schema===1&&['sample','desktop'].includes(x.mode)&&
      typeof x.at==='string'&&!Number.isNaN(Date.parse(x.at))&&
      (x.score===null||(Number.isInteger(x.score)&&x.score>=0&&x.score<=100))
    ).slice(-MAX_ENTRIES).map(x=>({
      schema:1,at:x.at,mode:x.mode,score:x.score,
      cpuPercent:round(x.cpuPercent),ramPercent:round(x.ramPercent),
      maxStoragePercent:round(x.maxStoragePercent),cpuTempC:round(x.cpuTempC),
      warningCount:Number.isInteger(x.warningCount)&&x.warningCount>=0?x.warningCount:0
    }))
  } catch {return []}
}
export function isHistoryEnabled(storage){
  try{return storage.getItem(HISTORY_OPTIN_KEY)==='true'}catch{return false}
}
export function setHistoryEnabled(storage,enabled){
  storage.setItem(HISTORY_OPTIN_KEY,enabled?'true':'false')
}
export function appendHistory(storage,entry){
  if(!isHistoryEnabled(storage))return readHistory(storage)
  if(!entry||entry.schema!==1||!['sample','desktop'].includes(entry.mode))throw new Error('Invalid summary')
  const values=[...readHistory(storage),entry].slice(-MAX_ENTRIES)
  storage.setItem(HISTORY_KEY,JSON.stringify(values))
  return values
}
export function clearHistory(storage){
  storage.removeItem(HISTORY_KEY)
}
export function compareHistory(first,last){
  if(!first||!last)return null
  const delta=(key)=>finite(first[key])!==null&&finite(last[key])!==null?round(last[key]-first[key]):null
  return {score:delta('score'),cpuPercent:delta('cpuPercent'),ramPercent:delta('ramPercent'),maxStoragePercent:delta('maxStoragePercent'),warningCount:delta('warningCount')}
}

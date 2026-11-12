'use strict'
// Conservative, opt-in microbenchmark of the filesystem containing the OS temporary directory.
// Results are NOT a standardized hardware disk benchmark; reads may be served from cache.
const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const {performance} = require('node:perf_hooks')

const DEFAULT_BYTES = 8 * 1024 * 1024
let running = false
async function runDiskCheck({bytes=DEFAULT_BYTES,runs=2,tmpdir=os.tmpdir()}={}) {
  if (running) return {ok:false,error:'A storage check is already running.'}
  if (!Number.isInteger(bytes) || bytes < 1048576 || bytes > 16777216 ||
    !Number.isInteger(runs) || runs < 1 || runs > 3) {
    return {ok:false,error:'Invalid bounded workload'}
  }
  running = true
  let directory
  try {
    const capacity = await fsp.statfs(tmpdir)
    const free = Number(capacity.bavail) * Number(capacity.bsize)
    if (!Number.isFinite(free) || free < 256 * 1024 * 1024 + bytes * 2) {
      return {ok:false,error:'Less than 256 MiB of safe free-space headroom. Skipping the storage check.'}
    }
    directory = await fsp.mkdtemp(path.join(tmpdir, 'pcdoctor-'))
    const filename = path.join(directory, 'workload.bin')
    const buffer = crypto.randomBytes(bytes)
    const readBuffer = Buffer.alloc(bytes)
    const writeRates=[], readRates=[]
    for (let i=0;i<runs;i++){
      const file = await fsp.open(filename, 'w+', 0o600)
      try {
        let tick = performance.now()
        await file.writeFile(buffer)
        await file.sync()
        let time = Math.max(performance.now()-tick,0.1)
        writeRates.push((bytes/1048576)/(time/1000))
        tick = performance.now()
        const result = await file.read(readBuffer,0,bytes,0)
        if (result.bytesRead !== bytes || !readBuffer.equals(buffer)) {
          throw new Error('Storage check read-back validation failed')
        }
        time = Math.max(performance.now()-tick,0.1)
        readRates.push((bytes/1048576)/(time/1000))
      } finally {await file.close()}
    }
    const mean = list => Math.round((list.reduce((a,b)=>a+b,0)/list.length)*10)/10
    return {
      ok:true,
      result:{
        kind:'bounded-temporary-file-io',
        at:new Date().toISOString(),
        bytes,runs,
        writeMiBs:mean(writeRates),
        cachedReadMiBs:mean(readRates),
        note:'8 MiB temporary-file test by default; writes include flush, reads may hit OS cache. Not disk hardware throughput.'
      }
    }
  } catch(error) {
    return {ok:false,error:'Unable to run safe storage check: '+String(error.message||error).slice(0,170)}
  } finally {
    if (directory) {
      try { await fsp.rm(directory,{recursive:true,force:true,maxRetries:2,retryDelay:100}) } catch {}
    }
    running = false
  }
}
module.exports={runDiskCheck,DEFAULT_BYTES}

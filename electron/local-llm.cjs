'use strict'
// Optional Ollama integration. No model is bundled or downloaded by this app.
// HTTP traffic is restricted to numeric loopback IP 127.0.0.1:11434.
const http = require('node:http')

const HOST = '127.0.0.1'
const PORT = 11434
const MODEL_NAME = /^[A-Za-z0-9_.:/+-]{1,120}$/
function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.round(value * 10) / 10 : null
}
function safeSnapshot(scan) {
  if (!scan || typeof scan !== 'object') return null
  const memory = scan.memory || {}
  const drives = Array.isArray(scan.storage) ? scan.storage.slice(0, 8) : []
  const temp = scan.temperature || {}
  const charge = scan.battery || {}
  const cpuTemperature = asNumber(temp.main) || asNumber(temp.max)
  return {
    cpuLoadPercent: asNumber(scan.cpu?.load),
    memoryTotalGiB: asNumber(memory.total / 1073741824),
    memoryUsedGiB: asNumber(memory.used / 1073741824),
    storageUsedPercent: drives.map(d => asNumber(d.use)).filter(n => n !== null),
    cpuTemperatureC: cpuTemperature,
    batteryChargePercent: asNumber(charge.percent),
    networkPingMs: asNumber(scan.network?.ping)
  }
}
function requestJson(method, pathname, body, timeoutMs = 3500) {
  if (!['GET','POST'].includes(method) || !['/api/tags','/api/generate'].includes(pathname)) {
    return Promise.reject(new Error('Unsupported local model request'))
  }
  return new Promise((resolve, reject) => {
    let settled = false
    const done = (error, value) => {
      if (settled) return
      settled = true
      if (error) reject(error)
      else resolve(value)
    }
    const payload = body === undefined ? '' : JSON.stringify(body)
    const req = http.request({
      hostname: HOST, port: PORT, method, path: pathname, agent: false,
      headers: {
        Accept: 'application/json',
        ...(method === 'POST' ? {'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)} : {})
      },
      timeout: timeoutMs
    }, res => {
      if (res.statusCode !== 200) {
        res.resume()
        return done(new Error('Local model service returned HTTP ' + res.statusCode))
      }
      let bytes = 0
      const chunks = []
      res.on('data', part => {
        bytes += part.length
        if (bytes > 262144) {
          req.destroy(new Error('Local model response too large'))
          return
        }
        chunks.push(part)
      })
      res.on('end', () => {
        try { done(null, JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch { done(new Error('Invalid local model response')) }
      })
      res.on('error', error => done(error))
    })
    req.on('timeout', () => req.destroy(new Error('Local model timed out')))
    req.on('error', error => done(error))
    if (method === 'POST') req.write(payload)
    req.end()
  })
}
function createLocalDoctor({ request = requestJson } = {}) {
  async function models() {
    try {
      const data = await request('GET', '/api/tags', undefined, 3500)
      const names = Array.isArray(data.models)
        ? data.models.map(m => m?.name).filter(x => typeof x === 'string' && MODEL_NAME.test(x)).slice(0, 60)
        : []
      return {ok:true,models:names}
    } catch (error) {
      return {ok:false,models:[],error:'Local Ollama is not reachable. Install and start Ollama separately, then download a model. '+String(error.message).slice(0,120)}
    }
  }
  async function ask({model,question,scan}) {
    if (typeof question !== 'string' || question.trim().length < 3 || question.length > 800)
      return {ok:false,error:'Question must contain 3–800 characters.'}
    if (typeof model !== 'string' || !MODEL_NAME.test(model))
      return {ok:false,error:'Choose a valid local model.'}
    const available = await models()
    if (!available.ok) return {ok:false,error:available.error}
    if (!available.models.includes(model))return {ok:false,error:'Selected model is not installed locally.'}
    const snapshot = safeSnapshot(scan)
    const prompt = [
      'Role: PC troubleshooting assistant. Provide cautious, concise technical advice.',
      'System measurements (JSON):',JSON.stringify(snapshot),
      'Measurements may be unavailable or inaccurate; do not claim root cause or performance gains.',
      'Do not recommend disabling security, deleting unknown files, overclocking, or running arbitrary commands.',
      'State uncertainty. For hardware purchases require exact device model/OEM service manual verification.',
      'User question:', question.trim()
    ].join('\n')
    try {
      const result = await request('POST','/api/generate',{
        model,prompt,stream:false,keep_alive:'0',
        options:{num_predict:320,num_ctx:2048,temperature:0.15}
      },90000)
      const answer = typeof result.response === 'string' ? result.response.slice(0,7000).trim() : ''
      if (!answer) return {ok:false,error:'The local model returned an empty answer.'}
      return {ok:true,model,answer,source:'local-ollama',warning:'Generated text may be inaccurate. Verify any proposed repair before proceeding.'}
    } catch(error) {
      return {ok:false,error:'The local model request failed: '+String(error.message).slice(0,130)}
    }
  }
  return {models,ask}
}
module.exports = {createLocalDoctor,requestJson,safeSnapshot,MODEL_NAME,HOST,PORT}

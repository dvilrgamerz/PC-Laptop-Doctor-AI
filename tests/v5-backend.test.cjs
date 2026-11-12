const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const path=require('node:path')
const os=require('node:os')
const {createLocalDoctor,safeSnapshot}=require('../electron/local-llm.cjs')
const {sanitizeInventory,createHardwareInspector}=require('../electron/hardware.cjs')
const {createMaintenance,loadLog}=require('../electron/maintenance.cjs')
const {runDiskCheck}=require('../electron/disk-check.cjs')

test('LLM snapshot sends numeric-only summary and excludes local identifiers',()=>{
 const scan={cpu:{brand:'SECRET',load:75},memory:{total:8589934592,used:6442450944},
 storage:[{mount:'C:',use:95,fs:'C:\\PRIVATE'}],
 startupApps:[{name:'SECRET APP'}],network:{ip4:'192.168.0.11',iface:'PRIVATE NIC',ping:23},
 temperature:{main:0,max:0},battery:{percent:75}}
 const result=JSON.stringify(safeSnapshot(scan))
 for(const secret of ['SECRET','192.168.0.11','PRIVATE','C:\\'])assert.equal(result.includes(secret),false)
 assert.equal(JSON.parse(result).memoryTotalGiB,8)
})
test('local model must be installed and requests are loopback API only',async()=>{
 const calls=[]
 const client=createLocalDoctor({request:async(method,pathname,body)=>{
   calls.push([method,pathname,body])
   if(pathname==='/api/tags')return {models:[{name:'qwen:small'},{name:'../../evil'},{name:'valid-1b'}]}
   if(pathname==='/api/generate')return {response:'Review Task Manager and check memory.'}
 }})
 const inventory=await client.models()
 assert.deepEqual(inventory.models,['qwen:small','valid-1b'])
 assert.equal((await client.ask({model:'../../evil',question:'Why slow?'})).ok,false)
 assert.equal((await client.ask({model:'nonexistent',question:'Why slow?'})).ok,false)
 const scan={network:{ip4:'10.22.4.5'},startupApps:[{name:'TOP SECRET'}],cpu:{load:90}}
 const r=await client.ask({model:'qwen:small',question:'Why is RAM high?',scan})
 assert.equal(r.ok,true)
 assert.equal(calls[calls.length-1][0],'POST')
 assert.equal(calls[calls.length-1][1],'/api/generate')
 const sent=JSON.stringify(calls[calls.length-1][2])
 for(const secret of ['TOP SECRET','10.22.4.5'])assert.equal(sent.includes(secret),false)
 assert.equal(calls[calls.length-1][2].stream,false)
 assert.equal(calls[calls.length-1][2].keep_alive,'0')
})
test('hardware inventory excludes serial numbers and does not assert empty slots',async()=>{
 const raw={system:{manufacturer:'Example',model:'Model 100',serial:'PRIVATE SERIAL'},
 baseboard:{model:'Board A',serial:'BOARD SECRET'},mem:[
 {size:8*1073741824,bank:'DIMM0',serial:'RAM SECRET',type:'DDR4',clockSpeed:3200}
 ],disks:[{name:'SSD',size:256*1073741824,serialNum:'DISK SECRET'}]}
 const result=sanitizeInventory(raw)
 const serialized=JSON.stringify(result)
 for(const secret of ['PRIVATE SERIAL','BOARD SECRET','RAM SECRET','DISK SECRET'])assert.equal(serialized.includes(secret),false)
 assert.equal(result.ramModules.length,1)
 assert.match(result.certainty,/NOT total slot count/)
 const inspector=createHardwareInspector({si:{
   system:async()=>raw.system,baseboard:async()=>raw.baseboard,memLayout:async()=>raw.mem,
   diskLayout:async()=>raw.disks,bios:async()=>({version:'1.0',serial:'BIOS PRIVATE'}),
   processes:async()=>({list:[{name:'Example app',pid:12,memRss:400*1048576,cpu:10}]})
 }})
 assert.equal((await inspector.getInventory()).inventory.machine.model,'Model 100')
 assert.equal((await inspector.getProcesses()).processes[0].memoryMiB,400)
})
test('maintenance actions need preview token, single use and audit only metadata',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'doctor-v5-test-'))
 const logFile=path.join(root,'actions.json')
 const called=[]
 const client=createMaintenance({
  platform:'win32',logFile,clock:()=>Date.UTC(2026,10,12,9,0,0),
  command:async(exe,args)=>{called.push([exe,...args]);return 'success'},
  getSession:()=>({getCacheSize:async()=>12345,clearCache:async()=>{called.push(['cache-clear'])}})
 })
 try{
   assert.equal((await client.apply('flushDns','not-a-token')).ok,false)
   assert.equal((await client.preview('powershell')).ok,false)
   const preview=await client.preview('flushDns')
   assert.equal(preview.ok,true)
   const ok=await client.apply('flushDns',preview.token)
   assert.equal(ok.ok,true)
   assert.deepEqual(called,[['ipconfig.exe','/flushdns']])
   assert.equal((await client.apply('flushDns',preview.token)).ok,false)
   const previewCache=await client.preview('clearAppCache')
   assert.equal(previewCache.approximateCacheBytes,12345)
   assert.equal((await client.apply('clearAppCache',previewCache.token)).ok,true)
   assert.deepEqual(called[1],['cache-clear'])
   const log=await client.history()
   assert.equal(log.items.length,2)
   assert.equal(JSON.stringify(log).includes('success'),true)
   assert.equal(JSON.stringify(log).includes('12345'),false)
   assert.equal((client.clearLog()).ok,true)
   assert.deepEqual(loadLog(logFile),[])
 }finally{fs.rmSync(root,{recursive:true,force:true})}
})
test('disk workload stays bounded, validates readback and removes the temporary folder',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'doctor-v5-disk-'))
 try{
   assert.equal((await runDiskCheck({bytes:20000000,tmpdir:root})).ok,false)
   const result=await runDiskCheck({bytes:1048576,runs:1,tmpdir:root})
   assert.equal(result.ok,true,result.error)
   assert.equal(result.result.bytes,1048576)
   assert.ok(result.result.writeMiBs>0)
   assert.ok(result.result.cachedReadMiBs>0)
   assert.deepEqual(fs.readdirSync(root),[])
 }finally{fs.rmSync(root,{recursive:true,force:true})}
})

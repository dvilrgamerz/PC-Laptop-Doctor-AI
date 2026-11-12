const test=require('node:test')
const assert=require('node:assert/strict')
const path=require('node:path')
const {createGameLibrary,parseLibraries,parseGameManifest}=require('../electron/game-library.cjs')
const {createNetworkPath,isIpv4,PROBES}=require('../electron/network-path.cjs')

test('Steam manifest parser reads names/IDs and never returns raw path or tokens',()=>{
 assert.deepEqual(parseGameManifest('"AppState" { "appid" "730" "name" "Counter-Strike 2" }'),{appid:'730',name:'Counter-Strike 2'})
 assert.equal(parseGameManifest('"name" "No app ID"'),null)
 assert.deepEqual(parseLibraries('"libraryfolders" { "0" { "path" "C:\\\\Program Files (x86)\\\\Steam" } "1" { "path" "D:\\\\SteamLibrary" } }'),
   ['C:\\Program Files (x86)\\Steam','D:\\SteamLibrary'])
})
test('Steam discovery only reads named appmanifest files; no launch or modifications',async()=>{
 const seen=[]
 const mock={
  readFile:async(file)=>{seen.push(['read',file]);if(file.endsWith('libraryfolders.vdf'))return '"path" "D:\\\\Games"'
   return '"AppState" { "appid" "730" "name" "Counter-Strike 2" }'},
  readdir:async(file)=>{seen.push(['readdir',file]);return ['readme.txt','user-data.json','appmanifest_730.acf']},
  stat:async(file)=>{seen.push(['stat',file]);return {isFile:()=>true,size:100}}
 }
 const service=createGameLibrary({platform:'win32',roots:['C:\\Steam'],read:mock,exec:async()=>''})
 const result=await service.inspect()
 assert.equal(result.ok,true)
 assert.equal(result.games.length,1)
 assert.equal(result.games[0].appid,'730')
 assert.equal(seen.some(x=>x[1].includes('user-data.json')),false)
 assert.ok(seen.every(x=>['read','readdir','stat'].includes(x[0])))
})
test('default gateway validator rejects malformed and loopback addresses',()=>{
 for(const ip of ['127.0.0.1','0.0.0.0','999.1.2.3','abc.1.1.1','::1','1.1.1.1 && cmd'])
  assert.equal(isIpv4(ip),false)
 assert.equal(isIpv4('192.168.1.1'),true)
})
function pingSample(ms){
 const lines=Array.from({length:PROBES},()=>('Reply from 1.1.1.1: bytes=32 time='+ms+'ms TTL=58')).join('\r\n')
 return lines+'\r\nPackets: Sent = '+PROBES+', Received = '+PROBES+', Lost = 0'
}
test('compares only OS-reported gateway and fixed upstream host with bounded probes',async()=>{
 const calls=[]
 const service=createNetworkPath({platform:'win32',si:{networkGatewayDefault:async()=> '192.168.1.1'},
  exec:async(exe,args)=>{
   calls.push([exe,...args])
   return pingSample(args.at(-1)==='192.168.1.1'?4:180)
  }})
 const r=await service.run()
 assert.equal(r.ok,true)
 assert.equal(calls.length,2)
 assert.deepEqual(calls.map(x=>x.at(-1)),['192.168.1.1','1.1.1.1'])
 assert.equal(r.local.avgMs,4)
 assert.equal(r.external.avgMs,180)
 assert.match(r.classification,/upstream|routing/i)
 assert.ok(calls.every(c=>c[0]==='ping.exe'&&c.includes('6')))
})
test('unavailable OS gateway prevents external probing',async()=>{
 let sent=0
 const r=await createNetworkPath({platform:'win32',si:{networkGatewayDefault:async()=> null},exec:async()=>{sent++}}).run()
 assert.equal(r.ok,false)
 assert.equal(sent,0)
})

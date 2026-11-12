'use strict'
// Explicitly queried local-only hardware inventory. Omits serial numbers, UUIDs and asset tags.
const valid = value => typeof value === 'string' ? value.trim().slice(0,120) : null
const amount = n => typeof n === 'number' && Number.isFinite(n) && n>0 ? n : null
const gib = n => amount(n) === null ? null : Math.round(n / (1024**3) * 10)/10
function sanitizeInventory({system={},baseboard={},mem=[],disks=[],bios={}}={}){
  return {
    machine:{
      manufacturer:valid(system.manufacturer),
      model:valid(system.model),
      version:valid(system.version),
      boardManufacturer:valid(baseboard.manufacturer),
      boardModel:valid(baseboard.model),
      biosVendor:valid(bios.vendor),
      biosVersion:valid(bios.version)
    },
    ramModules:(Array.isArray(mem)?mem:[]).filter(m=>amount(m.size)!==null).slice(0,16).map(m=>({
      capacityGiB:gib(m.size),type:valid(m.type),speedMhz:amount(m.clockSpeed)||amount(m.clockSpeedConfigured),bank:valid(m.bank),formFactor:valid(m.formFactor)
    })),
    physicalDrives:(Array.isArray(disks)?disks:[]).slice(0,12).map(d=>({
      name:valid(d.name),type:valid(d.type),interfaceType:valid(d.interfaceType),capacityGiB:gib(d.size)
    })),
    certainty:'Detected memory modules are NOT total slot count, maximum supported RAM or confirmed upgradeability. Consult OEM service manual.'
  }
}
function createHardwareInspector({si}){
  if(!si)throw new Error('systeminformation source required')
  async function getInventory(){
    const call=name=>Promise.resolve().then(()=>si[name]()).catch(()=>null)
    const [system,baseboard,mem,disks,bios]=await Promise.all([
      call('system'),call('baseboard'),call('memLayout'),call('diskLayout'),call('bios')
    ])
    return {ok:true,inventory:sanitizeInventory({system:system||{},baseboard:baseboard||{},mem,disks,bios:bios||{}})}
  }
  async function getProcesses(){
    const result=await callProcesses()
    return {ok:true,processes:result}
  }
  async function callProcesses(){
    let snapshot
    try {snapshot=await si.processes()}catch{return []}
    const rows=Array.isArray(snapshot?.list)?snapshot.list:[]
    return rows.filter(x=>typeof x.name==='string' && x.name.trim()).slice(0,5000)
      .map(x=>({
        name:x.name.trim().slice(0,70),
        pid:Number.isInteger(x.pid)&&x.pid>=0?x.pid:null,
        memoryMiB:amount(x.memRss)!==null?Math.round(x.memRss/1048576):null,
        cpuPercent:typeof x.cpu==='number'&&Number.isFinite(x.cpu)?Math.max(0,Math.round(x.cpu*10)/10):null
      }))
      .sort((a,b)=>(b.memoryMiB??0)-(a.memoryMiB??0)).slice(0,12)
  }
  return {getInventory,getProcesses}
}
module.exports={sanitizeInventory,createHardwareInspector}

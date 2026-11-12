import test from 'node:test'
import assert from 'node:assert/strict'
import {OPTIMIZATIONS,PROFILES,PROFILE_IDS,getBottlenecks,sortOptimizations,validateProfiles} from '../src/optimizationCatalog.mjs'
import fixes from '../electron/fixes.cjs'

const GiB=1024**3
const scan={
  cpu:{load:94},
  memory:{total:8*GiB,used:7.4*GiB},
  storage:[{use:98,size:240*GiB,available:5*GiB,mount:'C:'}],
  temperature:{main:0,max:0}
}
test('all optimization options have a unique ID, safety disclosure, source, and supported action',()=>{
  assert.ok(OPTIMIZATIONS.length>=20)
  assert.equal(new Set(OPTIMIZATIONS.map(x=>x.id)).size,OPTIMIZATIONS.length)
  for(const x of OPTIMIZATIONS){
    assert.ok(['Gaming','Windows','Network','Storage'].includes(x.category),x.id)
    assert.ok(['Low','Moderate'].includes(x.risk),x.id)
    assert.ok(['guided','confirmed'].includes(x.kind),x.id)
    assert.ok(x.summary.length>25,x.id)
    assert.ok(x.detail.length>25,x.id)
    assert.ok(x.undo.length>20,x.id)
    assert.ok(x.evidence.length>20,x.id)
    assert.ok(x.source.startsWith('https://'),x.id)
    if(x.kind==='guided'){
      assert.ok(Object.hasOwn(fixes.SETTING_PAGES,x.action),'Unknown Windows settings action: '+x.action)
      assert.ok(String(fixes.SETTING_PAGES[x.action]).startsWith('ms-settings:') ||
        ['taskmgr','systempropertiesprotection'].includes(fixes.SETTING_PAGES[x.action]),x.id)
    } else assert.equal(x.action,'fixes')
  }
})
test('presets only link to available catalog entries',()=>{
  assert.equal(validateProfiles(),true)
  assert.equal(PROFILES.length,PROFILE_IDS.length)
  for(const p of PROFILES){
    assert.ok(PROFILE_IDS.includes(p.id))
    assert.ok(p.ids.length>=3)
  }
})
test('real scan prioritizes storage and memory pressure above optional gaming preferences',()=>{
  const findings=getBottlenecks(scan)
  assert.equal(findings[0].severity,'high')
  assert.match(findings[0].detail,/98%/)
  assert.ok(findings.some(x=>/memory/i.test(x.title)))
  assert.ok(findings.some(x=>/CPU/.test(x.title)))
  const sorted=sortOptimizations(OPTIMIZATIONS,scan)
  const index=id=>sorted.findIndex(x=>x.id===id)
  assert.ok(index('storageCleanup')<index('performancePlan'))
  assert.ok(index('taskManager')<index('performancePlan'))
})
test('empty or normal scan does not invent a bottleneck or promise FPS improvement',()=>{
  assert.match(getBottlenecks(null)[0].title,/Run a diagnosis/)
  const quiet={
    cpu:{load:22},
    memory:{total:16*GiB,used:5*GiB},
    storage:[{use:40,size:500*GiB}],
    temperature:{main:55}
  }
  assert.equal(getBottlenecks(quiet)[0].severity,'good')
  assert.equal(sortOptimizations(OPTIMIZATIONS,quiet,['gameMode','graphics']).length,2)
})
test('dangerous system operations are absent from guided catalog',()=>{
  const textBlob=OPTIMIZATIONS.map(x=>x.title+' '+x.detail+' '+x.summary).join(' ').toLowerCase()
  for(const s of ['disable antivirus','disable defender','disable hyper-v','disable vbs','registry cleaner','uninstall windows updates']){
    assert.equal(textBlob.includes(s),false,'Unsafe recommendation: '+s)
  }
})

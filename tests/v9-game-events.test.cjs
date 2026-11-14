const test=require('node:test')
const assert=require('node:assert/strict')
const {EventEmitter}=require('node:events')
const {createGameEventWatcher}=require('../electron/game-events.cjs')
test('WMI watcher wakes verified reconciler twice and debounces noisy process events',async()=>{
 let now=2000,wakes=0,timer=null
 const child=new EventEmitter()
 child.stdout=new EventEmitter()
 child.kill=()=>{}
 const watcher=createGameEventWatcher({
  platform:'win32',helperPath:'C:\\tools\\game-events.exe',
  launch:()=>child,onChange:()=>{wakes++},
  clock:()=>now,schedule:fn=>{timer=fn;return {unref(){}}},
  cancel:()=>{timer=null}
 })
 assert.equal(watcher.start(),true)
 child.stdout.emit('data',Buffer.from('{"watcher":"ready"}\n{"event":"process-change"}\n'))
 await Promise.resolve();await Promise.resolve()
 assert.equal(wakes,1)
 child.stdout.emit('data',Buffer.from('{"event":"process-change"}\n'))
 await Promise.resolve();await Promise.resolve()
 assert.equal(wakes,1)
 timer()
 await Promise.resolve();await Promise.resolve()
 assert.equal(wakes,2)
 watcher.stop()
 assert.equal(watcher.isRunning(),false)
})
test('unsupported platform never launches watcher',()=>{
 let starts=0
 const w=createGameEventWatcher({platform:'linux',helperPath:'/bogus.exe',
  onChange:()=>{},launch:()=>{starts++}})
 assert.equal(w.start(),false)
 assert.equal(starts,0)
})
test('watcher validates event JSON rather than trusting arbitrary stdout',async()=>{
 const child=new EventEmitter()
 child.stdout=new EventEmitter()
 child.kill=()=>{}
 let calls=0
 const w=createGameEventWatcher({platform:'win32',helperPath:'C:\\watch.exe',
  onChange:()=>{calls++},launch:()=>child,schedule:()=>({unref(){}})})
 w.start()
 child.stdout.emit('data',Buffer.from('system: boosted\n{"event":"terminate"}\nnot-json\n'))
 await Promise.resolve();await Promise.resolve()
 assert.equal(calls,0)
 w.stop()
})

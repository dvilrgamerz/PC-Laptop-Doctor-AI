'use strict'
// Read-only WMI notifications wake existing trusted-game reconciliation.
// Neither a WMI event nor a process name grants authority to start Boost.
const path=require('node:path')
const {spawn}=require('node:child_process')
function createGameEventWatcher({helperPath,platform=process.platform,
 onChange,launch=spawn,schedule=setTimeout,cancel=clearTimeout,clock=Date.now}={}){
 if(typeof helperPath!=='string'||typeof onChange!=='function')throw Error('Watcher requires a fixed binary and callback')
 let child=null,stopped=true,last=0,timer=null,line=''
 function wake(){
  const now=clock()
  if(now-last<650)return
  last=now
  Promise.resolve().then(onChange).catch(()=>{})
  if(timer)cancel(timer)
  timer=schedule(()=>{timer=null;if(!stopped)Promise.resolve().then(onChange).catch(()=>{})},1100)
  timer?.unref?.()
 }
 function handle(bytes){
  line+=String(bytes)
  if(line.length>32768){line='';return}
  let i
  while((i=line.indexOf('\n'))>=0){
   const row=line.slice(0,i).trim()
   line=line.slice(i+1)
   if(row.length>512)continue
   try{if(JSON.parse(row)?.event==='process-change')wake()}catch{}
  }
 }
 function start(){
  if(platform!=='win32'||child)return false
  stopped=false;line=''
  try{
   child=launch(helperPath,[],{windowsHide:true,stdio:['ignore','pipe','ignore']})
   child.stdout?.on('data',handle)
   child.on('error',()=>{child=null;stopped=true})
   child.on('close',()=>{child=null;stopped=true})
   return true
  }catch{child=null;stopped=true;return false}
 }
 function stop(){
  stopped=true
  if(timer){cancel(timer);timer=null}
  if(child){const prev=child;child=null;prev.kill()}
 }
 return {start,stop,isRunning:()=>!stopped&&!!child}
}
module.exports={createGameEventWatcher}

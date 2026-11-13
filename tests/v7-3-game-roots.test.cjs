const test=require('node:test')
const assert=require('node:assert/strict')
const {createInstalledGameRoots,safeFolder,safeSteamInstallDir,getSteamInstalledFolder,getEpicInstalledFolder}=require('../electron/installed-game-roots.cjs')
const {gameForProcesses}=require('../electron/autopilot.cjs')

const steamRoot='C:\\Steam'
const lib='D:\\SteamLibrary'
const epicDir='C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'
const steamAcf='"AppState" { "appid" "730" "name" "Counter-Strike 2" "installdir" "Counter-Strike Global Offensive" }'
const epicManifest=JSON.stringify({
 DisplayName:'Fortnite',AppName:'Fortnite',CatalogNamespace:'fn',
 CatalogItemId:'4fe75bbc5a674f4f9b356b5c90567da5',
 InstallLocation:'D:\\EpicGames\\Fortnite',bIsIncompleteInstall:false
})
test('installed-game path parser rejects traversal, arbitrary Windows folders and UNC paths',()=>{
 assert.equal(safeSteamInstallDir('..\\Private'),null)
 assert.equal(safeSteamInstallDir('../Private'),null)
 assert.equal(safeSteamInstallDir('C:\\Windows'),null)
 assert.equal(safeFolder('C:\\Windows\\System32'),null)
 assert.equal(safeFolder('\\\\server\\share\\stuff'),null)
 assert.equal(safeFolder('C:\\'),null)
 assert.equal(getSteamInstalledFolder(steamAcf,lib).root,'d:\\steamlibrary\\steamapps\\common\\counter-strike global offensive')
 assert.equal(getEpicInstalledFolder(epicManifest).root,'d:\\epicgames\\fortnite')
})
test('read-only Steam and Epic manifest scanner resolves installed roots but never reads game content',async()=>{
 const files=[]
 const read={
  async readFile(p){
   files.push(['read',p])
   const name=p.toLowerCase()
   if(name.endsWith('libraryfolders.vdf'))return '"path" "D:\\\\SteamLibrary"'
   if(name.endsWith('appmanifest_730.acf'))return steamAcf
   if(name.endsWith('.item'))return epicManifest
   throw Error('Unexpected path '+p)
  },
  async readdir(p){
   files.push(['list',p])
   const name=p.toLowerCase()
   if(name===('c:\\steam\\steamapps'))return []
   if(name===('d:\\steamlibrary\\steamapps'))return ['appmanifest_730.acf','random.txt']
   if(name===epicDir.toLowerCase())return ['01234567-8888.item','untrusted.exe']
   return []
  },
  async lstat(p){files.push(['stat',p]);return {isFile:()=>true,isSymbolicLink:()=>false,size:500}}
 }
 let clock=Date.UTC(2026,10,12)
 const detector=createInstalledGameRoots({platform:'win32',steamRoots:[steamRoot],epicDir,
  read,now:()=>clock})
 const roots=await detector.list()
 assert.equal(roots.length,2)
 assert.ok(roots.some(g=>g.source==='Steam'&&g.name==='Counter-Strike 2'))
 assert.ok(roots.some(g=>g.source==='Epic Games'&&g.name==='Fortnite'))
 assert.ok(files.every(([verb,p])=>p.toLowerCase().includes('steamapps')||
   p.toLowerCase().includes('epicgameslauncher\\data\\manifests')))
 const number=files.length
 await detector.list()
 assert.equal(files.length,number,'should use 5 minute cache rather than scan manifest folders every tick')
 clock+=6*60*1000
 await detector.list()
 assert.ok(files.length>number)
})
test('running process matching requires being INSIDE the launcher-reported folder',()=>{
 const roots=[{root:'D:\\EpicGames\\Fortnite',name:'Fortnite',source:'Epic Games'}]
 const installed=[{name:'FortniteClient-Win64-Shipping.exe',path:'D:\\EpicGames\\Fortnite\\FortniteGame\\Binaries\\Win64'}]
 const detected=gameForProcesses(installed,[],roots)
 assert.equal(detected.name,'Fortnite')
 assert.equal(detected.source,'Epic Games')
 assert.equal(detected.key,'d:\\epicgames\\fortnite')
 assert.equal(gameForProcesses([{name:'Fortnite.exe',path:'D:\\EpicGames\\FortniteFake'}],[],roots),null)
 assert.equal(gameForProcesses([{name:'Fortnite.exe',path:'C:\\Windows\\System32'}],[],roots),null)
})

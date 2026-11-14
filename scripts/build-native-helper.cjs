'use strict'
// The Windows native helper is built locally for development and again in Windows CI.
// It is not downloaded from the internet, launched elevated, or built in the renderer.
const fs=require('node:fs')
const path=require('node:path')
const {execFileSync}=require('node:child_process')
if(process.platform!=='win32')throw Error('The PC Doctor Win32 helper can only be built on Windows.')
const root=path.join(__dirname,'..')
const vswhere=path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)',
 'Microsoft Visual Studio','Installer','vswhere.exe')
if(!fs.existsSync(vswhere))throw Error('Microsoft Visual C++ Build Tools not found (vswhere missing).')
const install=execFileSync(vswhere,['-latest','-products','*',
 '-requires','Microsoft.VisualStudio.Component.VC.Tools.x86.x64','-property','installationPath'],
 {encoding:'utf8',timeout:15000,windowsHide:true}).trim()
if(!install)throw Error('Microsoft Visual Studio C++ x64 tools are required.')
const vcvars=path.join(install,'VC','Auxiliary','Build','vcvars64.bat')
if(!fs.existsSync(vcvars))throw Error('Visual Studio vcvars64.bat is missing.')
const out=path.join(root,'native','build')
fs.mkdirSync(out,{recursive:true})
// No user-controlled arguments or shell interpolation; all paths are project-derived.
const command='cl.exe /nologo /std:c++17 /O2 /W4 /WX /MT /EHsc '+
 '/D_UNICODE /DUNICODE /D_WIN32_WINNT=0x0A00 '+
 '/Fo"'+path.join(out,'boost-helper.obj')+'" '+
 '/Fe"'+path.join(out,'boost-helper.exe')+'" '+
 '"'+path.join(root,'native','boost-helper','main.cpp')+'"'
const eventWatcher='cl.exe /nologo /std:c++17 /O2 /W4 /WX /MT /EHsc '+
 '/D_UNICODE /DUNICODE /D_WIN32_WINNT=0x0A00 '+
 '/Fo"'+path.join(out,'game-events.obj')+'" '+
 '/Fe"'+path.join(out,'game-events.exe')+'" '+
 '"'+path.join(root,'native','game-events','main.cpp')+'"'
const batch=path.join(out,'compile-native-helper.cmd')
fs.writeFileSync(batch,['@echo off','call "'+vcvars+'" >nul','if errorlevel 1 exit /b 1',
 command,'if errorlevel 1 exit /b 1',eventWatcher,'exit /b %ERRORLEVEL%',''].join('\r\n'),{encoding:'utf8'})
console.log('Building local native PC Doctor EcoQoS helper with MSVC...')
execFileSync('cmd.exe',['/d','/c',path.join('native','build','compile-native-helper.cmd')],
 {cwd:root,stdio:'inherit',windowsHide:true,timeout:120000})
const exe=path.join(out,'boost-helper.exe')
if(!fs.existsSync(exe)||fs.statSync(exe).size<20000)throw Error('Native boost helper build failed.')
const events=path.join(out,'game-events.exe')
if(!fs.existsSync(events)||fs.statSync(events).size<20000)throw Error('Native WMI game events build failed.')
console.log('Win32 helper built:',exe,'; process watcher built:',events)

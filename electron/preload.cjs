const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('doctor', {
  runDiagnostics: () => ipcRenderer.invoke('doctor:run-diagnostics')
})

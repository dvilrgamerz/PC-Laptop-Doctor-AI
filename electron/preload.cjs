const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('doctor', {
  runDiagnostics: () => ipcRenderer.invoke('doctor:run-diagnostics'),
  getFixStatus: () => ipcRenderer.invoke('doctor:fix-status'),
  runFix: action => ipcRenderer.invoke('doctor:apply-fix', action),
  openSettings: pageId => ipcRenderer.invoke('doctor:open-settings', pageId)
})

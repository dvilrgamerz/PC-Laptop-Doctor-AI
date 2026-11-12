const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('doctor', {
  runDiagnostics: () => ipcRenderer.invoke('doctor:run-diagnostics'),
  getFixStatus: () => ipcRenderer.invoke('doctor:fix-status'),
  runFix: action => ipcRenderer.invoke('doctor:apply-fix', action),
  openSettings: pageId => ipcRenderer.invoke('doctor:open-settings', pageId),
  listLocalModels: () => ipcRenderer.invoke('doctor:local-models'),
  askLocalModel: payload => ipcRenderer.invoke('doctor:local-question', payload),
  getHardwareInventory: () => ipcRenderer.invoke('doctor:hardware-inventory'),
  getTopProcesses: () => ipcRenderer.invoke('doctor:top-processes'),
  runDiskCheck: () => ipcRenderer.invoke('doctor:disk-check'),
  runNetworkQuality: () => ipcRenderer.invoke('doctor:network-quality'),
  getV6Catalog: () => ipcRenderer.invoke('doctor:v6-catalog'),
  previewV6: (id,mode) => ipcRenderer.invoke('doctor:v6-preview',id,mode),
  confirmV6: (id,mode,token) => ipcRenderer.invoke('doctor:v6-confirm',id,mode,token),
  scanSteamLibrary: () => ipcRenderer.invoke('doctor:v6-games'),
  previewMaintenance: action => ipcRenderer.invoke('doctor:maintenance-preview', action),
  applyMaintenance: (action, token) => ipcRenderer.invoke('doctor:maintenance-apply', action, token),
  getMaintenanceHistory: () => ipcRenderer.invoke('doctor:maintenance-history'),
  clearMaintenanceLog: () => ipcRenderer.invoke('doctor:maintenance-clear-log')
})

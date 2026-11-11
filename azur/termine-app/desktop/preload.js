const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  info: () => ipcRenderer.invoke('app:info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s) => ipcRenderer.invoke('settings:set', s),
  loadLocal: () => ipcRenderer.invoke('local:load'),
  saveLocal: (json) => ipcRenderer.invoke('local:save', json),
  kbCloud: () => ipcRenderer.invoke('kb:cloud'),
  openCalendar: (name, text) => ipcRenderer.invoke('calendar:open', name, text),
  copy: (text) => ipcRenderer.invoke('clip:write', text),
  getMini: () => ipcRenderer.invoke('win:get-mini'),
  setMini: (on) => ipcRenderer.invoke('win:set-mini', on),
  onMini: (fn) => ipcRenderer.on('mini', (_e, v) => fn(v)),
});

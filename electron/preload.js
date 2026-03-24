const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // App control
  quit: () => ipcRenderer.invoke("app:quit"),
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),

  // File dialogs
  openFiles: () => ipcRenderer.invoke("dialog:openFiles"),
  openFolder: () => ipcRenderer.invoke("dialog:openFolder"),
  readFileAsBase64: (filePath) =>
    ipcRenderer.invoke("file:readAsBase64", filePath),

  // Persistent storage
  storageGet: (key) => ipcRenderer.invoke("storage:get", key),
  storageSet: (key, value) => ipcRenderer.invoke("storage:set", key, value),
  storageGetAll: () => ipcRenderer.invoke("storage:getAll"),

  // Uptime
  getUptime: () => ipcRenderer.invoke("get-uptime"),
  // Check if running in electron
  isElectron: true,
});

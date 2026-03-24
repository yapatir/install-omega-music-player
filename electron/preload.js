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

  // External links
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke("updater:check"),
  downloadUpdate: () => ipcRenderer.invoke("updater:download"),
  installUpdate: () => ipcRenderer.invoke("updater:install"),

  onUpdate: (callback) => {
    const handlers = {
      "update:checking": () => callback("checking"),
      "update:available": (_, version) => callback("available", version),
      "update:not-available": () => callback("none"),
      "update:downloaded": () => callback("downloaded"),
      "update:progress": (_, percent) => callback("progress", percent),
      "update:error": (_, msg) => callback("error", msg),
    };

    for (const [channel, handler] of Object.entries(handlers)) {
      ipcRenderer.on(channel, handler);
    }

    return () => {
      for (const [channel, handler] of Object.entries(handlers)) {
        ipcRenderer.removeListener(channel, handler);
      }
    };
  },

  isElectron: true,
});

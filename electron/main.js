const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.ELECTRON_ENV === "dev" ||
  (!app.isPackaged &&
    !fs.existsSync(path.join(__dirname, "../build/index.html")));

// Don't auto-download — wait for user to confirm
autoUpdater.autoDownload = false;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#0a0a0f",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../public/icon.png"),
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("console-message", (event, level, message) => {
    if (message.includes("dragEvent is not defined")) event.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();
  // Silently check on startup, no auto-download
  if (!isDev) autoUpdater.checkForUpdates().catch(() => {});
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

// ── Auto-updater events ───────────────────────────────────
autoUpdater.on("checking-for-update", () => {
  mainWindow?.webContents.send("update:checking");
});

autoUpdater.on("update-available", (info) => {
  mainWindow?.webContents.send("update:available", info.version);
});

autoUpdater.on("update-not-available", () => {
  mainWindow?.webContents.send("update:not-available");
});

autoUpdater.on("download-progress", (progress) => {
  mainWindow?.webContents.send("update:progress", progress.percent);
});

autoUpdater.on("update-downloaded", () => {
  mainWindow?.webContents.send("update:downloaded");
});

autoUpdater.on("error", (err) => {
  mainWindow?.webContents.send("update:error", err.message);
});

// ── IPC Handlers ──────────────────────────────────────────
ipcMain.handle("app:quit", () => app.quit());
ipcMain.handle("window:minimize", () => mainWindow?.minimize());
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle("window:close", () => mainWindow?.close());

// Shell
ipcMain.handle("shell:openExternal", (_, url) => shell.openExternal(url));

// Updater
ipcMain.handle("updater:check", () => {
  autoUpdater.checkForUpdates().catch(() => {});
});
ipcMain.handle("updater:download", () => {
  autoUpdater.downloadUpdate().catch(() => {});
});
ipcMain.handle("updater:install", () => autoUpdater.quitAndInstall());

// Uptime
let startTime = Date.now();
ipcMain.handle("get-uptime", () => startTime);

// File dialogs
ipcMain.handle("dialog:openFiles", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Audio Files",
        extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus"],
      },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths.map((filePath) => ({
    path: filePath,
    name: path.basename(filePath, path.extname(filePath)),
    ext: path.extname(filePath).replace(".", ""),
    size: fs.statSync(filePath).size,
  }));
});

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (result.canceled) return null;
  const dir = result.filePaths[0];
  const audioExts = [".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".opus"];
  const files = fs
    .readdirSync(dir)
    .filter((f) => audioExts.includes(path.extname(f).toLowerCase()))
    .map((f) => ({
      path: path.join(dir, f),
      name: path.basename(f, path.extname(f)),
      ext: path.extname(f).replace(".", ""),
      size: fs.statSync(path.join(dir, f)).size,
    }));
  return { dir, files };
});

ipcMain.handle("file:readAsBase64", async (_, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).replace(".", "").toLowerCase();
    const mimeMap = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      flac: "audio/flac",
      aac: "audio/aac",
      m4a: "audio/mp4",
      opus: "audio/opus",
    };
    return `data:${mimeMap[ext] || "audio/mpeg"};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
});

ipcMain.handle("storage:get", async (_, key) => {
  const storePath = path.join(app.getPath("userData"), "omega-data.json");
  try {
    if (!fs.existsSync(storePath)) return null;
    return JSON.parse(fs.readFileSync(storePath, "utf-8"))[key] ?? null;
  } catch {
    return null;
  }
});

ipcMain.handle("storage:set", async (_, key, value) => {
  const storePath = path.join(app.getPath("userData"), "omega-data.json");
  try {
    let data = {};
    if (fs.existsSync(storePath))
      data = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    data[key] = value;
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle("storage:getAll", async () => {
  const storePath = path.join(app.getPath("userData"), "omega-data.json");
  try {
    if (!fs.existsSync(storePath)) return {};
    return JSON.parse(fs.readFileSync(storePath, "utf-8"));
  } catch {
    return {};
  }
});

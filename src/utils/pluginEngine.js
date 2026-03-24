import { loadPackagesIntoContext, parseRequires } from "./packageManager";
// src/utils/pluginEngine.js
// Sandboxed plugin runner with permission system

export const PERMISSIONS = {
  LIBRARY_READ: {
    id: "library.read",
    label: "Read your music library",
    icon: "📚",
    risk: "low",
  },
  LIBRARY_WRITE: {
    id: "library.write",
    label: "Add/remove songs & playlists",
    icon: "✏️",
    risk: "medium",
  },
  PLAYER_READ: {
    id: "player.read",
    label: "See currently playing track",
    icon: "▶️",
    risk: "low",
  },
  PLAYER_CONTROL: {
    id: "player.control",
    label: "Control playback (play/pause/skip)",
    icon: "🎮",
    risk: "medium",
  },
  STORAGE_READ: {
    id: "storage.read",
    label: "Read plugin settings/data",
    icon: "💾",
    risk: "low",
  },
  STORAGE_WRITE: {
    id: "storage.write",
    label: "Save plugin settings/data",
    icon: "💾",
    risk: "low",
  },
  NETWORK: {
    id: "network",
    label: "Make network requests (fetch)",
    icon: "🌐",
    risk: "medium",
  },
  UI_PAGE: {
    id: "ui.page",
    label: "Add a page to the navigation",
    icon: "🖥️",
    risk: "low",
  },
  UI_VISUALIZER: {
    id: "ui.visualizer",
    label: "Render a custom visualizer",
    icon: "🎨",
    risk: "low",
  },
  METADATA: {
    id: "metadata",
    label: "Read/write song metadata & tags",
    icon: "🏷️",
    risk: "medium",
  },
};

export const RISK_COLORS = {
  low: "#4ade80",
  medium: "#fb923c",
  high: "#f87171",
};

// ── Plugin manifest parser ─────────────────────────────────
export function parsePluginManifest(code) {
  // Plugins must export a manifest object at the top:
  // /** @omega-plugin
  //  * @name My Plugin
  //  * @version 1.0.0
  //  * @description Does cool stuff
  //  * @author You
  //  * @permissions library.read, player.read, ui.page
  //  */
  const manifestMatch = code.match(/\/\*\*\s*@omega-plugin([\s\S]*?)\*\//);
  if (!manifestMatch) throw new Error("Missing @omega-plugin manifest comment");

  const block = manifestMatch[1];
  const get = (tag) => {
    const m = block.match(new RegExp(`@${tag}\\s+(.+)`));
    return m ? m[1].trim() : "";
  };

  const name = get("name");
  const version = get("version") || "1.0.0";
  const description = get("description");
  const author = get("author") || "Unknown";
  const permsRaw = get("permissions");

  if (!name) throw new Error("Plugin must have a @name");

  const permissions = permsRaw
    ? permsRaw
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // Validate permissions
  const validIds = Object.values(PERMISSIONS).map((p) => p.id);
  const invalid = permissions.filter((p) => !validIds.includes(p));
  if (invalid.length)
    throw new Error(`Unknown permissions: ${invalid.join(", ")}`);

  return { name, version, description, author, permissions };
}

// ── Build sandboxed API for plugin ────────────────────────
export function buildPluginAPI(manifest, appContext, pluginStorage) {
  const perms = new Set(manifest.permissions);
  const guard = (perm, fn) => {
    if (!perms.has(perm)) {
      return () => {
        throw new Error(`Permission denied: ${perm}`);
      };
    }
    return fn;
  };

  return {
    // ── Library ──
    library: {
      getSongs: guard("library.read", () =>
        appContext.library.map((s) => ({ ...s })),
      ),
      getPlaylists: guard("library.read", () =>
        appContext.playlists.map((p) => ({ ...p })),
      ),
      getFavorites: guard("library.read", () =>
        appContext.favorites.map((s) => ({ ...s })),
      ),
      addSongs: guard("library.write", (songs) =>
        appContext.addToLibrary(songs),
      ),
      createPlaylist: guard("library.write", (name) =>
        appContext.createPlaylist(name),
      ),
      addToPlaylist: guard("library.write", (plId, song) =>
        appContext.addToPlaylist(plId, song),
      ),
    },

    // ── Player ──
    player: {
      getCurrentSong: guard("player.read", () =>
        appContext.currentSong ? { ...appContext.currentSong } : null,
      ),
      isPlaying: guard("player.read", () => appContext.isPlaying),
      getVolume: guard("player.read", () => appContext.volume),
      play: guard("player.control", (song, queue) =>
        appContext.playSong(song, queue),
      ),
      pause: guard("player.control", () => appContext.setIsPlaying(false)),
      resume: guard("player.control", () => appContext.setIsPlaying(true)),
      setVolume: guard("player.control", (v) =>
        appContext.setVolume(Math.max(0, Math.min(1, v))),
      ),
    },

    // ── Storage (scoped per plugin) ──
    storage: {
      get: guard("storage.read", (key) => {
        const data = pluginStorage.get(manifest.name) || {};
        return key ? data[key] : data;
      }),
      set: guard("storage.write", (key, value) => {
        const data = pluginStorage.get(manifest.name) || {};
        data[key] = value;
        pluginStorage.set(manifest.name, data);
      }),
      delete: guard("storage.write", (key) => {
        const data = pluginStorage.get(manifest.name) || {};
        delete data[key];
        pluginStorage.set(manifest.name, data);
      }),
    },

    // ── Network (guarded fetch) ──
    fetch: guard("network", async (url, options = {}) => {
      // Block local/internal URLs
      const blocked = ["localhost", "127.0.0.1", "0.0.0.0", "file://"];
      if (blocked.some((b) => url.includes(b))) {
        throw new Error("Plugins cannot fetch local/internal URLs");
      }
      const res = await window.fetch(url, {
        ...options,
        headers: { ...options.headers },
      });
      return {
        ok: res.ok,
        status: res.status,
        json: () => res.json(),
        text: () => res.text(),
      };
    }),

    // ── UI ──
    ui: {
      // Plugin registers a render function that returns an HTML string or React-like tree
      registerPage: guard("ui.page", (config) => {
        // Handled by plugin manager, this is a no-op marker
        return { type: "page", ...config };
      }),
      registerVisualizer: guard("ui.visualizer", (config) => {
        return { type: "visualizer", ...config };
      }),
      // Toast notification
      toast: (message, type = "info") => {
        window.dispatchEvent(
          new CustomEvent("omega:toast", { detail: { message, type } }),
        );
      },
    },

    // ── Metadata / tags ──
    metadata: {
      getTag: guard("metadata", (songId, tag) => {
        const song = appContext.library.find((s) => s.id === songId);
        return song?.tags?.[tag] ?? null;
      }),
      setTag: guard("metadata", async (songId, tag, value) => {
        // This mutates via addToLibrary update — simplified
        const songs = appContext.library.map((s) =>
          s.id === songId
            ? { ...s, tags: { ...(s.tags || {}), [tag]: value } }
            : s,
        );
        await appContext.addToLibrary(songs.filter((s) => s.id === songId));
      }),
    },

    // ── Events ──
    on: (event, callback) => {
      const handler = (e) => callback(e.detail);
      window.addEventListener(`omega:${event}`, handler);
      return () => window.removeEventListener(`omega:${event}`, handler);
    },

    // ── Utils ──
    utils: {
      formatTime: (ms) => {
        if (!ms) return "0:00";
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
      },
      version: "1.0.0",
    },
  };
}

// ── Execute plugin code in sandbox ────────────────────────
export function executePlugin(code, api) {
  // Load any declared packages into context
  const requires = parseRequires(code);
  const pkgNames = requires.map((r) => r.name);
  const packages = pkgNames.length > 0 ? loadPackagesIntoContext(pkgNames) : {};

  // Build arg list: omega + each package by name
  const pkgKeys = Object.keys(packages);
  const pkgVals = pkgKeys.map((k) => packages[k]);

  const sandboxedCode = `
    "use strict";
    return (function(omega, ${pkgKeys.join(", ")}) {
      ${code}
    })(omega, ${pkgKeys.map((_, i) => `__pkg${i}__`).join(", ")});
  `;

  try {
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      "omega",
      ...pkgKeys.map((_, i) => `__pkg${i}__`),
      sandboxedCode,
    );
    return factory(api, ...pkgVals);
  } catch (err) {
    throw new Error(`Plugin execution error: ${err.message}`);
  }
}

// ── Generate plugin ID ─────────────────────────────────────
export function generatePluginId(name) {
  return `plugin-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
}

// src/context/PluginContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import {
  parsePluginManifest, buildPluginAPI, executePlugin,
  generatePluginId, PERMISSIONS,
} from '../utils/pluginEngine';

const PluginContext = createContext(null);

const STORAGE_KEY = 'omega_plugins';
const PLUGIN_DATA_KEY = 'omega_plugin_data';

function loadFromStorage(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}

function saveToStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function PluginProvider({ children }) {
  const appContext = useApp();

  const [plugins, setPlugins]             = useState([]);       // installed plugins metadata
  const [activePlugins, setActivePlugins] = useState({});       // id -> plugin instance/exports
  const [pendingInstall, setPendingInstall] = useState(null);   // plugin awaiting permission approval
  const [toasts, setToasts]               = useState([]);
  const pluginStorageRef = useRef(new Map());

  // ── Load installed plugins on mount ──
  useEffect(() => {
    const saved = loadFromStorage(STORAGE_KEY) || [];
    const pluginData = loadFromStorage(PLUGIN_DATA_KEY) || {};

    // Restore plugin storage
    Object.entries(pluginData).forEach(([k, v]) => pluginStorageRef.current.set(k, v));

    setPlugins(saved);

    // Re-run enabled plugins
    saved.filter(p => p.enabled).forEach(p => {
      runPlugin(p, p.code);
    });

    // Toast listener
    const handler = (e) => addToast(e.detail.message, e.detail.type);
    window.addEventListener('omega:toast', handler);
    return () => window.removeEventListener('omega:toast', handler);
  }, []);

  // ── Persist plugin data when it changes ──
  const persistPluginData = () => {
    const obj = {};
    pluginStorageRef.current.forEach((v, k) => { obj[k] = v; });
    saveToStorage(PLUGIN_DATA_KEY, obj);
  };

  // ── Toast system ──
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // ── Run plugin code ──
  const runPlugin = (meta, code) => {
    try {
      const storage = {
        get: (name) => pluginStorageRef.current.get(name),
        set: (name, val) => {
          pluginStorageRef.current.set(name, val);
          persistPluginData();
        },
      };

      const api = buildPluginAPI(meta.manifest, appContext, storage);
      const result = executePlugin(code, api);
      setActivePlugins(prev => ({ ...prev, [meta.id]: { result, meta } }));
      return true;
    } catch (err) {
      console.error(`[Plugin: ${meta.manifest.name}]`, err);
      addToast(`Plugin "${meta.manifest.name}" error: ${err.message}`, 'error');
      return false;
    }
  };

  // ── Upload & parse plugin file ──
  const uploadPlugin = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const code = e.target.result;
        try {
          const manifest = parsePluginManifest(code);
          // Check if already installed
          const existing = plugins.find(p => p.manifest.name === manifest.name);
          setPendingInstall({ code, manifest, isUpdate: !!existing, existingId: existing?.id });
          resolve(manifest);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // ── Confirm install (after permission approval) ──
  const confirmInstall = (grantedPermissions) => {
    if (!pendingInstall) return;
    const { code, manifest, isUpdate, existingId } = pendingInstall;

    const pluginMeta = {
      id:          isUpdate ? existingId : generatePluginId(manifest.name),
      manifest:    { ...manifest, permissions: grantedPermissions },
      code,
      enabled:     true,
      installedAt: isUpdate ? plugins.find(p => p.id === existingId)?.installedAt : Date.now(),
      updatedAt:   Date.now(),
    };

    let updatedPlugins;
    if (isUpdate) {
      updatedPlugins = plugins.map(p => p.id === existingId ? pluginMeta : p);
    } else {
      updatedPlugins = [...plugins, pluginMeta];
    }

    setPlugins(updatedPlugins);
    saveToStorage(STORAGE_KEY, updatedPlugins);
    runPlugin(pluginMeta, code);
    setPendingInstall(null);
    addToast(`Plugin "${manifest.name}" ${isUpdate ? 'updated' : 'installed'}!`, 'success');
  };

  const cancelInstall = () => setPendingInstall(null);

  // ── Toggle enable/disable ──
  const togglePlugin = (id) => {
    const plugin = plugins.find(p => p.id === id);
    if (!plugin) return;
    const updated = plugins.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPlugins(updated);
    saveToStorage(STORAGE_KEY, updated);

    if (plugin.enabled) {
      // Disable: remove from active
      setActivePlugins(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // Enable: re-run
      runPlugin({ ...plugin, enabled: true }, plugin.code);
    }
  };

  // ── Uninstall ──
  const uninstallPlugin = (id) => {
    const updated = plugins.filter(p => p.id !== id);
    setPlugins(updated);
    saveToStorage(STORAGE_KEY, updated);
    setActivePlugins(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // Clear plugin storage
    const plugin = plugins.find(p => p.id === id);
    if (plugin) pluginStorageRef.current.delete(plugin.manifest.name);
    persistPluginData();
    addToast('Plugin uninstalled', 'info');
  };

  // ── Get pages registered by plugins ──
  const getPluginPages = () => {
    const pages = [];
    Object.values(activePlugins).forEach(({ result, meta }) => {
      if (result?.type === 'page') {
        pages.push({ ...result, pluginId: meta.id, pluginName: meta.manifest.name });
      }
      if (Array.isArray(result)) {
        result.filter(r => r?.type === 'page').forEach(r =>
          pages.push({ ...r, pluginId: meta.id, pluginName: meta.manifest.name })
        );
      }
    });
    return pages;
  };

  return (
    <PluginContext.Provider value={{
      plugins, activePlugins,
      pendingInstall, setPendingInstall,
      uploadPlugin, confirmInstall, cancelInstall,
      togglePlugin, uninstallPlugin,
      getPluginPages,
      toasts,
      PERMISSIONS,
    }}>
      {children}
    </PluginContext.Provider>
  );
}

export const usePlugins = () => {
  const ctx = useContext(PluginContext);
  if (!ctx) throw new Error('usePlugins must be used within PluginProvider');
  return ctx;
};
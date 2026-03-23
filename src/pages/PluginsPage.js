// src/pages/PluginsPage.js
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usePlugins } from '../context/PluginContext';
import { PERMISSIONS, RISK_COLORS } from '../utils/pluginEngine';
import './PluginsPage.css';

// ── Permission grant dialog ─────────────────────────────────
function PermissionDialog({ pending, onConfirm, onCancel }) {
  const { manifest, isUpdate } = pending;
  const allPerms = Object.values(PERMISSIONS);
  const requested = allPerms.filter(p => manifest.permissions.includes(p.id));
  const [granted, setGranted] = useState(new Set(manifest.permissions));

  const toggle = (id) => {
    setGranted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="perm-dialog" onClick={e => e.stopPropagation()}>
        <div className="perm-dialog__header">
          <div className="perm-dialog__plugin-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
          </div>
          <div>
            <h3>{isUpdate ? 'Update' : 'Install'} Plugin</h3>
            <span className="perm-dialog__name">{manifest.name} <span className="perm-dialog__version">v{manifest.version}</span></span>
          </div>
        </div>

        {manifest.description && (
          <p className="perm-dialog__desc">{manifest.description}</p>
        )}
        <p className="perm-dialog__author">by {manifest.author}</p>

        {requested.length > 0 ? (
          <>
            <div className="perm-dialog__section-label">
              This plugin requests these permissions. Uncheck any you want to deny:
            </div>
            <div className="perm-dialog__perms">
              {requested.map(perm => (
                <label key={perm.id} className={`perm-item ${!granted.has(perm.id) ? 'perm-item--denied' : ''}`}>
                  <input
                    type="checkbox"
                    checked={granted.has(perm.id)}
                    onChange={() => toggle(perm.id)}
                    className="perm-item__checkbox"
                  />
                  <span className="perm-item__icon">{perm.icon}</span>
                  <div className="perm-item__info">
                    <span className="perm-item__label">{perm.label}</span>
                    <span className="perm-item__id">{perm.id}</span>
                  </div>
                  <span
                    className="perm-item__risk"
                    style={{ color: RISK_COLORS[perm.risk] }}
                  >
                    {perm.risk}
                  </span>
                </label>
              ))}
            </div>
          </>
        ) : (
          <div className="perm-dialog__no-perms">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            This plugin requests no special permissions
          </div>
        )}

        <div className="perm-dialog__warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Only install plugins from sources you trust.
        </div>

        <div className="perm-dialog__actions">
          <button className="btn btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onConfirm([...granted])}>
            {isUpdate ? 'Update' : 'Install'} Plugin
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plugin card ─────────────────────────────────────────────
function PluginCard({ plugin, onToggle, onUninstall }) {
  const [showCode, setShowCode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { manifest, enabled, installedAt } = plugin;
  const perms = Object.values(PERMISSIONS).filter(p => manifest.permissions.includes(p.id));

  return (
    <div className={`plugin-card ${!enabled ? 'plugin-card--disabled' : ''}`}>
      <div className="plugin-card__header">
        <div className="plugin-card__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
        </div>
        <div className="plugin-card__meta">
          <span className="plugin-card__name">{manifest.name}</span>
          <span className="plugin-card__version">v{manifest.version} · by {manifest.author}</span>
        </div>
        <div className="plugin-card__actions">
          {/* Toggle */}
          <button
            className={`toggle-switch ${enabled ? 'toggle-switch--on' : ''}`}
            onClick={() => onToggle(plugin.id)}
            title={enabled ? 'Disable' : 'Enable'}
          >
            <span className="toggle-switch__thumb" />
          </button>
        </div>
      </div>

      {manifest.description && (
        <p className="plugin-card__desc">{manifest.description}</p>
      )}

      {/* Permissions badges */}
      {perms.length > 0 && (
        <div className="plugin-card__perms">
          {perms.map(p => (
            <span key={p.id} className="perm-badge" title={p.label}>
              {p.icon} {p.id}
            </span>
          ))}
        </div>
      )}

      <div className="plugin-card__footer">
        <span className="plugin-card__date">
          Installed {new Date(installedAt).toLocaleDateString()}
        </span>
        <div className="plugin-card__footer-actions">
          <button
            className="plugin-card__btn"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide Code' : 'View Code'}
          </button>
          {!confirmDelete ? (
            <button
              className="plugin-card__btn plugin-card__btn--danger"
              onClick={() => setConfirmDelete(true)}
            >
              Uninstall
            </button>
          ) : (
            <div className="confirm-inline">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sure?</span>
              <button className="btn btn--danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onUninstall(plugin.id)}>Yes</button>
              <button className="btn btn--secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmDelete(false)}>No</button>
            </div>
          )}
        </div>
      </div>

      {showCode && (
        <pre className="plugin-card__code">{plugin.code}</pre>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────
export default function PluginsPage() {
  const { t } = useApp();
  const {
    plugins, pendingInstall,
    uploadPlugin, confirmInstall, cancelInstall,
    togglePlugin, uninstallPlugin,
    PERMISSIONS: PERMS,
  } = usePlugins();

  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith('.js')) {
      setUploadError('Only .js files are supported');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      await uploadPlugin(file);
    } catch (err) {
      setUploadError(err.message);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="plugins-page">
      {/* Permission dialog */}
      {pendingInstall && (
        <PermissionDialog
          pending={pendingInstall}
          onConfirm={confirmInstall}
          onCancel={cancelInstall}
        />
      )}

      <div className="plugins-page__header">
        <div>
          <h1>Plugins</h1>
          <p className="plugins-page__subtitle">
            Extend Omega with JavaScript plugins
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => fileRef.current?.click()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Install Plugin
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".js"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      <div className="plugins-page__body">
        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? 'drop-zone--over' : ''} ${uploading ? 'drop-zone--loading' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          {uploading
            ? <><span className="spin" style={{ fontSize: 24 }}>⟳</span><span>Reading plugin...</span></>
            : <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/></svg>
                <span>Drop a <strong>.js</strong> plugin file here, or click to browse</span>
              </>
          }
        </div>

        {uploadError && (
          <div className="upload-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {uploadError}
          </div>
        )}

        {/* Installed plugins */}
        {plugins.length > 0 ? (
          <div className="plugins-list">
            <div className="plugins-list__header">
              Installed ({plugins.length}) · {plugins.filter(p => p.enabled).length} active
            </div>
            {plugins.map(plugin => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={togglePlugin}
                onUninstall={uninstallPlugin}
              />
            ))}
          </div>
        ) : (
          <div className="plugins-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>
            <p>No plugins installed yet</p>
            <span>Upload a .js file to get started</span>
          </div>
        )}

        {/* Docs */}
        <div className="plugin-docs">
          <h3>Writing a Plugin</h3>
          <p>Create a <code>.js</code> file with an <code>@omega-plugin</code> manifest:</p>
          <pre className="plugin-docs__code">{`/** @omega-plugin
 * @name My Plugin
 * @version 1.0.0
 * @description Does something cool
 * @author You
 * @permissions library.read, player.read, ui.page
 */

// omega API is injected automatically
const songs = omega.library.getSongs();
omega.ui.toast(\`Library has \${songs.length} songs!\`);

// Register a page in the nav
return omega.ui.registerPage({
  id: 'my-plugin-page',
  label: 'My Plugin',
  icon: '🎵',
  render: () => \`
    <div style="padding:24px;color:white">
      <h2>Hello from plugin!</h2>
      <p>\${songs.length} songs in library</p>
    </div>
  \`,
});`}</pre>
          <div className="plugin-docs__perms-table">
            <div className="plugin-docs__perms-title">Available Permissions</div>
            {Object.values(PERMS).map(p => (
              <div key={p.id} className="plugin-docs__perm-row">
                <span>{p.icon}</span>
                <code>{p.id}</code>
                <span>{p.label}</span>
                <span style={{ color: RISK_COLORS[p.risk] }}>{p.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
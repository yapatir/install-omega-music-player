// src/pages/PluginsPage.js
import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { usePlugins } from "../context/PluginContext";
import { PERMISSIONS, RISK_COLORS } from "../utils/pluginEngine";
import { fetchPackageInfo } from "../utils/packageManager";
import "./PluginsPage.css";

// ── Permission + Package dialog ────────────────────────────
function PermissionDialog({ pending, onConfirm, onCancel, installingPkgs }) {
  const { manifest, missingPackages = [] } = pending;
  const allPerms = Object.values(PERMISSIONS);
  const requested = allPerms.filter((p) => manifest.permissions.includes(p.id));
  const [granted, setGranted] = useState(new Set(manifest.permissions));
  const [pkgGrants, setPkgGrants] = useState(
    new Set(missingPackages.map((p) => p.name)),
  );
  const [step, setStep] = useState(
    missingPackages.length > 0 ? "packages" : "permissions",
  );

  const togglePerm = (id) =>
    setGranted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const togglePkg = (name) =>
    setPkgGrants((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const handleConfirm = () => {
    const pkgsToInstall = missingPackages.filter((p) => pkgGrants.has(p.name));
    onConfirm([...granted], pkgsToInstall);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="perm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="perm-dialog__header">
          <div className="perm-dialog__plugin-icon">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
              <line x1="16" y1="8" x2="2" y2="22" />
              <line x1="17.5" y1="15" x2="9" y2="15" />
            </svg>
          </div>
          <div>
            <h3>{pending.isUpdate ? "Update" : "Install"} Plugin</h3>
            <span className="perm-dialog__name">
              {manifest.name}{" "}
              <span className="perm-dialog__version">v{manifest.version}</span>
            </span>
          </div>
        </div>

        {manifest.description && (
          <p className="perm-dialog__desc">{manifest.description}</p>
        )}
        <p className="perm-dialog__author">by {manifest.author}</p>

        {missingPackages.length > 0 && (
          <div className="perm-dialog__steps">
            <button
              className={`perm-step-tab ${step === "packages" ? "active" : ""}`}
              onClick={() => setStep("packages")}
            >
              <span className="perm-step-num">1</span> Packages
              <span className="perm-step-badge">{missingPackages.length}</span>
            </button>
            <div className="perm-step-divider" />
            <button
              className={`perm-step-tab ${step === "permissions" ? "active" : ""}`}
              onClick={() => setStep("permissions")}
            >
              <span className="perm-step-num">2</span> Permissions
            </button>
          </div>
        )}

        {step === "packages" && (
          <div className="perm-dialog__section">
            <div className="perm-dialog__section-label">
              This plugin requires these packages. Uncheck any you want to skip:
            </div>
            <div className="perm-dialog__perms">
              {missingPackages.map((pkg) => (
                <label
                  key={pkg.name}
                  className={`perm-item ${!pkgGrants.has(pkg.name) ? "perm-item--denied" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={pkgGrants.has(pkg.name)}
                    onChange={() => togglePkg(pkg.name)}
                    className="perm-item__checkbox"
                  />
                  <span className="perm-item__icon">📦</span>
                  <div className="perm-item__info">
                    <span className="perm-item__label">
                      {pkg.name}
                      {pkg.version ? `@${pkg.version}` : ""}
                    </span>
                    <span className="perm-item__id">
                      {pkg.type === "npm" ? "npm / CDN (unpkg)" : "custom file"}
                    </span>
                  </div>
                  <span
                    className="perm-item__risk"
                    style={{ color: "#60a5fa" }}
                  >
                    cdn
                  </span>
                </label>
              ))}
            </div>
            <div className="perm-dialog__actions" style={{ marginTop: 12 }}>
              <button className="btn btn--secondary" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setStep("permissions")}
              >
                Next: Permissions →
              </button>
            </div>
          </div>
        )}

        {step === "permissions" && (
          <div className="perm-dialog__section">
            {requested.length > 0 ? (
              <>
                <div className="perm-dialog__section-label">
                  Review and grant permissions:
                </div>
                <div className="perm-dialog__perms">
                  {requested.map((perm) => (
                    <label
                      key={perm.id}
                      className={`perm-item ${!granted.has(perm.id) ? "perm-item--denied" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={granted.has(perm.id)}
                        onChange={() => togglePerm(perm.id)}
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                No special permissions requested
              </div>
            )}
            <div className="perm-dialog__warning">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Only install plugins from sources you trust.
            </div>
            <div className="perm-dialog__actions">
              {missingPackages.length > 0 && (
                <button
                  className="btn btn--secondary"
                  onClick={() => setStep("packages")}
                >
                  ← Packages
                </button>
              )}
              {!missingPackages.length && (
                <button className="btn btn--secondary" onClick={onCancel}>
                  Cancel
                </button>
              )}
              <button
                className="btn btn--primary"
                onClick={handleConfirm}
                disabled={installingPkgs}
              >
                {installingPkgs ? (
                  <>
                    <span className="spin">⟳</span> Installing...
                  </>
                ) : (
                  `${pending.isUpdate ? "Update" : "Install"} Plugin`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Plugin card ────────────────────────────────────────────
function PluginCard({ plugin, onToggle, onUninstall }) {
  const [showCode, setShowCode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { manifest, enabled, installedAt, requires = [] } = plugin;
  const perms = Object.values(PERMISSIONS).filter((p) =>
    manifest.permissions.includes(p.id),
  );

  return (
    <div className={`plugin-card ${!enabled ? "plugin-card--disabled" : ""}`}>
      <div className="plugin-card__header">
        <div className="plugin-card__icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
            <line x1="16" y1="8" x2="2" y2="22" />
            <line x1="17.5" y1="15" x2="9" y2="15" />
          </svg>
        </div>
        <div className="plugin-card__meta">
          <span className="plugin-card__name">{manifest.name}</span>
          <span className="plugin-card__version">
            v{manifest.version} · by {manifest.author}
          </span>
        </div>
        <button
          className={`toggle-switch ${enabled ? "toggle-switch--on" : ""}`}
          onClick={() => onToggle(plugin.id)}
        >
          <span className="toggle-switch__thumb" />
        </button>
      </div>

      {manifest.description && (
        <p className="plugin-card__desc">{manifest.description}</p>
      )}

      {perms.length > 0 && (
        <div className="plugin-card__perms">
          {perms.map((p) => (
            <span key={p.id} className="perm-badge" title={p.label}>
              {p.icon} {p.id}
            </span>
          ))}
        </div>
      )}

      {requires.length > 0 && (
        <div className="plugin-card__deps">
          <span className="plugin-card__deps-label">📦 Deps:</span>
          {requires.map((r) => (
            <span key={r.name} className="dep-badge">
              {r.name}
              {r.version ? `@${r.version}` : ""}
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
            {showCode ? "Hide Code" : "View Code"}
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
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Sure?
              </span>
              <button
                className="btn btn--danger"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={() => onUninstall(plugin.id)}
              >
                Yes
              </button>
              <button
                className="btn btn--secondary"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
      {showCode && <pre className="plugin-card__code">{plugin.code}</pre>}
    </div>
  );
}

// ── OPI — Omega Package Installer ─────────────────────────
function PackageInstaller() {
  const {
    getPackages,
    removePackage,
    getCacheSize,
    clearCache,
    installManualPackage,
    formatBytes,
  } = usePlugins();
  const [tab, setTab] = useState("installed");
  const [pkgInput, setPkgInput] = useState("");
  const [pkgVer, setPkgVer] = useState("");
  const [customFile, setCustomFile] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [pkgInfo, setPkgInfo] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef(null);

  const packages = getPackages();
  const pkgList = Object.values(packages);
  const cacheSize = getCacheSize();

  const handleLookup = async () => {
    if (!pkgInput.trim()) return;
    setFetching(true);
    const info = await fetchPackageInfo(pkgInput.trim());
    setPkgInfo(info);
    if (info.version && info.version !== "unknown") setPkgVer(info.version);
    setFetching(false);
  };

  const handleInstallNpm = async () => {
    if (!pkgInput.trim()) return;
    setInstalling(true);
    await installManualPackage({
      name: pkgInput.trim(),
      version: pkgVer || null,
      type: "npm",
    });
    setPkgInput("");
    setPkgVer("");
    setPkgInfo(null);
    setInstalling(false);
  };

  const handleInstallCustom = async () => {
    if (!customFile) return;
    setInstalling(true);
    const code = await customFile.text();
    await installManualPackage({
      name: customFile.name.replace(".js", ""),
      version: "0.0.0",
      type: "custom",
      customCode: code,
    });
    setCustomFile(null);
    setInstalling(false);
  };

  return (
    <div className="opi">
      <div className="opi__tabs">
        {[
          { id: "installed", label: `Installed (${pkgList.length})` },
          { id: "npm", label: "Install npm / CDN" },
          { id: "custom", label: "Install Custom .js" },
        ].map((t) => (
          <button
            key={t.id}
            className={`opi__tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "installed" && (
        <div className="opi__panel">
          {pkgList.length === 0 ? (
            <div className="opi__empty">
              <span style={{ fontSize: 36 }}>📦</span>
              <p>No packages installed yet</p>
              <span>
                Packages are auto-installed when a plugin that requires them is
                installed,
                <br />
                or install manually from the other tabs.
              </span>
            </div>
          ) : (
            <div className="opi__pkg-list">
              {pkgList.map((pkg) => (
                <div key={pkg.name} className="opi__pkg-item">
                  <div className="opi__pkg-info">
                    <span className="opi__pkg-name">📦 {pkg.name}</span>
                    <span className="opi__pkg-meta">
                      v{pkg.version} · {pkg.type} ·{" "}
                      {formatBytes(pkg.code?.length || 0)}
                    </span>
                  </div>
                  {confirmDel === pkg.name ? (
                    <div className="confirm-inline">
                      <span
                        style={{ fontSize: 12, color: "var(--text-secondary)" }}
                      >
                        Sure?
                      </span>
                      <button
                        className="btn btn--danger"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => {
                          removePackage(pkg.name);
                          setConfirmDel(null);
                        }}
                      >
                        Yes
                      </button>
                      <button
                        className="btn btn--secondary"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => setConfirmDel(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="plugin-card__btn plugin-card__btn--danger"
                      onClick={() => setConfirmDel(pkg.name)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {cacheSize > 0 && (
            <div className="opi__cache-row">
              <span>CDN cache: {formatBytes(cacheSize)}</span>
              <button className="plugin-card__btn" onClick={clearCache}>
                Clear Cache
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "npm" && (
        <div className="opi__panel">
          <p className="opi__panel-desc">
            Install any npm package. Fetched via <strong>unpkg.com</strong> and
            cached locally for offline use after first download.
          </p>
          <div className="opi__input-row">
            <input
              type="text"
              placeholder="Package name (e.g. lodash, axios)"
              value={pkgInput}
              onChange={(e) => {
                setPkgInput(e.target.value);
                setPkgInfo(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              className="settings-input"
              style={{ flex: 1, fontFamily: "monospace" }}
            />
            <input
              type="text"
              placeholder="version (optional)"
              value={pkgVer}
              onChange={(e) => setPkgVer(e.target.value)}
              className="settings-input"
              style={{ width: 140, fontFamily: "monospace" }}
            />
            <button
              className="btn btn--secondary"
              onClick={handleLookup}
              disabled={!pkgInput || fetching}
            >
              {fetching ? <span className="spin">⟳</span> : "Lookup"}
            </button>
          </div>

          {pkgInfo && (
            <div className="opi__pkg-preview">
              <div className="opi__pkg-preview-header">
                <strong>{pkgInfo.name}</strong>
                <span className="dep-badge">v{pkgInfo.version}</span>
                {pkgInfo.license && (
                  <span className="dep-badge">{pkgInfo.license}</span>
                )}
              </div>
              {pkgInfo.description && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--text-secondary)",
                    margin: "6px 0 0",
                  }}
                >
                  {pkgInfo.description}
                </p>
              )}
            </div>
          )}

          <button
            className="btn btn--primary"
            onClick={handleInstallNpm}
            disabled={!pkgInput || installing}
            style={{ marginTop: 12 }}
          >
            {installing ? (
              <>
                <span className="spin">⟳</span> Installing...
              </>
            ) : (
              <>
                📦 Install {pkgInput}
                {pkgVer ? `@${pkgVer}` : ""}
              </>
            )}
          </button>

          <div className="opi__hint">
            <strong>Tip:</strong> Plugins declare dependencies with{" "}
            <code>@requires lodash</code> in their manifest — missing packages
            are auto-detected and you'll be prompted to install them.
          </div>
        </div>
      )}

      {tab === "custom" && (
        <div className="opi__panel">
          <p className="opi__panel-desc">
            Install a custom JavaScript library from a local <code>.js</code>{" "}
            file. Available to plugins via its filename (without{" "}
            <code>.js</code> extension).
          </p>
          <div
            className={`drop-zone ${customFile ? "drop-zone--over" : ""}`}
            style={{ marginBottom: 16 }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setCustomFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".js"
              style={{ display: "none" }}
              onChange={(e) => setCustomFile(e.target.files[0])}
            />
            {customFile ? (
              <>
                <span>📄</span> <strong>{customFile.name}</strong> (
                {formatBytes(customFile.size)})
              </>
            ) : (
              <>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>{" "}
                Drop a .js file or click to browse
              </>
            )}
          </div>
          {customFile && (
            <button
              className="btn btn--primary"
              onClick={handleInstallCustom}
              disabled={installing}
            >
              {installing ? (
                <>
                  <span className="spin">⟳</span> Installing...
                </>
              ) : (
                <>📦 Install {customFile.name}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function PluginsPage() {
  const { t } = useApp();
  const {
    plugins,
    pendingInstall,
    installingPkgs,
    uploadPlugin,
    confirmInstall,
    cancelInstall,
    togglePlugin,
    uninstallPlugin,
    PERMISSIONS: PERMS,
  } = usePlugins();

  const [activeTab, setActiveTab] = useState("plugins");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".js")) {
      setUploadError("Only .js files are supported");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      await uploadPlugin(file);
    } catch (err) {
      setUploadError(err.message);
    }
    setUploading(false);
  };

  return (
    <div className="plugins-page">
      {pendingInstall && (
        <PermissionDialog
          pending={pendingInstall}
          onConfirm={confirmInstall}
          onCancel={cancelInstall}
          installingPkgs={installingPkgs}
        />
      )}

      <div className="plugins-page__header">
        <div>
          <h1>Plugins</h1>
          <p className="plugins-page__subtitle">
            Extend Omega with JavaScript plugins
          </p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => fileRef.current?.click()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Install Plugin
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".js"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <div className="plugins-page__tabs">
        <button
          className={`om-tab ${activeTab === "plugins" ? "active" : ""}`}
          onClick={() => setActiveTab("plugins")}
        >
          Plugins ({plugins.length})
        </button>
        <button
          className={`om-tab ${activeTab === "packages" ? "active" : ""}`}
          onClick={() => setActiveTab("packages")}
        >
          Omega Package Installer [OPI]
        </button>
      </div>

      <div className="plugins-page__body">
        {activeTab === "plugins" && (
          <>
            <div
              className={`drop-zone ${dragOver ? "drop-zone--over" : ""} ${uploading ? "drop-zone--loading" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <>
                  <span className="spin" style={{ fontSize: 24 }}>
                    ⟳
                  </span>
                  <span>Reading plugin...</span>
                </>
              ) : (
                <>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                    <line x1="16" y1="8" x2="2" y2="22" />
                  </svg>
                  <span>
                    Drop a <strong>.js</strong> plugin file here, or click to
                    browse
                  </span>
                </>
              )}
            </div>

            {uploadError && (
              <div className="upload-error">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {uploadError}
              </div>
            )}

            {plugins.length > 0 ? (
              <div className="plugins-list">
                <div className="plugins-list__header">
                  Installed ({plugins.length}) ·{" "}
                  {plugins.filter((p) => p.enabled).length} active
                </div>
                {plugins.map((plugin) => (
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
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                >
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </svg>
                <p>No plugins installed yet</p>
                <span>Upload a .js file to get started</span>
              </div>
            )}

            <div className="plugin-docs">
              <h3>Writing a Plugin</h3>
              <p>
                Use <code>@requires</code> in the manifest to declare npm
                dependencies — they'll be auto-detected on install:
              </p>
              <pre className="plugin-docs__code">{`/** @omega-plugin
 * @name My Plugin
 * @version 1.0.0
 * @description Does something cool
 * @author You
 * @permissions library.read, ui.page
 * @requires lodash
 * @requires axios@1.6.0
 */

// lodash and axios are injected automatically!
const songs = omega.library.getSongs();
const names = lodash.map(songs, 'name');

return omega.ui.registerPage({
  id: 'my-plugin', label: 'My Plugin', icon: '🎵',
  render: () => \`<div style="padding:24px;color:white">
    <p>\${names.length} songs found.</p>
  </div>\`,
});`}</pre>
              <div className="plugin-docs__perms-table">
                <div className="plugin-docs__perms-title">
                  Available Permissions
                </div>
                {Object.values(PERMS).map((p) => (
                  <div key={p.id} className="plugin-docs__perm-row">
                    <span>{p.icon}</span>
                    <code>{p.id}</code>
                    <span>{p.label}</span>
                    <span style={{ color: RISK_COLORS[p.risk] }}>{p.risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "packages" && <PackageInstaller />}
      </div>
    </div>
  );
}

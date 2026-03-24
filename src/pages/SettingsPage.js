import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import "./SettingsPage.css";

// ── Helpers ───────────────────────────────────────────────
const APP_VERSION = process.env.REACT_APP_VERSION || "1.0.0";

function compareSemver(a, b) {
  const parse = (v) => v.replace(/^v/, "").split(".").map(Number);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);
  if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1;
  if (aMin !== bMin) return aMin > bMin ? 1 : -1;
  if (aPat !== bPat) return aPat > bPat ? 1 : -1;
  return 0;
}

function formatRelease(r) {
  const asset = r.assets?.find((a) => a.name.endsWith(".exe"));
  const cmp = compareSemver(r.tag_name, APP_VERSION);
  return {
    version: r.tag_name,
    name: r.name || r.tag_name,
    body: r.body || "",
    publishedAt: new Date(r.published_at).toLocaleDateString(),
    downloadUrl: asset?.browser_download_url || r.html_url,
    releaseUrl: r.html_url,
    isCurrent: cmp === 0,
    isNewer: cmp > 0,
    isOlder: cmp < 0,
  };
}

function openUrl(url) {
  if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
  else window.open(url, "_blank");
}

// ── ApiKeyInput ───────────────────────────────────────────
function ApiKeyInput({ value, onChange, onSave, onTest, testStatus, saved }) {
  const { t } = useApp();
  const [show, setShow] = useState(false);

  return (
    <div className="api-key-input">
      <div className="api-key-input__field">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("apiKeyPlaceholder")}
          className="settings-input"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="api-key-input__toggle"
          onClick={() => setShow((s) => !s)}
        >
          {show ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      <div className="api-key-input__actions">
        <button
          className="btn btn--secondary"
          onClick={onTest}
          disabled={!value || testStatus === "testing"}
        >
          {testStatus === "testing" ? (
            <>
              <span className="spin">⟳</span> {t("testingKey")}
            </>
          ) : (
            t("testKey")
          )}
        </button>
        <button className="btn btn--primary" onClick={onSave} disabled={!value}>
          {saved ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>{" "}
              {t("apiKeySaved")}
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>{" "}
              {t("save")}
            </>
          )}
        </button>
      </div>
      {testStatus === "valid" && (
        <div className="api-key-status api-key-status--ok">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t("keyValid")}
        </div>
      )}
      {testStatus === "invalid" && (
        <div className="api-key-status api-key-status--err">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          {t("keyInvalid")}
        </div>
      )}
    </div>
  );
}

// ── ReleaseRow ────────────────────────────────────────────
function ReleaseRow({ r, type }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`release-row release-row--${type}`}>
      <div className="release-row__main">
        <span className="release-row__ver">{r.version}</span>
        <span className="release-row__date">{r.publishedAt}</span>
        {r.body && (
          <button
            className="release-row__notes-btn"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "hide ▲" : "notes ▼"}
          </button>
        )}
        <div className="release-row__actions">
          {type === "current" && (
            <span className="release-row__installed">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Installed
            </span>
          )}
          {type === "update" && (
            <button
              className="release-row__btn release-row__btn--update"
              onClick={() => openUrl(r.downloadUrl)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Update
            </button>
          )}
          {type === "downgrade" && (
            <button
              className="release-row__btn release-row__btn--downgrade"
              onClick={() => openUrl(r.downloadUrl)}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Downgrade
            </button>
          )}
          <button
            className="release-row__btn release-row__btn--ghost"
            onClick={() => openUrl(r.releaseUrl)}
          >
            GitHub ↗
          </button>
        </div>
      </div>
      {expanded && r.body && (
        <div className="release-row__body">
          {r.body.slice(0, 500)}
          {r.body.length > 500 ? "…" : ""}
        </div>
      )}
    </div>
  );
}

// ── UpdateChecker ─────────────────────────────────────────
function UpdateChecker() {
  const [status, setStatus] = useState("idle");
  const [releases, setReleases] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAllDown, setShowAllDown] = useState(false);
  const [lastChecked, setLastChecked] = useState(
    () => localStorage.getItem("omega_last_update_check") || null,
  );

  const check = useCallback(async () => {
    setStatus("checking");
    setErrorMsg("");
    try {
      const res = await fetch(
        "https://api.github.com/repos/yapatir/omega/releases?per_page=20",
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": `Omega-Music-Player/${APP_VERSION}`,
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );

      if (res.status === 403 || res.status === 429) {
        const reset = res.headers.get("x-ratelimit-reset");
        const time = reset
          ? new Date(parseInt(reset) * 1000).toLocaleTimeString()
          : null;
        throw new Error(
          time ? `Rate limit hit. Try again after ${time}.` : "Rate limit hit.",
        );
      }
      if (res.status === 404)
        throw new Error("No releases found on GitHub yet.");
      if (!res.ok) throw new Error(`GitHub returned error ${res.status}.`);

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0)
        throw new Error("No releases found on GitHub yet.");

      const parsed = data
        .filter((r) => r.tag_name && !r.draft)
        .map(formatRelease)
        .sort((a, b) => compareSemver(b.version, a.version));

      setReleases(parsed);
      const now = new Date().toLocaleString();
      localStorage.setItem("omega_last_update_check", now);
      localStorage.setItem("omega_last_update_check_ts", Date.now().toString());
      setLastChecked(now);
      setStatus("done");
    } catch (err) {
      setErrorMsg(
        err.message ||
          "Could not reach GitHub. Check your internet connection.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const lastRaw = localStorage.getItem("omega_last_update_check_ts");
    if (!lastRaw || Date.now() - parseInt(lastRaw) > 60 * 60 * 1000) check();
  }, [check]);

  const updates = releases.filter((r) => r.isNewer);
  const current = releases.find((r) => r.isCurrent);
  const downgrades = releases.filter((r) => r.isOlder);
  const visibleDown = showAllDown ? downgrades : downgrades.slice(0, 3);

  return (
    <div className="update-checker">
      {/* Header row */}
      <div className="update-checker__row">
        <div className="update-checker__info">
          <span className="update-checker__current">
            Current version: <strong>v{APP_VERSION}</strong>
          </span>
          {lastChecked && (
            <span className="update-checker__last">
              Last checked: {lastChecked}
            </span>
          )}
        </div>
        <button
          className="btn btn--secondary"
          onClick={check}
          disabled={status === "checking"}
        >
          {status === "checking" ? (
            <>
              <span className="spin">⟳</span> Checking...
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.56" />
              </svg>{" "}
              Check
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="update-status update-status--err">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* Up to date */}
      {status === "done" && updates.length === 0 && (
        <div className="update-status update-status--ok">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          You're on the latest version!
        </div>
      )}

      {/* Updates section */}
      {updates.length > 0 && (
        <div className="ver-section">
          <div className="ver-section__label ver-section__label--update">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.56" />
            </svg>
            Updates available ({updates.length})
          </div>
          {updates.map((r) => (
            <ReleaseRow key={r.version} r={r} type="update" />
          ))}
        </div>
      )}

      {/* Current version */}
      {current && (
        <div className="ver-section">
          <div className="ver-section__label ver-section__label--current">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Installed
          </div>
          <ReleaseRow r={current} type="current" />
        </div>
      )}

      {/* Downgrade section */}
      {downgrades.length > 0 && (
        <div className="ver-section">
          <div className="ver-section__label ver-section__label--downgrade">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Older versions
          </div>
          {visibleDown.map((r) => (
            <ReleaseRow key={r.version} r={r} type="downgrade" />
          ))}
          {downgrades.length > 3 && (
            <button
              className="ver-show-more"
              onClick={() => setShowAllDown((s) => !s)}
            >
              {showAllDown
                ? "▲ Show less"
                : `▼ Show ${downgrades.length - 3} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function SettingsPage() {
  const { t, pixabayKey, setPixabayKey } = useApp();

  const [localPixabayKey, setLocalPixabayKey] = useState(pixabayKey || "");
  const [pixabayTestStatus, setPixabayTestStatus] = useState("");
  const [pixabaySaved, setPixabaySaved] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    window.electronAPI.getUptime().then(setStartTime);
  }, []);
  const handleSavePixabay = async () => {
    await setPixabayKey(localPixabayKey.trim());
    setPixabaySaved(true);
    setTimeout(() => setPixabaySaved(false), 2500);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  const elapsed = Math.floor((now - startTime) / 1000);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
  };
  const handleTestPixabay = async () => {
    if (!localPixabayKey.trim()) return;
    setPixabayTestStatus("testing");
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${localPixabayKey.trim()}&q=test&per_page=3`,
      );
      const data = await res.json();
      setPixabayTestStatus(data.hits !== undefined ? "valid" : "invalid");
    } catch {
      setPixabayTestStatus("invalid");
    }
    setTimeout(() => setPixabayTestStatus(""), 4000);
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1>{t("settings")}</h1>
      </div>

      <div className="settings-page__body">
        {/* API Keys */}
        <section className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <div>
              <h2 className="settings-section__title">{t("apiKeys")}</h2>
              <p className="settings-section__desc">
                Configure API keys for online music search features.
              </p>
            </div>
          </div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item__header">
                <div className="settings-item__label-group">
                  <div className="settings-item__service-badge pixabay-badge">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path
                        d="M8 12l2 2 4-4"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                    Pixabay
                  </div>
                  <span className="settings-item__label">
                    {t("pixabayApiKey")}
                  </span>
                </div>
                <a
                  href="https://pixabay.com/api/docs/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="settings-link"
                  onClick={(e) => {
                    if (window.electronAPI) {
                      e.preventDefault();
                      openUrl("https://pixabay.com/api/docs/");
                    }
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  {t("getKeyHere")}
                </a>
              </div>
              <p className="settings-item__desc">{t("pixabayApiKeyDesc")}</p>
              <ApiKeyInput
                value={localPixabayKey}
                onChange={setLocalPixabayKey}
                onSave={handleSavePixabay}
                onTest={handleTestPixabay}
                testStatus={pixabayTestStatus}
                saved={pixabaySaved}
              />
            </div>
            <div className="settings-guide">
              <h4 className="settings-guide__title">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                How to get a free Pixabay key
              </h4>
              <ol className="settings-guide__steps">
                <li>
                  Go to <strong>pixabay.com</strong> and create a free account
                </li>
                <li>
                  Visit <strong>pixabay.com/api/docs</strong>
                </li>
                <li>Your API key is shown at the top of the page</li>
                <li>
                  Copy and paste it above, then click <strong>Save</strong>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h2 className="settings-section__title">Status</h2>
              <p className="settings-section__desc">
                Current configuration overview.
              </p>
            </div>
          </div>
          <div className="settings-card">
            <div className="status-row">
              <span className="status-row__label">Pixabay API Key</span>
              {pixabayKey ? (
                <div className="status-badge status-badge--ok">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Configured — {pixabayKey.slice(0, 6)}
                  {"•".repeat(Math.max(0, pixabayKey.length - 10))}
                  {pixabayKey.slice(-4)}
                </div>
              ) : (
                <div className="status-badge status-badge--missing">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Not configured
                </div>
              )}
            </div>
            <div className="status-row">
              <span className="status-row__label">Uptime</span>
              <div className="status-badge status-badge--ok">
                {formatTime(elapsed)}
              </div>
            </div>
          </div>
        </section>

        {/* Updates & Versions */}
        <section className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.56" />
              </svg>
            </div>
            <div>
              <h2 className="settings-section__title">Updates & Versions</h2>
              <p className="settings-section__desc">
                Update to the latest or downgrade to a previous version.
              </p>
            </div>
          </div>
          <div className="settings-card">
            <div style={{ padding: "18px 20px" }}>
              <UpdateChecker />
            </div>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__icon">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <circle
                  cx="14"
                  cy="13"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M10 22 L7 26 M18 22 L21 26"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M10 26 L18 26"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="settings-section__title">{t("aboutApp")}</h2>
            </div>
          </div>
          <div className="settings-card about-card">
            <div className="about-omega">
              <div className="about-omega__logo">Ω</div>
              <div className="about-omega__info">
                <h3>Omega Music Player</h3>
                <span className="about-omega__version">
                  {t("appVersion")} {APP_VERSION}
                </span>
                <p>{t("appDesc")}</p>
              </div>
            </div>
            <div className="about-stack">
              <span>Built with</span>
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Electron 28</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

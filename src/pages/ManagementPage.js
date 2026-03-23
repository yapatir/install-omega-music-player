import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import './ManagementPage.css';

const isElectronEnv = typeof window !== 'undefined' && window.electronAPI;

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function OnlineSearchResult({ result, onDownload, isDownloading, isDownloaded }) {
  const { t } = useApp();
  return (
    <div className="online-result-item">
      <div className="online-result-item__artwork">
        {result.artwork
          ? <img src={result.artwork} alt="" />
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        }
      </div>
      <div className="online-result-item__info">
        <span className="online-result-item__title">{result.name}</span>
        <span className="online-result-item__artist">{result.artist || t('unknownArtist')}</span>
        {result.duration && <span className="online-result-item__meta">{result.duration}</span>}
      </div>
      <div className="online-result-item__badge">{t('freeToDownload')}</div>
      <button
        className={`download-btn ${isDownloaded ? 'downloaded' : ''}`}
        onClick={onDownload}
        disabled={isDownloading || isDownloaded}
      >
        {isDownloaded ? (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> {t('downloaded')}</>
        ) : isDownloading ? (
          <><span className="spin">⟳</span> {t('downloading')}</>
        ) : (
          <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> {t('download')}</>
        )}
      </button>
    </div>
  );
}

export default function ManagementPage() {
  const { t, library, addToLibrary, removeFromLibrary, clearLibrary, pixabayKey, setCurrentPage } = useApp();

  const [activeTab, setActiveTab] = useState('import');
  const [onlineSearchQuery, setOnlineSearchQuery] = useState('');
  const [onlineSource, setOnlineSource] = useState('pixabay');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [downloading, setDownloading] = useState({});
  const [downloaded, setDownloaded] = useState({});
  const [importStatus, setImportStatus] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const totalSize = library.reduce((acc, s) => acc + (s.size || 0), 0);

  const handleImportFiles = async () => {
    if (!isElectronEnv) {
      setImportStatus(t('requiresInternet'));
      return;
    }
    const files = await window.electronAPI.openFiles();
    if (!files.length) return;
    const songs = files.map(f => ({
      id: `local-${f.path}-${Date.now()}`,
      name: f.name,
      path: f.path,
      size: f.size,
      ext: f.ext,
      artist: '',
      artwork: null,
      source: 'local',
    }));
    await addToLibrary(songs);
    setImportStatus(`${songs.length} ${t('songsImported')}`);
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleImportFolder = async () => {
    if (!isElectronEnv) {
      setImportStatus(t('requiresInternet'));
      return;
    }
    const result = await window.electronAPI.openFolder();
    if (!result) return;
    const songs = result.files.map(f => ({
      id: `local-${f.path}-${Date.now()}`,
      name: f.name,
      path: f.path,
      size: f.size,
      ext: f.ext,
      artist: '',
      artwork: null,
      source: 'local',
    }));
    await addToLibrary(songs);
    setImportStatus(`${songs.length} ${t('songsImported')}`);
    setTimeout(() => setImportStatus(''), 3000);
  };

  // Web Audio File Import (for browser mode)
  const handleWebImport = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const songs = files.map(f => ({
      id: `web-${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name.replace(/\.[^.]+$/, ''),
      dataUrl: URL.createObjectURL(f),
      size: f.size,
      ext: f.name.split('.').pop(),
      artist: '',
      artwork: null,
      source: 'local',
    }));
    addToLibrary(songs);
    setImportStatus(`${songs.length} ${t('songsImported')}`);
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleOnlineSearch = async () => {
    if (!onlineSearchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      if (onlineSource === 'fma') {
        const res = await fetch(`https://freemusicarchive.org/api/get/tracks.json?limit=20&search=${encodeURIComponent(onlineSearchQuery)}`);
        if (!res.ok) throw new Error('FMA request failed');
        const data = await res.json();
        const tracks = (data.dataset || []).map(tr => ({
          id: `fma-${tr.track_id}`,
          name: tr.track_title || t('untitled'),
          artist: tr.artist_name || t('unknownArtist'),
          url: tr.track_url,
          artwork: tr.album_image_file || null,
          source: 'fma',
          duration: tr.track_duration,
        }));
        setSearchResults(tracks);
      } else {
        // Pixabay music search
        if (!pixabayKey) {
          setSearchError('No Pixabay API key. Please go to Settings to add your key.');
          setIsSearching(false);
          return;
        }
        const res = await fetch(`https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(onlineSearchQuery)}&per_page=20&safesearch=true`);
        const data = await res.json();
        setSearchResults((data.hits || []).map(h => ({
          id: `px-${h.id}`,
          name: h.tags?.split(',')[0]?.trim() || t('untitled'),
          artist: 'Pixabay',
          url: null,
          artwork: h.previewURL,
          source: 'pixabay',
        })));
      }
    } catch (err) {
      setSearchError(t('error') + ': ' + err.message);
    }
    setIsSearching(false);
  };

  const handleDownload = async (song) => {
    if (!song.url) return;
    setDownloading(d => ({ ...d, [song.id]: true }));
    try {
      const res = await fetch(song.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      await addToLibrary([{
        ...song,
        dataUrl: url,
        source: 'downloaded',
        size: blob.size,
      }]);
      setDownloaded(d => ({ ...d, [song.id]: true }));
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(d => ({ ...d, [song.id]: false }));
  };

  return (
    <div className="management-page">
      <div className="management-page__header">
        <h1>{t('musicManagement')}</h1>
        <div className="mgmt-tabs">
          {['import', 'search', 'storage'].map(tab => (
            <button
              key={tab}
              className={`mgmt-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'import' && t('importMusic')}
              {tab === 'search' && t('searchOnline')}
              {tab === 'storage' && t('storageManagement')}
            </button>
          ))}
        </div>
      </div>

      <div className="management-page__body">
        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="mgmt-section">
            <div className="import-cards">
              {isElectronEnv ? (
                <>
                  <div className="import-card" onClick={handleImportFiles}>
                    <div className="import-card__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                    </div>
                    <h3>{t('importFromFiles')}</h3>
                    <p>MP3, WAV, FLAC, OGG, AAC, M4A</p>
                  </div>
                  <div className="import-card" onClick={handleImportFolder}>
                    <div className="import-card__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="18" x2="12" y2="11"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
                    </div>
                    <h3>{t('importFromFolder')}</h3>
                    <p>Import all audio files from a folder</p>
                  </div>
                </>
              ) : (
                <label className="import-card import-card--web">
                  <input type="file" accept="audio/*" multiple onChange={handleWebImport} style={{ display: 'none' }} />
                  <div className="import-card__icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <h3>{t('importFromFiles')}</h3>
                  <p>Click to browse audio files</p>
                </label>
              )}
            </div>

            {importStatus && (
              <div className="import-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {importStatus}
              </div>
            )}
          </div>
        )}

        {/* Online Search Tab */}
        {activeTab === 'search' && (
          <div className="mgmt-section">
            <div className="online-search-controls">
              <div className="source-tabs">
                <button className={`source-tab ${onlineSource === 'pixabay' ? 'active' : ''}`} onClick={() => setOnlineSource('pixabay')}>
                  Pixabay
                </button>
                <button className={`source-tab ${onlineSource === 'fma' ? 'active' : ''}`} onClick={() => setOnlineSource('fma')}>
                  Free Music Archive
                </button>
              </div>
              <div className="online-search-bar">
                <input
                  type="text"
                  placeholder={`${t('search')}...`}
                  value={onlineSearchQuery}
                  onChange={e => setOnlineSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOnlineSearch()}
                  className="search-input-full"
                />
                <button className="btn btn--primary" onClick={handleOnlineSearch} disabled={isSearching}>
                  {isSearching ? t('searching') : t('search')}
                </button>
              </div>
            </div>

            {searchError && (
              <div className="search-error">
                {searchError}
                {!pixabayKey && onlineSource === 'pixabay' && (
                  <button
                    className="search-error__settings-btn"
                    onClick={() => setCurrentPage('settings')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Go to Settings
                  </button>
                )}
              </div>
            )}

            <div className="online-results-list">
              {searchResults.length === 0 && !isSearching && (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <p>{onlineSearchQuery ? t('noResults') : t('searchOnline')}</p>
                </div>
              )}
              {searchResults.map(r => (
                <OnlineSearchResult
                  key={r.id}
                  result={r}
                  onDownload={() => handleDownload(r)}
                  isDownloading={downloading[r.id]}
                  isDownloaded={downloaded[r.id]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="mgmt-section">
            <div className="storage-stats">
              <div className="stat-card">
                <div className="stat-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">{library.length}</span>
                  <span className="stat-card__label">{t('totalSongs')}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card__icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <div className="stat-card__info">
                  <span className="stat-card__value">{formatBytes(totalSize)}</span>
                  <span className="stat-card__label">{t('storageUsed')}</span>
                </div>
              </div>
            </div>

            <div className="storage-actions">
              {!confirmClear ? (
                <button className="btn btn--danger" onClick={() => setConfirmClear(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  {t('clearLibrary')}
                </button>
              ) : (
                <div className="confirm-clear">
                  <p>{t('confirmClear')}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn--danger" onClick={() => { clearLibrary(); setConfirmClear(false); }}>{t('yes')}</button>
                    <button className="btn btn--secondary" onClick={() => setConfirmClear(false)}>{t('no')}</button>
                  </div>
                </div>
              )}
            </div>

            <div className="library-list">
              <h3 className="library-list__title">{t('allSongs')}</h3>
              {library.map(song => (
                <div key={song.id} className="library-item">
                  <div className="library-item__info">
                    <span className="library-item__name">{song.name}</span>
                    <span className="library-item__meta">{song.artist || t('unknownArtist')} · {formatBytes(song.size)}</span>
                  </div>
                  {confirmDelete === song.id ? (
                    <div className="confirm-inline">
                      <button className="btn btn--danger" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => { removeFromLibrary(song.id); setConfirmDelete(null); }}>{t('yes')}</button>
                      <button className="btn btn--secondary" style={{padding:'4px 10px',fontSize:'12px'}} onClick={() => setConfirmDelete(null)}>{t('no')}</button>
                    </div>
                  ) : (
                    <button className="icon-btn icon-btn--danger" onClick={() => setConfirmDelete(song.id)} title={t('removeSong')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  )}
                </div>
              ))}
              {library.length === 0 && (
                <div className="empty-state">
                  <p>{t('noSongs')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
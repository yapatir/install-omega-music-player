import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import './MainPage.css';

function SongItem({ song, onPlay, onAddToPlaylist, onToggleFav, isFav, isActive }) {
  const { t } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const { playlists, addToPlaylist } = useApp();

  const formatDuration = (s) => {
    if (!s) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className={`song-item ${isActive ? 'song-item--active' : ''}`}>
      <button className="song-item__play" onClick={onPlay}>
        {isActive
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }
      </button>
      <div className="song-item__artwork">
        {song.artwork
          ? <img src={song.artwork} alt="" />
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        }
      </div>
      <div className="song-item__info">
        <span className="song-item__name">{song.name || t('untitled')}</span>
        <span className="song-item__artist">{song.artist || t('unknownArtist')}</span>
      </div>
      <span className="song-item__duration">{formatDuration(song.duration)}</span>
      <button
        className={`song-item__fav ${isFav ? 'active' : ''}`}
        onClick={onToggleFav}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <div className="song-item__menu-wrap">
        <button className="song-item__menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        {menuOpen && (
          <div className="song-item__dropdown" onMouseLeave={() => setMenuOpen(false)}>
            {playlists.map(pl => (
              <button key={pl.id} onClick={() => { addToPlaylist(pl.id, song); setMenuOpen(false); }}>
                + {pl.name}
              </button>
            ))}
            {playlists.length === 0 && <span className="song-item__dropdown-empty">{t('noPlaylists')}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaylistCard({ playlist, onSelect, isSelected }) {
  const { t } = useApp();
  return (
    <div className={`playlist-card ${isSelected ? 'playlist-card--active' : ''}`} onClick={onSelect}>
      <div className="playlist-card__artwork">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <div className="playlist-card__info">
        <span className="playlist-card__name">{playlist.name}</span>
        <span className="playlist-card__count">{playlist.songs.length} {t('songs')}</span>
      </div>
    </div>
  );
}

export default function MainPage() {
  const {
    t, library, playlists, favorites, recentlyPlayed,
    currentSong, playSong, isFavorite, toggleFavorite,
    createPlaylist, deletePlaylist, renamePlaylist,
  } = useApp();

  const [activeView, setActiveView] = useState('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineSearch, setOnlineSearch] = useState(false);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const currentSongs = useMemo(() => {
    if (activeView === 'all') return library;
    if (activeView === 'favorites') return favorites;
    if (activeView === 'recent') return recentlyPlayed.slice(0, 30);
    if (activeView === 'playlist' && selectedPlaylistId) {
      return playlists.find(p => p.id === selectedPlaylistId)?.songs || [];
    }
    return library;
  }, [activeView, library, favorites, recentlyPlayed, playlists, selectedPlaylistId]);

  const displaySongs = useMemo(() => {
    if (!searchQuery.trim()) return currentSongs;
    const q = searchQuery.toLowerCase();
    return currentSongs.filter(s =>
      s.name?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q)
    );
  }, [currentSongs, searchQuery]);

  const handleOnlineSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://freemusicarchive.org/api/get/tracks.json?limit=20&page=1&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSearchResults((data.dataset || []).map(t => ({
        id: `fma-${t.track_id}`,
        name: t.track_title,
        artist: t.artist_name,
        url: t.track_url,
        duration: null,
        source: 'fma',
      })));
    } catch {
      try {
        const key = process.env.REACT_APP_PIXABAY_KEY || '';
        const res = await fetch(`https://pixabay.com/api/videos/?key=${key}&q=${encodeURIComponent(searchQuery)}&per_page=10`);
        setSearchResults([]);
      } catch { setSearchResults([]); }
    }
    setIsSearching(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowNewPlaylist(false);
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) return;
    await renamePlaylist(id, renameValue.trim());
    setRenamingId(null);
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  return (
    <div className="main-page">
      {/* Sidebar - playlists */}
      <aside className="main-page__sidebar">
        <div className="sidebar__section">
          <div className="sidebar__section-header">
            <span>{t('playlists')}</span>
            <button className="sidebar__add-btn" onClick={() => setShowNewPlaylist(true)} title={t('newPlaylist')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

          {showNewPlaylist && (
            <div className="sidebar__new-playlist">
              <input
                autoFocus
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setShowNewPlaylist(false); }}
                placeholder={t('playlistName')}
                className="sidebar__input"
              />
              <div className="sidebar__new-actions">
                <button className="btn btn--primary" style={{padding:'6px 12px',fontSize:'12px'}} onClick={handleCreatePlaylist}>{t('create')}</button>
                <button className="btn btn--secondary" style={{padding:'6px 12px',fontSize:'12px'}} onClick={() => setShowNewPlaylist(false)}>{t('cancel')}</button>
              </div>
            </div>
          )}

          <nav className="sidebar__nav">
            {[
              { id: 'all', label: t('allSongs'), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, count: library.length },
              { id: 'recent', label: t('recentlyPlayed'), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, count: recentlyPlayed.length },
              { id: 'favorites', label: t('favorites'), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>, count: favorites.length },
            ].map(item => (
              <button
                key={item.id}
                className={`sidebar__nav-item ${activeView === item.id && activeView !== 'playlist' ? 'active' : ''}`}
                onClick={() => { setActiveView(item.id); setSelectedPlaylistId(null); }}
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="sidebar__count">{item.count}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar__playlists">
            {playlists.map(pl => (
              <div key={pl.id} className="sidebar__playlist-row">
                {renamingId === pl.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(pl.id); if (e.key === 'Escape') setRenamingId(null); }}
                    className="sidebar__input"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <button
                    className={`sidebar__nav-item ${activeView === 'playlist' && selectedPlaylistId === pl.id ? 'active' : ''}`}
                    onClick={() => { setActiveView('playlist'); setSelectedPlaylistId(pl.id); }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    <span>{pl.name}</span>
                    <span className="sidebar__count">{pl.songs.length}</span>
                  </button>
                )}
                <div className="sidebar__playlist-actions">
                  <button onClick={() => { setRenamingId(pl.id); setRenameValue(pl.name); }} title={t('rename')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deletePlaylist(pl.id)} title={t('delete')} className="danger">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-page__content">
        <div className="main-page__header">
          <h1 className="main-page__title">
            {activeView === 'all' && t('allSongs')}
            {activeView === 'favorites' && t('favorites')}
            {activeView === 'recent' && t('recentlyPlayed')}
            {activeView === 'playlist' && selectedPlaylist?.name}
          </h1>
          <div className="main-page__actions">
            {displaySongs.length > 0 && (
              <>
                <button className="action-btn" onClick={() => playSong(displaySongs[0], displaySongs)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {t('playAll')}
                </button>
                <button className="action-btn" onClick={() => {
                  const shuffled = [...displaySongs].sort(() => Math.random() - 0.5);
                  playSong(shuffled[0], shuffled);
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
                  {t('shuffle')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="main-page__search-bar">
          <div className="search-input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder={onlineSearch ? `${t('searchSongs')} (${t('onlineOnly')})` : t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => onlineSearch && e.key === 'Enter' && handleOnlineSearch()}
              className="search-input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>×</button>
            )}
          </div>
          <button
            className={`toggle-online-btn ${onlineSearch ? 'active' : ''}`}
            onClick={() => setOnlineSearch(!onlineSearch)}
            title={t('onlineOnly')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {t('onlineOnly')}
          </button>
          {onlineSearch && (
            <button className="btn btn--primary" style={{padding:'8px 16px',fontSize:'13px'}} onClick={handleOnlineSearch} disabled={isSearching}>
              {isSearching ? t('searching') : t('search')}
            </button>
          )}
        </div>

        {/* Online search results */}
        {onlineSearch && searchResults.length > 0 && (
          <div className="online-results">
            <h3>{t('searchResults')}</h3>
            {searchResults.map(song => (
              <SongItem
                key={song.id}
                song={song}
                onPlay={() => playSong(song, searchResults)}
                isActive={currentSong?.id === song.id}
                onToggleFav={() => toggleFavorite(song)}
                isFav={isFavorite(song.id)}
              />
            ))}
          </div>
        )}

        {/* Song list */}
        <div className="song-list">
          {displaySongs.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              <p>{t('noSongs')}</p>
            </div>
          ) : (
            displaySongs.map(song => (
              <SongItem
                key={song.id}
                song={song}
                onPlay={() => playSong(song, displaySongs)}
                isActive={currentSong?.id === song.id}
                onToggleFav={() => toggleFavorite(song)}
                isFav={isFavorite(song.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

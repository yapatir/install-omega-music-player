import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';

const AppContext = createContext(null);

const isElectron = typeof window !== 'undefined' && window.electronAPI;

const storage = {
  get: async (key) => {
    if (isElectron) return window.electronAPI.storageGet(key);
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  set: async (key, value) => {
    if (isElectron) return window.electronAPI.storageSet(key, value);
    localStorage.setItem(key, JSON.stringify(value));
  },
};

export const defaultTheme = {
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  bg: '#0a0a0f',
  bgSecondary: '#13131a',
  bgTertiary: '#1c1c26',
  bgCard: '#1a1a24',
  border: '#2a2a38',
  text: '#f0f0ff',
  textSecondary: '#8888aa',
  textMuted: '#5555777',
  mode: 'dark',
};

export const themePresets = [
  { name: 'Violet Night', accent: '#7c3aed', bg: '#0a0a0f', bgSecondary: '#13131a', bgCard: '#1a1a24', border: '#2a2a38', text: '#f0f0ff', textSecondary: '#8888aa', mode: 'dark' },
  { name: 'Crimson Dark', accent: '#dc2626', bg: '#0f0a0a', bgSecondary: '#1a0d0d', bgCard: '#221515', border: '#3a2020', text: '#fff0f0', textSecondary: '#aa8888', mode: 'dark' },
  { name: 'Ocean Blue', accent: '#0ea5e9', bg: '#0a0e14', bgSecondary: '#0d141e', bgCard: '#121a26', border: '#1e2d3d', text: '#e0f0ff', textSecondary: '#6a9ab8', mode: 'dark' },
  { name: 'Forest Green', accent: '#16a34a', bg: '#090f0b', bgSecondary: '#0d1610', bgCard: '#111d15', border: '#1c2f20', text: '#e0ffe8', textSecondary: '#6aaa7a', mode: 'dark' },
  { name: 'Golden Hour', accent: '#d97706', bg: '#0f0e09', bgSecondary: '#1a170a', bgCard: '#221e0e', border: '#3a3018', text: '#fff8e0', textSecondary: '#aaa060', mode: 'dark' },
  { name: 'Rose Light', accent: '#e11d48', bg: '#fdf2f8', bgSecondary: '#fce7f3', bgCard: '#ffffff', border: '#fbcfe8', text: '#1a0812', textSecondary: '#9d174d', mode: 'light' },
  { name: 'Sky Light', accent: '#2563eb', bg: '#f0f9ff', bgSecondary: '#e0f2fe', bgCard: '#ffffff', border: '#bae6fd', text: '#0c1a2e', textSecondary: '#1e40af', mode: 'light' },
];

export function AppProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [theme, setThemeState] = useState(defaultTheme);
  const [library, setLibraryState] = useState([]);
  const [playlists, setPlaylistsState] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none | one | all
  const [shuffleOn, setShuffleOn] = useState(false);
  const [favorites, setFavoritesState] = useState([]);
  const [recentlyPlayed, setRecentlyPlayedState] = useState([]);
  const [currentPage, setCurrentPage] = useState('main');
  const [navOpen, setNavOpen] = useState(true);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [pixabayKey, setPixabayKeyState] = useState('');

  const t = (key) => translations[language]?.[key] || translations['en']?.[key] || key;

  useEffect(() => {
    const load = async () => {
      const lang = await storage.get('language');
      if (lang) setLanguageState(lang);

      const savedTheme = await storage.get('theme');
      if (savedTheme) setThemeState({ ...defaultTheme, ...savedTheme });

      const lib = await storage.get('library');
      if (lib) setLibraryState(lib);

      const pl = await storage.get('playlists');
      if (pl) setPlaylistsState(pl);

      const fav = await storage.get('favorites');
      if (fav) setFavoritesState(fav);

      const recent = await storage.get('recentlyPlayed');
      if (recent) setRecentlyPlayedState(recent);

      const vol = await storage.get('volume');
      if (vol !== null && vol !== undefined) setVolumeState(vol);

      const pxKey = await storage.get('pixabayKey');
      if (pxKey) setPixabayKeyState(pxKey);

      setInitialized(true);
    };
    load();
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
    root.style.setProperty('--bg-tertiary', theme.bgTertiary || theme.bgSecondary);
    root.style.setProperty('--bg-card', theme.bgCard);
    root.style.setProperty('--border', theme.border);
    root.style.setProperty('--text', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--text-muted', theme.textMuted || theme.textSecondary);
    // Generate accent variants
    root.style.setProperty('--accent-15', theme.accent + '26');
    root.style.setProperty('--accent-30', theme.accent + '4d');
  }, [theme]);

  const setLanguage = async (lang) => {
    setLanguageState(lang);
    await storage.set('language', lang);
  };

  const setTheme = async (newTheme) => {
    const merged = { ...theme, ...newTheme };
    setThemeState(merged);
    await storage.set('theme', merged);
  };

  const addToLibrary = async (songs) => {
    setLibraryState(prev => {
      const existingPaths = new Set(prev.map(s => s.path || s.id));
      const newSongs = songs.filter(s => !existingPaths.has(s.path || s.id));
      const updated = [...prev, ...newSongs];
      storage.set('library', updated);
      return updated;
    });
  };

  const removeFromLibrary = async (songId) => {
    setLibraryState(prev => {
      const updated = prev.filter(s => s.id !== songId);
      storage.set('library', updated);
      return updated;
    });
  };

  const clearLibrary = async () => {
    setLibraryState([]);
    setPlaylistsState([]);
    setFavoritesState([]);
    await storage.set('library', []);
    await storage.set('playlists', []);
    await storage.set('favorites', []);
  };

  const createPlaylist = async (name) => {
    const newPl = { id: Date.now().toString(), name, songs: [], createdAt: Date.now() };
    setPlaylistsState(prev => {
      const updated = [...prev, newPl];
      storage.set('playlists', updated);
      return updated;
    });
    return newPl;
  };

  const deletePlaylist = async (id) => {
    setPlaylistsState(prev => {
      const updated = prev.filter(p => p.id !== id);
      storage.set('playlists', updated);
      return updated;
    });
  };

  const renamePlaylist = async (id, name) => {
    setPlaylistsState(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, name } : p);
      storage.set('playlists', updated);
      return updated;
    });
  };

  const addToPlaylist = async (playlistId, song) => {
    setPlaylistsState(prev => {
      const updated = prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.songs.find(s => s.id === song.id)) return p;
        return { ...p, songs: [...p.songs, song] };
      });
      storage.set('playlists', updated);
      return updated;
    });
  };

  const removeFromPlaylist = async (playlistId, songId) => {
    setPlaylistsState(prev => {
      const updated = prev.map(p => p.id !== playlistId ? p : { ...p, songs: p.songs.filter(s => s.id !== songId) });
      storage.set('playlists', updated);
      return updated;
    });
  };

  const toggleFavorite = async (song) => {
    setFavoritesState(prev => {
      const isFav = prev.find(s => s.id === song.id);
      const updated = isFav ? prev.filter(s => s.id !== song.id) : [...prev, song];
      storage.set('favorites', updated);
      return updated;
    });
  };

  const isFavorite = (songId) => favorites.some(s => s.id === songId);

  const playSong = useCallback((song, songList = null) => {
    setCurrentSong(song);
    setIsPlaying(true);
    if (songList) setQueue(songList);
    setRecentlyPlayedState(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 50);
      storage.set('recentlyPlayed', updated);
      return updated;
    });
  }, []);

  const setVolume = async (v) => {
    setVolumeState(v);
    await storage.set('volume', v);
  };

  const setPixabayKey = async (key) => {
    setPixabayKeyState(key);
    await storage.set('pixabayKey', key);
  };

  const value = {
    t, language, setLanguage,
    theme, setTheme,
    library, addToLibrary, removeFromLibrary, clearLibrary,
    playlists, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist,
    favorites, toggleFavorite, isFavorite,
    recentlyPlayed,
    currentSong, setCurrentSong,
    queue, setQueue,
    isPlaying, setIsPlaying,
    volume, setVolume,
    isMuted, setIsMuted,
    repeatMode, setRepeatMode,
    shuffleOn, setShuffleOn,
    playSong,
    currentPage, setCurrentPage,
    navOpen, setNavOpen,
    exitModalOpen, setExitModalOpen,
    initialized,
    isElectron: !!isElectron,
    pixabayKey, setPixabayKey,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
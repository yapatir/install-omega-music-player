import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './Player.css';

const isElectronEnv = typeof window !== 'undefined' && window.electronAPI;

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatTitle(name, max = 30) {
  if (!name) return 'Unknown';
  return name.length > max ? name.slice(0, max) + '…' : name;
}

export default function Player() {
  const {
    t, currentSong, queue,
    isPlaying, setIsPlaying,
    volume, setVolume,
    isMuted, setIsMuted,
    repeatMode, setRepeatMode,
    shuffleOn, setShuffleOn,
    playSong, toggleFavorite, isFavorite,
  } = useApp();

  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioSrc, setAudioSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Load audio source
  useEffect(() => {
    if (!currentSong) return;
    setLoading(true);

    const loadAudio = async () => {
      if (currentSong.dataUrl) {
        setAudioSrc(currentSong.dataUrl);
      } else if (currentSong.url) {
        setAudioSrc(currentSong.url);
      } else if (currentSong.path && isElectronEnv) {
        const b64 = await window.electronAPI.readFileAsBase64(currentSong.path);
        if (b64) setAudioSrc(b64);
      }
      setLoading(false);
    };
    loadAudio();
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current || !audioSrc) return;
    audioRef.current.src = audioSrc;
    audioRef.current.load();
    if (isPlaying) audioRef.current.play().catch(() => {});
  }, [audioSrc, isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      audioRef.current?.play();
      return;
    }
    const currentIdx = queue.findIndex(s => s.id === currentSong?.id);
    if (shuffleOn) {
      const randIdx = Math.floor(Math.random() * queue.length);
      playSong(queue[randIdx], queue);
    } else if (currentIdx < queue.length - 1) {
      playSong(queue[currentIdx + 1], queue);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playSong(queue[0], queue);
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, shuffleOn, queue, currentSong, playSong, setIsPlaying]);

  const seekTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const time = pct * duration;
    if (audioRef.current) audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const prevSong = () => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    const idx = queue.findIndex(s => s.id === currentSong?.id);
    if (idx > 0) playSong(queue[idx - 1], queue);
  };

  const nextSong = () => {
    const idx = queue.findIndex(s => s.id === currentSong?.id);
    if (shuffleOn) {
      playSong(queue[Math.floor(Math.random() * queue.length)], queue);
    } else if (idx < queue.length - 1) {
      playSong(queue[idx + 1], queue);
    } else if (repeatMode === 'all') {
      playSong(queue[0], queue);
    }
  };

  const cycleRepeat = () => {
    const modes = ['none', 'all', 'one'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="player player--empty">
        <div className="player__empty-text">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          <span>{t('nowPlaying')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Progress bar */}
      <div className="player__progress" onClick={seekTo}>
        <div className="player__progress-bg">
          <div className="player__progress-fill" style={{ width: `${progress}%` }} />
          <div className="player__progress-thumb" style={{ left: `${progress}%` }} />
        </div>
        <div className="player__time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player__main">
        {/* Song info */}
        <div className="player__info">
          <div className="player__artwork">
            {currentSong.artwork
              ? <img src={currentSong.artwork} alt="artwork" />
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            }
            {loading && <div className="player__artwork-loading" />}
          </div>
          <div className="player__meta">
            <span className="player__song-title">{formatTitle(currentSong.name, 25)}</span>
            <span className="player__song-artist">{currentSong.artist || t('unknownArtist')}</span>
          </div>
          <button
            className={`player__fav-btn ${isFavorite(currentSong.id) ? 'active' : ''}`}
            onClick={() => toggleFavorite(currentSong)}
            title={isFavorite(currentSong.id) ? t('removeFromFavorites') : t('addToFavorites')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite(currentSong.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        {/* Controls */}
        <div className="player__controls">
          <button
            className={`player__ctrl-btn player__ctrl-btn--sm ${shuffleOn ? 'active' : ''}`}
            onClick={() => setShuffleOn(!shuffleOn)}
            title={t('shufflePlay')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
          </button>

          <button className="player__ctrl-btn" onClick={prevSong} title={t('previous')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>

          <button
            className="player__play-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? t('pause') : t('play')}
          >
            {isPlaying
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            }
          </button>

          <button className="player__ctrl-btn" onClick={nextSong} title={t('next')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>

          <button
            className={`player__ctrl-btn player__ctrl-btn--sm ${repeatMode !== 'none' ? 'active' : ''}`}
            onClick={cycleRepeat}
            title={t('repeat')}
          >
            {repeatMode === 'one'
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="10" y="14" fontSize="7" fill="currentColor" stroke="none" textAnchor="middle">1</text></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            }
          </button>
        </div>

        {/* Volume + Queue */}
        <div className="player__extras">
          <div className="player__volume">
            <button className="player__ctrl-btn player__ctrl-btn--sm" onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              }
            </button>
            <input
              type="range" min="0" max="1" step="0.02"
              value={isMuted ? 0 : volume}
              onChange={e => { setIsMuted(false); setVolume(parseFloat(e.target.value)); }}
              className="player__volume-slider"
            />
          </div>

          <button
            className={`player__ctrl-btn player__ctrl-btn--sm ${showQueue ? 'active' : ''}`}
            onClick={() => setShowQueue(!showQueue)}
            title={t('queue')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Queue panel */}
      {showQueue && (
        <div className="player__queue">
          <div className="player__queue-header">
            <span>{t('queue')} ({queue.length})</span>
            <button onClick={() => setShowQueue(false)}>×</button>
          </div>
          <div className="player__queue-list">
            {queue.map((song, i) => (
              <div
                key={song.id}
                className={`player__queue-item ${song.id === currentSong?.id ? 'active' : ''}`}
                onClick={() => playSong(song, queue)}
              >
                <span className="player__queue-idx">{i + 1}</span>
                <div className="player__queue-info">
                  <span>{formatTitle(song.name, 28)}</span>
                  <span>{song.artist || t('unknownArtist')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

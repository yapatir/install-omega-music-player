import React, { useState } from 'react';
import { useApp, themePresets, defaultTheme } from '../context/AppContext';
import { languageNames } from '../i18n/translations';
import './CustomizePage.css';

function ColorSwatch({ color, label, onChange }) {
  return (
    <div className="color-swatch">
      <div
        className="color-swatch__preview"
        style={{ background: color }}
        onClick={() => document.getElementById(`picker-${label}`)?.click()}
      >
        <input
          id={`picker-${label}`}
          type="color"
          value={color}
          onChange={e => onChange(e.target.value)}
          className="color-swatch__input"
        />
      </div>
      <span className="color-swatch__label">{label}</span>
      <span className="color-swatch__value">{color}</span>
    </div>
  );
}

function MiniPlayer() {
  return (
    <div className="preview-player">
      <div className="preview-player__artwork">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </div>
      <div className="preview-player__info">
        <span className="preview-player__title">Sample Song Title</span>
        <span className="preview-player__artist">Artist Name</span>
      </div>
      <div className="preview-player__controls">
        <div className="preview-ctrl">⏮</div>
        <div className="preview-ctrl preview-ctrl--play">▶</div>
        <div className="preview-ctrl">⏭</div>
      </div>
    </div>
  );
}

export default function CustomizePage() {
  const { t, theme, setTheme, language, setLanguage } = useApp();
  const [localTheme, setLocalTheme] = useState({ ...theme });
  const [saved, setSaved] = useState(false);

  const handleColorChange = (key, val) => {
    setLocalTheme(prev => ({ ...prev, [key]: val }));
  };

  const handlePreset = (preset) => {
    const merged = { ...defaultTheme, ...preset };
    setLocalTheme(merged);
  };

  const handleSave = async () => {
    await setTheme(localTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalTheme({ ...defaultTheme });
  };

  const colors = [
    { key: 'accent', label: t('accentColor') },
    { key: 'bg', label: t('backgroundColor') },
    { key: 'bgSecondary', label: 'Secondary BG' },
    { key: 'bgCard', label: 'Card BG' },
    { key: 'border', label: 'Border' },
    { key: 'text', label: t('textColor') },
    { key: 'textSecondary', label: 'Secondary Text' },
  ];

  return (
    <div className="customize-page">
      <div className="customize-page__header">
        <h1>{t('customize')}</h1>
      </div>

      <div className="customize-page__body">
        <div className="customize-grid">
          {/* Left panel — controls */}
          <div className="customize-controls">
            {/* Language */}
            <section className="customize-section">
              <h2 className="customize-section__title">{t('language')}</h2>
              <div className="lang-grid">
                {Object.entries(languageNames).map(([code, name]) => (
                  <button
                    key={code}
                    className={`lang-btn ${language === code ? 'active' : ''}`}
                    onClick={() => setLanguage(code)}
                  >
                    <span className="lang-flag">
                      {code === 'en' && '🇬🇧'}
                      {code === 'id' && '🇮🇩'}
                      {code === 'es' && '🇪🇸'}
                      {code === 'pt' && '🇧🇷'}
                      {code === 'ru' && '🇷🇺'}
                    </span>
                    {name}
                  </button>
                ))}
              </div>
            </section>

            {/* Theme mode */}
            <section className="customize-section">
              <h2 className="customize-section__title">{t('theme')}</h2>
              <div className="theme-mode-toggle">
                <button
                  className={`mode-btn ${localTheme.mode === 'dark' ? 'active' : ''}`}
                  onClick={() => handleColorChange('mode', 'dark')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  {t('darkTheme')}
                </button>
                <button
                  className={`mode-btn ${localTheme.mode === 'light' ? 'active' : ''}`}
                  onClick={() => handleColorChange('mode', 'light')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                  {t('lightTheme')}
                </button>
              </div>
            </section>

            {/* Presets */}
            <section className="customize-section">
              <h2 className="customize-section__title">{t('presets')}</h2>
              <div className="presets-grid">
                {themePresets.map((preset, i) => (
                  <button
                    key={i}
                    className="preset-btn"
                    onClick={() => handlePreset(preset)}
                    title={preset.name}
                  >
                    <div className="preset-btn__swatch">
                      <div className="preset-btn__bg" style={{ background: preset.bg }} />
                      <div className="preset-btn__accent" style={{ background: preset.accent }} />
                      <div className="preset-btn__text" style={{ background: preset.text }} />
                    </div>
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Color pickers */}
            <section className="customize-section">
              <h2 className="customize-section__title">{t('appearance')}</h2>
              <div className="colors-grid">
                {colors.map(({ key, label }) => (
                  <ColorSwatch
                    key={key}
                    color={localTheme[key] || '#000000'}
                    label={label}
                    onChange={val => handleColorChange(key, val)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right panel — preview */}
          <div className="customize-preview">
            <h2 className="customize-section__title">{t('preview')}</h2>
            <div className="preview-app" style={{
              '--prev-accent': localTheme.accent,
              '--prev-bg': localTheme.bg,
              '--prev-bg2': localTheme.bgSecondary,
              '--prev-card': localTheme.bgCard,
              '--prev-border': localTheme.border,
              '--prev-text': localTheme.text,
              '--prev-text2': localTheme.textSecondary,
            }}>
              {/* Fake sidebar */}
              <div className="preview-sidebar">
                <div className="preview-logo">Ω</div>
                <div className="preview-nav-item preview-nav-item--active" />
                <div className="preview-nav-item" />
                <div className="preview-nav-item" />
                <div className="preview-nav-item" style={{ marginTop: 'auto' }} />
              </div>
              {/* Fake content */}
              <div className="preview-content">
                <div className="preview-song" />
                <div className="preview-song preview-song--active" />
                <div className="preview-song" />
                <div className="preview-song" />
              </div>
              {/* Fake player */}
              <div className="preview-bottom">
                <div className="preview-progress">
                  <div className="preview-progress-fill" />
                </div>
                <MiniPlayer />
              </div>
            </div>

            {/* Save / Reset */}
            <div className="customize-actions">
              <button className="btn btn--secondary" onClick={handleReset}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.56"/></svg>
                {t('resetDefaults')}
              </button>
              <button className={`btn btn--primary ${saved ? 'saved' : ''}`} onClick={handleSave}>
                {saved ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> {t('success')}</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> {t('saveChanges')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
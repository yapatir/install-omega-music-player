import React from 'react';
import { useApp } from '../../context/AppContext';
import './Modal.css';

export default function ExitModal() {
  const { t, exitModalOpen, setExitModalOpen, isElectron } = useApp();

  if (!exitModalOpen) return null;

  const handleExit = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.quit();
    } else {
      window.close();
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setExitModalOpen(false)}>
      <div className="exit-modal" onClick={e => e.stopPropagation()}>
        <div className="exit-modal__icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </div>
        <h2 className="exit-modal__title">{t('exitTitle')}</h2>
        <p className="exit-modal__message">{t('exitMessage')}</p>
        <div className="exit-modal__buttons">
          <button className="exit-modal__btn exit-modal__btn--cancel" onClick={() => setExitModalOpen(false)}>
            {t('no')}
          </button>
          <button className="exit-modal__btn exit-modal__btn--confirm" onClick={handleExit}>
            {t('yes')}
          </button>
        </div>
      </div>
    </div>
  );
}

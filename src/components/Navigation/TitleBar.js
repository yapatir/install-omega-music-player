import React from 'react';
import { useApp } from '../../context/AppContext';
import './TitleBar.css';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export default function TitleBar() {
  const { setExitModalOpen } = useApp();

  const minimize = () => isElectron && window.electronAPI.minimize();
  const maximize = () => isElectron && window.electronAPI.maximize();
  const close = () => setExitModalOpen(true);

  return (
    <div className="titlebar">
      <div className="titlebar__drag" />
      <div className="titlebar__controls">
        <button className="titlebar__btn titlebar__btn--min" onClick={minimize} title="Minimize">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect y="4.5" width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button className="titlebar__btn titlebar__btn--max" onClick={maximize} title="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
        </button>
        <button className="titlebar__btn titlebar__btn--close" onClick={close} title="Close">
          <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  );
}

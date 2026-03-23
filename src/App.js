import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation/Navigation';
import TitleBar from './components/Navigation/TitleBar';
import Player from './components/Player/Player';
import ExitModal from './components/Modals/ExitModal';
import MainPage from './pages/MainPage';
import ManagementPage from './pages/ManagementPage';
import CustomizePage from './pages/CustomizePage';
import SettingsPage from './pages/SettingsPage';
import PluginsPage from './pages/PluginsPage';
import { PluginProvider, usePlugins } from './context/PluginContext';
import './App.css';

const isElectron = typeof window !== 'undefined' && window.electronAPI;


function ToastContainer() {
  const { toasts } = usePlugins();
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 9998, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: t.type === 'error' ? 'rgba(220,38,38,0.9)' : t.type === 'success' ? 'rgba(22,163,74,0.9)' : 'rgba(30,30,50,0.95)',
          color: 'white', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
          maxWidth: 320,
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { currentPage, initialized } = useApp();

  if (!initialized) {
    return (
      <div className="app-loading">
        <div className="app-loading__omega">Ω</div>
        <div className="app-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="app">
      {isElectron && <TitleBar />}
      <div className="app__body">
        <Navigation />
        <main className="app__main">
          {currentPage === 'main' && <MainPage />}
          {currentPage === 'management' && <ManagementPage />}
          {currentPage === 'customize' && <CustomizePage />}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'plugins' && <PluginsPage />}
        </main>
      </div>
      <Player />
      <ExitModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PluginProvider>
        <AppContent />
      </PluginProvider>
    </AppProvider>
  );
}
# Ω Omega Music Player

A beautiful offline-capable desktop music player built with **React + Electron**.

![Omega Music Player](https://via.placeholder.com/800x500/0a0a0f/7c3aed?text=Omega+Music+Player)

---

## ✨ Features

- 🎵 **Offline-first** — plays local audio files without internet
- 📂 **Library management** — import files or entire folders
- 🎶 **Playlists** — create, rename, delete playlists
- ❤️ **Favorites & Recent** — quick access to loved and recent tracks
- 🌐 **Online search** — Pixabay & Free Music Archive integration
- 🎨 **Full customization** — accent colors, background, presets, dark/light mode
- 🌍 **5 languages** — English, Bahasa Indonesia, Español, Português, Русский
- 🔀 **Shuffle, Repeat (none / all / one)** modes
- 🎚️ **Volume & mute**, seek bar, playback queue
- 📦 **Persistent storage** — settings saved between sessions
- 🖥️ **Frameless window** with custom title bar

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm** v9+

### Install
```bash
cd omega
npm install
```

### Run in browser (dev mode, no Electron)
```bash
npm start
```
Open http://localhost:3000

### Run as Electron app (dev)
```bash
npm run electron-dev
```

### Build production Electron app
```bash
npm run build-electron
```
Output goes to `dist/`.

---

## 🔑 API Keys (optional)

For online music search features, create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_PIXABAY_KEY=your_key_here
```

Get a free key at [pixabay.com/api/docs](https://pixabay.com/api/docs/)

**Free Music Archive** works without an API key.

---

## 📁 Project Structure

```
omega/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Context bridge (IPC)
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navigation/
│   │   │   ├── Navigation.js    # Collapsible sidebar
│   │   │   ├── Navigation.css
│   │   │   ├── TitleBar.js      # Frameless window controls
│   │   │   └── TitleBar.css
│   │   ├── Player/
│   │   │   ├── Player.js        # Audio player controls
│   │   │   └── Player.css
│   │   └── Modals/
│   │       ├── ExitModal.js     # Exit confirmation
│   │       └── Modal.css
│   ├── context/
│   │   └── AppContext.js        # Global state (theme, library, player)
│   ├── i18n/
│   │   └── translations.js      # All 5 languages
│   ├── pages/
│   │   ├── MainPage.js          # Browse, search, playlists
│   │   ├── MainPage.css
│   │   ├── ManagementPage.js    # Import, online search, storage
│   │   ├── ManagementPage.css
│   │   ├── CustomizePage.js     # Theme & language settings
│   │   └── CustomizePage.css
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

---

## 🎨 Customization

Omega supports full UI theming:
- **Color presets**: Violet Night, Crimson Dark, Ocean Blue, Forest Green, Golden Hour, Rose Light, Sky Light
- **Custom colors**: Accent, Background, Card, Border, Text — all individually adjustable
- **Dark / Light mode**
- All settings persist between sessions

---

## 🌍 Supported Languages

| Code | Language         |
|------|-----------------|
| `en` | English          |
| `id` | Bahasa Indonesia |
| `es` | Español          |
| `pt` | Português        |
| `ru` | Русский          |

---

## 🎵 Supported Formats

MP3, WAV, OGG, FLAC, AAC, M4A, OPUS

---

## 📦 Building

| Platform | Command              | Output              |
|----------|---------------------|---------------------|
| Windows  | `npm run build-electron` | `dist/*.exe` (NSIS) |
| macOS    | `npm run build-electron` | `dist/*.dmg`        |
| Linux    | `npm run build-electron` | `dist/*.AppImage`   |

---

## License

MIT — Free to use, modify, distribute.

# Build Guide - Holophonix Animator v2

Complete guide to building and packaging Holophonix Animator v2 for Windows.

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: For version control
- **Windows 10/11**: For building Windows executables

## Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd holophonix-animator/v2

# Install dependencies
npm install
```

## Development

### Run Development Server

```bash
# Start Vite dev server + Electron in development mode
npm run electron:dev
```

This will:
- Start Vite dev server on `http://localhost:5173`
- Launch Electron window
- Enable hot-reload for React components
- Open DevTools automatically

### Run Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Production Build

### Step 1: Build React Application

```bash
# Compile TypeScript and build Vite bundle
npm run build
```

This creates:
- `dist/index.html` - Main HTML file
- `dist/assets/` - Bundled JS/CSS files

**Important**: This uses `HashRouter` for Electron compatibility (not `BrowserRouter`).

### Step 2: Compile Electron Main Process

```bash
# Compile main.ts and preload.ts
npm run compile:electron
```

This creates:
- `main.js` - Electron main process
- `preload.js` - Preload script for context isolation
- Source maps (`.map` files)

### Step 3: Package Application

#### Option A: Portable Executable (Quick Test)

```bash
# Create unpacked Windows application (no installer)
npx electron-builder --win --x64 --dir
```

Output: `dist/win-unpacked/Holophonix Animator v2.exe`

Use this for quick testing. No installation required.

#### Option B: NSIS Installer (Distribution)

```bash
# Create Windows installer
npx electron-builder --win nsis --x64
```

Output: `dist/Holophonix Animator v2 Setup.exe`

This creates a full installer with:
- Installation wizard
- Start menu shortcuts
- Uninstaller
- Custom installation directory option

### Complete Build Script

```bash
# Build everything in one command
npm run build:electron
```

This runs:
1. `cross-env NODE_ENV=production npm run build` - Build React app
2. `electron-builder` - Package with electron-builder

## Build Configuration

### package.json - Electron Builder Config

```json
{
  "build": {
    "appId": "com.holophonix.animator",
    "productName": "Holophonix Animator v2",
    "directories": {
      "output": "dist",
      "buildResources": "assets"
    },
    "files": [
      "main.js",
      "main.js.map",
      "preload.js",
      "preload.js.map",
      "dist/**/*",
      "!dist/builder-*",
      "!dist/win-unpacked"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### Key Files Included in Bundle

- **main.js** - Electron main process (compiled from `main.ts`)
- **preload.js** - Preload script for IPC bridge
- **dist/** - Vite-built React application
- **node_modules/** - Production dependencies (auto-included by electron-builder)

## Troubleshooting

### Issue: Test files causing build errors

**Error:**
```
Cannot find module '@testing-library/react'
```

**Solution:** Test files are excluded in `tsconfig.json`:
```json
{
  "exclude": ["src/test", "src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

### Issue: Blank pages in Electron app

**Error:** Navigation works but pages show blank content.

**Solution:** Use `HashRouter` instead of `BrowserRouter` in `src/main.tsx`:
```tsx
import { HashRouter } from 'react-router-dom'

// In ReactDOM.createRoot
<HashRouter>
  <App />
</HashRouter>
```

**Why:** `file://` protocol doesn't support pushState routing. HashRouter uses `#/` URLs.

### Issue: "Application entry file main.js does not exist"

**Error:** Electron-builder can't find main.js in app.asar

**Solution:** Ensure `main.js` is in project root (not in dist/), and `files` array includes it:
```json
{
  "build": {
    "files": [
      "main.js",
      "preload.js",
      "dist/**/*"
    ]
  }
}
```

### Issue: Native dependencies not rebuilding

**Error:** `@serialport/bindings-cpp` or other native modules fail

**Solution:** electron-builder automatically rebuilds native dependencies. If issues persist:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build:electron
```

## File Structure

```
v2/
├── src/                    # React application source
│   ├── components/         # React components
│   ├── stores/            # Zustand state stores
│   ├── utils/             # Utilities & animation logic
│   └── main.tsx           # React entry point
├── main.ts                # Electron main process
├── preload.ts             # Electron preload script
├── dist/                  # Build output
│   ├── index.html         # Built HTML
│   ├── assets/            # Built JS/CSS
│   └── win-unpacked/      # Unpacked Windows app
├── main.js                # Compiled Electron main
├── preload.js             # Compiled preload
├── package.json           # Dependencies & build config
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## Environment Variables

### Development

```bash
NODE_ENV=development
```

- Loads from Vite dev server (`http://localhost:5173`)
- Enables DevTools
- Hot module reloading

### Production

```bash
NODE_ENV=production
```

- Loads from bundled files (`dist/index.html`)
- DevTools disabled
- Optimized bundle

## Build Artifacts

After successful build:

```
dist/
├── index.html                              # Main HTML
├── assets/
│   ├── index-[hash].js                     # Bundled React app
│   └── index-[hash].css                    # Bundled styles
├── win-unpacked/
│   └── Holophonix Animator v2.exe          # Portable executable
└── Holophonix Animator v2 Setup.exe        # NSIS installer
```

## Distribution

### For Testing
Share `dist/win-unpacked/Holophonix Animator v2.exe` - portable, no installation needed.

### For End Users
Share `dist/Holophonix Animator v2 Setup.exe` - professional installer with uninstaller.

## Version Updates

Update version in `package.json`:
```json
{
  "version": "2.1.0"
}
```

This automatically updates:
- Application title bar
- Installer version
- About dialog

## Clean Build

```bash
# Remove all build artifacts
rm -rf dist/ main.js preload.js *.js.map

# Rebuild from scratch
npm run build:electron
```

## CI/CD Notes

For automated builds:

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build production
npm run build:electron

# Artifacts location
dist/Holophonix Animator v2 Setup.exe
```

## Additional Resources

- **Electron Builder Docs**: https://www.electron.build/
- **Vite Docs**: https://vitejs.dev/
- **NSIS Installer**: https://www.electron.build/configuration/nsis

## Support

For build issues, check:
1. Node.js version (v18+)
2. npm version (v9+)
3. Windows SDK installed
4. Antivirus not blocking electron-builder
5. No spaces in project path

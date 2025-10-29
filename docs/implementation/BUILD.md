# Build Guide - Holophonix Animator v2

Complete guide to building and packaging Holophonix Animator v2 for Windows.

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: For version control
- **Windows 10/11**: For building Windows executables

---

## Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd holophonix-animator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Development Mode
```bash
# Start Vite dev server
npm run dev

# Start Electron in development (in separate terminal)
npm run electron:dev
```

---

## Production Build

### 1. Build Web Assets
```bash
# Compile TypeScript and build React app
npm run build
```

### 2. Build Electron Application
```bash
# Build for current platform
npm run build:electron

# Build for Windows specifically
npm run build:win

# Build for Linux
npm run build:linux
```

### 3. Distribution Packages
```bash
# Create all distributable packages
npm run dist

# Windows executable (NSIS installer)
npm run build:win

# Linux packages
npm run build:deb        # Debian package
npm run build:appimage   # AppImage package
```

---

## Build Configuration

### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:electron": "cross-env NODE_ENV=production npm run build && electron-builder",
    "build:win": "cross-env NODE_ENV=production npm run build && electron-builder --win",
    "build:linux": "cross-env NODE_ENV=production npm run build && electron-builder --linux",
    "electron:dev": "cross-env NODE_ENV=development concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\""
  }
}
```

### Electron Builder Configuration
```json
{
  "build": {
    "appId": "com.holophonix.animator",
    "productName": "Holophonix Animator v2",
    "directories": {
      "output": "release",
      "buildResources": "assets"
    },
    "files": [
      "main.cjs",
      "preload.cjs",
      "dist/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "linux": {
      "target": ["deb", "AppImage"],
      "category": "AudioVideo",
      "icon": "assets/icon.png"
    }
  }
}
```

---

## TypeScript Configuration

### Main tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Electron Configuration (tsconfig.electron.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["main.ts", "preload.ts"]
}
```

---

## Vite Configuration

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
```

---

## Build Process Details

### 1. TypeScript Compilation
```bash
# Type checking without emitting files
npm run type-check

# Compile Electron main process
npm run compile:electron
```

### 2. Vite Build Process
- **React components** compiled to JavaScript
- **TypeScript** transpiled with full type checking
- **Assets** optimized and hashed
- **Source maps** generated for debugging

### 3. Electron Packaging
- **Main process** compiled to CommonJS
- **Preload script** bundled and secured
- **Application icon** and metadata embedded
- **Code signing** (if configured)

---

## Troubleshooting

### Common Build Issues

#### 1. TypeScript Errors
```bash
# Check for type errors
npm run type-check

# Update types if needed
npm update @types/node @types/react @types/react-dom
```

#### 2. Vite Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules/.vite
npm run build
```

#### 3. Electron Builder Issues
```bash
# Clean build directory
rm -rf release dist

# Rebuild from scratch
npm run build:electron
```

#### 4. Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build:electron
```

### Platform-Specific Issues

#### Windows
- Ensure **Windows SDK** is installed
- Check **Visual Studio Build Tools**
- Verify **code signing certificates** (for production)

#### Linux
- Install **build dependencies**: `sudo apt-get install build-essential`
- Check **libnss3** dependencies for Debian packages
- Verify **AppImage tools** for AppImage builds

---

## Optimization Tips

### 1. Bundle Size Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@types/three'],
          osc: ['osc', 'osc-js']
        }
      }
    }
  }
})
```

### 2. Build Performance
```bash
# Use parallel builds
npm run build --parallel

# Enable caching
npm run build --cache
```

### 3. Production Optimizations
- **Tree shaking** removes unused code
- **Minification** reduces bundle size
- **Compression** enabled for static assets
- **Source maps** excluded from production builds

---

## Deployment

### Windows Installer
- Location: `release/Holophonix Animator v2 Setup x.x.x.exe`
- Includes: Application, Visual C++ redistributables
- Installation: Standard NSIS installer

### Linux Packages
- **Debian**: `release/holophonix-animator_v2.x.x.x_amd64.deb`
- **AppImage**: `release/Holophonix-Animator-v2.x.x.x.AppImage`
- Both packages include all dependencies

---

## Version Management

Update version in multiple places:
1. `package.json` - `version` field
2. `electron-builder` config - `build.version`
3. `main.ts` - `app.getVersion()` calls
4. `About` dialog - Version display

---

**Status**: ✅ Production-ready build system
**Files**: package.json, vite.config.ts, tsconfig.json, electron-builder config
**Version**: v2.0.0

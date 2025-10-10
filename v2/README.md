# Holophonix Animator v2

A modern, high-performance 3D sound animation system for Holophonix processors, completely rewritten from the ground up with modern technologies and improved architecture.

## ✨ Features

### Core Functionality
- **Real-time 3D Animation**: Create sophisticated sound source animations in 3D space
- **OSC Communication**: Robust communication with Holophonix devices via OSC protocol
- **Track Management**: Organize sound sources with hierarchical grouping
- **Animation Types**: Linear, circular, elliptical, spiral, and custom animations
- **Timeline System**: Professional-grade animation sequencing and orchestration
- **Coordinate Systems**: Support for both XYZ and AED coordinate systems

### Technical Excellence
- **Performance Optimized**: Built for real-time audio workflows with sub-millisecond latency
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern Architecture**: React 18, Zustand state management, and modular design
- **3D Visualization**: Three.js integration for real-time animation preview
- **Cross-platform**: Electron-based desktop application

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **React 18** with modern hooks and concurrent features
- **Zustand** for lightweight, scalable state management
- **Three.js** for 3D visualization and animation preview
- **Tailwind CSS** for consistent, responsive UI design
- **Vite** for fast development and optimized production builds

### Backend Integration
- **Node.js 20** with native ESM support
- **Rust** via NAPI for high-performance computation tasks
- **Custom OSC** implementation for reliable device communication
- **WebSockets** for real-time process communication

### Key Design Principles
1. **Performance First**: Optimized for real-time audio applications
2. **Modular Architecture**: Clean separation of concerns and reusable components
3. **Type Safety**: Comprehensive TypeScript implementation
4. **Real-time Updates**: Live preview and immediate feedback
5. **Professional UX**: Intuitive interface for sound designers

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd holophonix-animator/v2

# Install dependencies
npm install

# Start development server
npm run dev

# Start Electron app (in another terminal)
npm run electron:dev
```

### Build for Production

```bash
# Build the application
npm run build

# Create distributable packages
npm run build:electron
```

## 📁 Project Structure

```
v2/
├── src/
│   ├── components/          # React components
│   │   ├── Layout.tsx       # Main application layout
│   │   ├── TrackList.tsx    # Track management interface
│   │   ├── AnimationEditor.tsx # Animation creation tools
│   │   ├── Timeline.tsx     # Animation sequencing
│   │   ├── OSCManager.tsx   # Device communication
│   │   └── Settings.tsx     # Application settings
│   ├── stores/              # State management
│   │   ├── projectStore.ts  # Project and track state
│   │   ├── animationStore.ts # Animation engine state
│   │   └── oscStore.ts      # OSC communication state
│   ├── types/               # TypeScript definitions
│   │   └── index.ts         # Core domain types
│   ├── utils/               # Utility functions
│   │   └── index.ts         # Math, animation, OSC utilities
│   ├── hooks/               # Custom React hooks
│   └── test/                # Test utilities
├── main.ts                  # Electron main process
├── preload.ts               # Electron preload script
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🎯 Key Improvements from v1

### Architecture
- **Modern Tech Stack**: React 18, TypeScript 5, Vite, Zustand
- **Better State Management**: Centralized stores with proper separation of concerns
- **Improved Performance**: Optimized rendering and computation pipelines
- **Enhanced Type Safety**: Comprehensive type definitions throughout

### User Experience
- **Intuitive Interface**: Clean, professional design with better UX patterns
- **Real-time Preview**: Immediate visual feedback for all changes
- **Better Animation Tools**: More sophisticated animation creation and editing
- **Enhanced Timeline**: Professional-grade sequencing capabilities

### Developer Experience
- **Fast Development**: Vite-based hot reloading and fast builds
- **Better Testing**: Vitest with comprehensive test coverage
- **Improved Tooling**: ESLint, Prettier, and modern development tools
- **Clear Documentation**: Comprehensive docs and architecture guides

## 🔧 Configuration

### OSC Settings
```typescript
{
  defaultPort: 8000,
  retryAttempts: 3,
  messageTimeout: 1000,
  bufferSize: 1024,
  maxRetries: 5
}
```

### Animation Settings
```typescript
{
  frameRate: 60,
  bufferSize: 1024,
  interpolationMethod: "cubic",
  coordinateSystem: "xyz"
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test TrackList.test.tsx
```

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Detailed technical architecture
- [Development Guide](./docs/development/) - Development workflows and patterns
- [API Reference](./docs/api/) - Component and API documentation
- [User Guide](./docs/user/) - End-user documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by professional audio workstation interfaces
- Designed for the needs of sound designers and audio engineers

---

**Version 2.0.0** | Modern 3D Sound Animation System

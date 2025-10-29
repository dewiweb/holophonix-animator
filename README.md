# Holophonix Animator v2

A professional spatial audio animation application for controlling Holophonix processors with real-time multi-track animations and advanced OSC communication.

## 🎯 Overview

Holophonix Animator v2 is a sophisticated Electron-based application designed for creating and controlling complex spatial audio animations. It provides an intuitive interface for designing multi-track movement patterns, managing sound sources in 3D space, and communicating with Holophonix audio processors via OSC protocol.

## ✨ Key Features

### 🎭 Animation System
- **24 Animation Types**: Linear, Circular, Spiral, Pendulum, Wave, Lissajous, and more
- **6 Multi-Track Modes**: Identical, Position-Relative, Formation, Phase-Offset, Centered, and Phase-Offset-Relative
- **Real-time Preview**: 3D visualization of animation paths and track movements
- **Advanced Control Points**: Bézier curves, Catmull-Rom splines, and custom path editing

### 🎛️ Professional Controls
- **Multi-Track Management**: Create, import, and organize unlimited sound sources
- **Real-time OSC Communication**: Optimized message batching and performance tuning
- **Preset System**: Save and load animation configurations
- **Parameter Forms**: Detailed control over all animation parameters

### 🔧 Technical Features
- **Bidirectional OSC**: Import tracks from Holophonix processors
- **Performance Optimized**: 60 FPS animation engine with background operation
- **Cross-Platform**: Windows, macOS, and Linux support
- **Professional UI**: Modern, dark-themed interface with responsive design

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Holophonix Processor**: For OSC communication (optional for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/holophonix-animator.git
cd holophonix-animator

# Install dependencies
npm install

# Start development server
npm run electron:dev
```

### Basic Usage

1. **Create Tracks**: Add individual tracks or import from Holophonix
2. **Select Animation**: Choose from 24 available animation types
3. **Configure Parameters**: Adjust animation settings using intuitive forms
4. **Multi-Track Setup**: Select multiple tracks and choose animation mode
5. **Preview & Play**: Use 3D preview to visualize, then play to send OSC

## 📁 Project Structure

```
holophonix-animator/
├── 📄 README.md                    # This file
├── 📄 package.json                # Dependencies and scripts
├── 📁 src/                        # Source code
│   ├── 📁 components/             # React components
│   │   ├── 📁 animation-editor/   # Main animation interface
│   │   ├── 📁 track-list/         # Track management
│   │   └── 📁 settings/           # Application settings
│   ├── 📁 stores/                 # Zustand state management
│   ├── 📁 utils/                  # Utilities and helpers
│   ├── 📁 types/                  # TypeScript definitions
│   └── 📁 main.tsx                # React entry point
├── 📁 docs/                       # Documentation
│   ├── 📋 DOCUMENTATION_INDEX.md  # Complete documentation guide
│   ├── 📁 bug-fixes/              # Bug fix documentation
│   ├── 📁 implementation/         # Technical implementation
│   ├── 📁 components/             # Component documentation
│   ├── 📁 features/               # Feature documentation
│   ├── 📁 testing/                # Testing procedures
│   └── 📁 osc/                    # OSC communication docs
├── 📁 assets/                     # Build assets and icons
├── 📄 main.ts                     # Electron main process
├── 📄 preload.ts                  # Electron preload script
└── 📄 vite.config.ts              # Vite configuration
```

## 🎮 Development

### Available Scripts

```bash
# Development
npm run electron:dev          # Start development server
npm run dev                   # Vite dev server only

# Building
npm run build                 # Build React application
npm run compile:electron      # Compile Electron processes
npm run build:electron        # Complete production build

# Testing
npm test                      # Run all tests
npm run test:ui              # Test with UI interface
npm run test:coverage        # Test with coverage report

# Distribution
npm run dist                  # Build distributables
npm run dist:win             # Windows build
npm run dist:linux           # Linux build
```

### Architecture

The application follows a modular architecture:

- **Frontend**: React with TypeScript, styled with TailwindCSS
- **State Management**: Zustand for reactive state management
- **3D Graphics**: Three.js for real-time animation preview
- **Communication**: OSC for Holophonix processor control
- **Desktop**: Electron for cross-platform desktop application

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Documentation Index](docs/DOCUMENTATION_INDEX.md)** - Complete guide to all features
- **[Animation Types](docs/features/NEW_ANIMATION_TYPES.md)** - Detailed animation documentation
- **[OSC Communication](docs/osc/OSC_OPTIMIZATION_STRATEGY.md)** - OSC protocol and optimization
- **[Multi-Track Modes](docs/features/MULTITRACK_MODES_REDESIGN.md)** - Multi-track animation modes
- **[Implementation Guide](docs/implementation/ARCHITECTURE.md)** - Technical architecture

## 🔧 Configuration

### OSC Settings

Configure OSC communication in Settings → OSC:

- **Output IP**: Holophonix processor IP address
- **Output Port**: Typically 8000 (check Holophonix settings)
- **Input Port**: For bidirectional communication (default: 4003)
- **Message Throttle**: Balance performance vs. smoothness

### Animation Settings

- **Frame Rate**: 60 FPS for smooth animation
- **Preview Quality**: Adjust based on system performance
- **Auto-save**: Enable automatic project saving

## 🎯 Use Cases

### Live Performance
- Real-time control of spatial audio during concerts
- Automated movement patterns for installation art
- Synchronized multi-speaker array control

### Post-Production
- Precise automation for film and game audio
- Complex spatial effects design
- Batch processing of audio movements

### System Integration
- Integration with show control systems
- Automated testing of speaker arrays
- Calibration and alignment procedures

## 🐛 Troubleshooting

### Common Issues

**OSC Messages Not Received**
- Verify Holophonix processor IP and port settings
- Check network connectivity and firewall settings
- Ensure Holophonix is configured to accept OSC messages

**Animation Performance Issues**
- Reduce track count or animation complexity
- Adjust message throttle rate in OSC settings
- Close other applications to free system resources

**Build Issues**
- Ensure Node.js v18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check system dependencies for your platform

### Performance Optimization

- **Message Batching**: Enabled by default for optimal OSC performance
- **Background Operation**: Animation continues when app is minimized
- **Memory Management**: Automatic cleanup of unused resources

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Holophonix**: For the excellent spatial audio processing platform
- **Electron Team**: For the cross-platform desktop framework
- **Three.js**: For the powerful 3D graphics library
- **React Community**: For the amazing UI framework and ecosystem

## 📞 Support

- **Documentation**: See `docs/` folder for comprehensive guides
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our discussions for questions and ideas

---

**Version**: v2.0.0  
**Last Updated**: 2024-01-15  
**Maintainer**: Holophonix Animator Team

---

*For detailed documentation, please refer to the [Documentation Index](docs/DOCUMENTATION_INDEX.md)*

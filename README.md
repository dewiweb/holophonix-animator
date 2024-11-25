# Holophonix Animator

> ⚠️ **Note**: This project is currently under active development and not yet available for production use. Features and APIs may change significantly.

A tool for creating and managing animations for Holophonix systems. This application provides a modern, user-friendly interface for designing and controlling spatial audio animations using the Holophonix system.

## Development Status

- 🚧 **Alpha Stage**: The project is in active development
- ⚠️ **Not Production Ready**: APIs and features may change without notice
- 🔄 **Regular Updates**: Development is ongoing with frequent updates
- 👷 **Contributors Welcome**: We welcome contributions, but expect frequent changes

## Features

> Note: These features are in development and may not all be fully implemented yet.

- Create and manage spatial audio animations
- Real-time preview and control
- OSC protocol integration
- Cross-platform support (Windows, macOS, Linux)

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Rust for high-performance audio processing
- **Desktop Framework**: Electron
- **Testing**: Jest for JavaScript/TypeScript, Rust's built-in testing framework
- **Build Tools**: npm, cargo

## Installation

> ⚠️ **Note**: These instructions are for development purposes only. The application is not yet available for production use.

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable version)
- Cargo (comes with Rust)
- Git

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/dewiweb/holophonix-animator.git
   cd holophonix-animator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the Rust components:
   ```bash
   npm run build:rust
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Development Environment

The application uses several development tools and configurations:
- TypeScript for type safety
- ESLint for code linting
- Jest for testing
- Rust's cargo for native components

## Development

### Current Focus

The project is currently focusing on:
- Core animation engine implementation
- Basic UI components and interactions
- OSC protocol integration
- Cross-platform compatibility

### Contributing

While we welcome contributions, please note that:
- The project is in rapid development
- Breaking changes may occur frequently
- APIs and features may change without notice
- Documentation might be incomplete or outdated

### Building the Project

1. **Frontend Development**
   ```bash
   # Start development server with hot reload
   npm run dev
   
   # Build development version
   npm run build:dev
   ```

2. **Rust Development**
   ```bash
   # Build Rust components in debug mode
   npm run build:rust
   
   # Run Rust tests
   cd src/rust && cargo test
   ```

3. **Full Application**
   ```bash
   # Build everything in development mode
   npm run build
   
   # Start the development version
   npm start
   ```

### Testing

> Note: Test coverage is still being expanded

- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- Rust tests: `cd src/rust && cargo test`
- Benchmarks: `npm run benchmark`

### Code Quality

We maintain code quality through:
- TypeScript for type safety
- ESLint for code style
- Rust's built-in linting
- Regular code reviews

Run quality checks:
- Linting: `npm run lint`
- Type checking: `npm run type-check`
- Format code: `npm run format`

## Project Structure Overview

### Documentation (`docs/`)
- **Getting Started**
  - Installation guides
  - Quick start tutorials
  - Basic usage examples
- **Architecture**
  - System design and components
  - Technical specifications
  - Integration patterns
- **API Documentation**
  - Core API reference
  - Protocol implementations
  - Integration guides
- **Development**
  - Contributing guidelines
  - Development workflow
  - Testing procedures
- **User Interface**
  - UI/UX guidelines
  - Component documentation
  - Design assets
- **Tools and Utilities**
  - Development tools
  - Testing utilities
  - Documentation generators

### Source Code (`src/`)
- **Benchmark** (`benchmark/`)
  - Performance testing suite
  - Benchmarking tools
  - Performance metrics
- **Electron** (`electron/`)
  - Desktop application shell
  - Main process handlers
  - IPC communication
- **React** (`react/`)
  - UI components
  - State management
  - User interactions
- **Rust** (`rust/`)
  - Core animation engine
  - OSC protocol implementation
  - State management
  - FFI bridge
- **Shared** (`shared/`)
  - Common utilities
  - Shared constants
  - Cross-platform helpers
- **Types** (`types/`)
  - TypeScript definitions
  - Shared interfaces
  - Type utilities

## License

MIT © dewiweb

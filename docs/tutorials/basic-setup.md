# Basic Setup Guide 🚀

This guide will walk you through setting up your development environment for the Holophonix Animator project.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- Rust (latest stable)
- Cargo (comes with Rust)
- Git

## Step 1: Clone the Repository 📦

```bash
git clone https://github.com/ORGANIZATION/holophonix-animator.git
cd holophonix-animator
```

## Step 2: Install Dependencies 📥

### Frontend Dependencies
```bash
# Install Node.js dependencies
npm install

# Install development tools
npm install -g electron-builder
```

### Rust Dependencies
```bash
# Install Rust dependencies
cargo build

# Install additional tools
cargo install cargo-watch  # For development
cargo install cargo-audit  # For security auditing
```

## Step 3: Configuration ⚙️

1. **Environment Setup**
   ```bash
   # Copy example environment file
   cp .env.example .env
   ```

2. **Edit Configuration**
   Open `.env` and configure:
   ```env
   OSC_DEFAULT_PORT=4003
   ANIMATION_FPS=60
   DEBUG_MODE=true
   ```

## Step 4: Build the Project 🔨

```bash
# Build Rust core
cargo build

# Build frontend
npm run build

# Build electron app
npm run electron:build
```

## Step 5: Run Development Server 🏃‍♂️

```bash
# Start development server
npm run dev
```

## Step 6: Verify Installation ✅

1. **Check Frontend**
   - Open http://localhost:3000
   - Verify React dev tools are working
   - Check for any console errors

2. **Check Rust Core**
   ```bash
   cargo test
   ```

3. **Check OSC Communication**
   ```bash
   # In a new terminal
   npm run test:osc
   ```

## Common Issues and Solutions 🔧

### 1. Build Failures
- **Issue**: `cargo build` fails
  ```
  error: failed to load source for dependency 'xyz'
  ```
  **Solution**: Update Rust
  ```bash
  rustup update stable
  ```

- **Issue**: Node modules errors
  ```
  Error: Cannot find module 'xyz'
  ```
  **Solution**: Clear npm cache
  ```bash
  rm -rf node_modules
  npm cache clean --force
  npm install
  ```

### 2. Runtime Issues
- **Issue**: OSC connection fails
  ```
  Error: EADDRINUSE
  ```
  **Solution**: Check if port 4003 is in use
  ```bash
  lsof -i :4003
  ```

## Next Steps 🎯

1. Read the [Your First Animation](first-animation.md) tutorial
2. Explore the [Project Architecture](../architecture/README.md)
3. Review [Development Guidelines](../development/README.md)

## Need Help? 💬

- Check our [FAQ](../help/faq.md)
- Join our [Discord Community](https://discord.gg/xyz)
- [Report an Issue](https://github.com/ORGANIZATION/holophonix-animator/issues)

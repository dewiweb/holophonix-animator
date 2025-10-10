# Holophonix Animator 2.0 - Core Architecture

## Overview
A modern, high-performance 3D sound animation system for Holophonix processors.

## Core Principles
1. **Real-time 3D Animation**: Precise, low-latency sound source positioning
2. **OSC Communication**: Robust, reliable communication with Holophonix devices
3. **Group Synchronization**: Intelligent track grouping and animation coordination
4. **Performance First**: Optimized for real-time audio workflows
5. **Intuitive Interface**: Professional-grade UI for sound designers

## Architecture Overview

### Frontend (React + TypeScript)
- **Core**: React 18 with TypeScript for type safety
- **State Management**: Zustand for lightweight, scalable state
- **3D Visualization**: Three.js for real-time preview
- **UI Framework**: Custom components with Tailwind CSS
- **Build System**: Vite for fast development and optimized production builds

### Backend (Node.js + Rust)
- **Runtime**: Node.js 20+ with native ESM support
- **High-Performance Engine**: Rust via NAPI for computation-intensive tasks
- **Communication**: Custom OSC implementation for reliability
- **WebSockets**: Real-time communication between processes

### Key Features
- **Animation Engine**: Advanced interpolation and motion planning
- **Coordinate Systems**: XYZ and AED support with transformations
- **Timeline System**: Professional-grade animation sequencing
- **Preset Management**: Reusable animation templates
- **Real-time Preview**: Visual feedback during editing

## Technology Stack
- **Frontend**: React 18, TypeScript, Zustand, Three.js, Tailwind CSS, Vite
- **Backend**: Node.js 20, Rust (NAPI), OSC protocol, WebSockets
- **Development**: ESLint, Prettier, Vitest, Playwright
- **Deployment**: Electron for cross-platform desktop app

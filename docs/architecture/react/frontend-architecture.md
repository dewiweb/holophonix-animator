# React Frontend Architecture

## Overview

The React frontend provides the user interface for the Holophonix Animator, focusing on user interaction, state visualization, and real-time feedback through a modern, theme-switchable interface supporting both light and dark modes.

## Core Components

### 1. Main Window Components

#### Title Bar
- Application title
- Window controls (minimize, maximize, close)
- Connection status

#### Control Panel
- IP address and port configuration
- Connection management
- Settings access
  - Auto-save configuration
  - Theme selection
  - Language preferences
- Additional controls toggle
- Window management controls
  - New window creation
  - Window synchronization
  - Window arrangement presets

#### Status Bar
- Connection status
- Current coordinates
- Time display

### 2. Panel Components

#### Tracks Panel
- Track list management
- Track expansion/collapse
- Track addition interface
- Group management
  - Pattern-based group creation
    - Range syntax support `[start-end]`
    - Set syntax support `{track1,track2,...}`
  - Group hierarchy visualization
  - Formation pattern templates
  - Leader-follower relationships
    - Time offset configuration
    - Formation preservation controls
- Property configuration

#### Performance Monitor
- Real-time metrics visualization
  - State synchronization status
  - Animation frame rates
  - Network latency
  - Resource usage
- Connection timeout indicators
- System health status

#### Animation Models Panel
- Available animation models:
  - Linear Movement
  - Circular Motion
  - Pattern Movement
  - Random Walk
  - Path Following
  - Formation-based Movement
- Active animations management
- Playback controls
- Parameter editing with horizontal faders
- Real-time parameter adjustment

#### Animation Parameters Panel
- Horizontal parameter faders for numerical adjustments
- Real-time parameter feedback
- Parameter bounds visualization
- Animation model visualization
- Timeline control and display

### 3. Interaction Handling

#### User Input Processing
- Captures and validates connection settings
- Processes numerical parameters via horizontal faders
- Handles track modifications
- Manages timeline interactions

#### Event Flow
- Forwards validated commands to Electron main process
- Receives state updates through IPC
- Updates visualization in real-time
- Provides visual feedback for parameter changes

### 4. Visual Feedback

#### State Visualization
- Real-time parameter updates
- Animation model visualization
- Timeline progress
- Connection status indicators
- Parameter fader positions

#### Interactive Elements
- Horizontal parameter faders
- Parameter bound indicators
- Playback controls
- Expandable panels
- Smooth fader interactions

## Performance Optimization

### 1. Rendering Optimization
- React.memo for panel components
- Virtual scrolling for track lists
- Optimized 2D canvas rendering
- Efficient timeline rendering

### 2. State Updates
- Batched updates for parameter changes
- Efficient IPC message handling
- Optimistic UI updates
- Smooth animation transitions

### 3. Resource Management
- Lazy loading of panels
- Efficient canvas rendering
- Efficient asset caching
- Memory-conscious timeline handling

## Error Handling

### 1. User Input Validation
- Connection parameter validation
- Animation model parameter bounds with visual fader limits
- Track configuration validation
- Real-time parameter feedback
- Fader step size validation

### 2. Visual Error Feedback
- Connection status indicators
- Parameter validation highlights
- Error message displays
- Recovery suggestions

## Internationalization

### 1. Language Support
- English (default)
- French
- Dynamic language switching
- Fallback handling
- RTL support preparation

### 2. Translation Management
- Structured translation keys
- Context-aware translations
- Pluralization support
- Number and date formatting
- Units conversion handling

### 3. Content Adaptation
- Dynamic layout adjustments
- Language-specific formatting
- Cultural considerations
- Accessibility compliance
- Error messages localization

## Theme System

### 1. Theme Implementation
- Comprehensive theming system
- Light and dark mode support
- Dynamic theme switching
- System preference detection
- Theme-specific component styling
- Consistent color tokens across themes

### 2. Visual Hierarchy
- Clear component separation
- Intuitive grouping
- Consistent spacing
- Focus indicators
- Accessible contrast ratios
- Theme-independent visual structure

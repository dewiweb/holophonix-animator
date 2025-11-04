# Live Show Control System (Future Feature)

## Overview
The Live Show Control System will enable simultaneous playback of multiple animations with precise timing, similar to professional lighting and audio control systems. This is designed for live performances where multiple animation layers need to be triggered and controlled in real-time.

## Current Limitation
Currently, the application only allows one animation to play at a time, with no ability to layer animations or trigger them independently during a performance.

## Proposed Implementation

### 1. Core Components

#### Show Data Structure
```typescript
interface Show {
  id: string;
  name: string;
  cues: ShowCue[];
  timecodeFormat: 'SMPTE' | 'BPM' | 'Seconds';
  bpm?: number;  // For BPM-based timing
  startTime?: number;  // For absolute time start
}

interface ShowCue {
  id: string;
  name: string;
  type: 'animation' | 'effect' | 'group' | 'command';
  
  // Timing
  time: number;  // Start time in show timeline
  duration: number;  // 0 for instant/until stopped
  fadeIn: number;    // Fade in time (seconds)
  fadeOut: number;   // Fade out time (seconds)
  
  // Trigger options
  trigger: {
    type: 'time' | 'manual' | 'osc' | 'midi' | 'follow';
    oscAddress?: string;
    midiNote?: number;
    followCueId?: string;  // For follow-on cues
    followDelay?: number;  // Delay after previous cue
  };
  
  // Animation-specific (if type === 'animation')
  animation?: {
    id: string;  // Reference to animation preset
    startTime: number;  // Start time within the animation
    playbackRate: number;  // Speed multiplier
    loop: boolean;
    selectedTracks: string[];  // Override default tracks if needed
    parameterOverrides?: Partial<AnimationParameters>;  // Per-cue parameter adjustments
  };
  
  // Effect/Command data would go here
  
  // Status
  status: 'waiting' | 'running' | 'paused' | 'complete' | 'error';
}
```

### 2. Cue Library Interface

#### Cue Grid View
- Responsive grid of cue cards/buttons
- Each card shows:
  - Cue name (editable)
  - Preview thumbnail (auto-generated)
  - Status indicator (idle/active/paused/error)
  - Quick action buttons (play/pause/stop)
  - Color-coded by category/type
- Customizable grid size (1x1 to 5x5 per page)
- Pagination for large cue libraries

#### Cue Card Actions
- **Click**: Toggle play/pause
- **Shift+Click**: Stop and reset
- **Ctrl+Click (⌘+Click)**: Solo (stop others)
- **Right-click**: Context menu with advanced options
- **Drag to reorder** in the grid
- **Double-click**: Open in animation editor

#### Cue Status Indicators
- **Idle**: Gray outline
- **Playing**: Green pulse animation
- **Paused**: Yellow highlight
- **Error**: Red flash
- **Active with parameters**: Blue glow

#### Quick Controls
- Master play/pause/stop for all cues
- Global fade controls
- Bank selection (A/B/C/D)
- Search and filter cues by name/tag/status

#### Minimalist Cue Editor
- Inline editing of cue properties
- Quick parameter overrides
- Cue grouping and tagging
- Keyboard shortcut assignment

### 3. Technical Implementation

#### Storage
- SQLite database for cue storage
- JSON export/import functionality
- Versioning and backup system

#### State Management
- Track active cues and their states
- Handle cue transitions and overlaps
- Manage resource allocation for multiple animations

#### Performance Considerations
- Pre-loading of queued animations
- Memory management for many cues
- Background rendering of previews

### 4. Integration Points

#### With Existing Systems
- OSC/MIDI mapping for all controls
- Timecode synchronization (LTC, MTC, MIDI Clock)
- External show control protocols (OSC, Art-Net, etc.)
- Session recall and snapshots

### 5. Show Control Features

#### Advanced Playback
- Cue lists and stacks
- Cue timing curves
- Effect layers and blending modes
- Parameter automation

#### Live Performance
- Cue preview and pre-wait
- Cue timing adjustments on the fly
- Blackout and emergency stop
- Cue priority and overrides

#### Show Management
- Cue sheets and documentation
- Show file versioning
- Backup and restore
- Show merging

## Development Phases

### Phase 1: Core Cue Functionality
- Basic cue grid interface
- Simple play/stop controls
- Cue status indicators
- Keyboard shortcuts

### Phase 2: Advanced Triggering
- Multiple trigger modes (toggle/latch/one-shot)
- Cue chaining and follow-ons
- Parameter overrides
- OSC/MIDI mapping

### Phase 3: Performance Features
- Cue batching
- Bank switching
- Cue queuing
- Performance optimizations

## Technical Dependencies
- State management system updates
- Database integration
- New UI components
- Performance monitoring tools

## Technical Considerations

1. **Cue Management**
   - Fast cue lookup and instantiation
   - State management for many concurrent cues
   - Efficient resource handling

2. **UI Performance**
   - Smooth animations and transitions
   - Responsive design for touch/desktop
   - Visual feedback for user actions

3. **Integration**
   - Communication with animation engine
   - OSC/MIDI input handling
   - Timeline system synchronization

4. **User Experience**
   - Intuitive controls
   - Clear status feedback
   - Keyboard navigation

---
*Document last updated: 2025-11-04*

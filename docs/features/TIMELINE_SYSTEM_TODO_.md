# Timeline System Redesign (Future Feature)

## Overview
The Timeline System will be completely reimagined to support professional show control, enabling precise arrangement and synchronization of multiple animations, effects, and automation. This new system will serve as the central hub for show creation and editing.

## Current Limitations
- Single animation timeline only
- No support for multiple tracks or layers
- Limited editing capabilities
- No automation curves or keyframing
- No grouping or nesting of timeline elements

## Proposed Architecture

### 1. Timeline Data Model

```typescript
interface Timeline {
  id: string;
  name: string;
  
  // Time configuration
  duration: number;  // in seconds
  frameRate: number; // for frame-accurate editing
  timeFormat: 'timecode' | 'bars-beats' | 'seconds';
  
  // Tracks (vertical layers)
  tracks: TimelineTrack[];
  
  // Global settings
  viewSettings: {
    visibleRange: [number, number];  // visible time range
    verticalZoom: number;            // track height
    horizontalZoom: number;          // time scale
    snapToGrid: boolean;
    gridSize: number;               // in seconds or beats
  };
  
  // Markers and regions
  markers: TimelineMarker[];
  regions: TimelineRegion[];
  
  // Linked show control (optional)
  showId?: string;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'animation' | 'effect' | 'group' | 'automation';
  
  // Track visibility and behavior
  isMuted: boolean;
  isSoloed: boolean;
  isLocked: boolean;
  isCollapsed: boolean;
  
  // Track items (clips, automation points, etc.)
  items: TimelineItem[];
  
  // Track-specific settings
  height: number;
  color: string;
  
  // For group tracks
  children?: string[];  // IDs of child tracks
  parentId?: string;    // For nested tracks
}

interface TimelineItem {
  id: string;
  type: 'clip' | 'automation' | 'marker' | 'group' | 'cue';
  startTime: number;
  duration: number;
  
  // For animation clips
  animationId?: string;
  trackIds?: string[];  // For multi-track items
  
  // For cue triggers
  cueId?: string;  // Reference to a cue in the cue library
  triggerType?: 'timecode' | 'manual' | 'follow';
  triggerTime?: number;  // Timecode or beat position
  
  // For automation
  automationType?: 'parameter' | 'effect';
  parameterPath?: string;  // e.g., 'position.x', 'volume'
  
  // Visual styling
  color?: string;
  label?: string;
  
  // Linked to show cues
  cueId?: string;
}
```

### 2. Key Features

#### Multi-Track Editing
- Unlimited tracks with configurable types
- Track grouping and nesting
- Track visibility and solo/mute controls
- Track height adjustment

#### Advanced Clip Management
- Non-destructive editing
- Clip splitting, trimming, and resizing
- Time-stretching and pitch-shifting
- Crossfades and transitions
- Nested timelines

#### Automation
- Bezier curve editing
- Parameter linking
- Automation lanes
- Envelope following

#### Time Navigation
- Multiple time scales (timecode, bars/beats, seconds)
- Zoom to selection/fit to content
- Custom markers and regions
- Loop and punch in/out points

#### Cue Trigger Integration
- Drag and drop cues from library to timeline
- Cue markers with visual feedback
- Timecode-locked triggering
- Follow actions and chaining

#### Timecode Show Control
- SMPTE/MTC timecode input/output
- Timecode chase and sync modes
- Timecode offset and jitter correction
- Timecode display formats (24/25/29.97/30/50/60 fps)
- Timecode generator with start/stop/loop

#### Show Playback Controls
- Playhead with timecode display
- Jog/shuttle controls
- Loop points and regions
- Cue pre/post wait times
- Global speed control

### 3. User Interface

#### Main Timeline View
- Horizontal time ruler with multiple scales
- Vertical track list with controls
- Central editing area with grid
- Playhead with preview

#### Inspector Panel
- Selected item properties
- Keyframe editor
- Effect parameters
- Animation properties

#### Toolbar
- Selection and editing tools
- Zoom and navigation controls
- Snapping options
- Playback controls

### 4. Technical Considerations

#### Performance
- Virtualized rendering for large timelines
- Level-of-detail optimization
- Background rendering
- GPU acceleration

#### Data Management
- Efficient storage format
- Incremental saving
- Undo/redo stack
- Versioning

#### Integration Points
- Animation engine
- Show control system
- External sync protocols
- Plugin system

## Development Phases

### Phase 1: Foundation
- Basic multi-track timeline
- Simple clip and cue editing
- Basic playback with timecode

### Phase 2: Cue Integration
- Cue triggering from timeline
- Timecode synchronization
- Cue follow actions
- Show section markers

### Phase 3: Professional Features
- Advanced timecode features
- Show control protocols
- Performance optimization
- Multi-user collaboration

## Technical Considerations

### Cue Triggering
- Precise timing for cue execution
- Handling of late/early triggers
- Cue priority and interruption
- Resource allocation for multiple cues

### Timecode Management
- Sub-frame accurate triggering
- Timecode drift compensation
- Multiple timecode sources (LTC, MTC, MIDI Clock)
- Network time synchronization

### Performance
- Efficient cue lookup and instantiation
- Memory management for show data
- Real-time parameter interpolation
- Background rendering of timeline

### Integration
- OSC/MIDI timecode synchronization
- External show control protocols
- Multi-display support
- Remote control interfaces

---
*Document last updated: 2025-11-04*

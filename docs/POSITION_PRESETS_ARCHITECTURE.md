# Track Position Presets System - Architecture

## Overview

The **Position Presets System** enables users to save, recall, and interpolate between track position configurations in live performance scenarios. It integrates with the cuelist system to provide dynamic scene management with smooth transitions.

## Core Concepts

### Position Preset
A **snapshot** of track positions at a specific moment:
- Stores positions for multiple tracks
- Named and categorized for easy recall
- Can be partial (subset of tracks) or complete (all tracks)
- Versioned for project compatibility

### Position Cue
A **cue type** that recalls a position preset:
- Extends `BaseCue` like other cue types
- Supports interpolation to preset with configurable duration/easing
- Can blend between multiple presets
- Integrates with cuelist timeline and follow actions

### Interpolation Engine
Handles smooth transitions between position states:
- Multiple interpolation strategies (linear, bezier, spherical)
- Conflict resolution for multi-cue scenarios
- Respects track animation states

## Use Cases

### 1. Scene Management
**Problem:** In a theatrical performance, you need to quickly switch between pre-designed spatial configurations.

**Solution:**
```typescript
// Store scene configurations
const sceneA = createPreset("Scene A - Audience Left", [track1, track2, track3])
const sceneB = createPreset("Scene B - Surround", [track1, track2, track3])

// Recall with smooth transition
const cue1 = createPositionCue(sceneA, { duration: 2.0, easing: 'ease-in-out' })
const cue2 = createPositionCue(sceneB, { duration: 1.5, easing: 'ease-in-out' })
```

### 2. Complex Multi-Track Positioning
**Problem:** Setting up 20+ tracks in a precise formation is tedious and error-prone.

**Solution:**
- Create preset once in editor with visual tools
- Recall instantly in any show
- Reuse across multiple projects

### 3. Dynamic Scene Morphing
**Problem:** Gradually transition from one spatial configuration to another over time.

**Solution:**
```typescript
// Cuelist with position cue sequence
cueList.add([
  positionCue(preset1, { duration: 3.0 }),    // Move to preset 1
  positionCue(preset2, { duration: 5.0 }),    // Morph to preset 2
  positionCue(preset3, { duration: 2.0 })     // Quick change to preset 3
])
```

### 4. Animation Start/End Positions
**Problem:** Need precise starting positions before animations begin.

**Solution:**
- Position cue before animation cue in cuelist
- Ensures tracks are exactly where animation expects
- No more manual positioning errors

## Architecture

### Data Model

```typescript
// ========================================
// POSITION PRESETS
// ========================================

/**
 * Position Preset
 * A saved snapshot of track positions
 */
export interface PositionPreset {
  id: string
  name: string
  description?: string
  
  // Position data
  positions: Record<string, Position>  // trackId -> position
  trackIds: string[]                   // All tracks in this preset
  
  // Metadata
  category?: PresetCategory
  tags?: string[]
  thumbnail?: string                   // Base64 or URL to preset visualization
  
  // Creation info
  created: Date
  modified: Date
  author?: string
  
  // Versioning
  version: number                      // For migration compatibility
  projectId?: string                   // Link to source project
  
  // Scope
  scope: 'project' | 'global'         // Project-specific or shared library
}

export type PresetCategory = 
  | 'scene'           // Complete scene configurations
  | 'formation'       // Track formations (line, circle, grid)
  | 'effect'          // Effect start/end positions
  | 'safety'          // Safe positions (home, park)
  | 'custom'          // User-defined

/**
 * Position Preset Library
 * Manages collection of presets
 */
export interface PositionPresetLibrary {
  presets: PositionPreset[]
  categories: PresetCategory[]
  
  // Organization
  folders?: PresetFolder[]
  favorites?: string[]               // Preset IDs
}

export interface PresetFolder {
  id: string
  name: string
  presetIds: string[]
  color?: string
  icon?: string
}
```

### Position Cue Type

```typescript
/**
 * Position Cue
 * Recalls a position preset with interpolation
 */
export interface PositionCue extends BaseCue {
  type: 'position'
  data: PositionCueData
}

export interface PositionCueData {
  // Preset reference
  presetId: string                    // Reference to position preset
  
  // Target tracks (optional override)
  trackIds?: string[]                 // If undefined, use all tracks from preset
  trackFilter?: TrackFilter           // Dynamic track selection
  
  // Transition settings
  transition: PositionTransition
  
  // Blend settings (for multi-preset morphing)
  blend?: PresetBlend
  
  // Behavior
  interruptAnimations?: boolean       // Stop animations on target tracks
  waitForCompletion?: boolean         // Block until transition completes
  
  // Coordinate system override
  coordinateSystem?: 'xyz' | 'aed'
  
  // Safety
  respectBounds?: boolean             // Clip positions to safe bounds
  maxSpeed?: number                   // Max track velocity (m/s)
}

/**
 * Position Transition
 * How to move from current position to preset position
 */
export interface PositionTransition {
  duration: number                    // Seconds
  easing: EasingFunction              // From resetCue.ts
  
  // Advanced interpolation
  mode: InterpolationMode
  
  // Per-track overrides (optional)
  perTrackDuration?: Record<string, number>
  perTrackEasing?: Record<string, EasingFunction>
  
  // Delay options
  stagger?: StaggerConfig             // Stagger track movements
}

export type InterpolationMode = 
  | 'cartesian'      // Linear interpolation in XYZ space
  | 'spherical'      // Spherical interpolation (preserve arc)
  | 'bezier'         // Bezier curve with auto-generated control points
  | 'circular'       // Maintain constant distance from origin
  | 'custom'         // User-defined path

export interface StaggerConfig {
  enabled: boolean
  mode: 'sequential' | 'random' | 'inside-out' | 'outside-in'
  delay: number                       // Delay between tracks (seconds)
  overlap: number                     // Overlap factor (0-1)
}

/**
 * Preset Blend
 * Blend between multiple presets
 */
export interface PresetBlend {
  mode: 'crossfade' | 'additive' | 'selective'
  
  // Multiple presets with weights
  presets: Array<{
    presetId: string
    weight: number                    // 0-1
  }>
  
  // Conflict resolution
  conflictStrategy: 'first-wins' | 'average' | 'weighted'
}

/**
 * Track Filter
 * Dynamic track selection
 */
export interface TrackFilter {
  mode: 'include' | 'exclude'
  
  // Filter criteria
  trackType?: TrackType[]
  groups?: string[]
  tags?: string[]
  indices?: number[]                  // Holophonix indices
  names?: string[]                    // Name patterns (regex)
  
  // Conditions
  conditions?: Array<{
    property: keyof Track
    operator: 'equals' | 'contains' | 'greater' | 'less'
    value: any
  }>
}
```

### Store Integration

```typescript
/**
 * Position Preset Store
 * Manages presets in Zustand
 */
interface PositionPresetStore {
  // State
  presets: PositionPreset[]
  library: PositionPresetLibrary
  activePresetId: string | null
  
  // Actions
  
  // CRUD
  createPreset: (data: Omit<PositionPreset, 'id'>) => string
  updatePreset: (id: string, updates: Partial<PositionPreset>) => void
  deletePreset: (id: string) => void
  duplicatePreset: (id: string, newName?: string) => string
  
  // Capture
  captureCurrentPositions: (
    trackIds: string[],
    name: string,
    options?: CaptureOptions
  ) => string
  
  // Recall
  applyPreset: (
    presetId: string,
    options: ApplyPresetOptions
  ) => Promise<void>
  
  // Comparison
  comparePresets: (presetId1: string, presetId2: string) => PresetDiff
  
  // Import/Export
  exportPreset: (id: string) => string          // JSON string
  importPreset: (json: string) => string        // Returns new preset ID
  exportLibrary: () => string
  importLibrary: (json: string, merge: boolean) => void
  
  // Organization
  createFolder: (name: string) => string
  moveToFolder: (presetId: string, folderId: string) => void
  toggleFavorite: (presetId: string) => void
}

interface CaptureOptions {
  category?: PresetCategory
  description?: string
  tags?: string[]
  scope?: 'project' | 'global'
  includeInactive?: boolean          // Include tracks not in current project
}

interface ApplyPresetOptions {
  trackIds?: string[]                // Override preset tracks
  transition?: PositionTransition
  interruptAnimations?: boolean
}

interface PresetDiff {
  added: string[]                    // Tracks in preset2 not in preset1
  removed: string[]                  // Tracks in preset1 not in preset2
  moved: Array<{
    trackId: string
    from: Position
    to: Position
    distance: number
  }>
  unchanged: string[]
}
```

## Cuelist Integration

### Execution Flow

```typescript
/**
 * Position Cue Executor
 * Handles position cue execution in cuelist
 */
class PositionCueExecutor {
  async execute(cue: PositionCue, context: CueExecutionContext): Promise<void> {
    // 1. Resolve preset
    const preset = this.presetStore.getPreset(cue.data.presetId)
    if (!preset) throw new Error('Preset not found')
    
    // 2. Resolve target tracks
    const trackIds = this.resolveTrackIds(cue, preset, context)
    
    // 3. Check for conflicts
    const conflicts = this.checkConflicts(trackIds, context)
    if (conflicts.length > 0) {
      await this.resolveConflicts(conflicts, cue.data.transition)
    }
    
    // 4. Interrupt animations if requested
    if (cue.data.interruptAnimations) {
      await this.stopAnimations(trackIds)
    }
    
    // 5. Execute transition
    await this.executeTransition(cue, preset, trackIds, context)
    
    // 6. Update cue status
    context.updateCueStatus(cue.id, 'complete')
    
    // 7. Trigger follow actions
    this.triggerFollowActions(cue, context)
  }
  
  private async executeTransition(
    cue: PositionCue,
    preset: PositionPreset,
    trackIds: string[],
    context: CueExecutionContext
  ): Promise<void> {
    const { transition } = cue.data
    
    // Build interpolation targets
    const targets = trackIds.map(trackId => ({
      trackId,
      from: this.projectStore.getTrack(trackId).position,
      to: preset.positions[trackId]
    }))
    
    // Apply stagger if configured
    if (transition.stagger?.enabled) {
      await this.executeStaggered(targets, transition)
    } else {
      await this.executeParallel(targets, transition)
    }
  }
  
  private async executeStaggered(
    targets: TransitionTarget[],
    transition: PositionTransition
  ): Promise<void> {
    const { stagger } = transition
    const order = this.calculateStaggerOrder(targets, stagger!.mode)
    
    for (let i = 0; i < order.length; i++) {
      const target = order[i]
      const delay = i * stagger!.delay * (1 - stagger!.overlap)
      
      setTimeout(() => {
        this.interpolatePosition(target, transition)
      }, delay * 1000)
    }
  }
}
```

### Timeline Sequencing

```typescript
/**
 * Position Cue Sequencing
 * How position cues work in timeline
 */

// Example: Theatrical scene changes
const cuelist: Cuelist = {
  id: 'act-1',
  name: 'Act 1',
  cues: [
    // Scene 1: Opening
    {
      type: 'position',
      name: 'Scene 1 - Opening Positions',
      data: {
        presetId: 'scene-1-opening',
        transition: { duration: 2.0, easing: 'ease-in-out', mode: 'cartesian' }
      }
    },
    
    // Animation during scene 1
    {
      type: 'animation',
      name: 'Gentle Movement',
      data: {
        animationId: 'gentle-circular',
        duration: 30.0
      }
    },
    
    // Transition to Scene 2
    {
      type: 'position',
      name: 'Scene 2 - Surround Setup',
      data: {
        presetId: 'scene-2-surround',
        transition: {
          duration: 3.0,
          easing: 'ease-in-out',
          mode: 'spherical',
          stagger: {
            enabled: true,
            mode: 'outside-in',
            delay: 0.1,
            overlap: 0.5
          }
        },
        interruptAnimations: true
      }
    },
    
    // Scene 2 animation
    {
      type: 'animation',
      name: 'Dynamic Spiral',
      data: {
        animationId: 'spiral-formation',
        duration: 45.0
      }
    }
  ]
}
```

### Advanced Features

#### 1. Preset Morphing
Smoothly blend between multiple presets over time:

```typescript
const morphCue: PositionCue = {
  type: 'position',
  name: 'Morph A→B→C',
  data: {
    blend: {
      mode: 'crossfade',
      presets: [
        { presetId: 'preset-a', weight: 1.0 },
        { presetId: 'preset-b', weight: 0.0 }
      ],
      conflictStrategy: 'weighted'
    },
    transition: {
      duration: 10.0,
      easing: 'linear',
      mode: 'cartesian'
    }
  }
}

// Animate blend weights over time
animateBlendWeights(morphCue, [
  { time: 0.0, weights: [1.0, 0.0] },
  { time: 5.0, weights: [0.0, 1.0] }
])
```

#### 2. Relative Presets
Store presets as offsets rather than absolute positions:

```typescript
interface RelativePreset extends PositionPreset {
  mode: 'absolute' | 'relative'
  
  // For relative mode
  referencePosition?: Position        // Base position
  offsets?: Record<string, Position>  // Per-track offsets
}

// Apply relative preset to current positions
function applyRelativePreset(preset: RelativePreset): void {
  preset.trackIds.forEach(trackId => {
    const currentPos = getTrackPosition(trackId)
    const offset = preset.offsets[trackId]
    const newPos = {
      x: currentPos.x + offset.x,
      y: currentPos.y + offset.y,
      z: currentPos.z + offset.z
    }
    setTrackPosition(trackId, newPos)
  })
}
```

#### 3. Conditional Presets
Apply presets based on runtime conditions:

```typescript
interface ConditionalPositionCue extends PositionCue {
  conditions: Array<{
    check: 'track-count' | 'track-type' | 'project-setting'
    operator: 'equals' | 'greater' | 'contains'
    value: any
    presetId: string              // Use this preset if condition matches
  }>
  
  fallbackPresetId: string        // Default if no conditions match
}
```

## Implementation Strategy

### Phase 1: Core Infrastructure (Week 1-2)
1. ✅ Design data structures
2. ⏳ Create position preset types (`src/types/positionPreset.ts`)
3. ⏳ Create position cue type (`src/cues/types/positionCue.ts`)
4. ⏳ Build preset store (`src/stores/positionPresetStore.ts`)
5. ⏳ Implement capture/recall logic

### Phase 2: Cuelist Integration (Week 3)
1. ⏳ Position cue executor
2. ⏳ Add position cue to cue store
3. ⏳ Integrate with timeline
4. ⏳ Conflict resolution
5. ⏳ Testing with existing cue types

### Phase 3: UI Components (Week 4-5)
1. ⏳ Preset manager panel
2. ⏳ Preset capture dialog
3. ⏳ Position cue editor
4. ⏳ Visual preset preview (3D)
5. ⏳ Preset library browser

### Phase 4: Advanced Features (Week 6+)
1. ⏳ Preset morphing/blending
2. ⏳ Relative presets
3. ⏳ Stagger configurations
4. ⏳ Import/export
5. ⏳ Preset comparison tools

## Benefits

### For Users
- **Fast Scene Changes**: Recall complex positions instantly
- **Consistency**: Exact reproducible positioning
- **Safety**: Store safe/park positions
- **Experimentation**: Try different configurations quickly
- **Reusability**: Use presets across multiple shows/projects

### For System
- **Cuelist Integration**: Native position control in cuelist workflow
- **Interpolation Engine**: Reusable for other features
- **Extensibility**: Foundation for advanced scene management
- **Performance**: Optimized batch position updates

## Future Enhancements

1. **AI-Generated Presets**: ML-based formation suggestions
2. **Preset Interpolation Curves**: Bezier handles for complex movements
3. **Group Presets**: Store group hierarchies and relationships
4. **Preset Macros**: Chain multiple presets with logic
5. **Live Preset Recording**: Record positions during live performance
6. **Preset Version Control**: Track preset changes over time
7. **Collaborative Presets**: Share presets with other users
8. **Preset Templates**: Generate presets from mathematical patterns

## Technical Considerations

### Performance
- **Batch OSC Updates**: Group position updates for efficiency
- **Incremental Updates**: Only send changed positions
- **Position Diffing**: Skip tracks already at target position
- **Throttling**: Rate-limit position updates during fast transitions

### Safety
- **Bounds Checking**: Validate positions against coordinate system bounds
- **Collision Detection**: Warn about overlapping track positions
- **Velocity Limiting**: Prevent dangerous rapid movements
- **Undo/Redo**: Allow reverting preset applications

### Compatibility
- **Migration**: Handle old preset formats
- **Validation**: Verify track IDs still exist
- **Fallbacks**: Handle missing presets gracefully
- **Export Format**: Standardized JSON for interoperability

## Conclusion

The Position Presets System provides a professional-grade scene management solution that complements the existing animation system. By integrating with the cuelist, it enables complex spatial audio workflows with theatrical precision and real-time flexibility.

# Position Presets System - Implementation Guide

## Overview

The Position Presets System is now implemented with complete type definitions, interpolation utilities, and store management. This guide explains how to integrate it with the cuelist system.

## Files Created

### 1. Type Definitions
- **`src/types/positionPreset.ts`** (540 lines)
  - `PositionPreset`: Core preset data structure
  - `PositionPresetLibrary`: Library management
  - `TrackFilter`: Dynamic track selection
  - `PositionTransition`: Transition configuration
  - `InterpolationMode`: Interpolation strategies
  - `PresetBlend`: Multi-preset blending
  - Import/export formats

### 2. Cue Type
- **`src/cues/types/positionCue.ts`** (400+ lines)
  - `PositionCue`: New cue type extending `BaseCue`
  - `PositionCueData`: Cue configuration
  - `PositionCueExecution`: Runtime state
  - `MorphingCue`: Multi-preset morphing
  - `ConditionalPositionCue`: Conditional preset selection
  - Validation and display helpers

### 3. Interpolation Engine
- **`src/utils/interpolation/positionInterpolation.ts`** (440 lines)
  - 15 easing functions (linear, cubic, expo, back, elastic)
  - 4 interpolation modes:
    - Cartesian (linear)
    - Spherical (SLERP)
    - Bezier (smooth curves)
    - Circular (constant radius)
  - Helper functions for distance, velocity, bounds

### 4. Store Management
- **`src/stores/positionPresetStore.ts`** (700+ lines)
  - Zustand store with full CRUD operations
  - Capture current positions
  - Apply presets with transitions
  - Compare presets
  - Calculate statistics
  - Import/export functionality
  - Folder organization
  - Search and filter

### 5. Architecture Documentation
- **`docs/POSITION_PRESETS_ARCHITECTURE.md`** (Comprehensive guide)
  - Use cases and examples
  - Data model design
  - Cuelist integration patterns
  - Timeline sequencing
  - Advanced features

### 6. Type System Updates
- **`src/cues/types/baseCue.ts`**: Added `'position'` to `CueType` union
- **`src/cues/types/index.ts`**: Exported `PositionCue` and added to `Cue` union

## Integration with Cuelist System

### Phase 1: Position Cue Executor

Create `src/cues/executors/positionCueExecutor.ts`:

```typescript
import { PositionCue } from '@/cues/types'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { interpolatePosition, applyEasing } from '@/utils/interpolation/positionInterpolation'

export class PositionCueExecutor {
  async execute(cue: PositionCue): Promise<void> {
    const presetStore = usePositionPresetStore.getState()
    const preset = presetStore.getPreset(cue.data.presetId)
    
    if (!preset) {
      throw new Error(`Preset not found: ${cue.data.presetId}`)
    }
    
    // Use the store's applyPreset method
    await presetStore.applyPreset(cue.data.presetId, {
      trackIds: cue.data.trackIds,
      transition: cue.data.transition,
      interruptAnimations: cue.data.interruptAnimations,
      respectBounds: cue.data.respectBounds,
      maxSpeed: cue.data.maxSpeed
    })
  }
}
```

### Phase 2: Add to Cue Store

Update `src/cues/storeV2/index.ts`:

```typescript
import { PositionCue } from '@/cues/types'
import { PositionCueExecutor } from '@/cues/executors/positionCueExecutor'

// In executeCue method:
case 'position': {
  const positionExecutor = new PositionCueExecutor()
  await positionExecutor.execute(cue as PositionCue)
  break
}
```

### Phase 3: UI Components

#### Preset Manager Panel
`src/components/presets/PresetManager.tsx`:
- List all presets
- Folder organization
- Search/filter
- Create/edit/delete
- Import/export

#### Preset Capture Dialog
`src/components/presets/CapturePresetDialog.tsx`:
- Select tracks
- Set name/description
- Choose category
- Set scope (project/global)

#### Position Cue Editor
`src/components/cues/editors/PositionCueEditor.tsx`:
- Select preset from library
- Configure transition (duration, easing, mode)
- Override track selection
- Set behavior options
- Preview transition

#### Preset Preview
`src/components/presets/PresetPreview3D.tsx`:
- 3D visualization of preset
- Show track positions
- Compare with current positions
- Highlight differences

## Usage Examples

### Example 1: Capture and Recall Positions

```typescript
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'

// Capture current positions
const presetStore = usePositionPresetStore.getState()
const projectStore = useProjectStore.getState()

const trackIds = projectStore.tracks.map(t => t.id)
const presetId = presetStore.captureCurrentPositions(
  trackIds,
  'Scene 1 - Opening',
  {
    category: 'scene',
    description: 'Starting positions for Scene 1',
    tags: ['act1', 'opening']
  }
)

// Later, recall the preset
await presetStore.applyPreset(presetId, {
  transition: {
    duration: 2.0,
    easing: 'ease-in-out',
    mode: 'cartesian'
  },
  interruptAnimations: true
})
```

### Example 2: Create Position Cue in Cuelist

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { createPositionCueFromPreset } from '@/cues/types/positionCue'

const cueStore = useCueStoreV2.getState()
const presetStore = usePositionPresetStore.getState()

const preset = presetStore.getPreset('preset-id')
const cue = createPositionCueFromPreset(preset, {
  transition: {
    duration: 3.0,
    easing: 'ease-in-out-cubic',
    mode: 'spherical',
    stagger: {
      enabled: true,
      mode: 'outside-in',
      delay: 0.1,
      overlap: 0.5
    }
  },
  interruptAnimations: true,
  waitForCompletion: true
})

cueStore.createCue(cue)
```

### Example 3: Compare Two Presets

```typescript
const presetStore = usePositionPresetStore.getState()

const diff = presetStore.comparePresets('preset1-id', 'preset2-id')

if (diff) {
  console.log(`Tracks moved: ${diff.moved.length}`)
  console.log(`Average distance: ${diff.stats.averageDistance.toFixed(2)}m`)
  console.log(`Max distance: ${diff.stats.maxDistance.toFixed(2)}m`)
  
  diff.moved.forEach(track => {
    console.log(`${track.trackName}: ${track.distance.toFixed(2)}m`)
  })
}
```

### Example 4: Theatrical Scene Sequence

```typescript
const cueList = [
  // Go to opening positions
  {
    type: 'position',
    name: 'Scene 1 Start',
    data: {
      presetId: 'scene-1-opening',
      transition: {
        duration: 2.0,
        easing: 'ease-in-out',
        mode: 'cartesian'
      }
    }
  },
  
  // Run animation during scene
  {
    type: 'animation',
    name: 'Gentle Movement',
    data: {
      animationId: 'gentle-sway',
      duration: 30.0
    }
  },
  
  // Transition to next scene
  {
    type: 'position',
    name: 'Scene 2 Setup',
    data: {
      presetId: 'scene-2-surround',
      transition: {
        duration: 3.0,
        easing: 'ease-in-out',
        mode: 'spherical',
        stagger: {
          enabled: true,
          mode: 'outside-in',
          delay: 0.15,
          overlap: 0.6
        }
      },
      interruptAnimations: true
    }
  }
]
```

## Testing Strategy

### Unit Tests

1. **Interpolation Functions**
   - Test each easing function
   - Test each interpolation mode
   - Verify edge cases (t=0, t=1)
   - Test bounds checking

2. **Store Operations**
   - CRUD operations
   - Capture/apply logic
   - Comparison algorithm
   - Import/export serialization

3. **Cue Validation**
   - Preset existence check
   - Track validation
   - Transition validation
   - Safety checks

### Integration Tests

1. **Preset Capture & Recall**
   - Capture current positions
   - Apply with different transitions
   - Verify track positions match

2. **Cuelist Execution**
   - Position cue in sequence
   - Animation interruption
   - Follow actions
   - Error handling

3. **Multi-Preset Blending**
   - Morph between presets
   - Weight interpolation
   - Conflict resolution

## Performance Considerations

### Optimization Strategies

1. **Batch Position Updates**
   ```typescript
   // Group track updates and send as batch OSC message
   const batch = targets.map(t => ({
     address: `/track/${t.trackId}/xyz`,
     args: [t.to.x, t.to.y, t.to.z]
   }))
   oscStore.sendBatch(batch)
   ```

2. **Incremental Updates**
   ```typescript
   // Only update tracks that moved significantly
   if (calculateDistance(track.position, targetPos) > 0.001) {
     projectStore.updateTrack(trackId, { position: targetPos })
   }
   ```

3. **Request Animation Frame**
   ```typescript
   // Use RAF for smooth 60fps transitions
   const animate = () => {
     const progress = (Date.now() - startTime) / duration
     if (progress < 1.0) {
       updatePositions(progress)
       requestAnimationFrame(animate)
     }
   }
   requestAnimationFrame(animate)
   ```

4. **Memoization**
   ```typescript
   // Cache interpolation results for same parameters
   const interpolationCache = new Map<string, Position>()
   ```

## Safety Features

### Bounds Checking

```typescript
// Clip positions to safe operating area
if (options.respectBounds) {
  const bounds = settingsStore.getState().safetyBounds
  position = clampPosition(position, bounds.min, bounds.max)
}
```

### Velocity Limiting

```typescript
// Prevent dangerous rapid movements
const velocity = calculateVelocity(from, to, duration)
if (options.maxSpeed && velocity > options.maxSpeed) {
  duration = calculateDistance(from, to) / options.maxSpeed
}
```

### Collision Detection

```typescript
// Warn about overlapping tracks
const minDistance = 0.1  // meters
positions.forEach((pos1, i) => {
  positions.forEach((pos2, j) => {
    if (i !== j && calculateDistance(pos1, pos2) < minDistance) {
      warnings.push(`Tracks ${i} and ${j} are too close`)
    }
  })
})
```

## Next Steps

### Immediate (Week 1-2)
1. ✅ Create type definitions
2. ✅ Implement interpolation engine
3. ✅ Build position preset store
4. ⏳ Create position cue executor
5. ⏳ Integrate with cue store

### Short-term (Week 3-4)
1. ⏳ Build preset manager UI
2. ⏳ Create capture dialog
3. ⏳ Build position cue editor
4. ⏳ Add 3D preset preview
5. ⏳ Write unit tests

### Medium-term (Week 5-6)
1. ⏳ Implement preset morphing
2. ⏳ Add stagger configurations
3. ⏳ Build preset comparison tool
4. ⏳ Add import/export UI
5. ⏳ Create preset templates

### Long-term (Week 7+)
1. ⏳ Advanced interpolation modes
2. ⏳ AI-generated presets
3. ⏳ Preset version control
4. ⏳ Collaborative sharing
5. ⏳ Performance profiling

## API Reference

### Position Preset Store

```typescript
interface PositionPresetStore {
  // State
  presets: PositionPreset[]
  library: PositionPresetLibrary
  activePresetId: string | null
  isApplying: boolean
  
  // CRUD
  createPreset(data): string
  updatePreset(id, updates): void
  deletePreset(id): void
  duplicatePreset(id, newName?): string
  getPreset(id): PositionPreset | null
  
  // Operations
  captureCurrentPositions(trackIds, name, options?): string
  applyPreset(presetId, options?): Promise<void>
  comparePresets(id1, id2): PresetDiff | null
  calculatePresetStats(id): PresetStats | null
  validatePreset(id): PresetValidation
  
  // Organization
  createFolder(name, parentId?): string
  moveToFolder(presetId, folderId): void
  deleteFolder(id): void
  toggleFavorite(id): void
  
  // Import/Export
  exportPreset(id): string
  importPreset(json): string | null
  exportLibrary(): string
  importLibrary(json, merge): void
}
```

### Interpolation Functions

```typescript
// Interpolation modes
interpolateCartesian(from, to, t): Position
interpolateSpherical(from, to, t): Position
interpolateBezier(from, to, t, controlPoints?): Position
interpolateCircular(from, to, t, center?): Position

// Easing
applyEasing(t, easing): number

// Utilities
calculateDistance(from, to): number
calculateVelocity(from, to, duration): number
clampPosition(pos, min, max): Position
isWithinBounds(pos, min, max): boolean
```

## Conclusion

The Position Presets System is ready for integration. The core infrastructure is complete:

- ✅ Type system with comprehensive interfaces
- ✅ Interpolation engine with 4 modes and 15 easing functions
- ✅ Zustand store with full CRUD and operations
- ✅ Position cue type integrated with base cue system
- ✅ Architecture documentation with examples

Next phase: Build the executor, integrate with cuelist, and create UI components.

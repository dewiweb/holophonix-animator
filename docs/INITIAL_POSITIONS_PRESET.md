# Initial Positions Preset - Automatic Creation

## Overview

The system automatically creates an **"Initial Positions"** preset that captures the starting positions of all discovered tracks. This provides an instant "home" or "park" preset without requiring manual capture.

## Automatic Creation

### When It's Created

The "Initial Positions" preset is automatically created in these scenarios:

1. **After Track Discovery** 
   - When you discover tracks via OSC connection
   - Captures positions of all discovered tracks
   - Created 500ms after discovery completes

2. **When Tracks Are Added**
   - When tracks are manually added to the project
   - Updates existing preset or creates new one
   - Debounced to handle batch additions (1 second delay)

3. **When Tracks Are Loaded**
   - When opening an existing project
   - Ensures preset exists even for legacy projects

### What It Contains

```typescript
{
  name: "Initial Positions",
  category: "safety",
  scope: "project",
  tags: ["auto-generated", "initial", "home", "safe"],
  positions: {
    "track-1-id": { x: 0, y: 0, z: 1.5 },
    "track-2-id": { x: 2, y: 3, z: 1.5 },
    // ... all tracks
  },
  trackIds: ["track-1-id", "track-2-id", ...]
}
```

### Position Source Priority

For each track, the system uses positions in this order:

1. **`track.initialPosition`** (if set) - Position before animations started
2. **`track.position`** (fallback) - Current position

This ensures the preset captures the true starting state, even if tracks have been moved by animations.

## Usage

### Quick Recall

The "Initial Positions" preset appears in the preset manager alongside other presets:

```typescript
// Programmatic recall
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const presetStore = usePositionPresetStore.getState()
const initialPreset = presetStore.presets.find(
  p => p.name === 'Initial Positions'
)

if (initialPreset) {
  await presetStore.applyPreset(initialPreset.id, {
    transition: {
      duration: 2.0,
      easing: 'ease-in-out',
      mode: 'cartesian'
    }
  })
}
```

### In Cuelists

Create a "Return to Initial" position cue:

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { createPositionCueFromPreset } from '@/cues/types/positionCue'

const initialPreset = presetStore.presets.find(
  p => p.name === 'Initial Positions'
)

if (initialPreset) {
  const resetCue = createPositionCueFromPreset(initialPreset, {
    transition: {
      duration: 1.5,
      easing: 'ease-in-out',
      mode: 'cartesian'
    },
    interruptAnimations: true
  })
  
  cueStore.createCue({ ...resetCue, name: 'Reset to Initial' })
}
```

### Manual Update

If you need to update the preset manually:

```typescript
import { updateInitialPositionsPreset } from '@/utils/osc'

// Update preset with current track state
await updateInitialPositionsPreset()
```

### Check Existence

```typescript
import { hasInitialPositionsPreset } from '@/utils/osc'

if (await hasInitialPositionsPreset()) {
  console.log('Initial positions preset exists')
}
```

## Behavior Details

### Auto-Update

The preset is **automatically updated** in these scenarios:

- **Track Addition**: When new tracks are added (debounced 1 second)
- **Manual Update**: When explicitly called via `updateInitialPositionsPreset()`

The preset is **NOT automatically updated** when:
- Track positions change during animations
- Individual track positions are manually adjusted
- Tracks are removed (preserves historical data)

### Persistence

- Stored in position preset store (Zustand)
- Persisted with project data
- Survives app restart
- Can be exported/imported with preset library

### Category & Scope

- **Category**: `safety` - Groups with other safety/park presets
- **Scope**: `project` - Specific to current project (not global)
- **Tags**: `["auto-generated", "initial", "home", "safe"]`

## Integration with Existing Features

### Return to Initial (Animation Store)

The existing `returnAllToInitial()` method in animation store uses `track.initialPosition`. The "Initial Positions" preset provides a complementary cuelist-based approach:

**Animation Store Method**:
```typescript
// Direct, immediate return
animationStore.returnAllToInitial(durationMs)
```

**Position Preset Approach**:
```typescript
// Via cuelist system, with all preset features
cueStore.triggerCue(initialPositionCueId)
```

Both approaches use the same `initialPosition` data source, ensuring consistency.

### Track Discovery Integration

```typescript
// src/utils/osc/trackDiscovery.ts

export async function discoverTracks(/* ... */) {
  // ... discovery logic ...
  
  actions.setState({ isDiscoveringTracks: false })
  
  // Auto-create preset after discovery ✅
  const { createInitialPositionsPreset } = await import('./createInitialPreset')
  setTimeout(() => {
    createInitialPositionsPreset()
  }, 500)
}
```

### Project Store Integration

```typescript
// src/stores/projectStore.ts

addTrack: (trackData) => {
  // ... add track logic ...
  
  // Debounced preset update ✅
  setTimeout(async () => {
    const { updateInitialPositionsPreset } = await import('@/utils/osc/createInitialPreset')
    updateInitialPositionsPreset()
  }, 1000)
}
```

## UI Considerations

### Preset Manager

The "Initial Positions" preset should be:
- **Highlighted** or **pinned** at top of safety category
- **Labeled** with an icon (🏠 or ⭐) to indicate auto-generation
- **Protected** from accidental deletion (show warning)
- **Read-only name** (prevent renaming to maintain consistency)

### Quick Actions

Consider adding:
- **"Return to Initial" button** in toolbar (triggers preset)
- **Keyboard shortcut** (e.g., `Ctrl+Shift+Home`)
- **Panic button** integration (return to initial as safety action)

### Visual Feedback

When hovering over the preset:
```
Initial Positions ⭐
Auto-generated from track discovery
12 tracks • Last updated: 2 minutes ago
Category: safety • Scope: project
```

## Manual Override

Users can still manually capture their own "initial" presets if needed:

```typescript
// User-defined initial preset (different from auto-generated)
presetStore.captureCurrentPositions(
  trackIds,
  'My Custom Initial',
  {
    category: 'safety',
    tags: ['custom', 'initial']
  }
)
```

The auto-generated preset has specific name and category, so user presets won't conflict.

## Implementation Files

### Created
- **`src/utils/osc/createInitialPreset.ts`** - Creation and update logic

### Modified
- **`src/utils/osc/trackDiscovery.ts`** - Hook after discovery
- **`src/stores/projectStore.ts`** - Hook on track addition
- **`src/utils/osc/index.ts`** - Export utilities

## Testing

### Test 1: After Track Discovery

```typescript
// 1. Connect to Holophonix device
// 2. Discover tracks
await oscStore.discoverTracks()

// 3. Wait for completion
await new Promise(resolve => setTimeout(resolve, 3000))

// 4. Check preset exists
const presetStore = usePositionPresetStore.getState()
const initialPreset = presetStore.presets.find(
  p => p.name === 'Initial Positions'
)

console.assert(initialPreset, 'Initial Positions preset should exist')
console.assert(initialPreset.trackIds.length > 0, 'Should have tracks')
console.assert(initialPreset.category === 'safety', 'Should be safety category')
```

### Test 2: After Adding Track

```typescript
// 1. Add a track manually
projectStore.addTrack({
  name: 'New Track',
  type: 'sound-source',
  position: { x: 1, y: 2, z: 1.5 },
  initialPosition: { x: 1, y: 2, z: 1.5 },
  // ... other fields
})

// 2. Wait for debounced update
await new Promise(resolve => setTimeout(resolve, 1500))

// 3. Check preset updated
const preset = presetStore.presets.find(
  p => p.name === 'Initial Positions'
)

console.assert(
  preset.trackIds.includes('new-track-id'),
  'Should include new track'
)
```

### Test 3: Manual Update

```typescript
import { updateInitialPositionsPreset } from '@/utils/osc'

// Manually trigger update
await updateInitialPositionsPreset()

// Check preset reflects current state
const preset = presetStore.presets.find(
  p => p.name === 'Initial Positions'
)

console.assert(
  preset.trackIds.length === projectStore.tracks.length,
  'Should match current track count'
)
```

## Benefits

### For Users
- ✅ **Zero effort** - Preset created automatically
- ✅ **Always available** - No need to remember to capture
- ✅ **Consistent** - Uses same initial position as animation system
- ✅ **Safe** - Quick return to known good state
- ✅ **Reusable** - Can use in multiple cues

### For System
- ✅ **Integration** - Works with existing initial position tracking
- ✅ **Complementary** - Enhances return-to-initial feature
- ✅ **Cuelist-ready** - Enables scene-based workflows
- ✅ **Automatic** - No manual intervention required

## Future Enhancements

### Smart Updates
- Track which tracks have moved since last capture
- Only update preset if significant changes detected
- Preserve user modifications to preset

### Multiple Initial States
- "Initial Positions (Discovery)" - From first discovery
- "Initial Positions (Session Start)" - At app launch
- "Initial Positions (Show Start)" - User-marked milestone

### Versioning
- Keep history of initial positions
- Allow reverting to previous initial state
- Compare initial states across sessions

## Conclusion

The automatic "Initial Positions" preset provides a seamless, zero-effort "home" position for all tracks. It leverages existing `initialPosition` tracking and integrates perfectly with the position presets system, giving users an instant safety/reset option in their cuelists.

**Status**: ✅ Implemented and integrated  
**Documentation**: Complete  
**Testing**: Ready for validation

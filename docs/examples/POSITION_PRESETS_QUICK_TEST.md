# Position Presets System - Quick Test Guide

## Testing the Integration

This guide provides quick tests to verify the position presets system is working correctly.

## Test 1: Basic Preset Capture and Recall

```typescript
// In browser console or component
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'

const presetStore = usePositionPresetStore.getState()
const projectStore = useProjectStore.getState()

// 1. Verify tracks exist
console.log('Available tracks:', projectStore.tracks.length)
projectStore.tracks.forEach(t => {
  console.log(`  ${t.name}: (${t.position.x}, ${t.position.y}, ${t.position.z})`)
})

// 2. Capture current positions
const trackIds = projectStore.tracks.map(t => t.id)
const presetId = presetStore.captureCurrentPositions(
  trackIds,
  'Test Preset 1',
  {
    category: 'custom',
    description: 'First test preset'
  }
)

console.log('Created preset:', presetId)
console.log('Preset:', presetStore.getPreset(presetId))

// 3. Move tracks manually (in UI)
// ... user moves tracks in 3D view ...

// 4. Recall preset (instant)
await presetStore.applyPreset(presetId, {
  transition: { duration: 0, easing: 'linear', mode: 'cartesian' }
})

console.log('✅ Tracks should be back to original positions')

// 5. Move tracks again
// ... user moves tracks ...

// 6. Recall with smooth transition
await presetStore.applyPreset(presetId, {
  transition: {
    duration: 2.0,
    easing: 'ease-in-out',
    mode: 'cartesian'
  }
})

console.log('✅ Tracks should smoothly transition over 2 seconds')
```

## Test 2: Position Cue in Cuelist

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { createPositionCueFromPreset } from '@/cues/types/positionCue'
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const cueStore = useCueStoreV2.getState()
const presetStore = usePositionPresetStore.getState()

// 1. Create or get existing preset
const presetId = '...' // from Test 1

// 2. Create position cue
const preset = presetStore.getPreset(presetId)
if (!preset) {
  console.error('Preset not found')
} else {
  const cue = createPositionCueFromPreset(preset, {
    transition: {
      duration: 3.0,
      easing: 'ease-in-out-cubic',
      mode: 'spherical'
    }
  })
  
  const cueId = cueStore.createCue(cue)
  console.log('Created cue:', cueId)
  
  // 3. Execute cue
  console.log('Triggering cue...')
  await cueStore.triggerCue(cueId)
  console.log('✅ Cue executed successfully')
}
```

## Test 3: Stagger Transition

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { createPositionCueFromPreset } from '@/cues/types/positionCue'
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const cueStore = useCueStoreV2.getState()
const presetStore = usePositionPresetStore.getState()

// Create preset with multiple tracks
const projectStore = useProjectStore.getState()
const trackIds = projectStore.tracks.map(t => t.id).slice(0, 6) // First 6 tracks

const presetId = presetStore.captureCurrentPositions(
  trackIds,
  'Stagger Test',
  { category: 'effect' }
)

// Move tracks to different positions
// ... (manually or programmatically)

// Create cue with stagger
const preset = presetStore.getPreset(presetId)!
const cue = createPositionCueFromPreset(preset, {
  transition: {
    duration: 2.0,
    easing: 'ease-in-out',
    mode: 'spherical',
    stagger: {
      enabled: true,
      mode: 'outside-in',
      delay: 0.2,
      overlap: 0.5
    }
  }
})

const cueId = cueStore.createCue(cue)

// Execute
await cueStore.triggerCue(cueId)
console.log('✅ Tracks should move in staggered sequence (outside-in)')
```

## Test 4: Preset Comparison

```typescript
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'

const presetStore = usePositionPresetStore.getState()
const projectStore = useProjectStore.getState()

// Create two presets with different positions
const trackIds = projectStore.tracks.map(t => t.id).slice(0, 4)

// Preset A
const presetA = presetStore.captureCurrentPositions(
  trackIds,
  'Preset A',
  { category: 'custom' }
)

// Move tracks
projectStore.updateTrack(trackIds[0], { 
  position: { x: 1.0, y: 2.0, z: 1.5 } 
})
projectStore.updateTrack(trackIds[1], { 
  position: { x: -1.0, y: 2.0, z: 1.5 } 
})

// Preset B
const presetB = presetStore.captureCurrentPositions(
  trackIds,
  'Preset B',
  { category: 'custom' }
)

// Compare
const diff = presetStore.comparePresets(presetA, presetB)

console.log('Comparison Results:')
console.log('  Moved tracks:', diff.moved.length)
console.log('  Average distance:', diff.stats.averageDistance.toFixed(2), 'm')
console.log('  Max distance:', diff.stats.maxDistance.toFixed(2), 'm')

diff.moved.forEach(track => {
  console.log(`  Track ${track.trackId}:`)
  console.log(`    From: (${track.from.x}, ${track.from.y}, ${track.from.z})`)
  console.log(`    To: (${track.to.x}, ${track.to.y}, ${track.to.z})`)
  console.log(`    Distance: ${track.distance.toFixed(2)}m`)
})
```

## Test 5: Animation Interruption

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useAnimationStore } from '@/stores/animationStore'

const cueStore = useCueStoreV2.getState()
const presetStore = usePositionPresetStore.getState()
const animationStore = useAnimationStore.getState()

// 1. Start an animation on tracks
const projectStore = useProjectStore.getState()
const trackIds = projectStore.tracks.map(t => t.id).slice(0, 3)

// Assume animation exists in project
const animation = projectStore.animations[0]
if (animation) {
  animationStore.playAnimation(animation.id, trackIds)
  console.log('Animation started on', trackIds.length, 'tracks')
  
  // 2. Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 3. Trigger position cue with interruption
  const presetId = presetStore.captureCurrentPositions(
    trackIds,
    'Interrupt Test'
  )
  
  const preset = presetStore.getPreset(presetId)!
  const cue = createPositionCueFromPreset(preset, {
    transition: {
      duration: 1.5,
      easing: 'ease-in-out',
      mode: 'cartesian'
    },
    interruptAnimations: true
  })
  
  const cueId = cueStore.createCue(cue)
  await cueStore.triggerCue(cueId)
  
  console.log('✅ Animation should be stopped, position cue executing')
}
```

## Test 6: Import/Export

```typescript
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const presetStore = usePositionPresetStore.getState()

// Create a preset
const projectStore = useProjectStore.getState()
const trackIds = projectStore.tracks.map(t => t.id).slice(0, 3)
const presetId = presetStore.captureCurrentPositions(
  trackIds,
  'Export Test',
  {
    category: 'custom',
    tags: ['test', 'export']
  }
)

// Export
const exportedJSON = presetStore.exportPreset(presetId)
console.log('Exported preset:')
console.log(exportedJSON)

// Save to file (would use file API in real app)
// const blob = new Blob([exportedJSON], { type: 'application/json' })
// const url = URL.createObjectURL(blob)
// ... download ...

// Delete original
presetStore.deletePreset(presetId)
console.log('Original preset deleted')

// Import
const importedId = presetStore.importPreset(exportedJSON)
console.log('✅ Preset imported with new ID:', importedId)

// Verify
const imported = presetStore.getPreset(importedId)
console.log('Imported preset:', imported?.name)
```

## Test 7: LTP Conflict Resolution

```typescript
import { useCueStoreV2 } from '@/cues/storeV2'
import { createPositionCueFromPreset } from '@/cues/types/positionCue'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'

const cueStore = useCueStoreV2.getState()
const presetStore = usePositionPresetStore.getState()
const projectStore = useProjectStore.getState()

// Create two presets with overlapping tracks
const allTrackIds = projectStore.tracks.map(t => t.id)
const preset1Tracks = allTrackIds.slice(0, 4) // Tracks 0-3
const preset2Tracks = allTrackIds.slice(2, 6) // Tracks 2-5 (overlap on 2-3)

const preset1Id = presetStore.captureCurrentPositions(
  preset1Tracks,
  'Preset 1'
)

// Move tracks
preset2Tracks.forEach(id => {
  const track = projectStore.tracks.find(t => t.id === id)
  if (track) {
    projectStore.updateTrack(id, {
      position: {
        x: track.position.x + 2.0,
        y: track.position.y,
        z: track.position.z
      }
    })
  }
})

const preset2Id = presetStore.captureCurrentPositions(
  preset2Tracks,
  'Preset 2'
)

// Create cues
const cue1 = createPositionCueFromPreset(
  presetStore.getPreset(preset1Id)!,
  {
    transition: { duration: 5.0, easing: 'linear', mode: 'cartesian' },
    waitForCompletion: false
  }
)

const cue2 = createPositionCueFromPreset(
  presetStore.getPreset(preset2Id)!,
  {
    transition: { duration: 3.0, easing: 'linear', mode: 'cartesian' },
    waitForCompletion: false
  }
)

const cue1Id = cueStore.createCue(cue1)
const cue2Id = cueStore.createCue(cue2)

// Execute cue 1
console.log('Triggering Cue 1 (tracks 0-3)...')
await cueStore.triggerCue(cue1Id)

// Wait 1 second
await new Promise(resolve => setTimeout(resolve, 1000))

// Execute cue 2 (should take over tracks 2-3 via LTP)
console.log('Triggering Cue 2 (tracks 2-5)...')
await cueStore.triggerCue(cue2Id)

console.log('✅ Tracks 2-3 should now be controlled by Cue 2 (LTP)')
console.log('✅ Tracks 0-1 should still be controlled by Cue 1')
console.log('✅ Tracks 4-5 should be controlled by Cue 2')
```

## Expected Console Output Patterns

### Successful Capture
```
Created preset: preset-abc123
Preset: {
  id: "preset-abc123",
  name: "Test Preset 1",
  positions: { track1: {x, y, z}, ... },
  trackIds: ["track1", "track2", ...],
  ...
}
```

### Successful Apply
```
🎯 Executing position cue: cue-xyz789
  Tracks: 3
  Parallel transition: 2.0s, easing=ease-in-out
✅ Position cue complete: cue-xyz789
```

### Stagger Execution
```
🎯 Executing position cue: cue-stagger
  Tracks: 6
  Staggered transition: outside-in, delay=0.2s
✅ Position cue complete: cue-stagger
```

### LTP Conflict
```
🎯 Executing position cue: cue-1
  Tracks: 4
...
🎯 Executing position cue: cue-2
  Releasing 2 conflicting tracks (LTP)
    Cue cue-1 reduced to 2 tracks
  Tracks: 4
```

## Troubleshooting

### Issue: Preset not found
```typescript
// Check available presets
const presets = usePositionPresetStore.getState().presets
console.log('Available presets:', presets.map(p => p.name))
```

### Issue: Tracks not moving
```typescript
// Check OSC connection
const oscStore = useOSCStore.getState()
const conn = oscStore.getActiveConnection()
console.log('OSC Connected:', conn?.isConnected)

// Check track ownership
const cueStore = useCueStoreV2.getState()
const ownership = cueStore.executionContext.trackOwnership
console.log('Track ownership:', Array.from(ownership.entries()))
```

### Issue: Smooth transition not working
```typescript
// Check animation store
const animStore = useAnimationStore.getState()
console.log('Is engine running:', animStore.isEngineRunning)
console.log('Playing animations:', animStore.playingAnimations.size)
```

## Success Criteria

✅ **Test 1**: Tracks return to exact positions  
✅ **Test 2**: Cue executes without errors  
✅ **Test 3**: Tracks move in sequence (visible delay)  
✅ **Test 4**: Distance calculations are accurate  
✅ **Test 5**: Animation stops when cue triggers  
✅ **Test 6**: Export/import preserves all data  
✅ **Test 7**: LTP correctly reassigns track ownership  

## Next Steps After Testing

1. Create UI components for preset management
2. Add visual feedback during transitions
3. Implement preset library browser
4. Add keyboard shortcuts for quick recall
5. Create preset templates for common formations

## Notes

- All tests assume tracks exist in project store
- OSC connection should be active for position updates
- Tests can be run in browser console or integrated into test suite
- Performance profiling recommended after basic functionality confirmed

# Position Presets - Console Commands for Testing

Quick commands to test the position presets system from the browser console.

## 🎯 Prerequisites

1. Open the app in browser
2. Open Developer Console (F12)
3. Have tracks discovered via OSC connection

---

## 🚀 Quick Start Commands

### Check if Presets System is Available

```javascript
// Access stores
const presetStore = usePositionPresetStore.getState()
const projectStore = useProjectStore.getState()
const cueStore = useCueStoreV2.getState()

// Check tracks
console.log('Tracks:', projectStore.tracks.length)
console.log('Presets:', presetStore.presets.length)
```

### View All Presets

```javascript
presetStore.presets.forEach(p => {
  console.log(`${p.name} (${p.category}) - ${p.trackIds.length} tracks`)
})
```

### View Initial Positions Preset (Auto-Created)

```javascript
const initial = presetStore.presets.find(p => p.name === 'Initial Positions')
console.log('Initial Positions:', initial)
```

---

## 📸 Capture Presets

### Capture Current Positions

```javascript
// Simple capture
const presetId = presetStore.captureCurrentPositions(
  projectStore.tracks.map(t => t.id),
  'My Scene 1'
)
console.log('Captured preset:', presetId)

// With options
const presetId = presetStore.captureCurrentPositions(
  projectStore.tracks.map(t => t.id),
  'Act 1 - Opening',
  {
    category: 'scene',
    description: 'Opening positions for Act 1',
    tags: ['act1', 'opening']
  }
)
```

### Quick Snapshot (Using Helper)

```javascript
// Available via global helper
const snapshotId = presetHelpers.captureCurrentSnapshot('Test Snapshot')
```

---

## ▶️ Apply Presets

### Apply with Default Transition

```javascript
// Get a preset
const preset = presetStore.presets[0]

// Apply it
await presetStore.applyPreset(preset.id)
```

### Apply with Custom Transition

```javascript
const presetId = presetStore.presets[0].id

await presetStore.applyPreset(presetId, {
  transition: {
    duration: 3.0,
    easing: 'ease-in-out',
    mode: 'spherical'
  },
  interruptAnimations: true
})
```

### Apply with Stagger

```javascript
await presetStore.applyPreset(presetId, {
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
```

### Return to Initial Positions (Quick Helper)

```javascript
// Uses helper function
await presetHelpers.returnToInitialPositions(2.0)
```

### Park All Tracks at Origin

```javascript
// Uses helper function (creates park preset if needed)
await presetHelpers.parkAllTracks(1.5)
```

---

## 🎨 Generate Formation Presets

### Circle Formation

```javascript
const circleId = presetHelpers.createCircleFormation(
  4.0,   // radius in meters
  1.5,   // height (z)
  'Surround Circle'  // optional name
)
console.log('Created circle preset:', circleId)

// Apply it
await presetStore.applyPreset(circleId, {
  transition: { duration: 2.5, easing: 'ease-in-out', mode: 'spherical' }
})
```

### Frontal Semicircle (Dialogue Setup)

```javascript
const frontalId = presetHelpers.createFrontalSemicircle(
  3.0,   // radius
  1.2,   // height
  'Dialogue Setup'
)
await presetStore.applyPreset(frontalId)
```

### Line Formation

```javascript
const lineId = presetHelpers.createLineFormation(
  8.0,   // length
  1.5,   // height
  'x',   // axis ('x' or 'y')
  'Front Line'
)
await presetStore.applyPreset(lineId)
```

---

## 🎭 Create Position Cues

### Create Position Cue from Preset

```javascript
// Get a preset
const preset = presetStore.presets.find(p => p.name === 'My Scene 1')

// Create position cue
const cueId = cueStore.createCue({
  name: 'Go to Scene 1',
  type: 'position',
  data: {
    presetId: preset.id,
    transition: {
      duration: 2.0,
      easing: 'ease-in-out',
      mode: 'spherical'
    },
    interruptAnimations: true
  },
  triggers: [],
  status: 'idle',
  isEnabled: true,
  color: '#10B981',
  created: new Date(),
  modified: new Date(),
  triggerCount: 0
})

console.log('Created cue:', cueId)
```

### Execute Position Cue

```javascript
// Trigger the cue
await cueStore.triggerCue(cueId)
```

---

## 📊 Compare Presets

### Compare Two Presets

```javascript
const preset1 = presetStore.presets[0]
const preset2 = presetStore.presets[1]

const comparison = presetStore.comparePresets(preset1.id, preset2.id)

console.log('Common tracks:', comparison.commonTracks.length)
console.log('Average distance:', comparison.statistics.averageDistance)
console.log('Max distance:', comparison.statistics.maxDistance)

// View track movements
comparison.differences.forEach(diff => {
  console.log(`${diff.trackId}: ${diff.distance.toFixed(2)}m moved`)
})
```

### Get Preset Statistics

```javascript
const stats = presetStore.getPresetStatistics(preset.id)

console.log('Bounds:', stats.bounds)
console.log('Center:', stats.center)
console.log('Average spread:', stats.averageDistanceFromCenter)
```

---

## 🔄 Preset Operations

### Duplicate Preset

```javascript
const originalId = presetStore.presets[0].id
const duplicateId = presetStore.duplicatePreset(originalId, 'Copy of Scene 1')
```

### Update Preset

```javascript
presetStore.updatePreset(presetId, {
  name: 'Updated Name',
  description: 'New description',
  tags: ['new', 'tags']
})
```

### Delete Preset

```javascript
presetStore.deletePreset(presetId)
```

### Toggle Favorite

```javascript
presetStore.toggleFavorite(presetId)
```

---

## 📥📤 Import/Export

### Export Preset

```javascript
const preset = presetStore.presets[0]
const json = presetStore.exportPreset(preset.id)

// Download as file
const blob = new Blob([json], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `${preset.name}.json`
a.click()
URL.revokeObjectURL(url)
```

### Import Preset

```javascript
// Paste JSON string
const json = `{"name": "Imported Preset", ...}`
const presetId = presetStore.importPreset(json)
console.log('Imported preset:', presetId)
```

### Export All Presets

```javascript
const allPresetsJson = presetStore.exportAllPresets()
console.log('Exported', presetStore.presets.length, 'presets')

// Save to file
const blob = new Blob([allPresetsJson], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'all-presets.json'
a.click()
URL.revokeObjectURL(url)
```

---

## 🔍 Search and Filter

### Search Presets

```javascript
presetStore.setSearchQuery('scene')
console.log('Filtered presets:', presetStore.presets.length)

// Clear search
presetStore.setSearchQuery('')
```

### Filter by Category

```javascript
const scenePresets = presetStore.presets.filter(p => p.category === 'scene')
const formationPresets = presetStore.presets.filter(p => p.category === 'formation')
const safetyPresets = presetStore.presets.filter(p => p.category === 'safety')
```

### Find by Tag

```javascript
const act1Presets = presetStore.presets.filter(p => 
  p.tags?.includes('act1')
)
```

---

## 🎮 Advanced Workflows

### Scene Sequence with Position Cues

```javascript
// Capture multiple scenes
const scene1Id = presetStore.captureCurrentPositions(
  projectStore.tracks.map(t => t.id),
  'Scene 1',
  { category: 'scene', tags: ['act1'] }
)

// Move tracks manually to scene 2 positions...

const scene2Id = presetStore.captureCurrentPositions(
  projectStore.tracks.map(t => t.id),
  'Scene 2',
  { category: 'scene', tags: ['act1'] }
)

// Create cues for each scene
const cue1 = cueStore.createCue({
  name: 'Go to Scene 1',
  type: 'position',
  data: { presetId: scene1Id, transition: { duration: 2.0 } },
  // ... other fields
})

const cue2 = cueStore.createCue({
  name: 'Go to Scene 2',
  type: 'position',
  data: { presetId: scene2Id, transition: { duration: 2.0 } },
  // ... other fields
})

// Execute sequence
await cueStore.triggerCue(cue1)
// wait...
await cueStore.triggerCue(cue2)
```

### Morphing Between Presets

```javascript
// Create intermediate preset at 50%
const preset1 = presetStore.presets[0]
const preset2 = presetStore.presets[1]

const positions = {}
preset1.trackIds.forEach(trackId => {
  const pos1 = preset1.positions[trackId]
  const pos2 = preset2.positions[trackId]
  
  positions[trackId] = {
    x: pos1.x + (pos2.x - pos1.x) * 0.5,
    y: pos1.y + (pos2.y - pos1.y) * 0.5,
    z: pos1.z + (pos2.z - pos1.z) * 0.5
  }
})

const morphId = presetStore.createPreset({
  name: 'Scene 1→2 (50%)',
  positions,
  trackIds: preset1.trackIds,
  category: 'effect'
})
```

---

## 🧪 Testing & Debugging

### Log All State

```javascript
console.log('=== POSITION PRESETS STATE ===')
console.log('Presets:', presetStore.presets)
console.log('Library:', presetStore.library)
console.log('Is Applying:', presetStore.isApplying)
console.log('Search Query:', presetStore.searchQuery)
```

### Validate Preset Data

```javascript
const preset = presetStore.presets[0]

console.log('Preset valid:', preset.trackIds.every(id => 
  projectStore.tracks.find(t => t.id === id)
))

console.log('All positions defined:', preset.trackIds.every(id => 
  preset.positions[id] !== undefined
))
```

### Monitor Preset Application

```javascript
// Watch isApplying state
const checkApplying = setInterval(() => {
  console.log('Is applying:', presetStore.isApplying)
}, 100)

await presetStore.applyPreset(presetId)

clearInterval(checkApplying)
```

---

## 🎉 Complete Example Workflow

```javascript
// 1. Check system status
console.log('Tracks:', projectStore.tracks.length)
console.log('Presets:', presetStore.presets.length)

// 2. Create some formation presets
const circleId = presetHelpers.createCircleFormation(4.0, 1.5)
const frontalId = presetHelpers.createFrontalSemicircle(3.0, 1.2)
const lineId = presetHelpers.createLineFormation(6.0, 1.5, 'x')

// 3. Apply circle formation with stagger
await presetStore.applyPreset(circleId, {
  transition: {
    duration: 3.0,
    easing: 'ease-out-back',
    mode: 'spherical',
    stagger: {
      enabled: true,
      mode: 'sequential',
      delay: 0.15,
      overlap: 0.6
    }
  }
})

console.log('✅ Applied circle formation with stagger!')

// 4. Wait 5 seconds, then go to frontal
setTimeout(async () => {
  await presetStore.applyPreset(frontalId, {
    transition: { duration: 2.5, easing: 'ease-in-out', mode: 'spherical' }
  })
  console.log('✅ Applied frontal formation!')
}, 5000)

// 5. Wait another 5 seconds, return to initial
setTimeout(async () => {
  await presetHelpers.returnToInitialPositions(2.0)
  console.log('✅ Returned to initial positions!')
}, 10000)
```

---

## 💡 Tips

1. **Use Tab Completion**: Type `presetStore.` and press Tab to see available methods
2. **Helper Functions**: The `presetHelpers` object is globally available
3. **Store State**: Access `getState()` for current store data
4. **Async Operations**: Remember to use `await` for preset application
5. **Error Handling**: Wrap commands in try/catch for debugging

---

## 🐛 Troubleshooting

### Preset Not Applying

```javascript
// Check if preset exists
const preset = presetStore.getPreset(presetId)
console.log('Preset exists:', !!preset)

// Check if tracks still exist
if (preset) {
  const validTracks = preset.trackIds.filter(id =>
    projectStore.tracks.find(t => t.id === id)
  )
  console.log('Valid tracks:', validTracks.length, '/', preset.trackIds.length)
}
```

### "Initial Positions" Not Found

```javascript
// Check if tracks were discovered
console.log('Tracks:', projectStore.tracks.length)

// Manually create if needed
if (projectStore.tracks.length > 0) {
  const { createInitialPositionsPreset } = await import('@/utils/osc/createInitialPreset')
  await createInitialPositionsPreset()
}
```

---

*These commands work in the browser console when the app is running!*

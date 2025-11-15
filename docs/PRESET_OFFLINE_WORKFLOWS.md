# Position Presets - Offline Workflows

## 🔌 Creating Presets Without Holophonix Device

You're right - track positions normally come from OSC messages. But there are **several ways** to create presets when offline!

---

## ✅ Method 1: Preset Generator Functions (Easiest!)

**Already available** in the console:

```javascript
// Circle formation (surround sound)
const id = presetHelpers.createCircleFormation(
  4.0,   // radius in meters
  1.5,   // height (z)
  'Surround Circle'  // optional name
)

// Frontal semicircle (dialogue/stage)
const id = presetHelpers.createFrontalSemicircle(
  3.0,   // radius
  1.2,   // height
  'Stage Front'
)

// Line formation
const id = presetHelpers.createLineFormation(
  6.0,   // length
  1.5,   // height
  'x',   // axis ('x' or 'y')
  'Front Line'
)
```

**Pros**:
- ✅ No device needed
- ✅ Mathematical precision
- ✅ Instant creation
- ✅ Works in console immediately

**Use Cases**:
- Pre-show planning
- Testing preset workflows
- Creating standard formations
- Offline development

---

## ✅ Method 2: Manual Position Editor (New!)

**Just created**: `ManualPositionEditor.tsx`

### Single Track Editor

```tsx
import { ManualPositionEditor } from '@/components/tracks/ManualPositionEditor'

// Add to your TrackList or similar:
<ManualPositionEditor 
  trackId={trackId}
  onClose={() => setShowEditor(false)}
/>
```

**Interface**:
```
┌────────────────────────────────┐
│ Set Position: Track 1          │
├────────────────────────────────┤
│ X Position: [2.5] meters       │
│ Y Position: [3.0] meters       │
│ Z Position: [1.5] meters       │
│                                 │
│ Current: (0.0, 0.0, 0.0)       │
│ New:     (2.5, 3.0, 1.5)       │
│                                 │
│        [Cancel] [Set Position] │
└────────────────────────────────┘
```

### Batch Editor

```tsx
import { BatchPositionEditor } from '@/components/tracks/ManualPositionEditor'

<BatchPositionEditor 
  trackIds={selectedTrackIds}
  onClose={() => setShowBatch(false)}
/>
```

**Layouts Available**:
- Circle (surround)
- Line (stage front)
- Grid (audience)

**Workflow**:
1. Select tracks in UI
2. Open batch editor
3. Choose layout & parameters
4. Apply → All tracks positioned
5. Capture preset!

---

## ✅ Method 3: Animation-Based Positions

**If you have animations**, you can use their calculated positions:

```javascript
// 1. Load/play an animation (calculates positions offline)
animationStore.playAnimation(animationId, trackIds)

// 2. Pause at desired frame
animationStore.pauseAnimation(animationId)

// 3. Capture current state
const presetId = presetStore.captureCurrentPositions(
  trackIds,
  'Animation Frame 30'
)
```

**Pros**:
- ✅ Uses existing animation data
- ✅ Preview before capturing
- ✅ Frame-accurate positioning

---

## ✅ Method 4: Import from File

**Load positions from saved project**:

```javascript
// If you have a project with track positions
projectStore.openProject()  // Loads tracks with positions

// Then capture
presetStore.captureCurrentPositions(trackIds, 'Imported Scene')
```

---

## ✅ Method 5: Programmatic Creation

**Create presets directly via code**:

```javascript
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const presetStore = usePositionPresetStore.getState()

// Define positions manually
const positions = {
  'track-1': { x: 2.5, y: 3.0, z: 1.5 },
  'track-2': { x: -2.5, y: 3.0, z: 1.5 },
  'track-3': { x: 0.0, y: -3.0, z: 1.5 },
  // ...
}

// Create preset
const presetId = presetStore.createPreset({
  name: 'Custom Scene',
  positions,
  trackIds: ['track-1', 'track-2', 'track-3'],
  category: 'scene',
  scope: 'project'
})
```

**Pros**:
- ✅ Full control
- ✅ Can use calculations
- ✅ Scriptable/repeatable

---

## 📋 Complete Offline Workflow

### Scenario: Pre-Show Planning (No Device)

1. **Create Project**
   ```javascript
   // Add dummy tracks (no OSC needed)
   projectStore.addTrack({
     name: 'Actor 1',
     type: 'sound-source',
     position: { x: 0, y: 0, z: 0 },
     // ...
   })
   ```

2. **Generate Formation Presets**
   ```javascript
   // Opening scene - frontal semicircle
   presetHelpers.createFrontalSemicircle(3.0, 1.2, 'Scene 1 - Opening')
   
   // Middle - full surround
   presetHelpers.createCircleFormation(5.0, 1.5, 'Scene 2 - Surround')
   
   // Finale - line formation
   presetHelpers.createLineFormation(8.0, 1.5, 'x', 'Scene 3 - Finale')
   ```

3. **Create Position Cues**
   ```javascript
   // In Cue Grid, create position cues that use these presets
   ```

4. **Export Presets**
   ```javascript
   // Save to file for later
   const json = presetStore.exportAllPresets()
   // Download or save
   ```

5. **On Show Day** (With Device)
   ```javascript
   // Import presets
   presetStore.importPresets(json)
   
   // Connect to device
   // Discover tracks
   
   // Execute cues - works perfectly!
   ```

---

## 🎯 Recommended Approach

### For Development/Testing:
```javascript
// Use generator functions
presetHelpers.createCircleFormation(4.0, 1.5)
```

### For Pre-Show Planning:
```javascript
// 1. Generate formations
// 2. Create position cues
// 3. Export presets
// 4. Import on show day
```

### For Manual Control:
```tsx
// Add ManualPositionEditor to your UI
// Allow users to set positions manually
// Then capture as presets
```

---

## 🔧 Integration: Add Manual Editor to TrackList

```tsx
// In TrackList.tsx or similar
import { ManualPositionEditor, BatchPositionEditor } from '@/components/tracks/ManualPositionEditor'

function TrackList() {
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [showBatchEditor, setShowBatchEditor] = useState(false)
  
  return (
    <>
      {/* Track list with edit buttons */}
      {tracks.map(track => (
        <div key={track.id}>
          <span>{track.name}</span>
          <button onClick={() => setEditingTrackId(track.id)}>
            Edit Position
          </button>
        </div>
      ))}
      
      {/* Batch edit button */}
      <button onClick={() => setShowBatchEditor(true)}>
        Arrange All Tracks
      </button>
      
      {/* Editors */}
      {editingTrackId && (
        <ManualPositionEditor
          trackId={editingTrackId}
          onClose={() => setEditingTrackId(null)}
        />
      )}
      
      {showBatchEditor && (
        <BatchPositionEditor
          trackIds={tracks.map(t => t.id)}
          onClose={() => setShowBatchEditor(false)}
        />
      )}
    </>
  )
}
```

---

## 💡 Pro Tips

### 1. Use Helper Functions First
The generator functions are the fastest way to create standard formations offline.

### 2. Create a "Template" Preset Library
```javascript
// Create standard presets once
presetHelpers.createCircleFormation(3.0, 1.5, 'Small Circle')
presetHelpers.createCircleFormation(5.0, 1.5, 'Large Circle')
presetHelpers.createFrontalSemicircle(3.0, 1.2, 'Stage')
presetHelpers.createLineFormation(6.0, 1.5, 'x', 'Front Line')

// Export for reuse
presetStore.exportAllPresets()
```

### 3. Animation as Position Source
If you have animations, they calculate positions offline. Use them as a source!

### 4. Combine Methods
```javascript
// 1. Generate base formation
presetHelpers.createCircleFormation(4.0, 1.5)

// 2. Manually adjust specific tracks
// (via ManualPositionEditor)

// 3. Capture adjusted preset
presetStore.captureCurrentPositions(trackIds, 'Custom Circle')
```

---

## 🎉 Summary

### You CAN Create Presets Offline!

| Method | Effort | Flexibility | Use Case |
|--------|--------|-------------|----------|
| Generator Functions | ⭐ Easy | ⭐⭐ Standard | Quick formations |
| Manual Editor | ⭐⭐ Medium | ⭐⭐⭐ Full | Custom positions |
| Animations | ⭐⭐ Medium | ⭐⭐ Animated | From animations |
| Programmatic | ⭐⭐⭐ Advanced | ⭐⭐⭐ Full | Scripting |

### Workflow:
1. **Offline**: Generate/create presets
2. **Export**: Save preset library
3. **Show Day**: Import & connect device
4. **Execute**: Position cues work perfectly!

No Holophonix device needed for preset creation! 🎊

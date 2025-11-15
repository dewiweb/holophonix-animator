# Position Presets - Complete User Flow

## 📋 How Users Create & Save Presets

You're right to ask - here's the complete flow from UI to saved preset!

---

## 🎯 The Complete Flow

### Step 1: User Clicks "Capture" Button

**Where**: In toolbar, floating panel, or quick actions
```tsx
import { PresetQuickActions } from '@/components/presets'

// In your toolbar/panel
<PresetQuickActions />
```

**What happens**: 
- User clicks the "Capture" button
- `CapturePresetDialog` opens

### Step 2: CapturePresetDialog Opens

**This IS the save interface!** User sees:

```
┌─────────────────────────────────────────┐
│ 📸 Capture Position Preset             │
├─────────────────────────────────────────┤
│ Preset Name *                           │
│ [Scene 1 - Opening            ]         │
│                                          │
│ Description                              │
│ [Opening positions for Act 1  ]         │
│                                          │
│ Category: [scene ▾]  Scope: [project ▾] │
│ Tags: [act1, opening]                   │
│                                          │
│ Tracks (6 selected):                    │
│ ☑️ Track 1: Actor A (2.0, 3.0, 1.2)    │
│ ☑️ Track 2: Actor B (-1.0, 3.0, 1.2)   │
│ ...                                      │
│                                          │
│           [Cancel]  [Save Preset]       │  ← THIS SAVES!
└─────────────────────────────────────────┘
```

### Step 3: User Fills Form & Clicks "Save Preset"

**Code in CapturePresetDialog.tsx**:
```typescript
const handleSave = () => {
  // This creates AND saves the preset!
  captureCurrentPositions(
    selectedTrackIds,
    name.trim(),
    {
      description: description.trim() || undefined,
      category,
      scope,
      tags: tagList
    }
  )
  
  onClose() // Dialog closes
}
```

**What happens internally**:
```typescript
// In positionPresetStore.ts
captureCurrentPositions: (trackIds, name, options) => {
  // 1. Gather current positions
  const positions = {}
  trackIds.forEach(id => {
    const track = projectStore.tracks.find(t => t.id === id)
    positions[id] = { ...track.position }
  })
  
  // 2. Create preset object
  const preset: PositionPreset = {
    id: generateId(),
    name,
    description,
    positions,
    trackIds,
    category,
    scope,
    tags,
    created: new Date(),
    modified: new Date(),
    version: 1
  }
  
  // 3. SAVE to store
  set(state => ({
    presets: [...state.presets, preset]
  }))
  
  // 4. Add to recently used
  // 5. Update library
  
  return preset.id
}
```

### Step 4: Preset is Now Saved!

The preset is now:
- ✅ Stored in `positionPresetStore.presets` array
- ✅ Available in PresetManager
- ✅ Available in CueEditorV2 dropdown
- ✅ Available for Apply operations
- ✅ Persisted with project data

---

## 🔌 Integration Options

### Option 1: Add to Existing Toolbar (Recommended)

```tsx
// In your main Layout.tsx or Toolbar component
import { PresetQuickActions } from '@/components/presets'

function Toolbar() {
  return (
    <div className="toolbar">
      {/* Your existing buttons */}
      <button>Animations</button>
      <button>Cues</button>
      
      {/* Add preset actions */}
      <PresetQuickActions layout="horizontal" showLabels={true} />
    </div>
  )
}
```

**Result**:
```
[Animations] [Cues] [Capture] [Apply] [Manage] [3 presets]
                     ↑ Click this to save!
```

### Option 2: Floating Panel (Quick & Easy)

```tsx
// In your main App.tsx or Layout.tsx
import { PresetFloatingPanel } from '@/components/presets'

function App() {
  return (
    <>
      {/* Your existing app */}
      <YourMainLayout />
      
      {/* Add floating panel - appears bottom-right */}
      <PresetFloatingPanel />
    </>
  )
}
```

**Result**: Floating button (🏠) in bottom-right corner:
- Click to expand → Shows Capture/Apply/Manage buttons
- Click "Capture" → Opens save dialog
- Click close → Collapses back to button

### Option 3: Keyboard Shortcut

```tsx
// In your main app or Layout
import { useState, useEffect } from 'react'
import { CapturePresetDialog } from '@/components/presets'

function App() {
  const [showCapture, setShowCapture] = useState(false)
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+P = Capture preset
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowCapture(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  return (
    <>
      {/* Your app */}
      
      {/* Capture dialog */}
      {showCapture && (
        <CapturePresetDialog onClose={() => setShowCapture(false)} />
      )}
    </>
  )
}
```

**Result**: User presses `Ctrl+Shift+P` → Save dialog opens!

### Option 4: Context Menu

```tsx
// In your track list or 3D view context menu
const contextMenuItems = [
  {
    label: 'Capture Positions...',
    icon: Camera,
    onClick: () => setShowCaptureDialog(true)
  },
  // ... other items
]
```

---

## 📸 The Save Dialog Explained

### CapturePresetDialog IS the Save Interface

When users click "Save Preset" in this dialog, it:

1. **Validates** the input (name required, tracks selected)
2. **Calls** `presetStore.captureCurrentPositions()`
3. **Creates** the preset object with current positions
4. **Saves** to the store (which persists with project)
5. **Closes** the dialog
6. **Done!** Preset is now available everywhere

### What Gets Saved

```typescript
{
  id: "preset-123",
  name: "Scene 1 - Opening",      // User entered
  description: "Opening positions", // User entered
  positions: {
    "track-1": { x: 2.0, y: 3.0, z: 1.2 },  // Current positions
    "track-2": { x: -1.0, y: 3.0, z: 1.2 }, // captured from tracks
    // ...
  },
  trackIds: ["track-1", "track-2", ...],
  category: "scene",               // User selected
  scope: "project",                // User selected
  tags: ["act1", "opening"],      // User entered
  created: Date,
  modified: Date,
  version: 1
}
```

---

## 🎬 Complete User Journey

### Scenario: Saving a Scene Preset

1. **User arranges tracks** in desired positions
   - Moves Track 1 to (2, 3, 1.5)
   - Moves Track 2 to (-1, 3, 1.2)
   - Etc.

2. **User clicks "Capture" button** in toolbar
   - `CapturePresetDialog` opens

3. **User fills in the form**:
   - Name: "Scene 1 - Opening"
   - Description: "Opening positions for Act 1"
   - Category: Scene
   - Tags: "act1, opening"
   - Tracks: All 6 tracks selected ✓

4. **User clicks "Save Preset"**
   - Dialog validates input ✓
   - Calls `captureCurrentPositions()`
   - Preset created with ID "preset-abc123"
   - Dialog closes

5. **Preset is now saved!**
   - Shows in PresetManager
   - Available in CueEditorV2 dropdown
   - Can be applied anytime
   - Persisted with project

### Later: Using the Saved Preset

1. **Create Position Cue**:
   - Open CueEditorV2
   - Select "Position" type
   - Choose "Scene 1 - Opening" from dropdown ✓
   - Configure transition
   - Save cue

2. **Or Apply Directly**:
   - Click "Apply" button
   - Select "Scene 1 - Opening"
   - Click "Apply Preset"
   - Tracks move to saved positions ✓

---

## 🔄 Alternative Flows

### Quick Snapshot (No Dialog)

```typescript
// In console or via quick action
import { presetHelpers } from '@/utils/presetHelpers'

// Capture with one line
const id = presetHelpers.captureCurrentSnapshot('Quick Test')
// Preset saved instantly!
```

### Programmatic Save

```typescript
import { usePositionPresetStore } from '@/stores/positionPresetStore'

const presetStore = usePositionPresetStore.getState()

// Save directly without dialog
const presetId = presetStore.captureCurrentPositions(
  allTrackIds,
  'Programmatic Preset',
  { category: 'custom' }
)
```

---

## ✅ Summary

### The Save Flow
```
User clicks "Capture" 
  → CapturePresetDialog opens
  → User fills form
  → User clicks "Save Preset" 
  → captureCurrentPositions() called
  → Preset saved to store
  → Dialog closes
  → Preset available everywhere ✓
```

### Integration Needed (Pick One)

1. **Quick**: Add `<PresetFloatingPanel />` to App.tsx (1 line!)
2. **Toolbar**: Add `<PresetQuickActions />` to existing toolbar
3. **Shortcut**: Add Ctrl+Shift+P keyboard handler
4. **Menu**: Add "Capture Positions..." menu item

### That's It!

Once you add any of these entry points, users can:
- ✅ Click "Capture" → Dialog opens
- ✅ Fill form → Click "Save Preset"
- ✅ Preset saved and available
- ✅ Use in cues or apply directly

**The CapturePresetDialog IS the save interface** - it creates AND saves the preset in one action!

---

## 🎯 Recommended Quick Start

Add this to your `App.tsx` or `Layout.tsx`:

```tsx
import { PresetFloatingPanel } from '@/components/presets'

// At the end of your return statement:
return (
  <>
    {/* Your existing app */}
    <YourLayout />
    
    {/* Add this one line - instant preset access! */}
    <PresetFloatingPanel />
  </>
)
```

**Result**: 
- Floating 🏠 button appears bottom-right
- Click to open → Shows "Capture" button
- Click "Capture" → Save dialog opens
- Fill & save → Done!

**That's all you need!** 🎉

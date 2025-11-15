# Position Presets - Quick Start Guide

## ❓ How Do Users Save Presets?

**Short Answer**: Click "Capture" button → Fill form → Click "Save Preset"

---

## 🎯 The 3-Step Process

### 1. Add UI Access Point (One Time Setup)

Choose ONE of these options:

#### Option A: Floating Panel (Easiest - 1 line!)

```tsx
// In your App.tsx or Layout.tsx
import { PresetFloatingPanel } from '@/components/presets'

<PresetFloatingPanel />
```

**Result**: Floating 🏠 button appears bottom-right corner

#### Option B: Toolbar Buttons

```tsx
// In your toolbar component
import { PresetQuickActions } from '@/components/presets'

<PresetQuickActions layout="horizontal" showLabels={true} />
```

**Result**: [Capture] [Apply] [Manage] buttons appear

### 2. User Clicks "Capture" Button

- Opens `CapturePresetDialog` (the save form)

### 3. User Saves Preset

User fills form:
- ✏️ Name (required)
- 📝 Description (optional)
- 🏷️ Category (scene/formation/effect/safety/custom)
- 🌍 Scope (project/global)
- 🏷️ Tags (optional)
- ☑️ Select tracks

**Clicks "Save Preset" → DONE!**

---

## 📸 The Save Dialog (CapturePresetDialog)

This dialog **IS the save interface**. When user clicks "Save Preset":

```typescript
// What happens internally:
captureCurrentPositions(trackIds, name, options)
  → Reads current track positions
  → Creates preset object
  → Saves to positionPresetStore
  → Closes dialog
  → Preset is now available everywhere ✓
```

---

## ✅ Where Presets Appear After Saving

Once saved, presets are automatically available in:

1. **CueEditorV2** dropdown (position cue type)
2. **PresetManager** (manage dialog)
3. **Apply dialog** (quick apply)
4. **Store** (`presetStore.presets` array)
5. **Console** (for testing/debugging)

---

## 🚀 Minimal Integration Example

**File**: `App.tsx` or `Layout.tsx`

```tsx
import { PresetFloatingPanel } from '@/components/presets'

export function App() {
  return (
    <>
      {/* Your existing app */}
      <YourLayout />
      
      {/* Add this ONE line - that's it! */}
      <PresetFloatingPanel />
    </>
  )
}
```

**Done!** Users can now:
1. Click floating button
2. Click "Capture"
3. Fill & save
4. Use preset in cues

---

## 🎬 Complete User Flow

```
1. User arranges tracks in desired positions

2. User clicks "Capture" button
   └─ CapturePresetDialog opens

3. User fills form:
   - Name: "Scene 1"
   - Category: Scene
   - Tags: "act1"
   - Tracks: Select all ✓

4. User clicks "Save Preset"
   └─ Preset saved to store
   └─ Dialog closes

5. Preset is now saved! ✓
   └─ Available in CueEditorV2
   └─ Can be applied anytime
   └─ Persisted with project
```

---

## 🎯 What "Capture" Does

```typescript
// When user clicks "Save Preset" in the dialog:

1. Validates form (name required, tracks selected)
2. Reads current positions from tracks
3. Creates preset object:
   {
     id: "preset-123",
     name: "Scene 1",
     positions: {
       "track-1": { x: 2.0, y: 3.0, z: 1.5 },
       "track-2": { x: -1.0, y: 3.0, z: 1.2 },
       // ... current position of each track
     },
     trackIds: ["track-1", "track-2", ...],
     category: "scene",
     // ... other metadata
   }
4. Saves to positionPresetStore.presets array
5. Preset is now available everywhere ✓
```

---

## 💡 Key Points

### The Save Interface IS CapturePresetDialog
- It's not a separate save step
- Fill form → Click "Save Preset" → Done!
- No additional save confirmation needed

### Presets Save Automatically
- Saved to Zustand store
- Persisted with project data
- Immediately available

### One Button to Rule Them All
- "Capture" button → Opens save dialog
- Everything else is automatic
- No complex setup needed

---

## 🧪 Test It Works

### Quick Test in Console

```javascript
// 1. Check store is available
console.log('Presets:', usePositionPresetStore.getState().presets)

// 2. Save a test preset programmatically
const id = presetHelpers.captureCurrentSnapshot('Test')
console.log('Saved:', id)

// 3. Check it's in the store
console.log('Presets:', usePositionPresetStore.getState().presets.length)
```

---

## 📋 Integration Checklist

- [ ] Add `<PresetFloatingPanel />` to App.tsx (or choose another option)
- [ ] Test: Click floating button → Panel opens ✓
- [ ] Test: Click "Capture" → Dialog opens ✓
- [ ] Test: Fill form → Click "Save Preset" → Dialog closes ✓
- [ ] Test: Open CueEditorV2 → Select "Position" type → See preset in dropdown ✓

**If all tests pass, it works!**

---

## ❓ FAQ

### Q: Where do I add the capture button?
**A**: Add `<PresetFloatingPanel />` to your App.tsx - easiest option!

### Q: What happens when user clicks "Save Preset"?
**A**: The preset is created and saved to the store immediately. That's it!

### Q: Do I need a separate save function?
**A**: No! CapturePresetDialog handles everything. Just open the dialog.

### Q: How do users edit saved presets?
**A**: Click "Manage" button → Opens PresetManager → Click preset → Edit

### Q: Are presets persisted?
**A**: Yes! Saved with project data automatically.

---

## 🎉 Summary

**To enable preset saving**:
1. Add one line: `<PresetFloatingPanel />`
2. That's it!

**Users can then**:
1. Click floating button
2. Click "Capture"
3. Fill form
4. Click "Save Preset"
5. Done!

**Presets are**:
- ✅ Saved automatically
- ✅ Available immediately
- ✅ Persisted with project
- ✅ Ready to use in cues

---

See also:
- `PRESET_USER_FLOW.md` - Detailed flow diagrams
- `PRESET_INTEGRATION_EXAMPLE.tsx` - Code examples
- `POSITION_PRESETS_CONSOLE_COMMANDS.md` - Testing commands

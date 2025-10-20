# Project Save Bug Fix

## Problem

When saving a project to a `.hpx` file, the following data was **NOT being saved**:
- ❌ Tracks (always empty array)
- ❌ Animations (always empty array)
- ❌ OSC Connections (always empty array)

### Evidence

Saved file showed:
```json
{
  "tracks": [],
  "animations": [],
  "oscConnections": []
}
```

---

## Root Cause

In `src/stores/projectStore.ts`, the `saveProject()` function was saving `state.currentProject` directly:

```typescript
// BUGGY CODE ❌
saveProject: async () => {
  const projectData = serializeProject(state.currentProject)  // Missing current data!
  await writeFile(filePath, projectData)
}
```

**Problem**: The project store maintains data in **two places**:
1. `state.currentProject` - Project metadata only
2. `state.tracks`, `state.animations`, etc. - **Actual current data**

The save function only saved #1, ignoring all the actual working data in #2!

---

## Solution

### Fixed: Merge Current State Before Saving

```typescript
// FIXED CODE ✅
saveProject: async () => {
  const oscStore = await import('./oscStore').then(m => m.useOSCStore.getState())
  
  const updatedProject: Project = {
    ...state.currentProject,
    tracks: state.tracks,                      // ← Current tracks
    groups: state.groups,                      // ← Current groups
    animations: state.animations,              // ← Current animations
    timelines: state.timelines,                // ← Current timelines
    presets: state.presets,                    // ← Current presets
    oscConnections: oscStore.connections,      // ← Current OSC connections
    metadata: {
      ...state.currentProject.metadata,
      modified: new Date(),
    },
  }
  
  console.log('💾 Saving project with:', {
    tracks: updatedProject.tracks.length,
    animations: updatedProject.animations.length,
    oscConnections: updatedProject.oscConnections.length,
  })
  
  const projectData = serializeProject(updatedProject)
  await writeFile(filePath, projectData)
}
```

---

## Changes Made

### 1. Fixed `saveProject()` 

**File**: `src/stores/projectStore.ts`

- Merges current state data before serialization
- Pulls OSC connections from `oscStore` (correct source)
- Updates modification timestamp
- Adds logging to verify what's being saved

### 2. Fixed `saveProjectAs()`

Same fix applied to ensure "Save As" also works correctly.

### 3. Enhanced `openProject()` / `loadProject()`

Added logging to show what was restored:
```typescript
console.log('📂 Restored:', {
  tracks: project.tracks.length,
  animations: project.animations.length,
  oscConnections: project.oscConnections.length,
})
```

---

## Testing

### Before Fix

1. Create project
2. Add tracks
3. Create animations
4. Connect to OSC device
5. Save project
6. **Result**: File has empty arrays ❌

### After Fix

1. Create project
2. Add tracks
3. Create animations  
4. Connect to OSC device
5. Save project
6. **Result**: File contains all data ✅

### Verification

Check the `.hpx` file:
```json
{
  "tracks": [
    {
      "id": "...",
      "name": "Track 1",
      "position": {...},
      ...
    }
  ],
  "animations": [
    {
      "id": "...",
      "type": "circular",
      "parameters": {...},
      ...
    }
  ],
  "oscConnections": [
    {
      "id": "...",
      "host": "localhost",
      "port": 4003,
      ...
    }
  ]
}
```

---

## OSC Connection Note

### Important Limitation

OSC connections contain **runtime state** (actual network sockets) that cannot be serialized. The saved file contains connection **metadata** (host, port, etc.) but not the live connection.

**When loading a project**:
- ✅ Connection info is restored
- ⚠️ Connections must be **manually re-established**
- User needs to click "Connect" for each saved connection

This is by design - network connections cannot be automatically restored.

---

## Architecture Note

### Why Two Storage Locations?

The project store uses this pattern:
```typescript
{
  currentProject: Project,  // Immutable project metadata
  tracks: Track[],          // Mutable working data
  animations: Animation[],  // Mutable working data
  ...
}
```

**Rationale**:
- Separates project identity from working data
- Allows tracking unsaved changes
- Maintains undo/redo history
- Enables real-time collaboration (future)

**Implication**: Must merge before saving!

---

## Related Issues

### Similar Pattern in `saveProjectAs()`

The same bug existed in `saveProjectAs()` - it was also fixed.

### Why `createProject()` Worked

`createProject()` starts with empty arrays, so the bug wasn't visible until user added data.

---

## Prevention

### Code Review Checklist

When working with project persistence:
- [ ] Merge `state.tracks`, `state.animations`, etc. before saving
- [ ] Pull `oscConnections` from `oscStore.connections`
- [ ] Update `metadata.modified` timestamp
- [ ] Log what's being saved for debugging
- [ ] Test with actual project data (not empty project)

### Automated Testing

Future improvement: Add integration test:
```typescript
test('saveProject preserves all data', async () => {
  // Create project
  // Add tracks, animations
  // Save
  // Load
  // Assert: all data restored
})
```

---

## Files Modified

- `src/stores/projectStore.ts`
  - `saveProject()` - Fixed to merge current state
  - `saveProjectAs()` - Fixed to merge current state
  - `openProject()` - Enhanced logging

---

## Conclusion

The project save functionality now correctly persists:
- ✅ All tracks with positions and animations
- ✅ All animations with parameters
- ✅ OSC connection metadata (manual re-connect needed)
- ✅ Groups, timelines, presets
- ✅ Project metadata and timestamps

**Users can now save and restore their complete animation setups!**

---

**Fix Date**: January 2025  
**Severity**: Critical (data loss bug)  
**Status**: FIXED ✅

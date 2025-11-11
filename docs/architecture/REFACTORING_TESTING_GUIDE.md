# Track Locking Refactoring - Testing Guide

**Status**: Ready for Testing  
**Date**: 2024-11-04  
**Phase**: 1.6 - Testing & Validation

---

## Overview

This guide provides step-by-step testing procedures for the Track Locking refactoring, which adds:
1. **Track Locking**: Lock animations to specific tracks
2. **Preset Integration**: Use presets in cue system
3. **Locked/Unlocked Distinction**: Clear UI indicators for track flexibility

---

## Test Environment Setup

### Prerequisites
1. **Build the application**:
   ```bash
   npm run build
   npm run dev
   ```

2. **Create test project**:
   - Create a new project
   - Add at least 5 tracks with unique names (e.g., "Track 1", "Track 2", etc.)
   - Set initial positions for each track

---

## Test Suite

### **Test 1: Animation Editor - Track Locking**

#### Test 1.1: Create Unlocked Animation
**Steps**:
1. Open Animation Editor
2. Select 2-3 tracks
3. Choose any animation type (e.g., Circular)
4. Configure parameters
5. **Leave "Lock tracks to this animation" UNCHECKED**
6. Enter name: "Unlocked Circular"
7. Click "Save Animation"

**Expected Result**:
- ✅ Animation saved successfully
- ✅ No trackIds in saved animation object
- ✅ Animation appears in Animation Library

**Validation**:
```typescript
// Check in browser console:
useProjectStore.getState().animations.find(a => a.name === "Unlocked Circular")
// Should show: trackIds: undefined, trackSelectionLocked: undefined
```

---

#### Test 1.2: Create Locked Animation
**Steps**:
1. Open Animation Editor
2. Select 2-3 specific tracks (e.g., Track 1, Track 2, Track 3)
3. Choose animation type (e.g., Spiral)
4. Configure parameters
5. **CHECK "Lock tracks to this animation"**
6. Verify info message shows: "🔒 This animation will be locked to 3 track(s)"
7. Enter name: "Locked Spiral"
8. Click "Save Animation"

**Expected Result**:
- ✅ Animation saved with trackIds
- ✅ trackSelectionLocked = true
- ✅ Animation appears in Animation Library

**Validation**:
```typescript
// Check in browser console:
const anim = useProjectStore.getState().animations.find(a => a.name === "Locked Spiral")
console.log(anim.trackIds) // Should show array of track IDs
console.log(anim.trackSelectionLocked) // Should be true
```

---

### **Test 2: Cue Editor - Preset Mode**

#### Test 2.1: Create Cue with Preset
**Steps**:
1. Open Cue Grid
2. Click on empty cue slot
3. In Cue Editor:
   - Name: "Test Preset Cue"
   - Click "Preset" source type button
   - Select preset: "Simple Linear Path" (or any available preset)
   - **SELECT at least 2 tracks**
   - Set trigger type (e.g., Manual)
4. Click "Save"

**Expected Result**:
- ✅ Cue saved successfully
- ✅ Cue appears in grid with name
- ✅ Parameters contain presetId
- ✅ Parameters contain trackIds

**Validation**:
```typescript
// Check cue parameters:
const cue = useCueStore.getState().getCueById('cue-id-here')
console.log(cue.parameters.presetId) // Should have preset ID
console.log(cue.parameters.trackIds) // Should have selected track IDs
console.log(cue.parameters.animationId) // Should be undefined
```

#### Test 2.2: Preset Validation
**Steps**:
1. Create cue with Preset mode
2. Select a preset
3. **DO NOT select any tracks**
4. Attempt to save

**Expected Result**:
- ✅ Warning message appears: "⚠️ You must select at least one track for presets"
- ✅ Tracks can still be saved (validation is UI-only)

---

### **Test 3: Cue Editor - Locked Animation**

#### Test 3.1: Create Cue with Locked Animation
**Steps**:
1. Create a locked animation first (see Test 1.2)
2. Open Cue Grid
3. Click empty cue slot
4. In Cue Editor:
   - Name: "Test Locked Animation Cue"
   - Click "Saved Animation" source type button
   - Select animation: "Locked Spiral 🔒"
5. Verify locked tracks UI appears

**Expected Result**:
- ✅ Blue info box appears with Lock icon
- ✅ Message: "Tracks Locked"
- ✅ Shows list of locked tracks as badges
- ✅ Message: "Cannot change tracks. To use different tracks, duplicate..."
- ✅ NO track checkboxes shown

**Validation**:
```typescript
const cue = useCueStore.getState().getCueById('cue-id-here')
console.log(cue.parameters.animationId) // Should have animation ID
console.log(cue.parameters.trackIds) // Should be undefined (removed)
console.log(cue.parameters.presetId) // Should be undefined
```

---

### **Test 4: Cue Editor - Unlocked Animation**

#### Test 4.1: Create Cue with Unlocked Animation
**Steps**:
1. Create unlocked animation (see Test 1.1)
2. Open Cue Grid
3. Create new cue
4. In Cue Editor:
   - Name: "Test Unlocked Animation Cue"
   - Source: "Saved Animation"
   - Select: "Unlocked Circular"
5. Verify track selection UI appears

**Expected Result**:
- ✅ Track checkboxes appear
- ✅ Message: "Target Tracks (optional)"
- ✅ Help text: "Leave empty to use currently selected tracks"
- ✅ Can select/deselect tracks freely

**Validation**:
```typescript
const cue = useCueStore.getState().getCueById('cue-id-here')
console.log(cue.parameters.animationId) // Should have animation ID
console.log(cue.parameters.trackIds) // Should have selected track IDs or undefined
console.log(cue.parameters.presetId) // Should be undefined
```

---

### **Test 5: Cue Playback - Preset**

#### Test 5.1: Trigger Preset Cue
**Steps**:
1. Create cue with preset (Test 2.1)
2. Select tracks in cue: Track 1, Track 2
3. Click cue button to trigger

**Expected Result**:
- ✅ Animation plays on selected tracks (Track 1, Track 2)
- ✅ Console log: "Using preset [preset-id]"
- ✅ Temporary animation created
- ✅ Tracks animate according to preset

**Browser Console Check**:
```typescript
// Should see logs like:
// "Triggering cue: [cue-id]"
// "Creating temp animation from preset"
```

---

### **Test 6: Cue Playback - Locked Animation**

#### Test 6.1: Trigger Locked Animation Cue
**Steps**:
1. Create locked animation for Track 1, 2, 3
2. Create cue with that locked animation
3. Trigger cue

**Expected Result**:
- ✅ Animation plays ONLY on locked tracks (1, 2, 3)
- ✅ Console log: "🔒 Using locked tracks from animation: [...]"
- ✅ Other tracks not affected

**Validation**:
```typescript
// Check animation store:
useAnimationStore.getState().playingAnimations
// Should show animation playing on correct track IDs
```

---

### **Test 7: Cue Playback - Unlocked Animation**

#### Test 7.1: Trigger Unlocked Animation with Track Selection
**Steps**:
1. Create unlocked animation
2. Create cue, select specific tracks (e.g., Track 4, Track 5)
3. Trigger cue

**Expected Result**:
- ✅ Animation plays on cue's selected tracks (4, 5)
- ✅ Console log: "Using cue track selection: [...]"
- ✅ Animation parameters applied to those tracks

#### Test 7.2: Trigger Unlocked Animation without Track Selection
**Steps**:
1. Create unlocked animation
2. Create cue WITHOUT selecting tracks
3. Select tracks 2, 3, 4 in main UI
4. Trigger cue

**Expected Result**:
- ✅ Animation plays on currently selected tracks (2, 3, 4)
- ✅ Fallback to `projectStore.selectedTracks`

---

### **Test 8: Multiple Simultaneous Cues**

#### Test 8.1: Play Multiple Cues Simultaneously
**Steps**:
1. Create 3 cues:
   - Cue A: Preset on Track 1, 2
   - Cue B: Locked animation on Track 3, 4
   - Cue C: Unlocked animation on Track 5
2. Trigger all 3 cues

**Expected Result**:
- ✅ All 3 animations play simultaneously
- ✅ No interference between cues
- ✅ Each respects its track configuration
- ✅ Console shows all 3 animations in playingAnimations

---

### **Test 9: Backward Compatibility**

#### Test 9.1: Existing Cues (Pre-Refactoring)
**Steps**:
1. Load a project with old cues (if available)
2. OR create cue with only animationId (no presetId, no locked)
3. Trigger cue

**Expected Result**:
- ✅ Old cues work as before
- ✅ Treated as unlocked animations
- ✅ Use cue's trackIds or fallback to selected

---

### **Test 10: UI/UX Validation**

#### Test 10.1: Visual Indicators
**Check**:
- ✅ Animation Editor: Lock checkbox visible and functional
- ✅ Animation Editor: Info message changes when locked/unlocked
- ✅ Animation dropdown: 🔒 emoji appears for locked animations
- ✅ Cue Editor: Source type toggle is clear (Preset vs Saved Animation)
- ✅ Cue Editor: Lock icon appears for locked animation section
- ✅ Cue Editor: Track badges displayed for locked tracks
- ✅ Cue Editor: Blue info box styling for locked animations
- ✅ All text is readable in light and dark modes

#### Test 10.2: Validation Messages
**Check**:
- ✅ Preset mode: Warning if no tracks selected
- ✅ Locked animation: Clear explanation of restriction
- ✅ Unlocked animation: Help text for optional tracks

---

## Edge Cases & Error Handling

### Edge Case 1: Deleted Tracks
**Steps**:
1. Create locked animation with Track 1, 2
2. Delete Track 1 from project
3. Trigger cue with locked animation

**Expected Behavior**:
- Should handle gracefully (show warning or skip deleted track)

### Edge Case 2: Empty Project
**Steps**:
1. Create project with no tracks
2. Try to create cue

**Expected Behavior**:
- No tracks available to select
- Should show empty state or disable track selection

### Edge Case 3: Preset Not Found
**Steps**:
1. Create cue with preset
2. Manually delete preset from presetStore
3. Trigger cue

**Expected Behavior**:
- Console error: "Preset [id] not found"
- Animation does not play

---

## Performance Testing

### Test P1: Many Simultaneous Animations
**Steps**:
1. Create 10+ cues with different animations
2. Trigger all simultaneously

**Expected**:
- ✅ Smooth playback at 60 FPS
- ✅ No lag or stutter
- ✅ OSC messages sent correctly

### Test P2: Large Track Count
**Steps**:
1. Create project with 50+ tracks
2. Create locked animation with 20 tracks
3. Trigger cue

**Expected**:
- ✅ UI remains responsive
- ✅ Animation plays smoothly

---

## Acceptance Criteria

### Phase 1 Complete When:
- ✅ All Test Suite tests pass
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ No console errors during normal use
- ✅ Backward compatibility maintained
- ✅ UI is intuitive and clear
- ✅ Documentation updated

---

## Troubleshooting

### Issue: Cue doesn't trigger
**Check**:
1. Console for errors
2. Verify animationId or presetId is set
3. Check trackIds are valid
4. Verify animation exists in projectStore

### Issue: Wrong tracks animate
**Check**:
1. Is animation locked? Should use animation's trackIds
2. Is animation unlocked? Should use cue's trackIds
3. Are trackIds empty? Should fallback to selected tracks

### Issue: Preset doesn't work
**Check**:
1. Preset exists in presetStore
2. TrackIds are selected in cue
3. Console for "Preset not found" error

---

## Test Results Log

| Test | Status | Notes | Date |
|------|--------|-------|------|
| Test 1.1 | ⏳ Pending |  |  |
| Test 1.2 | ⏳ Pending |  |  |
| Test 2.1 | ⏳ Pending |  |  |
| Test 2.2 | ⏳ Pending |  |  |
| Test 3.1 | ⏳ Pending |  |  |
| Test 4.1 | ⏳ Pending |  |  |
| Test 5.1 | ⏳ Pending |  |  |
| Test 6.1 | ⏳ Pending |  |  |
| Test 7.1 | ⏳ Pending |  |  |
| Test 7.2 | ⏳ Pending |  |  |
| Test 8.1 | ⏳ Pending |  |  |
| Test 9.1 | ⏳ Pending |  |  |
| Test 10.1 | ⏳ Pending |  |  |
| Test 10.2 | ⏳ Pending |  |  |

---

## Sign-Off

**Tested by**: _________________  
**Date**: _________________  
**Build Version**: _________________  
**Status**: ⏳ Pending / ✅ Passed / ❌ Failed  

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Next Steps After Testing**:
1. Fix any bugs found
2. Update documentation
3. Create user guide
4. Announce feature to users

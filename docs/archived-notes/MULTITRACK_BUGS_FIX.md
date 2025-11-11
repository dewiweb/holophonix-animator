# Multi-Track System Bugs - Fix Summary

## Bugs Reported

1. ❌ Control points not visible in multitrack modes (path is visible but not points)
2. ❌ Changing animation model makes them appear
3. ❌ Phase timing offset boolean checked by default (should be unchecked)
4. ❌ Barycenter not draggable even when gizmo appears
5. ❌ No clear difference between custom and centered variants
6. ❌ Duplicate center position displays in form

## Fixes Applied

### ✅ 1. Phase Offset Default (Bug #3)
**File:** `animationEditorStoreV2.ts`
```typescript
// BEFORE
phaseOffsetSeconds: 0.5,  // Always checked by default

// AFTER
phaseOffsetSeconds: 0,  // Default: no phase offset (unchecked)
```

### ✅ 2. Variant Clarification & Deprecation (Bugs #5, #6)
**File:** `MultiTrackModeSelector.tsx`

**Clarified descriptions:**
- **Shared**: User-defined center, zero offsets (all tracks move identically from center)
- **Isobarycentric**: Auto-calculated center, preserves offsets (rigid formation from calculated center)
- **Centered**: User-defined center, preserves offsets (rigid formation from your chosen center)
- **Custom**: DEPRECATED - Use "centered" instead. Will be removed.

**Removed duplicate displays:**
- Removed the green "Center Position (User-defined)" info panel
- Removed the orange "Center Position (Auto-calculated)" info panel
- Kept only the editable purple input panel for user-defined variants
- Kept only the orange calculated display for isobarycentric

**Result:** Now there's ONE center position display per variant:
- `shared/centered/custom` → Purple editable inputs
- `isobarycentric` → Orange read-only calculated display

### ✅ 3. Preserve Offsets Toggle Simplified
**File:** `MultiTrackModeSelector.tsx`

- **Shared**: Always OFF (no offsets to preserve)
- **Isobarycentric**: Always ON (rigid formation is the point)
- **Centered**: Always ON (rigid formation is the point)
- **Custom**: Toggle available (for backward compatibility before removal)

### 🔍 4. Control Points Visibility (Bug #1, #2)
**Status:** INVESTIGATING

The control point meshes ARE being created:
```typescript
// From useControlPointScene.ts
const mesh = new THREE.Mesh(geometry, material)
mesh.renderOrder = 999  // High render order
mesh.position.copy(position)
sceneRef.current.add(mesh)
```

**Possible causes:**
1. Control points might be at (0,0,0) if parameters aren't set
2. Camera might not be positioned to see them
3. `extractControlPointsFromAnimation` might return empty array

**Next steps:**
- Check console logs for "Computing control points" message
- Check what `controlPointPositions` contains
- Verify animation parameters exist

### 🔍 5. Barycenter Not Draggable (Bug #4)
**Status:** FIX APPLIED - NEEDS TESTING

**Recent fixes:**
- Added `isDragging` flag to prevent position reset during drag
- TransformControls should attach to center marker when selected (index -1)
- `onTransform` and `onTransformEnd` callbacks handle center separately

**Possible issues:**
- TransformControls might not be attaching correctly
- Center marker might not be in the scene
- `isCenterEditable` might be false

**Debug steps:**
1. Check console for "🔌 Attaching transform controls to barycentric center"
2. Verify centerMarker exists in scene
3. Check if `isCenterEditable` is true for the variant

## Testing Instructions

### Test Phase Offset Default
1. Open animation editor
2. Select multiple tracks
3. Check "Phase Offset" section
4. ✅ Should be UNCHECKED by default
5. ✅ Slider should not be visible until checked

### Test Variant Descriptions
1. Select barycentric mode
2. Try each variant:
   - **Shared** → Description: "zero offsets"
   - **Isobarycentric** → Description: "auto-calculated, preserves offsets"
   - **Centered** → Description: "user-defined, preserves offsets"
   - **Custom** → Description: "DEPRECATED"

### Test Center Position Display
1. Select **Shared** → Should see purple editable inputs (X, Y, Z)
2. Select **Isobarycentric** → Should see orange calculated display
3. Select **Centered** → Should see purple editable inputs
4. ✅ Should NOT see duplicate displays

### Test Control Points Visibility
1. Create linear/circular animation
2. Select multiple tracks (barycentric mode)
3. Switch to Edit mode in 3D view
4. ✅ Control points should be visible as colored spheres
5. ✅ Path should also be visible
6. If not visible, open console and check for:
   - "🔍 Computing control points from animation"
   - "✨ Updating control point positions in place"
   - What does controlPointPositions contain?

### Test Barycenter Dragging
1. Select **Centered** or **Shared** variant
2. Switch to Edit mode
3. Click on green barycentric center sphere
4. ✅ Gizmo should appear
5. ✅ Drag gizmo → center should move smoothly
6. ✅ Form inputs should update in real-time
7. ✅ Release → center should stay at new position
8. Check console for:
   - "🔌 Attaching transform controls to barycentric center"
   - "⏸️ Skipping barycentric center position update (dragging)"
   - "🔧 Barycentric center drag ended"

## Known Issues to Investigate

### Control Points Not Visible
**Symptoms:**
- Path is visible but control points are not
- Changing animation model makes them appear

**Hypothesis:**
- Initial animation might not have control points parameters set
- `extractControlPointsFromAnimation` might return empty array
- Control points might be at origin (0,0,0) and camera doesn't see them

**Investigation needed:**
1. Check what `animation.parameters` contains initially
2. Check what `extractControlPointsFromAnimation` returns
3. Check camera position and FOV

### Barycenter Gizmo Not Moving
**Symptoms:**
- Gizmo appears when clicking center
- Moving gizmo doesn't move the center

**Hypothesis:**
- TransformControls might not be attached to the right mesh
- `onTransform` callback might not be called
- Position update might be blocked

**Investigation needed:**
1. Verify TransformControls events are firing
2. Check if `currentSelectedIndex === -1` condition is met
3. Check if `centerMarker.position.copy(position)` is called

## Files Modified

1. `/src/stores/animationEditorStoreV2.ts`
   - Changed `phaseOffsetSeconds: 0.5` → `phaseOffsetSeconds: 0`

2. `/src/components/animation-editor/components/controls/MultiTrackModeSelector.tsx`
   - Updated variant descriptions
   - Removed duplicate center position panels
   - Simplified preserve offsets toggle logic
   - Fixed TypeScript errors

3. `/src/components/animation-editor/components/threejs-editor/hooks/useBarycentricControl.ts`
   - Added `isDragging` prop
   - Skip position update during drag

4. `/src/components/animation-editor/components/threejs-editor/UnifiedThreeJsEditor.tsx`
   - Pass `isDragging` flag to useBarycentricControl

## Next Steps

1. **User testing** - Check if control points appear now
2. **User testing** - Check if barycenter drags smoothly
3. **Console analysis** - If issues persist, check browser console logs
4. **Deprecate custom variant** - Plan migration path for existing projects
5. **Document variants** - Update user documentation with clear explanations

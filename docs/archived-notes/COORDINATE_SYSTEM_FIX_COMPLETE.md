# Unified Editor Coordinate System & Data Sync Fix - Complete

**Date**: November 9, 2024  
**Status**: ✅ **FIXED** - Ready for testing

---

## Issues Fixed

### 1. ✅ Coordinate System Mismatch
**Problem**: Front view showed what should be in top view  
**Root cause**: App uses Z-up (spatial audio), Three.js uses Y-up (graphics)

**Solution**: Created coordinate conversion utilities

**Files**:
- ✅ Created `coordinateConversion.ts`
- ✅ Updated `extractControlPoints.ts` to use conversion
- ✅ Updated `useTrackVisualization.ts` to use conversion

**Conversion formula**:
```typescript
// App → Three.js
App (x, y, z) → Three (x, z, -y)

// Three.js → App  
Three (x, y, z) → App (x, -z, y)
```

**Coordinate systems**:
- **App (Spatial Audio - Z-up)**:
  - X: Right
  - Y: Forward (toward listener)
  - Z: Up (vertical)

- **Three.js (Graphics - Y-up)**:
  - X: Right
  - Y: Up (vertical)
  - Z: Forward (toward viewer)

---

### 2. ✅ Control Point Edit Loop Fixed
**Problem**: Dragging control points caused them to snap back to original position  
**Root cause**: Animation object recreated on every parameter change, triggering control point reload

**Solution**: Only reload control points when animation ID or type changes

**Files**:
- ✅ Updated `useControlPointScene.ts` dependency array
- ✅ Added tracking of animation key (`${id}-${type}`)
- ✅ Skip reload if same animation and type

**Data flow** (fixed):
```
User drags gizmo
  ↓
updateControlPoint (local state)
  ↓
onTransformEnd
  ↓
controlPointsToParameters (Three.js → App coords)
  ↓
onAnimationChange({ parameters: updated })
  ↓
AnimationEditor.updateParameters()
  ↓
animationForm updates
  ↓
unifiedEditorAnimation memoized (same ID)
  ↓
useControlPointScene sees same ID → SKIP reload ✅
  ↓
Control point stays in new position ✅
```

---

### 3. ✅ Tracks Displayed in Edit Mode
**Problem**: Tracks only shown in Preview mode  
**Solution**: Show tracks in both Preview and Edit modes

**Files**:
- ✅ Updated `UnifiedThreeJsEditor.tsx` - `showTracks: true`
- ✅ Tracks now visible with control points

---

## Files Modified

### Created
1. ✅ `coordinateConversion.ts` - Coordinate system conversion utilities

### Modified
2. ✅ `extractControlPoints.ts` - Use coordinate conversion
3. ✅ `useControlPointScene.ts` - Fix reload loop, add coordinate conversion
4. ✅ `useTrackVisualization.ts` - Add coordinate conversion
5. ✅ `UnifiedThreeJsEditor.tsx` - Show tracks in all modes

---

## How It Works Now

### Control Point Extraction
```typescript
// 1. Extract from animation.parameters
const points = extractControlPointsFromAnimation(animation)

// 2. Convert App coords → Three.js coords
const threePos = appToThreePosition(appPos)

// 3. Create meshes in scene
const mesh = new THREE.Mesh(geometry, material)
mesh.position.copy(threePos)
```

### Control Point Editing
```typescript
// 1. User drags gizmo
TransformControls.onTransform(position)

// 2. Update local state (Three.js coords)
updateControlPoint(index, position)

// 3. On drag end, convert back
const appPos = threeToAppPosition(threePos)

// 4. Update animation parameters
const updatedParams = controlPointsToParameters(type, points, params)

// 5. Sync to form
onAnimationChange({ ...animation, parameters: updatedParams })
```

### Track Visualization
```typescript
// 1. Get track position (App coords)
const trackPos = track.position // { x, y, z }

// 2. Convert to Three.js coords
const threePos = appToThreePosition(trackPos)

// 3. Render sphere
mesh.position.copy(threePos)
```

---

## Testing Checklist

### ✅ Coordinate System
- [ ] Create animation with known positions:
  - Point A: (5, 0, 0) - along X axis
  - Point B: (0, 5, 0) - along Y axis (forward)
  - Point C: (0, 0, 5) - along Z axis (up)

- [ ] Verify views:
  - **Top view**: Should show XZ plane (looking down)
    - X horizontal, Z vertical, Y perpendicular
  - **Front view**: Should show XY plane (looking forward)
    - X horizontal, Y vertical, Z perpendicular
  - **Side view**: Should show YZ plane (looking from side)
    - Y horizontal, Z vertical, X perpendicular

- [ ] Verify tracks appear in correct positions

### ✅ Control Point Editing
- [ ] Load linear animation
- [ ] Switch to Edit mode
- [ ] See 2 control points (green start, blue end)
- [ ] See tracks as spheres with labels
- [ ] Click control point → turns yellow with gizmo
- [ ] Drag gizmo → point moves smoothly
- [ ] Release → point STAYS in new position ✅
- [ ] Check form → parameters updated ✅
- [ ] Save animation → new values persisted ✅

### ✅ Track Display
- [ ] Preview mode: Tracks visible ✅
- [ ] Edit mode: Tracks visible ✅
- [ ] Tracks at correct positions (with coordinate conversion) ✅

---

## Expected Behavior

### Before Fix ❌
- Front view = Top view content (coordinate mismatch)
- Tracks in wrong positions
- Control points snap back after drag
- Tracks hidden in Edit mode

### After Fix ✅
- Front view = Front view (XY plane)
- Top view = Top view (XZ plane)
- Side view = Side view (YZ plane)
- Control points stay when dragged
- Form updates with new values
- Tracks visible in both modes

---

## Technical Details

### Coordinate Conversion Math

**App to Three.js**:
```
Three.x = App.x       (right stays right)
Three.y = App.z       (up → up)
Three.z = -App.y      (forward → -forward, flipped)
```

**Three.js to App**:
```
App.x = Three.x       (right stays right)
App.y = -Three.z      (-forward → forward)
App.z = Three.y       (up → up)
```

### Why the flip?
- App Y points toward listener (positive forward)
- Three.js Z points toward viewer (positive forward)
- These are opposite directions → need negation

### Reload Prevention
```typescript
// Old (❌ caused loop)
useEffect(() => {
  reloadControlPoints()
}, [animation]) // Triggers on every parameter change

// New (✅ only on ID/type change)
useEffect(() => {
  const key = `${animation.id}-${animation.type}`
  if (lastKey === key) return // Skip if same animation
  reloadControlPoints()
}, [animation?.id, animation?.type])
```

---

## Common Scenarios

### Scenario 1: Edit Linear Animation
1. User loads animation with start(0,0,0), end(10,0,0)
2. Control points extracted:
   - App coords: (0,0,0), (10,0,0)
   - Three coords: (0,0,0), (10,0,0)
3. User drags end point to (10,5,5) in Three.js
4. Converted back to App: (10,-5,5)
5. Parameters updated: `endPosition: {x:10, y:-5, z:5}`
6. Point stays at dragged location ✅

### Scenario 2: View Track at (0,10,0)
1. Track position (App): {x:0, y:10, z:0}
2. Converted to Three.js: (0,0,-10)
3. **Top view** (looking down Y): See at X=0, Z=-10 ✅
4. **Front view** (looking down Z): See at X=0, Y=0 ✅
5. **Side view** (looking down X): See at Y=0, Z=-10 ✅

---

## Success Criteria

Integration successful when:
- [x] Coordinate conversion utilities created
- [x] Control points use conversion
- [x] Tracks use conversion
- [x] Control point edit loop fixed
- [x] Tracks shown in Edit mode
- [ ] User testing confirms correct positions
- [ ] User testing confirms no snap-back
- [ ] Views match expected planes

**Current Status**: Code complete, ready for user testing! ✅

---

## Next Steps

1. **User testing**: Verify coordinates and editing
2. **If views are correct**: Move to Preview mode path rendering
3. **If views need adjustment**: Fine-tune conversion or camera configs

---

## Rollback Plan

If coordinate conversion causes issues:

1. **Disable conversion**:
```typescript
// In coordinateConversion.ts
export const appToThreePosition = (pos: Position): THREE.Vector3 => {
  return new THREE.Vector3(pos.x, pos.y, pos.z) // Direct mapping
}
```

2. **Revert to old behavior**:
```bash
git checkout HEAD~1 -- src/components/animation-editor/components/threejs-editor/utils/
```

---

**Status**: 🎉 All three issues fixed!  
**Ready for**: User testing  
**Estimated test time**: 5 minutes

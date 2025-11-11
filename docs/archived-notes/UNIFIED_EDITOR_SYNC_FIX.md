# Unified Editor Data Synchronization Fix

**Date**: November 9, 2024  
**Issue**: Control points and animation paths not displaying in unified editor

---

## Problems Identified

### 1. Control Points Not Extracted from Animation Parameters ❌

**File**: `useControlPointScene.ts` lines 169-215

**Current Code**:
```typescript
// Extract control points from animation
// TODO: Adapt to actual animation data structure
const animationPoints: THREE.Vector3[] = []

if (animation.controlPoints) {
  // V3 format (already 3D)
  animationPoints.push(...animation.controlPoints)
} else if (animation.keyframes) {
  // Extract from keyframes
  animation.keyframes.forEach((kf: any) => {
    animationPoints.push(
      new THREE.Vector3(
        kf.position?.x ?? 0,
        kf.position?.y ?? 0,
        kf.position?.z ?? 0
      )
    )
  })
}
```

**Problem**: 
- Animation interface doesn't have `controlPoints` field
- Not extracting from `animation.parameters` like old ControlPointEditor
- Old editor extracted: `startPosition`, `endPosition`, `bezierStart`, `bezierControl1`, `bezierControl2`, `bezierEnd`, `controlPoints` array

**Solution**: Extract control points from `animation.parameters` based on `animation.type`

---

### 2. Animation Paths Not Generated ❌

**File**: `UnifiedThreeJsEditor.tsx`

**Current Code**: No path generation

**Old AnimationPreview3D** (line 802):
```typescript
const animationPath = React.useMemo(() => {
  if (!previewAnimation) return []
  return generateAnimationPath(previewAnimation, 100)
}, [previewAnimation])
```

**Problem**: 
- Unified editor doesn't call `generateAnimationPath()` to create visualization paths
- Preview mode shows nothing because no paths are rendered

**Solution**: Add path generation in Preview mode using `generateAnimationPath()`

---

### 3. Coordinate System Mismatch (Possible) ⚠️

**Camera Configurations** (`CameraConfigs.ts`):
```typescript
top: {
  position: new THREE.Vector3(0, 20, 0),  // Looking down Y axis
  lookAt: new THREE.Vector3(0, 0, 0),
  up: new THREE.Vector3(0, 0, -1),        // Z forward
}
side: {
  position: new THREE.Vector3(20, 0, 0),  // Looking along X axis
  lookAt: new THREE.Vector3(0, 0, 0),
  up: new THREE.Vector3(0, 1, 0),         // Y up
}
front: {
  position: new THREE.Vector3(0, 0, 20),  // Looking along Z axis
  lookAt: new THREE.Vector3(0, 0, 0),
  up: new THREE.Vector3(0, 1, 0),         // Y up
}
```

**Old ControlPointEditor Plane Convention**:
- `XY plane`: horizontal=X, vertical=Y
- `XZ plane`: horizontal=X, vertical=Z (top view)
- `YZ plane`: horizontal=Y, vertical=Z (side view)

**Verification needed**: Check if camera views actually match plane conventions

---

## Implementation Plan

### Step 1: Fix Control Point Extraction ✅

Create helper function to extract control points from animation parameters:

```typescript
const extractControlPointsFromAnimation = (animation: Animation | null): THREE.Vector3[] => {
  if (!animation) return []
  
  const params = animation.parameters
  const points: THREE.Vector3[] = []
  
  switch (animation.type) {
    case 'linear':
      if (params.startPosition) {
        points.push(positionToVector3(params.startPosition))
      }
      if (params.endPosition) {
        points.push(positionToVector3(params.endPosition))
      }
      break
      
    case 'bezier':
      if (params.bezierStart) points.push(positionToVector3(params.bezierStart))
      if (params.bezierControl1) points.push(positionToVector3(params.bezierControl1))
      if (params.bezierControl2) points.push(positionToVector3(params.bezierControl2))
      if (params.bezierEnd) points.push(positionToVector3(params.bezierEnd))
      break
      
    case 'catmull-rom':
      if (params.controlPoints && Array.isArray(params.controlPoints)) {
        params.controlPoints.forEach(p => points.push(positionToVector3(p)))
      }
      break
      
    case 'custom':
      if (animation.keyframes) {
        animation.keyframes.forEach(kf => {
          if (kf.position) {
            points.push(positionToVector3(kf.position))
          }
        })
      }
      break
  }
  
  return points
}

const positionToVector3 = (pos: Position): THREE.Vector3 => {
  return new THREE.Vector3(pos.x, pos.y, pos.z)
}
```

### Step 2: Add Path Generation in Preview Mode ✅

```typescript
// In UnifiedThreeJsEditor
const animationPath = useMemo(() => {
  if (!animation || settings.editMode !== 'preview') return []
  return generateAnimationPath(animation, 100)
}, [animation, settings.editMode])

// Render path in scene
useEffect(() => {
  if (!sceneState.scene || animationPath.length < 2) return
  
  // Create path line
  const pathGeometry = new THREE.BufferGeometry().setFromPoints(
    animationPath.map(p => new THREE.Vector3(p.x, p.y, p.z))
  )
  
  const pathMaterial = new THREE.LineBasicMaterial({
    color: 0x4a9eff,
    linewidth: 2
  })
  
  const pathLine = new THREE.Line(pathGeometry, pathMaterial)
  sceneState.scene.add(pathLine)
  
  return () => {
    sceneState.scene?.remove(pathLine)
    pathGeometry.dispose()
    pathMaterial.dispose()
  }
}, [sceneState.scene, animationPath])
```

### Step 3: Add Track Visualization in Preview Mode ✅

```typescript
// Render track spheres with labels
useEffect(() => {
  if (!sceneState.scene || !selectedTracks || settings.editMode !== 'preview') return
  
  const trackGroup = new THREE.Group()
  trackGroup.name = 'tracks'
  
  selectedTracks.forEach((track, index) => {
    const pos = track.initialPosition || track.position
    if (!pos) return
    
    // Sphere
    const geometry = new THREE.SphereGeometry(0.3, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: track.color ? rgbaToHex(track.color) : 0x4a9eff
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(pos.x, pos.y, pos.z)
    trackGroup.add(sphere)
    
    // Label (using sprite or canvas texture)
    const label = createTextSprite(track.name || `Track ${index + 1}`)
    label.position.set(pos.x, pos.y + 0.5, pos.z)
    trackGroup.add(label)
  })
  
  sceneState.scene.add(trackGroup)
  
  return () => {
    sceneState.scene?.remove(trackGroup)
    trackGroup.clear()
  }
}, [sceneState.scene, selectedTracks, settings.editMode])
```

### Step 4: Verify Coordinate System ⚠️

Test that:
- Top view (Y axis down) shows XZ plane correctly
- Front view (Z axis forward) shows XY plane correctly  
- Side view (X axis right) shows YZ plane correctly

If views are swapped, adjust camera positions in `CameraConfigs.ts`.

---

## Files to Modify

1. ✅ `useControlPointScene.ts` - Add control point extraction
2. ✅ `UnifiedThreeJsEditor.tsx` - Add path generation and track visualization
3. ⚠️ `CameraConfigs.ts` - Verify/fix coordinate system mapping
4. ✅ Create `extractControlPoints.ts` utility

---

## Testing Checklist

After fix:
- [ ] Load linear animation → See 2 control points (start/end)
- [ ] Load bezier animation → See 4 control points
- [ ] Load catmull-rom animation → See all control points
- [ ] Switch to Preview mode → See animation path
- [ ] Switch to Edit mode → See control points with gizmo
- [ ] Verify top view shows correct plane (XZ)
- [ ] Verify side view shows correct plane (YZ)
- [ ] Verify front view shows correct plane (XY)

---

## Root Cause Summary

**Why it failed**:
1. Demo code had TODO placeholder for control point extraction
2. No integration with existing `generateAnimationPath()` utility
3. Missing track visualization in preview mode
4. The unified editor was developed as standalone demo, not integrated with app's data flow

**What was missing**:
- Connection to Animation.parameters
- Connection to pathGeneration utilities
- Connection to track positions
- Proper mode switching between preview (paths) and edit (control points)

---

## Success Criteria

Integration successful when:
1. ✅ Control points appear in Edit mode
2. ✅ Animation paths appear in Preview mode
3. ✅ Tracks display as spheres with labels
4. ✅ Gizmo works on control points
5. ✅ Changes update animation.parameters
6. ✅ Views match old editor conventions

**Expected behavior**: Unified editor displays same data as old AnimationPreview3D + ControlPointEditor

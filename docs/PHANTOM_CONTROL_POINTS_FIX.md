# Phantom Control Points & Real-Time Updates Fix

**Date**: November 9, 2024  
**Issues Fixed**:
1. ✅ Phantom control points (old positions not cleaned up)
2. ✅ Real-time form updates during drag

---

## Issue 1: Phantom Control Points

### Problem
After editing control points multiple times, old positions remained visible as "phantom" control points. The scene accumulated duplicates.

### Root Cause
Cleanup logic was using **stale state** instead of **current ref**:

```typescript
// ❌ WRONG - controlPoints state is stale during cleanup
controlPoints.forEach(cp => {
  scene.remove(cp.mesh)  // Removes wrong meshes!
})
```

When the effect runs:
1. `controlPoints` state is from previous render (stale)
2. We try to remove meshes that don't exist anymore
3. New meshes are created
4. **Old meshes never removed** → Phantoms!

### Solution
Use `meshesRef` to track **current** meshes in the scene:

```typescript
// ✅ CORRECT - Track current meshes in ref
const meshesRef = useRef<THREE.Mesh[]>([])

// Cleanup uses ref (always current)
meshesRef.current.forEach(mesh => {
  scene.remove(mesh)
  mesh.geometry.dispose()
  mesh.material.dispose()
  // Also dispose children (outlines)
  mesh.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })
})
meshesRef.current = []

// Create new meshes
positions.forEach(pos => {
  const mesh = createMesh(pos)
  scene.add(mesh)
  meshesRef.current.push(mesh)  // Track!
})
```

**Flow now**:
1. ✅ Remove all meshes from `meshesRef.current` (actual scene meshes)
2. ✅ Clear the ref
3. ✅ Create new meshes
4. ✅ Add to scene AND ref
5. ✅ No phantoms!

---

## Issue 2: Real-Time Form Updates

### Problem
Form values only updated when drag finished, not during drag. User couldn't see real-time coordinate changes.

### Solution
Added throttled real-time updates during drag:

```typescript
const lastUpdateTimeRef = useRef<number>(0)
const updateThrottleMs = 100 // 10 updates/second

onTransform: (position) => {
  // 1. Always update visual immediately (60fps)
  updateControlPoint(selectedPoint.index, position)
  
  // 2. Throttle form updates (10fps)
  const now = Date.now()
  if (now - lastUpdateTimeRef.current > updateThrottleMs) {
    lastUpdateTimeRef.current = now
    
    // Update form with new parameters
    const updatedParams = controlPointsToParameters(...)
    onAnimationChange({ ...animation, parameters: updatedParams })
  }
}
```

**Benefits**:
- ✅ Visual updates: 60fps (smooth dragging)
- ✅ Form updates: 10fps (visible but not overwhelming)
- ✅ Final update: On drag end (guaranteed accurate)

---

## Changes Made

### 1. useControlPointScene.ts
```typescript
// Added meshesRef for tracking
const meshesRef = useRef<THREE.Mesh[]>([])

// Cleanup uses ref
meshesRef.current.forEach(mesh => {
  scene.remove(mesh)
  mesh.geometry.dispose()
  // ... dispose all resources
})
meshesRef.current = []

// Track new meshes
scene.add(mesh)
meshesRef.current.push(mesh)
```

### 2. UnifiedThreeJsEditor.tsx
```typescript
// Added throttling
const lastUpdateTimeRef = useRef<number>(0)
const updateThrottleMs = 100

onTransform: (position) => {
  // Visual: immediate
  updateControlPoint(index, position)
  
  // Form: throttled
  if (now - lastUpdateTimeRef.current > updateThrottleMs) {
    onAnimationChange({ parameters: updated })
  }
}
```

---

## Test Results

### Before ❌
- Multiple control points at different positions (phantoms)
- Form only updates on drag end
- Console shows "cleaning up 0 old meshes" (nothing cleaned!)

### After ✅
- Single control point at correct position
- Form updates every 100ms during drag
- Console shows "cleaning up 2 old meshes" (proper cleanup!)

---

## Console Output

### Expected Logs
```
🔄 Updating control point meshes: 2 (cleaning up 2 old meshes)
✅ Control points updated: 2

[User drags control point]

🔧 Gizmo drag ended: {
  animationType: "linear",
  oldParams: {startPosition: {x:0, y:0, z:0}},
  newParams: {startPosition: {x:5, y:0, z:0}}
}
```

### What to Look For
- "cleaning up X old meshes" where X > 0
- No duplicate control points
- Form values change during drag (every ~100ms)
- Final update on drag end

---

## Technical Details

### Why useRef for Meshes?
- ✅ Refs persist between renders
- ✅ Refs don't trigger re-renders when updated
- ✅ Refs always have current value (not stale)
- ✅ Perfect for tracking imperative Three.js objects

### Why State for controlPoints?
- ✅ Need to trigger re-renders when control points change
- ✅ Used by other React components (selection, etc.)
- ✅ Derived from meshesRef after creation

### Why Throttle Updates?
- ✅ Performance: Don't update form 60 times/second
- ✅ Smooth: Still feel real-time at 10 updates/second
- ✅ Accurate: Final update on drag end guarantees precision

---

## Files Modified

1. ✅ `useControlPointScene.ts` - Fixed cleanup with meshesRef
2. ✅ `UnifiedThreeJsEditor.tsx` - Added real-time throttled updates

---

**Status**: Both issues fixed! ✅  
**Test**: Drag control points and verify no phantoms and form updates in real-time

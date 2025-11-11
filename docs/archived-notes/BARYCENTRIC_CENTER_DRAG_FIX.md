# Barycentric Center Drag Reset Fix

## Problem
When dragging the barycentric center in the 3D view:
1. ❌ It visually returned to its initial position after drag
2. ❌ Form values didn't update during the drag

## Root Cause
The `useBarycentricControl` hook was **always** updating the center marker position from state in its `useEffect`:

```typescript
// This ran EVERY TIME barycentricCenter changed
useEffect(() => {
  // ...
  const threePos = appToThreePosition(center)
  centerMarkerRef.current.position.copy(threePos)  // ← RESET!
  // ...
}, [scene, getCenterPosition, isEditable, barycentricVariant])
```

### The Problematic Flow:
```
User drags center
  ↓
onTransform updates centerMarker.position (visual feedback)
  ↓
onTransform calls onBarycentricCenterChange (updates state)
  ↓
State change triggers useBarycentricControl useEffect
  ↓
useEffect recalculates position from NEW state
  ↓
Copies position to centerMarker ← OVERWRITES drag position!
  ↓
Visual jump/reset occurs
```

## Solution
**Skip position update during drag** - same pattern as control points:

### 1. **Add `isDragging` Prop**
```typescript
interface UseBarycentricControlProps {
  // ... existing props
  isDragging?: boolean  // NEW
  onCenterChange?: (center: Position) => void
}
```

### 2. **Skip Update When Dragging**
```typescript
// Update position (but NOT during drag to prevent reset)
if (!isDragging) {
  const threePos = appToThreePosition(center)
  centerMarkerRef.current.position.copy(threePos)
  console.log('🎯 Updated barycentric center position from state')
} else {
  console.log('⏸️ Skipping position update (dragging in progress)')
}
```

### 3. **Pass Dragging State from Parent**
```typescript
const { centerMarker, isEditable: isCenterEditable } = useBarycentricControl({
  // ... existing props
  isDragging: isGizmoDragging && currentSelectedIndex === -1, // Only when dragging center
  onCenterChange: onBarycentricCenterChange,
})
```

## The Fixed Flow

```
User drags center
  ↓
onTransformStart sets isGizmoDragging = true
  ↓
onTransform updates centerMarker.position (immediate visual)
  ↓
onTransform calls onBarycentricCenterChange (updates state)
  ↓
State change triggers useBarycentricControl useEffect
  ↓
useEffect checks: isDragging? YES
  ↓
Skips position update ← NO RESET!
  ↓
Smooth drag continues
  ↓
onTransformEnd sets isGizmoDragging = false
  ↓
Final state update
  ↓
useEffect runs, isDragging = false
  ↓
Position syncs (already correct)
```

## Changes Made

### **File: `useBarycentricControl.ts`**

1. **Added `isDragging` prop:**
   ```typescript
   isDragging?: boolean
   ```

2. **Conditional position update:**
   ```typescript
   if (!isDragging) {
     centerMarkerRef.current.position.copy(threePos)
   }
   ```

3. **Updated dependencies:**
   ```typescript
   }, [scene, getCenterPosition, isEditable, barycentricVariant, isDragging])
   ```

### **File: `UnifiedThreeJsEditor.tsx`**

1. **Pass dragging state:**
   ```typescript
   isDragging: isGizmoDragging && currentSelectedIndex === -1
   ```

## Benefits

1. ✅ **Smooth dragging:** No visual jumps or resets
2. ✅ **Real-time updates:** Form values update during drag (throttled)
3. ✅ **Consistent pattern:** Same as control points mechanism
4. ✅ **Final accuracy:** Position syncs correctly when drag ends

## Testing

1. ✅ Select "custom" variant
2. ✅ Click barycentric center (green sphere)
3. ✅ Drag with gizmo → Smooth movement
4. ✅ Watch form panel → Values update in real-time
5. ✅ Release → Stays at dragged position
6. ✅ No jumps, no resets!

## Technical Details

### Throttling:
```typescript
const updateThrottleMs = 100 // Update form every 100ms

onTransform: (position) => {
  if (currentSelectedIndex === -1) {
    centerMarker.position.copy(position) // Visual: immediate
    
    const now = Date.now()
    if (now - lastUpdateTimeRef.current > updateThrottleMs) {
      onBarycentricCenterChange(position) // Form: throttled
    }
  }
}
```

### Why This Works:
- **Visual update:** Always immediate (no throttle)
- **State update:** Throttled for performance
- **Position skip:** Prevents state → visual feedback loop
- **Final sync:** Happens naturally when drag ends

## Comparison with Control Points

Both now use the **exact same pattern:**

| Feature | Control Points | Barycentric Center |
|---------|---------------|-------------------|
| isDragging flag | ✅ | ✅ |
| Skip update during drag | ✅ | ✅ |
| TransformControls | ✅ | ✅ |
| Throttled updates | ✅ | ✅ |
| Update in place | ✅ | ✅ |

**The entire editing system is now unified and consistent!** 🎯

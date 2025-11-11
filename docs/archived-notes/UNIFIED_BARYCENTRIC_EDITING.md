# Unified Barycentric Center Editing

## Problem
The barycentric center was using custom mouse event handlers while control points used `TransformControls`, causing conflicts where the barycentric center couldn't be dragged properly.

## Solution
**Unified both mechanisms to use the same `TransformControls` system.**

### Changes Made

#### 1. **Modified `useBarycentricControl.ts`**
- Removed custom `mousedown`, `mousemove`, `mouseup` event handlers
- Exposed `centerMarker` object so `TransformControls` can attach to it
- Returns: `{ centerPosition, isEditable, centerMarker }`

#### 2. **Updated `UnifiedThreeJsEditor.tsx`**

**Selection System:**
- Extended to handle barycentric center selection
- `selectedIndex === -1` indicates barycentric center is selected
- `selectedIndex >= 0` indicates control point is selected
- `selectedIndex === null` indicates nothing is selected

**Click Handler:**
```typescript
// Check barycentric center first
if (centerMarker && isCenterEditable) {
  const intersects = raycaster.intersectObject(centerMarker, true)
  if (intersects.length > 0) {
    selectControlPoint(-1) // Special index for center
    return
  }
}

// Then check control points
// ... existing logic
```

**TransformControls Attachment:**
```typescript
if (currentSelectedIndex === -1 && centerMarker && isCenterEditable) {
  // Attach to barycentric center sphere
  const sphereMesh = centerMarker.children.find(child => child instanceof THREE.Mesh)
  transformControls.attach(sphereMesh)
} else if (currentSelectedIndex >= 0) {
  // Attach to control point
  transformControls.attach(controlPoints[currentSelectedIndex].mesh)
}
```

**Transform Callbacks:**
```typescript
onTransform: (position) => {
  if (currentSelectedIndex === -1 && centerMarker) {
    // Handle barycentric center drag
    centerMarker.position.copy(position)
    onBarycentricCenterChange?.(threeToAppPosition(position))
  } else {
    // Handle control point drag
    // ... existing logic
  }
}
```

#### 3. **Type Updates**
- Added `selectedIndex: number | null` to `ControlPointSceneState` interface
- Exported `selectedIndex` from `useControlPointScene` hook

## Architecture

```
User clicks barycentric center
  ↓
selectControlPoint(-1)
  ↓
TransformControls attaches to center sphere
  ↓
User drags with gizmo
  ↓
onTransform detects index === -1
  ↓
Updates centerMarker.position
  ↓
Calls onBarycentricCenterChange
  ↓
Form updates with new center position
```

## Benefits

1. **✅ Consistent UX:** Same interaction for both center and control points
2. **✅ No Conflicts:** Single event handler system (TransformControls)
3. **✅ Visual Feedback:** Same gizmo for all draggable elements
4. **✅ Keyboard Support:** All TransformControls features work (snapping, etc.)
5. **✅ Maintainable:** Single code path for all editing

## Testing

1. Select "custom", "centered", or "shared" barycentric variant
2. In Edit mode, click on the barycentric center (green sphere with cross)
3. Drag using the Transform gizmo
4. Verify the center position updates in the form
5. Verify control points can still be selected and dragged
6. Press ESC to deselect

## Special Index Values

- `-1`: Barycentric center selected
- `0..N`: Control point N selected  
- `null`: Nothing selected

# Path Coordinate System Fix

**Date**: November 9, 2024  
**Issue**: Paths displayed with wrong orientation (same issue as tracks had)

---

## Problem

Paths were generated with incorrect orientation because plane parameters are in **app coordinate space** (Z-up), but paths were being generated directly in **Three.js coordinate space** (Y-up).

### Example
```
Animation: Circular on XY plane
App space (Z-up):    XY = horizontal plane, Z is vertical
Three.js (Y-up):     XY = vertical plane, Y is vertical
Result: Circle displayed vertically instead of horizontally! ❌
```

---

## Root Cause

### Coordinate Systems

**App Coordinate System** (Spatial Audio - Z-up):
- X: Right
- Y: Forward (toward listener)
- Z: Up (vertical)

**Three.js Coordinate System** (Graphics - Y-up):
- X: Right
- Y: Up (vertical)
- Z: Forward (toward viewer)

### Conversion
- App → Three.js: `(x, y, z) → (x, z, -y)`
- Three.js → App: `(x, y, z) → (x, -z, y)`

### The Bug
Control points were already converted correctly, but when generating intermediate path points, the code assumed Three.js coordinate space:

```typescript
// ❌ WRONG - Assumes plane='xy' is Three.js XY plane
if (plane === 'xy') {
  point.x = center.x + cos(angle) * radius
  point.y = center.y + sin(angle) * radius  // Wrong! Y is vertical in Three.js
  point.z = center.z
}
```

**Problem**: `plane='xy'` refers to **app space** (horizontal), but code generated in Three.js XY (vertical)!

---

## Solution

### Plane Mapping

Map app planes to Three.js planes:

| App Plane | App Meaning | Three.js Plane | Three.js Meaning |
|-----------|-------------|----------------|------------------|
| **XY** | Horizontal (Z up) | **XZ** | Horizontal (Y up) |
| **XZ** | Vertical front | **XY** | Vertical front |
| **YZ** | Vertical side | **YZ** | Vertical side (same) |

### Fixed Code

```typescript
const plane = params.plane || 'xy' // In APP coordinate space

// Map app plane to Three.js plane
if (plane === 'xy') {
  // App XY (horizontal, Z up) → Three XZ (horizontal, Y up)
  point.x = center.x + Math.cos(angle) * radius
  point.y = center.y  // Y stays constant (up)
  point.z = center.z + Math.sin(angle) * radius
} else if (plane === 'xz') {
  // App XZ (vertical front, Y forward) → Three XY (vertical front, Z forward)
  point.x = center.x + Math.cos(angle) * radius
  point.y = center.y + Math.sin(angle) * radius  // Y varies (up/down)
  point.z = center.z  // Z stays constant (depth)
} else if (plane === 'yz') {
  // App YZ (vertical side, X right) → Three YZ (same orientation)
  point.x = center.x  // X stays constant (side)
  point.y = center.y + Math.cos(angle) * radius
  point.z = center.z + Math.sin(angle) * radius
}
```

---

## Affected Animation Types

### ✅ Fixed
- **Circular**: Now displays on correct plane
- **Orbit**: Correct orbital plane
- **Circular-Scan**: Correct scan plane
- **Spiral**: Correct spiral plane
- **Rose-Curve**: Correct plane for flower pattern
- **Epicycloid**: Correct rolling circle plane

### ✅ Already Correct
- **Linear, Zigzag, Doppler**: No planes (point-to-point)
- **Bezier, Catmull-Rom**: No planes (curve through points)
- **Helix**: Uses axis points (different approach)
- **Elliptical**: No plane parameter (uses radiusX/Y/Z)
- **Wave, Lissajous**: Amplitudes in X/Y/Z (different approach)
- **Pendulum**: Hardcoded plane (2D swing)

---

## Visual Results

### Before ❌

**Circular on XY plane**:
```
App: "horizontal circle"
Visual: Vertical circle (wrong!)
```

**Spiral on XZ plane**:
```
App: "vertical spiral going forward"
Visual: Spiral in wrong orientation
```

### After ✅

**Circular on XY plane**:
```
App: "horizontal circle"
Visual: Horizontal circle (correct!)
```

**Spiral on XZ plane**:
```
App: "vertical spiral"
Visual: Vertical spiral (correct!)
```

---

## Testing

### Test Circular XY (Default)
1. Create circular animation
2. Default plane = 'xy' (horizontal in app)
3. **Expected**: Circle displayed horizontally (like a floor)
4. **Check**: Circle should be in XZ plane in Three.js view

### Test Circular XZ
1. Change plane to 'xz'
2. **Expected**: Circle displayed vertically (like a wall facing forward)
3. **Check**: Circle should be in XY plane in Three.js view

### Test Spiral XY
1. Create spiral animation
2. Default plane = 'xy' (horizontal)
3. **Expected**: Spiral expanding horizontally (like on a table)
4. **Check**: Spiral should be in XZ plane in Three.js view

### Test Rose-Curve YZ
1. Create rose-curve, set plane to 'yz'
2. **Expected**: Flower pattern on vertical side plane
3. **Check**: Pattern should be in YZ plane in Three.js view

---

## Console Output

No changes to console output. Paths still generate the same number of points, just with correct orientation:

```
✅ Path generated: 65 points for type: circular
✅ Path generated: 101 points for type: spiral
✅ Path generated: 201 points for type: rose-curve
```

---

## Code Changes

### Files Modified

1. ✅ `generateAnimationPath.ts`
   - Fixed circular/orbit/circular-scan plane mapping
   - Fixed spiral plane mapping
   - Fixed rose-curve/epicycloid plane mapping
   - Added comments explaining coordinate space conversions

### Lines Changed
- **Circular** (lines 50-91): Added plane coordinate mapping
- **Spiral** (lines 111-148): Added plane coordinate mapping
- **Rose-curve/Epicycloid** (lines 228-266): Added plane coordinate mapping

---

## Technical Details

### Why YZ Plane Stays the Same?

**App YZ plane**:
- Y: Forward
- Z: Up
- (X constant = side plane)

**After conversion to Three.js**:
- App Y → Three -Z
- App Z → Three Y
- But we're generating in a 2D plane, so the relative orientation stays YZ in Three.js too!

The key insight: When generating in a plane, we're not converting individual axes, we're mapping which 2D plane in app space corresponds to which 2D plane in Three.js space.

---

## Related Issues

This is the same coordinate system issue that was fixed for:
- ✅ Track visualization (fixed earlier)
- ✅ Control point extraction (uses `appToThreePosition`)
- ✅ Path generation (fixed now!)

**All visual elements now use consistent coordinate conversion!** ✅

---

## Future Considerations

If adding new animation types with plane parameters:
1. ✅ Always check if `plane` refers to app or Three.js space
2. ✅ Apply plane mapping when generating paths
3. ✅ Test all three planes (XY, XZ, YZ)
4. ✅ Document the coordinate space in comments

---

**Status**: Paths now display with correct orientation! ✅  
**Test**: Create circular, spiral, rose-curve with different planes

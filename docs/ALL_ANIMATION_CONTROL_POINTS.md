# Control Points for All Animation Types

**Date**: November 9, 2024  
**Status**: ✅ Complete support for all 24 animation types

---

## Overview

Different animation types have different control points based on their mathematical model. The visual editor now extracts and displays the appropriate control points for each animation type.

---

## Animation Types & Their Control Points

### **Path-Based Animations** (2 Points)

#### Linear
- **Point 1**: Start position (`startPosition`)
- **Point 2**: End position (`endPosition`)
- **Usage**: Defines straight line path

#### Zigzag, Doppler
- **Point 1**: Start (`start`)
- **Point 2**: End (`end`)
- **Usage**: Start and end of path

---

### **Bezier Curves** (4 Points)

#### Bezier
- **Point 1**: Start (`bezierStart`)
- **Point 2**: Control point 1 (`bezierControl1`)
- **Point 3**: Control point 2 (`bezierControl2`)
- **Point 4**: End (`bezierEnd`)
- **Usage**: Cubic Bezier curve control points

---

### **Splines** (N Points)

#### Catmull-Rom
- **Points**: Array of control points (`controlPoints[]`)
- **Usage**: Smooth curve through all points
- **Editable**: Add/remove points, drag to reshape

---

### **Center-Based Animations** (1 Point)

#### Circular
- **Point**: Center (`center`)
- **Usage**: Center of circular motion
- **Other params**: radius, angles (not editable as control points)

#### Spiral
- **Point**: Center (`center`)
- **Usage**: Center of spiral
- **Other params**: startRadius, endRadius, rotations

#### Wave
- **Point**: Center (`center`)
- **Usage**: Center of oscillation
- **Other params**: amplitudes, frequency

#### Lissajous
- **Point**: Center (`center`)
- **Usage**: Center of Lissajous figure
- **Other params**: frequency ratios, amplitudes

#### Orbit
- **Point**: Center (`center`)
- **Usage**: Center of orbit
- **Other params**: radius, inclination

#### Rose Curve
- **Point**: Center (`center`)
- **Usage**: Center of rose pattern
- **Other params**: radius, petal count

#### Epicycloid
- **Point**: Center (`center`)
- **Usage**: Center of rolling circle motion
- **Other params**: radii, speed

#### Circular Scan
- **Point**: Center (`center`)
- **Usage**: Center of scan
- **Other params**: radius, height

#### Zoom
- **Point**: Center (`center`)
- **Usage**: Center of zoom (target point)
- **Other params**: distances

---

### **Elliptical** (1 Point - Special Format)

#### Elliptical
- **Point**: Center (from `centerX`, `centerY`, `centerZ`)
- **Usage**: Center of ellipse
- **Note**: Uses separate X/Y/Z instead of Position object
- **Other params**: radiusX, radiusY, radiusZ

---

### **Physics-Based** (1 Point)

#### Pendulum
- **Point**: Anchor point (`anchorPoint`)
- **Usage**: Point where pendulum hangs from
- **Other params**: length, angle, damping

#### Spring
- **Point**: Rest position (`restPosition`)
- **Usage**: Equilibrium point of spring
- **Other params**: stiffness, damping, displacement

#### Attract/Repel
- **Point**: Target (`target`)
- **Usage**: Center of attraction/repulsion
- **Other params**: strength, radius, max speed

---

### **Helix** (2 Points)

#### Helix
- **Point 1**: Axis start (`axisStart`)
- **Point 2**: Axis end (`axisEnd`)
- **Usage**: Defines axis of helix
- **Other params**: radius, rotations

---

### **Special Cases**

#### Custom
- **Points**: From keyframes array
- **Usage**: Each keyframe's position is a control point
- **Note**: Timeline-based, complex editing

#### Bounce, Perlin Noise, Random, Formation
- **No control points**: These animations don't have editable spatial control points
- **Bounce**: Vertical motion only (ground level, height)
- **Perlin Noise**: Procedural noise (no fixed points)
- **Random**: Random within bounds (no fixed points)
- **Formation**: Uses track relative positions

---

## Control Point Visualization

### **Colors**
- 🟢 **Green**: Start/First point
- 🔵 **Blue**: Middle/Regular points
- 🟡 **Yellow**: Selected point

### **Gizmo**
- Only appears when point is selected
- Drag arrows to move point
- Updates form in real-time (throttled to 100ms)

---

## Editing Flow

### 1. Extract Control Points
```typescript
extractControlPointsFromAnimation(animation)
// Returns: THREE.Vector3[] based on animation type
```

### 2. Display as Spheres
- Create sphere mesh for each point
- Add to scene
- Connect with curve line

### 3. User Drags Point
- Gizmo moves sphere
- Visual updates immediately (60fps)
- Form updates throttled (10fps)

### 4. Convert Back to Parameters
```typescript
controlPointsToParameters(animationType, points, originalParams)
// Updates: center, startPosition, anchorPoint, etc.
```

---

## Implementation Details

### **Coordinate Conversion**
All control points use coordinate conversion:
- **App**: Z-up (spatial audio standard)
- **Three.js**: Y-up (graphics standard)
- **Conversion**: Automatic via `appToThreePosition()` / `threeToAppPosition()`

### **Parameter Mapping**
Each animation type maps to specific parameter names:
```typescript
case 'circular':
  params.center → control point
  
case 'elliptical':
  {centerX, centerY, centerZ} → control point
  
case 'pendulum':
  params.anchorPoint → control point
```

### **Bidirectional Sync**
- **Extract**: Animation params → Control points → Meshes
- **Update**: Mesh drag → Control points → Animation params → Form

---

## Testing Each Type

### Test Circular:
1. Create circular animation
2. Expected: 1 green sphere at center
3. Drag sphere: center point moves, radius stays

### Test Linear:
1. Create linear animation
2. Expected: 2 spheres (green start, blue end)
3. Drag spheres: start/end positions update

### Test Bezier:
1. Create bezier animation
2. Expected: 4 spheres forming curve
3. Drag spheres: curve shape changes

### Test Helix:
1. Create helix animation
2. Expected: 2 spheres (axis start/end)
3. Drag spheres: helix axis rotates/moves

---

## Console Output

When switching animation types:
```
🔍 Extracting control points: {
  type: "circular",
  hasParameters: true
}
✅ Extracted control points: {
  count: 1,
  points: [{x: "0.00", y: "0.00", z: "0.00"}]
}
🔄 Updating control point meshes: 1 (cleaning up 2 old meshes)
```

---

## Files Modified

1. ✅ `extractControlPoints.ts` - All animation types supported
   - Extract: 24 animation types
   - Convert back: 24 animation types
   - Bidirectional sync complete

---

## Coverage

- ✅ **24/24 animation types supported**
- ✅ Linear, Bezier, Catmull-Rom
- ✅ Circular, Spiral, Elliptical
- ✅ Wave, Lissajous, Orbit
- ✅ Pendulum, Spring, Attract/Repel
- ✅ Helix, Zigzag, Doppler
- ✅ Rose Curve, Epicycloid, Circular Scan, Zoom
- ✅ Custom (keyframe-based)
- ⚠️ Bounce, Perlin, Random, Formation (no spatial control points)

---

**Status**: Complete! All animation types have appropriate control point support ✅

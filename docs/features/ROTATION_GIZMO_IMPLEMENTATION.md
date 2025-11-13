# Rotation Gizmo Implementation

## Overview
Implement generic 3D rotation support for animation models using the existing TransformControls gizmo system. This replaces discrete `plane` parameters with continuous `rotation` parameters for more flexible path orientation.

## Design Philosophy
- **Model-agnostic**: Rotation is applied generically by the visualization system
- **Opt-in**: Models declare rotation support via metadata
- **Clean architecture**: No hardcoded logic, uses parameter type system
- **Backward incompatible**: Replaces `plane` parameter with `rotation` (acceptable for single user)

## Implementation Status

### ✅ Phase 1: Foundation (COMPLETED)

**Type System** (`src/models/types.ts`)
- [x] Add `Rotation` interface `{ x, y, z }` (Euler angles in degrees)
- [x] Add `'rotation'` to `ParameterType` union
- [x] Add `'rotation3d'` to `uiComponent` options
- [x] Add `enabledModes?: ('translate' | 'rotate' | 'scale')[]` to control point metadata

**Utilities** (`src/utils/pathTransforms.ts`)
- [x] `applyRotationToPath()` - Generic rotation transform using Three.js rotation matrices
- [x] `planeToRotation()` - Helper for migration (converts plane enum to rotation angles)
- [x] `rotationToPlane()` - Helper for snapping to canonical planes

**Visualization Integration** (`src/components/.../utils/generateAnimationPath.ts`)
- [x] Import rotation utilities
- [x] Detect `rotation` parameter
- [x] Apply `applyRotationToPath()` generically after path generation
- [x] Use first control point as rotation center

### ✅ Phase 2: Model Update Example (COMPLETED - Circular)

**Circular Motion** (`src/models/builtin/circular.ts`)
- [x] Replace `plane: enum` with `rotation: rotation` parameter
- [x] Update `generatePath()` to always generate in XY plane
- [x] Update `calculate()` to apply rotation transform
- [x] Add `enabledModes: ['translate', 'rotate']` to center control point
- [x] Update `getDefaultParameters()` with rotation default
- [x] Update `cacheKey` to include rotation
- [x] Bump version to 3.0.0

### ⏳ Phase 3: Remaining Model Updates (TODO)

Models requiring update (7 remaining):

**High Priority** (have `plane` parameter):
- [ ] `elliptical.ts` - Ellipse motion
- [ ] `pendulum.ts` - Pendulum swing
- [ ] `spiral.ts` - Spiral motion
- [ ] `roseCurve.ts` - Rose pattern
- [ ] `epicycloid.ts` - Gear-like pattern
- [ ] `oscillatorPath.ts` - Oscillation along path
- [ ] `oscillatorStationary.ts` - Stationary oscillation

**Pattern for updates**:
1. Replace `plane: { type: 'enum', ... }` with `rotation: { type: 'rotation', default: {x:0,y:0,z:0}, uiComponent: 'rotation3d' }`
2. Update `generatePath()` to generate in canonical plane (usually XY)
3. Update `calculate()` to use `applyRotationToPath()`
4. Add `enabledModes: ['translate', 'rotate']` to relevant control points
5. Update version number
6. Update `cacheKey` and defaults

### ✅ Phase 4: UI/Gizmo Integration (COMPLETED)

**Transform Controls Updates** (`src/components/.../UnifiedThreeJsEditor.tsx`)
- [x] Read `enabledModes` from selected control point metadata
- [x] Enable/disable rotation mode based on control point capabilities
- [x] Pass rotation changes back to parameter updates
- [x] Transform mode state with translate/rotate toggle
- [x] Auto-reset to translate mode when rotation not supported

**UI Button Controls** 
- [x] **Move icon button** - Switch to translate mode
- [x] **RotateCw icon button** - Switch to rotate mode
- [x] Buttons only visible when:
  - Edit mode is active
  - Selected control point has `enabledModes: ['translate', 'rotate']`
- [x] Active mode highlighted in blue
- [x] Located in toolbar between control point actions and settings
- [x] Tooltips: "Translate mode (G)" and "Rotate mode"

**Note on Keyboard Shortcuts:**
- 'R' key already used for camera side plane view
- UI buttons preferred over keyboard shortcuts to avoid conflicts
- 'G' key could still be mapped to translate mode in future

**Parameter Panel** (`src/components/.../ModelParametersForm.tsx`)
- [x] UI component for `rotation3d` parameter type
- [x] Three number inputs for Pitch (X°), Yaw (Y°), Roll (Z°)
- [x] Min/max: -180 to 180 degrees, step: 15
- [x] Validation for rotation parameter type

**Rotation Handling**
- [x] onTransform callback receives position AND rotation (THREE.Euler)
- [x] Converts radians to degrees when updating rotation parameter
- [x] Only updates rotation when in rotate mode and parameter exists
- [x] Console logging for debugging transform mode changes

### 🔄 Phase 5: Testing & Documentation (TODO)

- [ ] Test rotation with all updated models
- [ ] Verify rotation parameter serialization/deserialization
- [ ] Test keyboard shortcuts
- [ ] Document new parameter type in model creation guide
- [ ] Add rotation examples to documentation

## Technical Details

### Rotation Application Order

1. **Path Generation** (`generatePath`):
   ```typescript
   // Model generates path in canonical orientation (e.g., XY plane)
   const points = generateCircleInXY(center, radius)
   
   // Visualization system applies rotation generically
   if (params.rotation) {
     points = applyRotationToPath(points, center, params.rotation)
   }
   ```

2. **Playback Calculation** (`calculate`):
   ```typescript
   // Model calculates position in canonical orientation
   const basePos = { x: center.x + cos(angle)*r, y: center.y + sin(angle)*r, z: center.z }
   
   // Apply rotation if specified
   if (rotation.x || rotation.y || rotation.z) {
     return applyRotationToPath([basePos], center, rotation)[0]
   }
   ```

### Rotation Parameter Format

```typescript
rotation: {
  type: 'rotation',
  default: { x: 0, y: 0, z: 0 },  // Euler angles in degrees
  label: 'Rotation',
  description: 'Rotate the path in 3D space',
  group: 'Orientation',
  uiComponent: 'rotation3d'
}
```

### Control Point Metadata

```typescript
controlPoints: [
  {
    parameter: 'center',
    type: 'center',
    enabledModes: ['translate', 'rotate']  // Declares gizmo support
  }
]
```

## Migration Notes

### Breaking Changes
- `plane` parameter removed from 8 models
- Existing animations using these models will need parameter migration
- Since only one user exists, no migration script needed

### Backward Compatibility Helpers
- `planeToRotation()` - Convert old plane values to rotation angles
- `rotationToPlane()` - Snap rotation to nearest canonical plane

## Future Enhancements

- [ ] Scale mode support for relevant models
- [ ] Compound transformations (rotate + scale)
- [ ] Rotation presets (quick buttons for common orientations)
- [ ] Visual rotation guides in 3D editor
- [ ] Rotation animation (rotate the path over time)

## Decision Log

**Why Option B (replace plane with rotation)?**
- Cleaner architecture
- No legacy parameters
- More flexible (arbitrary angles, not just 3 planes)
- Single user = no backward compatibility needed

**Why generic rotation in visualization system?**
- DRY principle - rotation logic written once
- Model-agnostic - works for any model
- Easier to maintain and test
- Models stay focused on path generation logic

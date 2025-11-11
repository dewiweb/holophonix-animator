# Multi-Track Animation Architecture (2-Mode System)

**Version:** 3.0  
**Date:** November 2025  
**Status:** ✅ Implemented

## Overview

The multi-track animation system has been refactored to a **2-mode architecture** with barycentric variants. This simplifies the previous 6-mode system while providing more flexibility and clearer semantics.

## Core Principles

Your insight was correct: **identical mode is actually a variant of barycentric mode** with zero offsets. This led to the realization that we only need 2 base modes:

1. **Relative Mode**: Each track is independent, parameters are relative to track position
2. **Barycentric Mode**: Formation/group movement around a center (barycenter)

## Architecture

### Base Modes

#### 1. Relative Mode
```typescript
multiTrackMode: 'relative'
```

- Each track has **independent parameters** 
- Parameters are **offset by track position**
- Ideal for: individual movements, position-relative animations
- Example: Each track circles around its own position

#### 2. Barycentric Mode
```typescript
multiTrackMode: 'barycentric'
barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
preserveOffsets?: boolean  // default: variant-dependent
```

- Tracks move as a **formation/group**
- Movement is relative to a **center point** (barycenter)
- Supports multiple variants for different center calculation methods

### Barycentric Variants

#### `shared` (replaces old 'identical'/'centered')
- All tracks use **same absolute coordinates**
- Center is the animation's defined center
- `preserveOffsets: false` (tracks converge to same point)
- Use case: All tracks perform identical motion

#### `isobarycentric` (replaces old 'isobarycenter')
- Center is **auto-calculated** from track positions (geometric center)
- `preserveOffsets: true` (maintains track-to-center distances)
- Use case: Rigid formation movement

#### `centered`
- Center is **user-defined** via `customCenter` property
- `preserveOffsets: true` (maintains track-to-center distances)
- Use case: Formation rotating around a specific point

#### `custom`
- **3D Spherical Distribution**: Tracks distributed evenly on sphere surface
- Center is **user-defined** via `customCenter.{x,y,z}` with orbital `radius`
- Uses **spherical coordinates** (theta, phi) with golden spiral algorithm for uniform distribution
- Radius = 0 → All tracks at center (like `shared`)
- Radius > 0 → Tracks distributed on 3D sphere surface
- Use case: Satellite constellations, surround speaker arrays, spherical formations

## Migration from 6-Mode System

### Old → New Mapping

```typescript
// Old 6-mode system
'identical'              → 'barycentric' + variant:'shared'
'phase-offset'           → 'barycentric' + variant:'shared' + phaseOffsetSeconds
'position-relative'      → 'relative'
'phase-offset-relative'  → 'relative' + phaseOffsetSeconds
'isobarycenter'          → 'barycentric' + variant:'isobarycentric'
'centered'               → 'barycentric' + variant:'centered'
```

### Key Insight

**Phase offset is orthogonal** - it works with ANY mode:
- `multiTrackMode: 'relative'` + `phaseOffsetSeconds: 2`
- `multiTrackMode: 'barycentric'` + `variant: 'shared'` + `phaseOffsetSeconds: 2`

## Implementation

### Type Definitions

```typescript
// Animation interface
interface Animation {
  multiTrackMode?: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  customCenter?: Position
  preserveOffsets?: boolean
  phaseOffsetSeconds?: number  // Orthogonal parameter
}

// AnimationParameters (internal)
interface AnimationParameters {
  _multiTrackMode?: 'relative' | 'barycentric'
  _isobarycenter?: Position      // Auto-calculated barycenter
  _customCenter?: Position       // User-defined center
  _trackOffset?: Position        // Offset from center
}

// CalculationContext
interface CalculationContext {
  multiTrackMode?: 'relative' | 'barycentric'
  barycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  isobarycenter?: Position
  customCenter?: Position
  trackOffset?: Position
  preserveOffsets?: boolean
}
```

### Model Definition

```typescript
export function createMyModel(): AnimationModel {
  return {
    metadata: { /* ... */ },
    parameters: { /* ... */ },
    
    // Multi-track support
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    calculate(params, time, duration, context) {
      let center = params.center || { x: 0, y: 0, z: 0 }
      
      if (context?.multiTrackMode === 'barycentric') {
        // Use barycenter or custom center
        const baryCenter = context.isobarycenter || context.customCenter
        if (baryCenter) {
          center = baryCenter
        }
        // Offset applied by store based on preserveOffsets
      } else if (context?.multiTrackMode === 'relative' && context?.trackOffset) {
        // Offset by track position
        center = {
          x: center.x + context.trackOffset.x,
          y: center.y + context.trackOffset.y,
          z: center.z + context.trackOffset.z
        }
      }
      
      // Continue with calculation...
    }
  }
}
```

## Future Possibilities

The new architecture enables advanced barycentric variants:

### Random Offsets
```typescript
barycentricVariant: 'random'
randomOffsetRange?: { min: number, max: number }
```
Tracks maintain random but fixed offsets from barycenter

### Orbiting Formation
```typescript
barycentricVariant: 'orbiting'
orbitSpeed?: number
orbitRadius?: number
```
Tracks orbit around the barycenter while moving

### Custom Offset Patterns
```typescript
barycentricVariant: 'pattern'
offsetPattern?: 'spiral' | 'grid' | 'fibonacci'
```
Tracks arranged in mathematical patterns around center

## Benefits

1. **Simpler Mental Model**: 2 base modes instead of 6
2. **More Flexible**: Barycentric variants are extensible
3. **Cleaner Code**: Fewer conditionals, clearer semantics
4. **Type-Safe**: TypeScript enforces valid combinations
5. **Future-Proof**: Easy to add new barycentric variants

## Model Support Matrix

| Model | Relative | Barycentric Variants |
|-------|----------|---------------------|
| circular | ✅ | shared, iso, centered |
| linear | ✅ | shared, iso, centered |
| elliptical | ✅ | shared, iso, centered |
| spiral | ✅ | shared, iso, centered |
| bezier | ✅ | shared, iso, centered |
| lissajous | ✅ | shared, iso, centered |
| random | ✅ | shared, iso, centered |
| bounce | ✅ | shared, iso |
| catmullRom | ✅ | shared, iso |
| zigzag | ✅ | shared, iso |
| epicycloid | ✅ | shared, iso |
| helix | ✅ | shared, iso |
| perlinNoise | ✅ | shared, iso |
| roseCurve | ✅ | shared, iso |
| circularScan | ✅ | shared |
| orbit | ✅ | shared |
| spring | ✅ | shared |
| wave | ✅ | shared, centered |
| attractRepel | ✅ | - |
| doppler | ✅ | - |
| pendulum | ✅ | - |
| zoom | ✅ | - |
| formation | - | iso, centered, custom |

## Implementation Status

- ✅ Type definitions updated
- ✅ All 24 models refactored
- ✅ Model calculation logic updated
- ⏳ AnimationStore integration (pending)
- ⏳ UI components update (pending)
- ⏳ Migration helper for old projects (pending)

## References

- `/src/types/index.ts` - Core type definitions
- `/src/models/types.ts` - Model system types
- `/src/models/builtin/*.ts` - All animation models
- Memory: Previous 3-mode architecture (shared/relative/formation) superseded by this 2-mode system

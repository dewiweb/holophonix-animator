# Holophonix Position System Migration Guide

This guide helps you migrate existing behavior implementations to use the new position system.

## Major Changes

1. **Position Type System**
   - New type-safe position representations
   - Support for multiple coordinate systems
   - Comprehensive validation and normalization

2. **Behavior System**
   - Updated BaseBehavior class
   - Coordinate system preferences
   - Enhanced parameter validation

3. **Parameter System**
   - New unit types
   - Improved validation rules
   - Common parameter definitions

## Completed Components 

1. **Linear Behavior**
   - Full XYZ and AED coordinate support
   - Center offset and range-based motion
   - Dynamic parameter updates
   - Comprehensive testing suite

## Migration Steps

### 1. Update Position Types

#### Before:
```typescript
interface Position {
  x: number;
  y: number;
  z: number;
}
```

#### After:
```typescript
import { 
  XYZPosition, 
  AEDPosition,
  createXYZPosition,
  createAEDPosition
} from '../types/position';

// Create XYZ position
const pos = createXYZPosition(x, y, z);

// Create AED position
const pos = createAEDPosition(azimuth, elevation, distance);
```

### 2. Update Behavior Implementation

#### Before:
```typescript
class OldBehavior extends BaseBehavior {
  calculatePosition(deltaTime: number): Position {
    return {
      x: this.parameters.speed * deltaTime,
      y: 0,
      z: 0
    };
  }
}
```

#### After:
```typescript
class NewBehavior extends BaseBehavior {
  constructor() {
    super(PARAMETERS, 'xyz'); // Specify preferred coordinate system
  }

  protected calculateXYZPosition(deltaTime: number): XYZPosition {
    return createXYZPosition(
      this.parameters.speed * deltaTime,
      0,
      0
    );
  }
}
```

### 3. Update Parameter Definitions

#### Before:
```typescript
const PARAMETERS = {
  speed: {
    default: 1,
    min: 0,
    max: 10,
    step: 0.1
  }
};
```

#### After:
```typescript
import { ParameterDefinitions } from '../types/parameters';

const PARAMETERS: ParameterDefinitions = {
  speed: {
    default: 1,
    min: 0,
    max: 10,
    step: 0.1,
    unit: 'meters/second',
    description: 'Movement speed'
  }
};
```

### 4. Update Position Calculations

#### Before:
```typescript
const x = Math.cos(angle) * radius;
const y = Math.sin(angle) * radius;
return { x, y, z: 0 };
```

#### After:
```typescript
import { normalizePosition } from '../types/position';

const pos = createXYZPosition(
  Math.cos(angle) * radius,
  Math.sin(angle) * radius,
  0
);
return normalizePosition(pos);
```

### 5. Update Position Validation

#### Before:
```typescript
if (Math.abs(x) > 100) x = Math.sign(x) * 100;
```

#### After:
```typescript
import { validatePosition, normalizePosition } from '../types/position';

const pos = createXYZPosition(x, y, z);
if (!validatePosition(pos)) {
  return normalizePosition(pos);
}
```

## Common Migration Patterns

### 1. Linear Motion
```typescript
// Before
x += speed * deltaTime;

// After
const position = speed * deltaTime;
return createXYZPosition(position, 0, 0);
```

### 2. Circular Motion
```typescript
// Before
const x = centerX + radius * Math.cos(angle);
const z = centerZ + radius * Math.sin(angle);

// After
return createXYZPosition(
  centerX + radius * Math.cos(angle),
  0,
  centerZ + radius * Math.sin(angle)
);
```

### 3. Orbital Motion
```typescript
// Before
const x = distance * Math.cos(azimuth);
const z = distance * Math.sin(azimuth);

// After
return createAEDPosition(azimuth, elevation, distance);
```

## Best Practices

1. **Choose the Right Coordinate System**
   - Use XYZ for linear and planar motions
   - Use AED for spherical and orbital motions
   - Let the base behavior handle conversions

2. **Validate All Positions**
   - Use `validatePosition` before returning
   - Apply `normalizePosition` when needed
   - Handle edge cases explicitly

3. **Use Type Guards**
   - Check coordinate systems with `isXYZPosition`/`isAEDPosition`
   - Handle conversion errors gracefully
   - Maintain type safety throughout

4. **Parameter Validation**
   - Define clear parameter ranges
   - Use appropriate units
   - Add descriptive error messages

## Testing Migration

1. Update test fixtures to use new position types
2. Add validation checks in tests
3. Test both coordinate systems
4. Verify parameter validation
5. Check edge cases and bounds

## Common Issues

1. **Type Errors**
   - Use type guards to check coordinate systems
   - Ensure proper imports from position types
   - Follow TypeScript compiler errors

2. **Parameter Validation**
   - Update all parameter definitions with units
   - Handle validation errors appropriately
   - Test parameter bounds

3. **Position Conversion**
   - Use provided conversion utilities
   - Handle edge cases (zero distance, vertical positions)
   - Maintain precision in calculations

4. **Performance**
   - Cache converted positions when possible
   - Minimize coordinate transformations
   - Use the preferred coordinate system

## Need Help?

If you encounter issues during migration:
1. Check the position system documentation
2. Review the test suite for examples
3. Use type guards and validation
4. Follow TypeScript compiler hints

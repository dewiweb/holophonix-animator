# Holophonix Position System Documentation

## Overview

The Holophonix Position System provides a flexible, type-safe framework for handling spatial audio track positions in multiple coordinate systems. It supports both Cartesian (XYZ) and Spherical (AED) coordinates, with comprehensive validation and transformation utilities.

## Coordinate Systems 

### XYZ (Cartesian) 
- `x`: Left/Right position (-10 to 10 meters)
- `y`: Up/Down position (-10 to 10 meters)
- `z`: Front/Back position (-10 to 10 meters)

### AED (Spherical) 
- `azimuth`: Horizontal angle (-180° to 180°)
- `elevation`: Vertical angle (-90° to 90°)
- `distance`: Distance from origin (0 to 100 meters)

## Position Types 

### Base Position Type
```typescript
interface HolophonixPosition {
  coordinate: CoordinateSystem;
  type: PositionType;
  values: Record<string, { value: number }>;
}
```

### Coordinate-Specific Types
```typescript
interface XYZPosition extends HolophonixPosition {
  coordinate: 'xyz';
  values: {
    x: { value: number };
    y: { value: number };
    z: { value: number };
  };
}

interface AEDPosition extends HolophonixPosition {
  coordinate: 'aed';
  values: {
    azimuth: { value: number };
    elevation: { value: number };
    distance: { value: number };
  };
}
```

## Utility Functions

### Position Creation
```typescript
createXYZPosition(x: number, y: number, z: number): XYZPosition
createAEDPosition(azimuth: number, elevation: number, distance: number): AEDPosition
```

### Coordinate Conversion
```typescript
convertXYZtoAED(pos: XYZPosition): AEDPosition
convertAEDtoXYZ(pos: AEDPosition): XYZPosition
```

### Position Manipulation
```typescript
interpolatePositions(start: HolophonixPosition, end: HolophonixPosition, t: number): HolophonixPosition
validatePosition(pos: HolophonixPosition): boolean
normalizePosition(pos: HolophonixPosition): HolophonixPosition
```

### Type Guards
```typescript
isXYZPosition(pos: HolophonixPosition): pos is XYZPosition
isAEDPosition(pos: HolophonixPosition): pos is AEDPosition
```

## Behavior System

### Base Behavior
The `BaseBehavior` class provides a foundation for implementing motion behaviors:

```typescript
abstract class BaseBehavior {
  constructor(parameterDefinitions: ParameterDefinitions, preferredCoordinate: 'xyz' | 'aed');
  update(time: number): { xyz: XYZPosition; aed: AEDPosition };
  setParameters(params: Record<string, number>): ParameterValidationError[];
  reset(): void;
}
```

### Available Behaviors

#### Linear Behavior
- Linear motion along a specified axis
- Parameters:
  * `speed`: Movement speed (meters/second)
  * `distance`: Total distance (meters)
  * `axis`: Movement axis (0: X, 1: Y, 2: Z)

#### Sine Wave Behavior
- Sinusoidal oscillation along a specified axis
- Parameters:
  * `frequency`: Oscillation frequency (Hz)
  * `amplitude`: Wave amplitude (meters)
  * `phase`: Wave phase offset (degrees)
  * `axis`: Movement axis (0: X, 1: Y, 2: Z)

#### Circle Behavior
- Circular motion in a specified plane
- Parameters:
  * `radius`: Circle radius (meters)
  * `speed`: Rotation speed (revolutions/second)
  * `phase`: Starting angle (degrees)
  * `plane`: Rotation plane (0: XY, 1: YZ, 2: XZ)
  * `centerX/Y/Z`: Center position (meters)

#### Orbit Behavior
- Spherical orbit with optional elevation wobble
- Parameters:
  * `distance`: Orbit radius (meters)
  * `speed`: Orbit speed (revolutions/second)
  * `elevation`: Orbit elevation (degrees)
  * `phase`: Starting azimuth (degrees)
  * `wobble`: Elevation wobble amplitude (degrees)
  * `wobbleSpeed`: Wobble frequency (Hz)

## Parameter Validation

### Parameter Types
```typescript
interface ParameterMetadata {
  min: number;
  max: number;
  default: number;
  step: number;
  unit: ParameterUnit;
  description: string;
}
```

### Available Units
- `degrees`: Angular measurements
- `meters`: Distance measurements
- `meters/second`: Linear speed
- `revolutions/second`: Angular speed
- `Hz`: Frequency
- `enum`: Discrete options (e.g., axis selection)

### Validation Rules
1. Values must be within defined min/max range
2. Values must align with defined step size
3. Values must be numeric
4. All required parameters must be provided

## Best Practices

1. **Coordinate System Selection**
   - Use XYZ for linear and wave motions
   - Use AED for orbital and spherical motions
   - Convert only when necessary using provided utilities

2. **Position Validation**
   - Always validate positions before use
   - Normalize positions that may exceed bounds
   - Use type guards to ensure coordinate system safety

3. **Parameter Handling**
   - Define clear parameter ranges and steps
   - Use appropriate units for each parameter
   - Validate parameters on every update

4. **Performance Considerations**
   - Cache converted positions when possible
   - Minimize coordinate system conversions
   - Use the behavior's preferred coordinate system

## Examples

### Creating and Converting Positions
```typescript
// Create XYZ position
const xyz = createXYZPosition(1, 2, 3);

// Convert to AED
const aed = convertXYZtoAED(xyz);

// Validate and normalize
if (validatePosition(aed)) {
  const normalized = normalizePosition(aed);
}
```

### Implementing a Custom Behavior
```typescript
class CustomBehavior extends BaseBehavior {
  constructor() {
    super({
      speed: {
        default: 1,
        min: 0,
        max: 10,
        step: 0.1,
        unit: 'meters/second',
        description: 'Movement speed'
      }
    }, 'xyz');
  }

  protected calculateXYZPosition(deltaTime: number): XYZPosition {
    const speed = this.parameters.speed;
    return createXYZPosition(
      speed * deltaTime,
      0,
      0
    );
  }
}

# Animation Model Definition Standard

**Purpose:** Ensure all animation models follow a consistent, well-formatted structure for maintainability and future extensibility (including user-created models).

## Required Structure

Every animation model **MUST** have the following sections in this order:

### 1. Metadata
```typescript
metadata: {
  type: string               // Unique identifier (kebab-case)
  name: string               // Display name
  version: string            // Semantic version
  category: string          // 'builtin' | 'physics' | 'wave' | 'curve' | 'procedural' | 'interactive' | 'spatial' | 'basic' | 'user'
  description: string       // Clear, concise description
  tags: string[]           // Searchable tags
  icon?: string            // Lucide icon name
}
```

### 2. Parameters
```typescript
parameters: Record<string, ParameterDefinition>
```

Each parameter MUST include:
- `type`: 'number' | 'position' | 'boolean' | 'string' | 'enum' | 'array'
- `default`: Default value (required)
- `label`: Human-readable name
- `description`: Tooltip/help text
- `group`: UI grouping ('Position' | 'Motion' | 'Shape' | 'Physics' | etc.)
- `order`: Display order within group
- `uiComponent`: UI widget type

**Number parameters** should include:
- `min`, `max`: Value constraints
- `step`: Increment step (optional)
- `unit`: Display unit ('m', 'deg', 'Hz', 's', etc.)

**Enum parameters** should include:
- `options`: Array of valid values

### 3. Multi-Track Support
```typescript
supportedModes: ('relative' | 'barycentric')[]
supportedBarycentricVariants?: ('shared' | 'isobarycentric' | 'centered' | 'custom')[]
defaultMultiTrackMode: 'relative' | 'barycentric'
defaultBarycentricVariant?: 'shared' | 'isobarycentric' | 'centered' | 'custom'  // Required if barycentric supported
```

**Guidelines:**
- Most models support both `'relative'` and `'barycentric'`
- Models with physics simulations often support only `'relative'`
- Formation-specific models support only `'barycentric'`
- Default is typically `'relative'` unless the model is specifically designed for group movement

### 4. Visualization (Required)
```typescript
visualization: {
  controlPoints: Array<{
    parameter: string  // Parameter name
    type: 'start' | 'end' | 'center' | 'control' | 'anchor'
  }>
  
  generatePath: (
    controlPoints: Position[],
    parameters: Record<string, any>,
    segments?: number
  ) => Position[]
  
  pathStyle: {
    type: 'line' | 'curve' | 'arc' | 'closed' | 'box' | 'sphere'
    showDirection?: boolean
    segments?: number
  }
  
  positionParameter?: string  // Primary position parameter
  
  calculateRotationAngle?: (
    time: number,
    duration: number,
    parameters: Record<string, any>
  ) => number
  
  updateFromControlPoints?: (
    controlPoints: Position[],
    currentParameters: Record<string, any>
  ) => Record<string, any>
}
```

### 5. Performance Hints (Optional but Recommended)
```typescript
performance: {
  complexity: 'constant' | 'linear' | 'quadratic' | 'exponential'
  stateful: boolean              // Maintains state between frames
  gpuAccelerated?: boolean       // Can use GPU
  maxTracks?: number            // Recommended limit
  cacheKey?: string[]           // Parameters affecting caching
}
```

### 6. Calculate Function (Required)
```typescript
calculate: (
  parameters: Record<string, any>,
  time: number,
  duration: number,
  context: CalculationContext
) => Position
```

**Multi-track handling pattern:**
```typescript
calculate(parameters, time, duration, context) {
  let center = parameters.center || { x: 0, y: 0, z: 0 }
  
  // Handle multi-track modes
  const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
  
  if (multiTrackMode === 'barycentric') {
    // Use barycenter or custom center
    const baryCenter = parameters._isobarycenter || parameters._customCenter || 
                       context?.isobarycenter || context?.customCenter
    if (baryCenter) {
      center = baryCenter
    }
    // Offset applied by animationStore based on preserveOffsets
  } else if (multiTrackMode === 'relative' && context?.trackOffset) {
    // Relative mode: offset by track position
    center = {
      x: center.x + context.trackOffset.x,
      y: center.y + context.trackOffset.y,
      z: center.z + context.trackOffset.z
    }
  }
  
  // Continue with position calculation...
  return { x, y, z }
}
```

### 7. getDefaultParameters (Required)
```typescript
getDefaultParameters: (trackPosition: Position) => Record<string, any>
```

**MUST** return all parameters with sensible defaults based on track position.

### 8. validateParameters (Recommended)
```typescript
validateParameters?: (parameters: Record<string, any>) => {
  valid: boolean
  errors?: string[]
}
```

Validate parameter constraints and relationships.

### 9. Lifecycle Hooks (Optional)
```typescript
initialize?: (parameters: Record<string, any>, context: CalculationContext) => void
cleanup?: (context: CalculationContext) => void
onParameterChange?: (key: string, value: any, parameters: Record<string, any>) => Record<string, any>
```

## Complete Example

```typescript
import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createMyAnimationModel(): AnimationModel {
  return {
    // 1. Metadata
    metadata: {
      type: 'my-animation',
      name: 'My Animation',
      version: '1.0.0',
      category: 'builtin',
      description: 'A clear description of what this animation does',
      tags: ['example', 'tutorial'],
      icon: 'Sparkles',
    },
    
    // 2. Parameters
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the animation',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Radius',
        description: 'Size of the effect',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 50,
        step: 0.1,
        unit: 'm',
        uiComponent: 'slider',
      },
    },
    
    // 3. Multi-track support
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    // 4. Visualization
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 64) => {
        // Generate preview path
        return []
      },
      pathStyle: {
        type: 'closed',
        segments: 64
      },
      positionParameter: 'center',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, center: controlPoints[0] }
        }
        return params
      }
    },
    
    // 5. Performance hints
    performance: {
      complexity: 'constant',
      stateful: false,
      gpuAccelerated: false,
      cacheKey: ['radius'],
    },
    
    // 6. Calculate function
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      let center = parameters.center || { x: 0, y: 0, z: 0 }
      const radius = parameters.radius || 5
      
      // Multi-track handling
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        const baryCenter = parameters._isobarycenter || parameters._customCenter || 
                          context?.isobarycenter || context?.customCenter
        if (baryCenter) {
          center = baryCenter
        }
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        center = {
          x: center.x + context.trackOffset.x,
          y: center.y + context.trackOffset.y,
          z: center.z + context.trackOffset.z
        }
      }
      
      // Your animation logic here
      return { x: center.x, y: center.y, z: center.z }
    },
    
    // 7. Default parameters
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
      }
    },
    
    // 8. Validation
    validateParameters: function(parameters: Record<string, any>) {
      const errors: string[] = []
      
      if (parameters.radius !== undefined && parameters.radius <= 0) {
        errors.push('Radius must be positive')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }
  }
}
```

## Common Patterns

### Parameter Groups
- **Position**: Spatial parameters (center, start, end, anchor)
- **Motion**: Movement parameters (speed, direction, frequency)
- **Shape**: Geometric parameters (radius, amplitude, size)
- **Physics**: Simulation parameters (gravity, damping, stiffness)
- **Limits**: Constraints (max speed, bounds, range)
- **Detail**: Fine-tuning (octaves, segments, resolution)
- **Behavior**: Behavioral flags (loop, reverse, easing)

### Icon Selection (Lucide)
- Basic motion: `MoveHorizontal`, `Circle`, `Waves`
- Physics: `Zap`, `Wind`, `Magnet`
- Curves: `BezierCurve`, `Spline`, `LineChart`
- Group: `Users`, `Group`, `Target`
- Procedural: `Sparkles`, `Hexagon`, `Flower`

## Validation Checklist

✅ All required sections present  
✅ Metadata complete with version  
✅ All parameters have defaults  
✅ Parameter groups logical  
✅ Multi-track modes specified  
✅ Visualization config complete  
✅ Calculate handles both modes  
✅ getDefaultParameters implemented  
✅ No hardcoded magic numbers  
✅ Clear comments for complex logic  
✅ Coordinate system documented (app coords)

## Future Extensions

User-created models will follow this same standard, enabling:
- Automatic UI generation from parameter definitions
- Consistent behavior across all models
- Easy validation and error handling
- Seamless integration with the animation editor
- Export/import of custom models

## References

- `/src/models/types.ts` - Type definitions
- `/src/models/builtin/*.ts` - Reference implementations
- `/docs/MULTI_TRACK_ARCHITECTURE.md` - Multi-track system details

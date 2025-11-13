import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

/**
 * Create the rose curve animation model
 */
export function createRoseCurveModel(): AnimationModel {
  return {
    metadata: {
      type: 'rose-curve',
      name: 'Rose Curve',
      version: '2.0.0',
      category: 'builtin',
      description: 'Mathematical flower pattern in polar coordinates',
      tags: ['mathematical', 'flower', 'polar', 'pattern'],
      icon: 'Flower',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the rose curve',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Radius',
        description: 'Size of the rose curve',
        group: 'Shape',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      petalCount: {
        type: 'number',
        default: 5,
        label: 'Petal Count',
        description: 'Number of petals (k value in r = cos(kθ))',
        group: 'Shape',
        order: 2,
        min: 1,
        max: 20,
        step: 1,
        uiComponent: 'slider',
      },
      angularOffset: {
        type: 'number',
        default: 0,
        label: 'Angular Offset',
        description: 'Starting angle offset in degrees',
        group: 'Shape',
        order: 3,
        min: 0,
        max: 360,
        uiComponent: 'slider',
      },
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the rose curve in 3D space',
        group: 'Orientation',
        order: 4,
        uiComponent: 'rotation3d',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { 
          parameter: 'center', 
          type: 'center',
          enabledModes: ['translate', 'rotate']
        }
      ],
      generatePath: (controlPoints, params, segments = 200) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const radius = params.radius || 5
        const petals = params.petalCount || 5
        const points = []
        
        // Always generate rose curve in XY plane - rotation is applied generically after
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const r = radius * Math.cos(petals * angle)
          points.push({
            x: center.x + Math.cos(angle) * r,
            y: center.y + Math.sin(angle) * r,
            z: center.z
          })
        }
        return points
      },
      pathStyle: { type: 'closed', segments: 200 },
      positionParameter: 'center',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, center: controlPoints[0] }
        }
        return params
      }
    },
    
    performance: {
      complexity: 'constant',
      stateful: false,
      gpuAccelerated: false,
    },
    
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      const progress = Math.min(time / duration, 1)
      
      let center = parameters.center || { x: 0, y: 0, z: 0 }
      const radius = parameters.radius || 5
      
      // Apply multi-track mode adjustments
      const petalCount = parameters.petalCount || 5
      const angularOffset = (parameters.angularOffset || 0) * Math.PI / 180
      const rotation3d = parameters.rotation && typeof parameters.rotation === 'object' 
        ? parameters.rotation 
        : { x: 0, y: 0, z: 0 }
      
      // Rose curve: r = radius * cos(k * θ)
      const theta = progress * 2 * Math.PI + angularOffset
      const r = radius * Math.cos(petalCount * theta)
      
      // Convert to Cartesian in XY plane
      const basePos: Position = {
        x: center.x + r * Math.cos(theta),
        y: center.y + r * Math.sin(theta),
        z: center.z
      }
      
      // Apply 3D rotation if specified
      if (rotation3d.x !== 0 || rotation3d.y !== 0 || rotation3d.z !== 0) {
        const rotated = applyRotationToPath([basePos], center, rotation3d)
        return rotated[0]
      }
      
      return basePos
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
        petalCount: 5,
        angularOffset: 0,
        rotation: { x: 0, y: 0, z: 0 },
      }
    },
  }
}

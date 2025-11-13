import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

/**
 * Create the epicycloid animation model
 */
export function createEpicycloidModel(): AnimationModel {
  return {
    metadata: {
      type: 'epicycloid',
      name: 'Epicycloid',
      version: '2.0.0',
      category: 'builtin',
      description: 'Path traced by a point on a circle rolling around another circle',
      tags: ['mathematical', 'rolling', 'circle', 'curve'],
      icon: 'Circle',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center of the fixed circle',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      fixedRadius: {
        type: 'number',
        default: 3,
        label: 'Fixed Circle Radius',
        description: 'Radius of the stationary circle',
        group: 'Shape',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      rollingRadius: {
        type: 'number',
        default: 1,
        label: 'Rolling Circle Radius',
        description: 'Radius of the rolling circle',
        group: 'Shape',
        order: 2,
        min: 0.1,
        max: 10,
        uiComponent: 'slider',
      },
      speed: {
        type: 'number',
        default: 1,
        label: 'Speed',
        description: 'Rolling speed multiplier',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        uiComponent: 'slider',
      },
      type: {
        type: 'enum',
        default: 'epicycloid',
        label: 'Type',
        description: 'Epicycloid (outside) or Hypocycloid (inside)',
        group: 'Motion',
        order: 2,
        options: ['epicycloid', 'hypocycloid'],
        uiComponent: 'select',
      },
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the epicycloid curve in 3D space',
        group: 'Orientation',
        order: 1,
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
        const R = params.fixedRadius || 3
        const r = params.rollingRadius || 1
        const points = []
        
        // Always generate epicycloid in XY plane - rotation is applied generically after
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const ratio = (R + r) / r
          const x = (R + r) * Math.cos(angle) - r * Math.cos(ratio * angle)
          const y = (R + r) * Math.sin(angle) - r * Math.sin(ratio * angle)
          points.push({
            x: center.x + x,
            y: center.y + y,
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
      
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const R = parameters.fixedRadius || 3
      const r = parameters.rollingRadius || 1
      const speed = parameters.speed || 1
      const type = parameters.type || 'epicycloid'
      const rotation = parameters.rotation || { x: 0, y: 0, z: 0 }
      
      const theta = progress * 2 * Math.PI * speed
      
      let x: number, y: number
      
      if (type === 'epicycloid') {
        // Epicycloid: point on circle rolling outside
        x = (R + r) * Math.cos(theta) - r * Math.cos(((R + r) / r) * theta)
        y = (R + r) * Math.sin(theta) - r * Math.sin(((R + r) / r) * theta)
      } else {
        // Hypocycloid: point on circle rolling inside
        x = (R - r) * Math.cos(theta) + r * Math.cos(((R - r) / r) * theta)
        y = (R - r) * Math.sin(theta) - r * Math.sin(((R - r) / r) * theta)
      }
      
      // Calculate position in XY plane
      const basePos: Position = {
        x: center.x + x,
        y: center.y + y,
        z: center.z
      }
      
      // Apply 3D rotation if specified
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        const rotated = applyRotationToPath([basePos], center, rotation)
        return rotated[0]
      }
      
      return basePos
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        fixedRadius: 3,
        rollingRadius: 1,
        speed: 1,
        type: 'epicycloid',
        rotation: { x: 0, y: 0, z: 0 },
      }
    },
  }
}

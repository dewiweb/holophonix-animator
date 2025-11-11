import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the rose curve animation model
 */
export function createRoseCurveModel(): AnimationModel {
  return {
    metadata: {
      type: 'rose-curve',
      name: 'Rose Curve',
      version: '1.0.0',
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
      rotation: {
        type: 'number',
        default: 0,
        label: 'Rotation',
        description: 'Rotation offset in degrees',
        group: 'Orientation',
        order: 1,
        min: 0,
        max: 360,
        unit: 'deg',
        uiComponent: 'slider',
      },
      plane: {
        type: 'enum',
        default: 'xy',
        label: 'Plane',
        description: 'Plane for the rose curve',
        group: 'Orientation',
        order: 2,
        options: ['xy', 'xz', 'yz'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 200) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const radius = params.radius || 5
        const petals = params.petalCount || 5
        const plane = params.plane || 'xy'
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const r = radius * Math.cos(petals * angle)
          const point = { x: center.x, y: center.y, z: center.z }
          
          if (plane === 'xy') {
            point.x += Math.cos(angle) * r
            point.y += Math.sin(angle) * r
          } else if (plane === 'xz') {
            point.x += Math.cos(angle) * r
            point.z += Math.sin(angle) * r
          } else if (plane === 'yz') {
            point.y += Math.cos(angle) * r
            point.z += Math.sin(angle) * r
          }
          points.push(point)
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
      const rotation = (parameters.rotation || 0) * Math.PI / 180
      const plane = parameters.plane || 'xy'
      
      // Rose curve: r = radius * cos(k * θ)
      const theta = progress * 2 * Math.PI + rotation
      const r = radius * Math.cos(petalCount * theta)
      
      // Convert to Cartesian
      const x = r * Math.cos(theta)
      const y = r * Math.sin(theta)
      
      // Apply to correct plane
      let position: Position
      if (plane === 'xy') {
        position = { x: center.x + x, y: center.y + y, z: center.z }
      } else if (plane === 'xz') {
        position = { x: center.x + x, y: center.y, z: center.z + y }
      } else { // yz
        position = { x: center.x, y: center.y + x, z: center.z + y }
      }
      
      return position
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
        petalCount: 5,
        rotation: 0,
        plane: 'xy',
      }
    },
  }
}

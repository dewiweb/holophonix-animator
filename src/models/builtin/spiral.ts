import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

export function createSpiralModel(): AnimationModel {
  return {
    metadata: {
      name: 'Spiral Motion',
      version: '2.0.0',
      author: 'System',
      description: 'Expanding or contracting spiral animation',
      category: 'basic',
      type: 'spiral',
      tags: ['basic', 'path', 'spiral'],
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the spiral',
        group: 'Position',
      },
      startRadius: { type: 'number', default: 1, min: 0, max: 50, label: 'Start Radius' },
      endRadius: { type: 'number', default: 10, min: 0, max: 50, label: 'End Radius' },
      rotations: { type: 'number', default: 3, min: 0.5, max: 10, label: 'Rotations' },
      direction: { 
        type: 'enum', 
        default: 'outward',
        options: ['outward', 'inward'],
        label: 'Direction' 
      },
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the spiral path in 3D space',
        group: 'Orientation',
        uiComponent: 'rotation3d',
      },
    },
    
    calculate: function(
      params: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      const progress = duration > 0 ? time / duration : 0
      
      const center = params.center || { x: 0, y: 0, z: 0 }
      const startRadius = params.startRadius ?? 1
      const endRadius = params.endRadius ?? 10
      const rotations = params.rotations ?? 3
      const direction = params.direction ?? 'outward'
      const rotation = params.rotation || { x: 0, y: 0, z: 0 }
      
      // Calculate current radius based on direction
      let radius: number
      if (direction === 'outward') {
        radius = startRadius + (endRadius - startRadius) * progress
      } else {
        radius = endRadius - (endRadius - startRadius) * progress
      }
      
      // Calculate angle based on rotations
      const angle = progress * rotations * Math.PI * 2
      
      // Calculate position in XY plane
      const basePos: Position = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
        z: center.z
      }
      
      // Apply rotation if specified
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        const rotated = applyRotationToPath([basePos], center, rotation)
        return rotated[0]
      }
      
      return basePos
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        startRadius: 1,
        endRadius: 10,
        rotations: 3,
        direction: 'outward',
        rotation: { x: 0, y: 0, z: 0 },
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { 
          parameter: 'center', 
          type: 'center',
          enabledModes: ['translate', 'rotate']
        }
      ],
      generatePath: (controlPoints, params, segments = 100) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const startRadius = params.startRadius || 1
        const endRadius = params.endRadius || 5
        const turns = params.rotations || params.turns || 3
        const direction = params.direction || 'outward'
        const points = []
        
        // Always generate spiral in XY plane - rotation is applied generically after
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * turns * Math.PI * 2
          // Apply direction: outward goes from start to end, inward goes from end to start
          const r = direction === 'outward'
            ? startRadius + (endRadius - startRadius) * t
            : endRadius - (endRadius - startRadius) * t
          points.push({
            x: center.x + Math.cos(angle) * r,
            y: center.y + Math.sin(angle) * r,
            z: center.z
          })
        }
        return points
      },
      pathStyle: { type: 'curve', segments: 100 },
      positionParameter: 'center',
      calculateRotationAngle: (time, duration, params) => {
        const rotations = params.rotations || 3
        const t = duration > 0 ? Math.min(time / duration, 1) : 0
        return t * rotations * 2 * Math.PI
      },
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, center: controlPoints[0] }
        }
        return params
      }
    }
  }
}

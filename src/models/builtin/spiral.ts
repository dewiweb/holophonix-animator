import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createSpiralModel(): AnimationModel {
  return {
    metadata: {
      name: 'Spiral Motion',
      version: '1.0.0',
      author: 'System',
      description: 'Expanding or contracting spiral animation',
      category: 'basic',
      type: 'spiral',
      tags: ['basic', 'path', 'spiral'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      startRadius: { type: 'number', default: 1, min: 0, max: 50, label: 'Start Radius' },
      endRadius: { type: 'number', default: 10, min: 0, max: 50, label: 'End Radius' },
      rotations: { type: 'number', default: 3, min: 0.5, max: 10, label: 'Rotations' },
      direction: { 
        type: 'enum', 
        default: 'outward',
        options: ['outward', 'inward'],
        label: 'Direction' 
      },
      plane: {
        type: 'enum',
        default: 'xy',
        options: ['xy', 'xz', 'yz'],
        label: 'Rotation Plane',
      },
    },
    
    calculate: function(
      params: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      const progress = duration > 0 ? time / duration : 0
      
      // Get center coordinates - support both individual coords and center object
      let centerX = params.center?.x ?? params.centerX ?? 0
      let centerY = params.center?.y ?? params.centerY ?? 0
      let centerZ = params.center?.z ?? params.centerZ ?? 0
      
      // Support multi-track modes
      
      const startRadius = params.startRadius ?? 1
      const endRadius = params.endRadius ?? 10
      const rotations = params.rotations ?? 3
      const direction = params.direction ?? 'outward'
      const plane = params.plane ?? 'xy'
      
      // Calculate current radius based on direction
      let radius: number
      if (direction === 'outward') {
        radius = startRadius + (endRadius - startRadius) * progress
      } else {
        radius = endRadius - (endRadius - startRadius) * progress
      }
      
      // Calculate angle based on rotations
      const angle = progress * rotations * Math.PI * 2
      
      let x = centerX
      let y = centerY
      let z = centerZ
      
      switch (plane) {
        case 'xy':
          x = centerX + radius * Math.cos(angle)
          y = centerY + radius * Math.sin(angle)
          break
        case 'xz':
          x = centerX + radius * Math.cos(angle)
          z = centerZ + radius * Math.sin(angle)
          break
        case 'yz':
          y = centerY + radius * Math.cos(angle)
          z = centerZ + radius * Math.sin(angle)
          break
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        centerX: trackPosition?.x ?? 0,
        centerY: trackPosition?.y ?? 0,
        centerZ: trackPosition?.z ?? 0,
        startRadius: 1,
        endRadius: 10,
        rotations: 3,
        direction: 'outward',
        plane: 'xy',
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 100) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const startRadius = params.startRadius || 1
        const endRadius = params.endRadius || 5
        const turns = params.turns || 3
        const plane = params.plane || 'xy'
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * turns * Math.PI * 2
          const r = startRadius + (endRadius - startRadius) * t
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

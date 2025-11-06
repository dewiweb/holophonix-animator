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
      
      // Support multi-track modes - check both parameters and context
      const multiTrackMode = params._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'centered' && params._centeredPoint) {
        centerX = params._centeredPoint.x
        centerY = params._centeredPoint.y
        centerZ = params._centeredPoint.z
      } else if (multiTrackMode === 'isobarycenter' && params._isobarycenter) {
        // For formation mode, use barycenter as center
        // Do NOT apply track offset here - it's applied after in animationStore.ts
        centerX = params._isobarycenter.x
        centerY = params._isobarycenter.y
        centerZ = params._isobarycenter.z
      } else if (multiTrackMode === 'position-relative') {
        if (context?.trackOffset) {
          centerX += context.trackOffset.x
          centerY += context.trackOffset.y
          centerZ += context.trackOffset.z
        }
      }
      
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
    
    supportedModes: ['identical', 'phase-offset', 'position-relative', 'phase-offset-relative', 'isobarycenter', 'centered'],
    defaultMultiTrackMode: 'position-relative',
  }
}

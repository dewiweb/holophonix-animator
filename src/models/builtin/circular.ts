import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the circular animation model
 */
export function createCircularModel(): AnimationModel {
  return {
    metadata: {
      type: 'circular',
      name: 'Circular Motion',
      version: '2.0.0',
      category: 'builtin',
      description: 'Smooth circular motion in 3D space with configurable radius, speed, and plane',
      tags: ['basic', 'rotation', 'orbit', 'circle'],
      icon: 'Circle',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the circular path',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Radius',
        description: 'Radius of the circular path',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 50,
        step: 0.1,
        unit: 'm',
        uiComponent: 'slider',
      },
      speed: {
        type: 'number',
        default: 1,
        label: 'Speed',
        description: 'Rotations per duration',
        group: 'Motion',
        order: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: 'rot/s',
        uiComponent: 'slider',
      },
      startAngle: {
        type: 'number',
        default: 0,
        label: 'Start Angle',
        description: 'Starting angle in degrees',
        group: 'Motion',
        order: 3,
        min: 0,
        max: 360,
        step: 1,
        unit: 'deg',
        uiComponent: 'slider',
      },
      plane: {
        type: 'enum',
        default: 'xy',
        label: 'Plane',
        description: 'Plane of rotation',
        group: 'Motion',
        order: 4,
        options: ['xy', 'xz', 'yz'],
        uiComponent: 'select',
      },
      direction: {
        type: 'enum',
        default: 'clockwise',
        label: 'Direction',
        description: 'Direction of rotation',
        group: 'Motion',
        order: 5,
        options: ['clockwise', 'counterclockwise'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['identical', 'phase-offset', 'position-relative', 'centered', 'isobarycenter'],
    defaultMultiTrackMode: 'phase-offset',
    
    performance: {
      complexity: 'constant',
      stateful: false,
      gpuAccelerated: false,
      cacheKey: ['radius', 'speed', 'plane', 'direction'],
    },
    
    calculate: function(
      parameters: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      let center = parameters.center || { x: 0, y: 0, z: 0 }
      const radius = parameters.radius || 5
      const speed = parameters.speed || 1
      const startAngle = (parameters.startAngle || 0) * Math.PI / 180
      const plane = parameters.plane || 'xy'
      const direction = parameters.direction || 'clockwise'
      
      // Apply multi-track mode adjustments - check both context AND parameters
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'centered' && parameters._centeredPoint) {
        center = parameters._centeredPoint
      } else if (multiTrackMode === 'isobarycenter' && parameters._isobarycenter) {
        // For formation mode, use barycenter as center
        // Do NOT apply track offset here - it's applied after in animationStore.ts
        center = parameters._isobarycenter
      } else if (multiTrackMode === 'position-relative') {
        // Use track position as center
        if (context?.trackOffset) {
          center = {
            x: center.x + context.trackOffset.x,
            y: center.y + context.trackOffset.y,
            z: center.z + context.trackOffset.z
          }
        }
      }
      
      // Calculate angle based on time
      const progress = duration > 0 ? (time / duration) : 0
      const rotations = progress * speed
      const angleDirection = direction === 'clockwise' ? -1 : 1
      const angle = startAngle + (rotations * Math.PI * 2 * angleDirection)
      
      // Calculate position based on plane
      const pos: Position = { x: center.x, y: center.y, z: center.z }
      
      switch (plane) {
        case 'xy':
          pos.x = center.x + Math.cos(angle) * radius
          pos.y = center.y + Math.sin(angle) * radius
          break
        case 'xz':
          pos.x = center.x + Math.cos(angle) * radius
          pos.z = center.z + Math.sin(angle) * radius
          break
        case 'yz':
          pos.y = center.y + Math.cos(angle) * radius
          pos.z = center.z + Math.sin(angle) * radius
          break
      }
      
      return pos
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
        speed: 1,
        startAngle: 0,
        plane: 'xy',
        direction: 'clockwise',
      }
    },
    
    validateParameters: function(parameters: Record<string, any>) {
      const errors: string[] = []
      
      if (parameters.radius !== undefined && parameters.radius <= 0) {
        errors.push('Radius must be positive')
      }
      
      if (parameters.speed !== undefined && parameters.speed <= 0) {
        errors.push('Speed must be positive')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }
  }
}

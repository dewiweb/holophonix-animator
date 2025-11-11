import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the zoom animation model
 */
export function createZoomModel(): AnimationModel {
  return {
    metadata: {
      type: 'zoom',
      name: 'Zoom',
      version: '1.0.0',
      category: 'builtin',
      description: 'Radial movement towards or away from a center point',
      tags: ['spatial-audio', 'radial', 'zoom', 'distance'],
      icon: 'ZoomIn',
    },
    
    parameters: {
      zoomCenter: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Zoom Center',
        description: 'Center point for zoom movement',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      startDistance: {
        type: 'number',
        default: 10,
        label: 'Start Distance',
        description: 'Initial distance from center',
        group: 'Distance',
        order: 1,
        min: 0.1,
        max: 50,
        uiComponent: 'slider',
      },
      endDistance: {
        type: 'number',
        default: 2,
        label: 'End Distance',
        description: 'Final distance from center',
        group: 'Distance',
        order: 2,
        min: 0.1,
        max: 50,
        uiComponent: 'slider',
      },
      direction: {
        type: 'position',
        default: { x: 1, y: 0, z: 0 },
        label: 'Direction',
        description: 'Direction vector for radial movement',
        group: 'Orientation',
        order: 1,
        uiComponent: 'position3d',
      },
      easing: {
        type: 'enum',
        default: 'ease-in-out',
        label: 'Easing',
        description: 'Acceleration curve',
        group: 'Motion',
        order: 1,
        options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [{ parameter: 'zoomCenter', type: 'center' }],
      generatePath: (controlPoints, params) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const startDist = params.startDistance || 5
        const endDist = params.endDistance || 1
        // Show radial movement
        return [
          { x: center.x, y: center.y, z: center.z + startDist },
          { x: center.x, y: center.y, z: center.z + endDist }
        ]
      },
      pathStyle: { type: 'line', showDirection: true },
      positionParameter: 'zoomCenter',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, zoomCenter: controlPoints[0] }
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
      const zoomCenter = parameters.zoomCenter || { x: 0, y: 0, z: 0 }
      const startDistance = parameters.startDistance || 10
      const endDistance = parameters.endDistance || 2
      const direction = parameters.direction || { x: 1, y: 0, z: 0 }
      const easing = parameters.easing || 'ease-in-out'
      
      // Normalize direction
      const dirLength = Math.sqrt(
        direction.x * direction.x +
        direction.y * direction.y +
        direction.z * direction.z
      )
      const normDir = {
        x: direction.x / dirLength,
        y: direction.y / dirLength,
        z: direction.z / dirLength,
      }
      
      // Calculate progress with easing
      let t = Math.min(time / duration, 1)
      
      switch (easing) {
        case 'ease-in':
          t = t * t
          break
        case 'ease-out':
          t = 1 - (1 - t) * (1 - t)
          break
        case 'ease-in-out':
          t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
          break
      }
      
      // Interpolate distance
      const distance = startDistance + (endDistance - startDistance) * t
      
      // Calculate position
      return {
        x: zoomCenter.x + normDir.x * distance,
        y: zoomCenter.y + normDir.y * distance,
        z: zoomCenter.z + normDir.z * distance,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      // Calculate direction from center to track position
      const dx = trackPosition.x
      const dy = trackPosition.y
      const dz = trackPosition.z
      const length = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      return {
        zoomCenter: { x: 0, y: 0, z: 0 },
        startDistance: 10,
        endDistance: 2,
        direction: length > 0 ? { x: dx / length, y: dy / length, z: dz / length } : { x: 1, y: 0, z: 0 },
        easing: 'ease-in-out',
      }
    },
  }
}

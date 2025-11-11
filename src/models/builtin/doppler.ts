import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the Doppler effect animation model
 */
export function createDopplerModel(): AnimationModel {
  return {
    metadata: {
      type: 'doppler',
      name: 'Doppler Effect',
      version: '1.0.0',
      category: 'builtin',
      description: 'Linear fly-by path for spatial audio Doppler effect',
      tags: ['spatial-audio', 'doppler', 'fly-by', 'velocity'],
      icon: 'Zap',
    },
    
    parameters: {
      pathStart: {
        type: 'position',
        default: { x: -10, y: 0, z: 0 },
        label: 'Path Start',
        description: 'Starting point of the fly-by path',
        group: 'Path',
        order: 1,
        uiComponent: 'position3d',
      },
      pathEnd: {
        type: 'position',
        default: { x: 10, y: 0, z: 0 },
        label: 'Path End',
        description: 'Ending point of the fly-by path',
        group: 'Path',
        order: 2,
        uiComponent: 'position3d',
      },
      passBySpeed: {
        type: 'number',
        default: 1,
        label: 'Pass-by Speed',
        description: 'Speed of the fly-by (higher = faster)',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        uiComponent: 'slider',
      },
    },
    
    supportedModes: ['relative'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'pathStart', type: 'start' },
        { parameter: 'pathEnd', type: 'end' }
      ],
      generatePath: (controlPoints) => {
        if (controlPoints.length >= 2) {
          return [controlPoints[0], controlPoints[1]]
        }
        return []
      },
      pathStyle: { type: 'line', showDirection: true },
      positionParameter: 'pathStart',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) updated.pathStart = controlPoints[0]
        if (controlPoints.length > 1) updated.pathEnd = controlPoints[1]
        return updated
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
      const pathStart = parameters.pathStart || { x: -10, y: 0, z: 0 }
      const pathEnd = parameters.pathEnd || { x: 10, y: 0, z: 0 }
      const passBySpeed = parameters.passBySpeed || 1
      
      // Adjust progress with speed (can exceed 1)
      let progress = (time / duration) * passBySpeed
      progress = Math.max(0, Math.min(1, progress)) // Clamp to [0, 1]
      
      // Linear interpolation
      return {
        x: pathStart.x + (pathEnd.x - pathStart.x) * progress,
        y: pathStart.y + (pathEnd.y - pathStart.y) * progress,
        z: pathStart.z + (pathEnd.z - pathStart.z) * progress,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        pathStart: { x: trackPosition.x - 10, y: trackPosition.y, z: trackPosition.z },
        pathEnd: { x: trackPosition.x + 10, y: trackPosition.y, z: trackPosition.z },
        passBySpeed: 1,
      }
    },
  }
}

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the linear animation model
 */
export function createLinearModel(): AnimationModel {
  return {
    metadata: {
      type: 'linear',
      name: 'Linear Motion',
      version: '2.0.0',
      category: 'builtin',
      description: 'Linear interpolation between two positions',
      tags: ['basic', 'line', 'interpolation', 'simple'],
      icon: 'MoveHorizontal',
    },
    
    parameters: {
      startPosition: {
        type: 'position',
        default: { x: -5, y: 0, z: 0 },
        label: 'Start Position',
        description: 'Starting point of the linear path',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      endPosition: {
        type: 'position',
        default: { x: 5, y: 0, z: 0 },
        label: 'End Position',
        description: 'Ending point of the linear path',
        group: 'Position',
        order: 2,
        uiComponent: 'position3d',
      },
      easing: {
        type: 'enum',
        default: 'linear',
        label: 'Easing',
        description: 'Easing function for the interpolation',
        group: 'Motion',
        order: 1,
        options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'startPosition', type: 'start' },
        { parameter: 'endPosition', type: 'end' }
      ],
      generatePath: (controlPoints) => {
        if (controlPoints.length >= 2) {
          return [controlPoints[0], controlPoints[1]]
        }
        return []
      },
      pathStyle: { type: 'line' },
      positionParameter: 'startPosition',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) updated.startPosition = controlPoints[0]
        if (controlPoints.length > 1) updated.endPosition = controlPoints[1]
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
      // V3: Pure function - just use parameters, no mode checks
      // Transforms are applied AFTER calculation in animationStore
      const start = parameters.startPosition || { x: 0, y: 0, z: 0 }
      const end = parameters.endPosition || { x: 10, y: 0, z: 0 }
      const easing = parameters.easing || 'linear'
      
      // Calculate normalized time (0 to 1)
      let t = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0
      
      // Apply easing
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
      
      // Interpolate position
      return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        startPosition: { ...trackPosition },
        endPosition: { x: trackPosition.x + 10, y: trackPosition.y, z: trackPosition.z },
        easing: 'linear',
      }
    },
  }
}

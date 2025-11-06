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
    
    supportedModes: ['identical', 'phase-offset', 'position-relative', 'phase-offset-relative', 'isobarycenter', 'centered'],
    defaultMultiTrackMode: 'position-relative',
    
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
      let start = parameters.startPosition || { x: 0, y: 0, z: 0 }
      let end = parameters.endPosition || { x: 10, y: 0, z: 0 }
      const easing = parameters.easing || 'linear'
      
      // Apply multi-track mode adjustments
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') {
        // Use track position as offset for both start and end
        if (context?.trackOffset) {
          start = {
            x: start.x + context.trackOffset.x,
            y: start.y + context.trackOffset.y,
            z: start.z + context.trackOffset.z
          }
          end = {
            x: end.x + context.trackOffset.x,
            y: end.y + context.trackOffset.y,
            z: end.z + context.trackOffset.z
          }
        }
      }
      
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

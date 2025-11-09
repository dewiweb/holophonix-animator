import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the formation animation model
 */
export function createFormationModel(): AnimationModel {
  return {
    metadata: {
      type: 'formation',
      name: 'Formation',
      version: '1.0.0',
      category: 'builtin',
      description: 'Group movement maintaining relative positions (isobarycenter mode)',
      tags: ['multi-track', 'group', 'formation', 'isobarycenter'],
      icon: 'Users',
    },
    
    parameters: {
      targetPosition: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Target Position',
        description: 'Destination for the formation center',
        group: 'Movement',
        order: 1,
        uiComponent: 'position3d',
      },
      followStiffness: {
        type: 'number',
        default: 0.5,
        label: 'Follow Stiffness',
        description: 'How rigidly tracks maintain formation (0=loose, 1=rigid)',
        group: 'Behavior',
        order: 1,
        min: 0,
        max: 1,
        step: 0.1,
        uiComponent: 'slider',
      },
    },
    
    supportedModes: ['isobarycenter'],
    defaultMultiTrackMode: 'isobarycenter',
    
    visualization: {
      controlPoints: [{ parameter: 'center', type: 'center' }],
      generatePath: (controlPoints) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const size = 2
        // Draw cross indicator
        return [
          { x: center.x - size, y: center.y, z: center.z },
          { x: center.x + size, y: center.y, z: center.z },
          center,
          { x: center.x, y: center.y, z: center.z - size },
          { x: center.x, y: center.y, z: center.z + size }
        ]
      },
      pathStyle: { type: 'line' },
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
      
      const targetPosition = parameters.targetPosition || { x: 0, y: 0, z: 0 }
      const followStiffness = parameters.followStiffness ?? 0.5
      
      // Use isobarycenter from context if available
      const isobarycenter = context?.isobarycenter || { x: 0, y: 0, z: 0 }
      const trackOffset = context?.trackOffset || { x: 0, y: 0, z: 0 }
      
      // Move isobarycenter towards target
      const newCenter = {
        x: isobarycenter.x + (targetPosition.x - isobarycenter.x) * progress,
        y: isobarycenter.y + (targetPosition.y - isobarycenter.y) * progress,
        z: isobarycenter.z + (targetPosition.z - isobarycenter.z) * progress,
      }
      
      // Apply track offset with stiffness
      return {
        x: newCenter.x + trackOffset.x * followStiffness,
        y: newCenter.y + trackOffset.y * followStiffness,
        z: newCenter.z + trackOffset.z * followStiffness,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        targetPosition: { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z },
        followStiffness: 0.5,
      }
    },
  }
}

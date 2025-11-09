import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the attract/repel animation model
 */
export function createAttractRepelModel(): AnimationModel {
  return {
    metadata: {
      type: 'attract-repel',
      name: 'Attract/Repel',
      version: '1.0.0',
      category: 'builtin',
      description: 'Force-based movement towards or away from a target',
      tags: ['physics', 'force', 'interactive', 'magnetic'],
      icon: 'Magnet',
    },
    
    parameters: {
      targetPosition: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Target Position',
        description: 'Point of attraction or repulsion',
        group: 'Force',
        order: 1,
        uiComponent: 'position3d',
      },
      strength: {
        type: 'number',
        default: 5,
        label: 'Force Strength',
        description: 'Strength of attraction (positive) or repulsion (negative)',
        group: 'Force',
        order: 2,
        min: -20,
        max: 20,
        uiComponent: 'slider',
      },
      maxSpeed: {
        type: 'number',
        default: 10,
        label: 'Max Speed',
        description: 'Maximum movement speed',
        group: 'Limits',
        order: 1,
        min: 0.1,
        max: 50,
        uiComponent: 'slider',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Influence Radius',
        description: 'Distance where force is strongest',
        group: 'Limits',
        order: 2,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
    },
    
    supportedModes: ['position-relative'],
    defaultMultiTrackMode: 'position-relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'sourcePosition', type: 'start' },
        { parameter: 'targetPosition', type: 'end' }
      ],
      generatePath: (controlPoints) => {
        if (controlPoints.length >= 2) {
          return [controlPoints[0], controlPoints[1]]
        }
        return []
      },
      pathStyle: { type: 'line', showDirection: true },
      positionParameter: 'sourcePosition',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) updated.sourcePosition = controlPoints[0]
        if (controlPoints.length > 1) updated.targetPosition = controlPoints[1]
        return updated
      }
    },
    
    performance: {
      complexity: 'constant',
      stateful: true,
      gpuAccelerated: false,
    },
    
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      const targetPosition = parameters.targetPosition || { x: 0, y: 0, z: 0 }
      const strength = parameters.strength ?? 5
      const maxSpeed = parameters.maxSpeed || 10
      const radius = parameters.radius || 5
      
      // Get current position (from context or initialize at origin)
      const initialPosition = context?.initialPosition || { x: -5, y: 0, z: 0 }
      
      // Simple physics simulation
      const dx = targetPosition.x - initialPosition.x
      const dy = targetPosition.y - initialPosition.y
      const dz = targetPosition.z - initialPosition.z
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (distance < 0.1) {
        return initialPosition
      }
      
      // Calculate force (inverse square law, clamped)
      const forceMagnitude = Math.min(strength / Math.max(distance, radius), maxSpeed)
      const progress = Math.min(time / duration, 1)
      
      // Move towards/away from target
      return {
        x: initialPosition.x + (dx / distance) * forceMagnitude * progress * duration,
        y: initialPosition.y + (dy / distance) * forceMagnitude * progress * duration,
        z: initialPosition.z + (dz / distance) * forceMagnitude * progress * duration,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        targetPosition: { x: 0, y: 0, z: 0 },
        strength: 5,
        maxSpeed: 10,
        radius: 5,
      }
    },
  }
}

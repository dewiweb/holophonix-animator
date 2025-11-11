import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the helix animation model
 */
export function createHelixModel(): AnimationModel {
  return {
    metadata: {
      type: 'helix',
      name: 'Helix',
      version: '1.0.0',
      category: 'builtin',
      description: '3D helical motion - spiral staircase pattern',
      tags: ['3d', 'spiral', 'helix', 'wave'],
      icon: 'Waves',
    },
    
    parameters: {
      axisStart: {
        type: 'position',
        default: { x: 0, y: 0, z: -5 },
        label: 'Axis Start',
        description: 'Starting point of the helix axis',
        group: 'Axis',
        order: 1,
        uiComponent: 'position3d',
      },
      axisEnd: {
        type: 'position',
        default: { x: 0, y: 0, z: 5 },
        label: 'Axis End',
        description: 'Ending point of the helix axis',
        group: 'Axis',
        order: 2,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 3,
        label: 'Radius',
        description: 'Radius of the helix',
        group: 'Shape',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      turns: {
        type: 'number',
        default: 3,
        label: 'Number of Turns',
        description: 'Number of complete rotations',
        group: 'Shape',
        order: 2,
        min: 0.1,
        max: 20,
        step: 0.5,
        uiComponent: 'slider',
      },
      clockwise: {
        type: 'boolean',
        default: true,
        label: 'Clockwise',
        description: 'Direction of rotation',
        group: 'Shape',
        order: 3,
        uiComponent: 'checkbox',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'axisStart', type: 'start' },
        { parameter: 'axisEnd', type: 'end' }
      ],
      generatePath: (controlPoints, params, segments = 100) => {
        if (controlPoints.length < 2) return []
        const start = controlPoints[0]
        const end = controlPoints[1]
        const radius = params.radius || 2
        const turns = params.turns || 3
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * turns * Math.PI * 2
          const base = {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t
          }
          
          // In app coords (Z-up): circular motion in XY plane (horizontal)
          base.x += Math.cos(angle) * radius
          base.y += Math.sin(angle) * radius
          points.push(base)
        }
        return points
      },
      pathStyle: { type: 'curve', segments: 100 },
      positionParameter: 'axisStart',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) updated.axisStart = controlPoints[0]
        if (controlPoints.length > 1) updated.axisEnd = controlPoints[1]
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
      const progress = Math.min(time / duration, 1)
      
      let axisStart = parameters.axisStart || { x: 0, y: 0, z: -5 }
      let axisEnd = parameters.axisEnd || { x: 0, y: 0, z: 5 }
      
      // Apply multi-track mode adjustments
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Axis defines BARYCENTER path
        // Keep as-is
        // STEP 2 (Store): Will add _trackOffset
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset axis by track position
        const offset = context.trackOffset
        axisStart = { x: axisStart.x + offset.x, y: axisStart.y + offset.y, z: axisStart.z + offset.z }
        axisEnd = { x: axisEnd.x + offset.x, y: axisEnd.y + offset.y, z: axisEnd.z + offset.z }
      }
      const radius = parameters.radius || 3
      const turns = parameters.turns || 3
      const clockwise = parameters.clockwise !== false
      
      // Calculate position along the axis
      const axisX = axisStart.x + (axisEnd.x - axisStart.x) * progress
      const axisY = axisStart.y + (axisEnd.y - axisStart.y) * progress
      const axisZ = axisStart.z + (axisEnd.z - axisStart.z) * progress
      
      // Calculate angle
      const angle = progress * turns * 2 * Math.PI * (clockwise ? 1 : -1)
      
      // Calculate offset from axis (perpendicular circular motion)
      const offsetX = Math.cos(angle) * radius
      const offsetY = Math.sin(angle) * radius
      
      return {
        x: axisX + offsetX,
        y: axisY + offsetY,
        z: axisZ
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        axisStart: { x: trackPosition.x, y: trackPosition.y, z: trackPosition.z - 5 },
        axisEnd: { x: trackPosition.x, y: trackPosition.y, z: trackPosition.z + 5 },
        radius: 3,
        turns: 3,
        clockwise: true,
      }
    },
  }
}

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the zigzag animation model
 */
export function createZigzagModel(): AnimationModel {
  return {
    metadata: {
      type: 'zigzag',
      name: 'Zigzag',
      version: '1.0.0',
      category: 'builtin',
      description: 'Sharp angular back-and-forth movement',
      tags: ['angular', 'path', 'zigzag'],
      icon: 'ZapOff',
    },
    
    parameters: {
      zigzagStart: {
        type: 'position',
        default: { x: -5, y: 0, z: 0 },
        label: 'Start Position',
        description: 'Starting point of the zigzag path',
        group: 'Path',
        order: 1,
        uiComponent: 'position3d',
      },
      zigzagEnd: {
        type: 'position',
        default: { x: 5, y: 0, z: 0 },
        label: 'End Position',
        description: 'Ending point of the zigzag path',
        group: 'Path',
        order: 2,
        uiComponent: 'position3d',
      },
      zigzagCount: {
        type: 'number',
        default: 3,
        label: 'Number of Zigzags',
        description: 'Number of back-and-forth movements',
        group: 'Shape',
        order: 1,
        min: 1,
        max: 20,
        step: 1,
        uiComponent: 'slider',
      },
      amplitude: {
        type: 'number',
        default: 2,
        label: 'Amplitude',
        description: 'Height of zigzag peaks',
        group: 'Shape',
        order: 2,
        min: 0.1,
        max: 10,
        uiComponent: 'slider',
      },
      plane: {
        type: 'enum',
        default: 'xy',
        label: 'Plane',
        description: 'Plane for zigzag movement',
        group: 'Shape',
        order: 3,
        options: ['xy', 'xz', 'yz'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['identical', 'position-relative', 'phase-offset'],
    defaultMultiTrackMode: 'position-relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'zigzagStart', type: 'start' },
        { parameter: 'zigzagEnd', type: 'end' }
      ],
      generatePath: (controlPoints, params) => {
        if (controlPoints.length < 2) return []
        const start = controlPoints[0]
        const end = controlPoints[1]
        const count = params.zigzagCount || 3
        const amplitude = params.amplitude || 2
        const points = [start]
        
        for (let i = 1; i <= count; i++) {
          const t = i / (count + 1)
          const mid = {
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t
          }
          
          // Offset perpendicular
          const offset = amplitude * (i % 2 === 0 ? 1 : -1)
          mid.x += offset
          points.push(mid)
        }
        
        points.push(end)
        return points
      },
      pathStyle: { type: 'line' },
      positionParameter: 'zigzagStart',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) updated.zigzagStart = controlPoints[0]
        if (controlPoints.length > 1) updated.zigzagEnd = controlPoints[1]
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
      
      const start = parameters.zigzagStart || { x: -5, y: 0, z: 0 }
      const end = parameters.zigzagEnd || { x: 5, y: 0, z: 0 }
      const zigzagCount = parameters.zigzagCount || 3
      const amplitude = parameters.amplitude || 2
      const plane = parameters.plane || 'xy'
      
      // Calculate base position along path
      const baseX = start.x + (end.x - start.x) * progress
      const baseY = start.y + (end.y - start.y) * progress
      const baseZ = start.z + (end.z - start.z) * progress
      
      // Calculate zigzag offset
      const zigzagProgress = progress * zigzagCount
      const zigzagPhase = (zigzagProgress % 1) * 2 - 1 // -1 to 1
      const zigzagValue = zigzagPhase * amplitude
      
      // Apply to correct plane
      let x = baseX
      let y = baseY
      let z = baseZ
      
      if (plane === 'xy') {
        y += zigzagValue
      } else if (plane === 'xz') {
        z += zigzagValue
      } else if (plane === 'yz') {
        z += zigzagValue
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        zigzagStart: { ...trackPosition, x: trackPosition.x - 5 },
        zigzagEnd: { ...trackPosition, x: trackPosition.x + 5 },
        zigzagCount: 3,
        amplitude: 2,
        plane: 'xy',
      }
    },
  }
}

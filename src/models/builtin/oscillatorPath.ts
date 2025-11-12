import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'
import {
  calculateWaveform,
  applyOscillation,
  generateOscillationPath,
  sharedOscillatorParameters,
  type WaveformType,
  type OscillationPlane
} from './oscillatorShared'

/**
 * Path Oscillator Model
 * 
 * Oscillates while moving along a path from start to end
 * Replaces the old "zigzag" model with all waveform types
 */
export function createPathOscillatorModel(): AnimationModel {
  return {
    metadata: {
      type: 'oscillator-path',
      name: 'Oscillator (Path)',
      version: '1.0.0',
      category: 'builtin',
      description: 'Oscillates while moving along a path with multiple waveform types',
      tags: ['oscillator', 'path', 'zigzag', 'traveling', 'periodic'],
      icon: 'Activity',
    },
    
    parameters: {
      pathStart: {
        type: 'position',
        default: { x: -5, y: 0, z: 0 },
        label: 'Path Start',
        description: 'Starting point of the path',
        group: 'Path',
        order: 1,
        uiComponent: 'position3d',
      },
      pathEnd: {
        type: 'position',
        default: { x: 5, y: 0, z: 0 },
        label: 'Path End',
        description: 'Ending point of the path',
        group: 'Path',
        order: 2,
        uiComponent: 'position3d',
      },
      ...sharedOscillatorParameters,
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'pathStart', type: 'start' },
        { parameter: 'pathEnd', type: 'end' }
      ],
      generatePath: (controlPoints, params) => {
        const start = params.pathStart || controlPoints[0] || { x: -5, y: 0, z: 0 }
        const end = params.pathEnd || controlPoints[1] || { x: 5, y: 0, z: 0 }
        const amplitude = params.amplitude || 2
        const frequency = params.frequency || 1
        const plane = params.plane || 'xy'
        const waveform = params.waveform || 'sine'
        
        // Create base points (interpolated along path)
        const basePoints: Position[] = []
        for (let i = 0; i <= 50; i++) {
          const t = i / 50
          basePoints.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            z: start.z + (end.z - start.z) * t
          })
        }
        
        // Apply oscillation
        return generateOscillationPath(basePoints, amplitude, frequency, plane as OscillationPlane, waveform as WaveformType)
      },
      pathStyle: { type: 'line' },
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
      const progress = Math.min(time / duration, 1)
      const start = parameters.pathStart || { x: -5, y: 0, z: 0 }
      const end = parameters.pathEnd || { x: 5, y: 0, z: 0 }
      const waveform = parameters.waveform || 'sine'
      const amplitude = parameters.amplitude || 2
      const frequency = parameters.frequency || 1
      const phase = (parameters.phase || 0) * Math.PI / 180
      const plane = parameters.plane || 'xy'
      
      // Calculate base position along path
      const basePosition: Position = {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        z: start.z + (end.z - start.z) * progress
      }
      
      // Calculate waveform value
      const angle = time * frequency * Math.PI * 2 + phase
      const waveValue = calculateWaveform(waveform as WaveformType, angle)
      
      // Apply oscillation to base position
      return applyOscillation(basePosition, waveValue, amplitude, plane as OscillationPlane)
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        pathStart: { ...trackPosition, x: trackPosition.x - 5 },
        pathEnd: { ...trackPosition, x: trackPosition.x + 5 },
        waveform: 'sine',
        amplitude: 2,
        frequency: 1,
        phase: 0,
        plane: 'xy',
      }
    },
  }
}

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
 * Stationary Oscillator Model
 * 
 * Oscillates around a fixed center point
 * Replaces the old "wave" model with all waveform types
 */
export function createStationaryOscillatorModel(): AnimationModel {
  return {
    metadata: {
      type: 'oscillator-stationary',
      name: 'Oscillator (Stationary)',
      version: '1.0.0',
      category: 'builtin',
      description: 'Oscillates around a fixed point with multiple waveform types',
      tags: ['oscillator', 'wave', 'sine', 'stationary', 'periodic'],
      icon: 'Radio',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of oscillation',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      ...sharedOscillatorParameters,
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params) => {
        const center = params.center || controlPoints[0] || { x: 0, y: 0, z: 0 }
        const amplitude = params.amplitude || 2
        const frequency = params.frequency || 1
        const plane = params.plane || 'xy'
        const waveform = params.waveform || 'sine'
        
        // Create base points (all at center)
        const basePoints: Position[] = []
        for (let i = 0; i <= 20; i++) {
          basePoints.push({ ...center })
        }
        
        // Apply oscillation
        return generateOscillationPath(basePoints, amplitude, frequency, plane as OscillationPlane, waveform as WaveformType)
      },
      pathStyle: { type: 'line' },
      positionParameter: 'center',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) {
          updated.center = controlPoints[0]
        }
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
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const waveform = parameters.waveform || 'sine'
      const amplitude = parameters.amplitude || 2
      const frequency = parameters.frequency || 1
      const phase = (parameters.phase || 0) * Math.PI / 180
      const plane = parameters.plane || 'xy'
      
      // Calculate waveform value
      const angle = time * frequency * Math.PI * 2 + phase
      const waveValue = calculateWaveform(waveform as WaveformType, angle)
      
      // Apply oscillation to center point
      return applyOscillation(center, waveValue, amplitude, plane as OscillationPlane)
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        waveform: 'sine',
        amplitude: 2,
        frequency: 1,
        phase: 0,
        plane: 'xy',
      }
    },
  }
}

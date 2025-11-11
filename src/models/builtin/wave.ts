import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the wave animation model
 */
export function createWaveModel(): AnimationModel {
  return {
    metadata: {
      type: 'wave',
      name: 'Wave Motion',
      version: '2.0.0',
      category: 'builtin',
      description: 'Sinusoidal wave motion with configurable amplitude and frequency',
      tags: ['wave', 'sine', 'oscillation', 'periodic'],
      icon: 'Waves',
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
      amplitude: {
        type: 'position',
        default: { x: 5, y: 0, z: 0 },
        label: 'Amplitude',
        description: 'Wave amplitude per axis',
        group: 'Wave',
        order: 1,
        uiComponent: 'position3d',
      },
      frequency: {
        type: 'number',
        default: 1,
        label: 'Frequency',
        description: 'Wave frequency in Hz',
        group: 'Wave',
        order: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: 'Hz',
        uiComponent: 'slider',
      },
      phase: {
        type: 'number',
        default: 0,
        label: 'Phase',
        description: 'Phase offset in degrees',
        group: 'Wave',
        order: 3,
        min: 0,
        max: 360,
        step: 1,
        unit: 'deg',
        uiComponent: 'slider',
      },
      waveType: {
        type: 'enum',
        default: 'sine',
        label: 'Wave Type',
        description: 'Type of waveform',
        group: 'Wave',
        order: 4,
        options: ['sine', 'square', 'triangle', 'sawtooth'],
        uiComponent: 'select',
      },
      combineMode: {
        type: 'enum',
        default: 'additive',
        label: 'Combine Mode',
        description: 'How to combine X, Y, Z waves',
        group: 'Wave',
        order: 5,
        options: ['additive', 'multiplicative', 'sequential'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'centered'],
    defaultMultiTrackMode: 'barycentric',
    defaultBarycentricVariant: 'shared',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 100) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const amp = params.amplitude || { x: 5, y: 0, z: 0 }
        const freq = params.frequency || 1
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * Math.PI * 2 * freq
          points.push({
            x: center.x + Math.sin(angle) * amp.x,
            y: center.y + Math.sin(angle) * amp.y,
            z: center.z + Math.sin(angle) * amp.z
          })
        }
        return points
      },
      pathStyle: { type: 'curve', segments: 100 },
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
      let center = parameters.center || { x: 0, y: 0, z: 0 }
      const amplitude = parameters.amplitude || { x: 5, y: 0, z: 0 }
      const frequency = parameters.frequency || 1
      const phase = (parameters.phase || 0) * Math.PI / 180
      const waveType = parameters.waveType || 'sine'
      const combineMode = parameters.combineMode || 'additive'
      
      // Apply multi-track mode adjustments
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Use barycenter as wave center
        // STEP 2 (Store): Will add _trackOffset
        const baryCenter = parameters._isobarycenter || parameters._customCenter
        if (baryCenter) {
          center = baryCenter
        }
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset center by track position
        center = {
          x: center.x + context.trackOffset.x,
          y: center.y + context.trackOffset.y,
          z: center.z + context.trackOffset.z
        }
      }
      
      // Calculate base wave value
      const angle = time * frequency * Math.PI * 2 + phase
      
      // Generate wave based on type
      let waveValue: number
      switch (waveType) {
        case 'sine':
          waveValue = Math.sin(angle)
          break
        case 'square':
          waveValue = Math.sin(angle) > 0 ? 1 : -1
          break
        case 'triangle':
          waveValue = (2 / Math.PI) * Math.asin(Math.sin(angle))
          break
        case 'sawtooth':
          waveValue = (2 * ((angle / (2 * Math.PI)) % 1)) - 1
          break
        default:
          waveValue = Math.sin(angle)
      }
      
      // Apply wave to each axis
      let offsetX: number, offsetY: number, offsetZ: number
      
      switch (combineMode) {
        case 'additive':
          // All axes use the same wave value
          offsetX = amplitude.x * waveValue
          offsetY = amplitude.y * waveValue
          offsetZ = amplitude.z * waveValue
          break
          
        case 'multiplicative':
          // Each axis has its own phase-shifted wave
          offsetX = amplitude.x * Math.sin(angle)
          offsetY = amplitude.y * Math.sin(angle + Math.PI / 3)
          offsetZ = amplitude.z * Math.sin(angle + 2 * Math.PI / 3)
          break
          
        case 'sequential':
          // Waves cascade through axes
          const progress = (time * frequency) % 3
          if (progress < 1) {
            offsetX = amplitude.x * waveValue
            offsetY = 0
            offsetZ = 0
          } else if (progress < 2) {
            offsetX = 0
            offsetY = amplitude.y * waveValue
            offsetZ = 0
          } else {
            offsetX = 0
            offsetY = 0
            offsetZ = amplitude.z * waveValue
          }
          break
          
        default:
          offsetX = amplitude.x * waveValue
          offsetY = amplitude.y * waveValue
          offsetZ = amplitude.z * waveValue
      }
      
      return {
        x: center.x + offsetX,
        y: center.y + offsetY,
        z: center.z + offsetZ,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        amplitude: { x: 5, y: 0, z: 0 },
        frequency: 1,
        phase: 0,
        waveType: 'sine',
        combineMode: 'additive',
      }
    },
    
    validateParameters: function(parameters: Record<string, any>) {
      const errors: string[] = []
      
      if (parameters.frequency !== undefined && parameters.frequency <= 0) {
        errors.push('Frequency must be positive')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }
  }
}

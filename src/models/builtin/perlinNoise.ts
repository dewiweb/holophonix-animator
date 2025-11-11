import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Simple noise function (simplified Perlin-like)
 */
function noise(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Create the Perlin noise animation model
 */
export function createPerlinNoiseModel(): AnimationModel {
  return {
    metadata: {
      type: 'perlin-noise',
      name: 'Perlin Noise',
      version: '1.0.0',
      category: 'builtin',
      description: 'Organic procedural movement using noise',
      tags: ['procedural', 'organic', 'noise', 'random'],
      icon: 'Sparkles',
    },
    
    parameters: {
      scale: {
        type: 'number',
        default: 5,
        label: 'Scale',
        description: 'Size of the movement area',
        group: 'Movement',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      frequency: {
        type: 'number',
        default: 1,
        label: 'Frequency',
        description: 'Speed of noise changes',
        group: 'Movement',
        order: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        uiComponent: 'slider',
      },
      octaves: {
        type: 'number',
        default: 3,
        label: 'Octaves',
        description: 'Number of noise layers for detail',
        group: 'Detail',
        order: 1,
        min: 1,
        max: 8,
        step: 1,
        uiComponent: 'slider',
      },
      persistence: {
        type: 'number',
        default: 0.5,
        label: 'Persistence',
        description: 'Amplitude decrease per octave',
        group: 'Detail',
        order: 2,
        min: 0,
        max: 1,
        step: 0.1,
        uiComponent: 'slider',
      },
      seed: {
        type: 'number',
        default: 0,
        label: 'Seed',
        description: 'Random seed for reproducibility',
        group: 'Detail',
        order: 3,
        min: 0,
        max: 1000,
        step: 1,
        uiComponent: 'input',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [{ parameter: 'center', type: 'center' }],
      generatePath: (controlPoints, params) => {
        const origin = controlPoints[0] || { x: 0, y: 0, z: 0 }
        const scale = params.scale || 5
        // Draw cube showing noise space
        return [
          { x: origin.x - scale, y: origin.y - scale, z: origin.z - scale },
          { x: origin.x + scale, y: origin.y - scale, z: origin.z - scale },
          { x: origin.x + scale, y: origin.y - scale, z: origin.z + scale },
          { x: origin.x - scale, y: origin.y - scale, z: origin.z + scale },
          { x: origin.x - scale, y: origin.y - scale, z: origin.z - scale },
          { x: origin.x - scale, y: origin.y + scale, z: origin.z - scale },
          { x: origin.x + scale, y: origin.y + scale, z: origin.z - scale },
          { x: origin.x + scale, y: origin.y + scale, z: origin.z + scale },
          { x: origin.x - scale, y: origin.y + scale, z: origin.z + scale },
          { x: origin.x - scale, y: origin.y + scale, z: origin.z - scale }
        ]
      },
      pathStyle: { type: 'box' },
      positionParameter: 'center',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, center: controlPoints[0] }
        }
        return params
      }
    },
    
    performance: {
      complexity: 'linear',
      stateful: false,
      gpuAccelerated: false,
    },
    
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      const scale = parameters.scale || 5
      const frequency = parameters.frequency || 1
      const octaves = parameters.octaves || 3
      const persistence = parameters.persistence || 0.5
      const seed = parameters.seed || 0
      
      const t = time * frequency
      
      // Multi-octave noise
      let x = 0, y = 0, z = 0
      let amplitude = 1
      let maxAmplitude = 0
      
      for (let i = 0; i < octaves; i++) {
        const freq = Math.pow(2, i)
        x += noise(t * freq + seed, i, 0) * amplitude
        y += noise(t * freq + seed, i + 10, 1) * amplitude
        z += noise(t * freq + seed, i + 20, 2) * amplitude
        
        maxAmplitude += amplitude
        amplitude *= persistence
      }
      
      // Normalize and scale
      x = (x / maxAmplitude - 0.5) * 2 * scale
      y = (y / maxAmplitude - 0.5) * 2 * scale
      z = (z / maxAmplitude - 0.5) * 2 * scale
      
      // Apply multi-track mode adjustments
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Noise defines BARYCENTER movement
        // Output is barycenter position
        // STEP 2 (Store): Will add _trackOffset
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset noise by track position
        x += context.trackOffset.x
        y += context.trackOffset.y
        z += context.trackOffset.z
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        scale: 5,
        frequency: 1,
        octaves: 3,
        persistence: 0.5,
        seed: Math.floor(Math.random() * 1000),
      }
    },
  }
}

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

// Random state management per context
const randomStates = new Map<string, {
  currentPos: Position
  targetPos: Position
  lastUpdate: number
}>()

export function createRandomModel(): AnimationModel {
  return {
    metadata: {
      name: 'Random Motion',
      version: '1.0.0',
      author: 'System',
      description: 'Random movement within defined bounds',
      category: 'basic',
      type: 'random',
      tags: ['basic', 'random', 'procedural'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      boundsX: { type: 'number', default: 5, min: 0, max: 50, label: 'Bounds ±X' },
      boundsY: { type: 'number', default: 5, min: 0, max: 50, label: 'Bounds ±Y' },
      boundsZ: { type: 'number', default: 2, min: 0, max: 50, label: 'Bounds ±Z' },
      speed: { type: 'number', default: 1, min: 0.1, max: 10, label: 'Speed' },
      smoothness: { type: 'number', default: 0.5, min: 0, max: 1, label: 'Smoothness' },
      updateFrequency: { type: 'number', default: 10, min: 1, max: 60, label: 'Update Frequency (Hz)' },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      
      // Determine center based on multi-track mode
      let centerX = params.centerX ?? 0
      let centerY = params.centerY ?? 0
      let centerZ = params.centerZ ?? 0
      
      
      const boundsX = params.boundsX ?? 5
      const boundsY = params.boundsY ?? 5
      const boundsZ = params.boundsZ ?? 2
      const smoothness = params.smoothness ?? 0.5
      const updateFreq = params.updateFrequency ?? 10
      
      // Create unique key for this track/context
      const stateKey = `${context?.trackId || 'default'}_${context?.state || 'playback'}`
      
      // Initialize or get state
      if (!randomStates.has(stateKey)) {
        randomStates.set(stateKey, {
          currentPos: { x: centerX, y: centerY, z: centerZ },
          targetPos: { 
            x: centerX + (Math.random() - 0.5) * 2 * boundsX,
            y: centerY + (Math.random() - 0.5) * 2 * boundsY,
            z: centerZ + (Math.random() - 0.5) * 2 * boundsZ
          },
          lastUpdate: 0
        })
      }
      
      const state = randomStates.get(stateKey)!
      const updateInterval = 1000 / updateFreq
      
      // Check if we should update target
      if (time * 1000 - state.lastUpdate > updateInterval) {
        state.targetPos = {
          x: centerX + (Math.random() - 0.5) * 2 * boundsX,
          y: centerY + (Math.random() - 0.5) * 2 * boundsY,
          z: centerZ + (Math.random() - 0.5) * 2 * boundsZ
        }
        state.lastUpdate = time * 1000
      }
      
      // Smooth interpolation to target
      state.currentPos = {
        x: state.currentPos.x + (state.targetPos.x - state.currentPos.x) * (1 - smoothness),
        y: state.currentPos.y + (state.targetPos.y - state.currentPos.y) * (1 - smoothness),
        z: state.currentPos.z + (state.targetPos.z - state.currentPos.z) * (1 - smoothness)
      }
      
      return state.currentPos
    },
    
    getDefaultParameters(position?: Position) {
      return {
        centerX: position?.x ?? 0,
        centerY: position?.y ?? 0,
        centerZ: position?.z ?? 0,
        boundsX: 5,
        boundsY: 5,
        boundsZ: 2,
        speed: 1,
        smoothness: 0.5,
        updateFrequency: 10,
      }
    },
    
    cleanup(context) {
      const stateKey = `${context?.trackId || 'default'}_${context?.state || 'playback'}`
      randomStates.delete(stateKey)
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const bx = params.boundsX || 5
        const by = params.boundsY || 5
        const bz = params.boundsZ || 2
        // Draw wireframe box showing bounds
        return [
          { x: center.x - bx, y: center.y - by, z: center.z - bz },
          { x: center.x + bx, y: center.y - by, z: center.z - bz },
          { x: center.x + bx, y: center.y + by, z: center.z - bz },
          { x: center.x - bx, y: center.y + by, z: center.z - bz },
          { x: center.x - bx, y: center.y - by, z: center.z - bz },
          { x: center.x - bx, y: center.y - by, z: center.z + bz },
          { x: center.x + bx, y: center.y - by, z: center.z + bz },
          { x: center.x + bx, y: center.y + by, z: center.z + bz },
          { x: center.x - bx, y: center.y + by, z: center.z + bz },
          { x: center.x - bx, y: center.y - by, z: center.z + bz }
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
    }
  }
}

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

// Store spring state per instance
const springStates = new Map<string, { position: Position; velocity: Position; lastTime: number }>()

/**
 * Create the spring animation model
 */
export function createSpringModel(): AnimationModel {
  return {
    metadata: {
      type: 'spring',
      name: 'Spring Motion',
      version: '2.0.0',
      category: 'builtin',
      description: 'Spring physics simulation with stiffness and damping',
      tags: ['physics', 'spring', 'oscillation', 'elastic'],
      icon: 'Zap',
    },
    
    parameters: {
      restPosition: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rest Position',
        description: 'Equilibrium position of the spring',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      initialDisplacement: {
        type: 'position',
        default: { x: 5, y: 5, z: 0 },
        label: 'Initial Displacement',
        description: 'Initial offset from rest position',
        group: 'Position',
        order: 2,
        uiComponent: 'position3d',
      },
      stiffness: {
        type: 'number',
        default: 10,
        label: 'Stiffness',
        description: 'Spring stiffness (higher = stiffer)',
        group: 'Physics',
        order: 1,
        min: 0.1,
        max: 100,
        step: 0.1,
        uiComponent: 'slider',
      },
      damping: {
        type: 'number',
        default: 0.5,
        label: 'Damping',
        description: 'Damping coefficient (0 = no damping, 1 = critical)',
        group: 'Physics',
        order: 2,
        min: 0,
        max: 1,
        step: 0.01,
        uiComponent: 'slider',
      },
      mass: {
        type: 'number',
        default: 1,
        label: 'Mass',
        description: 'Mass of the object',
        group: 'Physics',
        order: 3,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: 'kg',
        uiComponent: 'slider',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'restPosition', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 50) => {
        if (controlPoints.length < 1) return []
        const rest = controlPoints[0]
        const amplitude = params.initialDisplacement || 3
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const displacement = amplitude * Math.cos(t * Math.PI * 4) * Math.exp(-t * 2)
          points.push({
            x: rest.x,
            y: rest.y + displacement,
            z: rest.z
          })
        }
        return points
      },
      pathStyle: { type: 'curve', segments: 50 },
      positionParameter: 'restPosition',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, restPosition: controlPoints[0] }
        }
        return params
      }
    },
    
    performance: {
      complexity: 'linear',
      stateful: true,
      gpuAccelerated: false,
    },
    
    initialize: function(parameters: Record<string, any>, context: CalculationContext) {
      // Initialize spring state
      const stateKey = `${context.trackId}_${context.trackIndex}`
      const restPosition = parameters.restPosition || { x: 0, y: 0, z: 0 }
      const displacement = parameters.initialDisplacement || { x: 5, y: 5, z: 0 }
      springStates.set(stateKey, {
        position: {
          x: restPosition.x + displacement.x,
          y: restPosition.y + displacement.y,
          z: restPosition.z + displacement.z
        },
        velocity: { x: 0, y: 0, z: 0 },
        lastTime: 0
      })
    },
    
    cleanup: function(context: CalculationContext) {
      // Clean up state when animation stops
      const stateKey = `${context.trackId}_${context.trackIndex}`
      springStates.delete(stateKey)
    },
    
    calculate: function(
      parameters: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      let restPosition = parameters.restPosition || { x: 0, y: 0, z: 0 }
      const stiffness = parameters.stiffness || 10
      const damping = parameters.damping || 0.5
      const mass = parameters.mass || 1
      
      // Apply multi-track mode adjustments
      const multiTrackMode = parameters._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Use barycenter as rest position
        // STEP 2 (Store): Will add _trackOffset
        const baryCenter = parameters._isobarycenter || parameters._customCenter
        if (baryCenter) {
          restPosition = baryCenter
        }
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset rest position by track position
        restPosition = {
          x: restPosition.x + context.trackOffset.x,
          y: restPosition.y + context.trackOffset.y,
          z: restPosition.z + context.trackOffset.z
        }
      }
      
      // Get or create state
      const stateKey = `${context.trackId}_${context.trackIndex}`
      let state = springStates.get(stateKey)
      
      if (!state || time < 0.01 || state.lastTime > time) {
        // Reset state
        const displacement = parameters.initialDisplacement || { x: 5, y: 5, z: 0 }
        state = {
          position: {
            x: restPosition.x + displacement.x,
            y: restPosition.y + displacement.y,
            z: restPosition.z + displacement.z
          },
          velocity: { x: 0, y: 0, z: 0 },
          lastTime: 0
        }
        springStates.set(stateKey, state)
      }
      
      // Spring physics simulation
      const dt = Math.min(time - state.lastTime, 0.1)
      if (dt > 0) {
        // Spring force: F = -k * x - c * v
        const forceX = -stiffness * (state.position.x - restPosition.x) - damping * state.velocity.x
        const forceY = -stiffness * (state.position.y - restPosition.y) - damping * state.velocity.y
        const forceZ = -stiffness * (state.position.z - restPosition.z) - damping * state.velocity.z
        
        // Update velocity: v = v + (F/m) * dt
        state.velocity.x += (forceX / mass) * dt
        state.velocity.y += (forceY / mass) * dt
        state.velocity.z += (forceZ / mass) * dt
        
        // Update position: p = p + v * dt
        state.position.x += state.velocity.x * dt
        state.position.y += state.velocity.y * dt
        state.position.z += state.velocity.z * dt
      }
      state.lastTime = time
      
      return { ...state.position }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        restPosition: { ...trackPosition },
        initialDisplacement: { x: 5, y: 5, z: 0 },
        stiffness: 10,
        damping: 0.5,
        mass: 1,
      }
    },
  }
}

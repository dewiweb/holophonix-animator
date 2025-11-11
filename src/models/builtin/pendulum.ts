import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

// Store physics state per instance
const pendulumStates = new Map<string, { angle: number; angularVelocity: number; lastTime: number }>()

/**
 * Create the pendulum animation model
 */
export function createPendulumModel(): AnimationModel {
  return {
    metadata: {
      type: 'pendulum',
      name: 'Pendulum Motion',
      version: '2.0.0',
      category: 'builtin',
      description: 'Physics-based pendulum simulation with gravity and damping',
      tags: ['physics', 'swing', 'pendulum', 'gravity'],
      icon: 'Activity',
    },
    
    parameters: {
      anchorPoint: {
        type: 'position',
        default: { x: 0, y: 5, z: 0 },
        label: 'Anchor Point',
        description: 'Pivot point of the pendulum',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      length: {
        type: 'number',
        default: 3,
        label: 'Length',
        description: 'Length of the pendulum',
        group: 'Physics',
        order: 1,
        min: 0.1,
        max: 20,
        step: 0.1,
        unit: 'm',
        uiComponent: 'slider',
      },
      initialAngle: {
        type: 'number',
        default: 45,
        label: 'Initial Angle',
        description: 'Starting angle in degrees',
        group: 'Physics',
        order: 2,
        min: -90,
        max: 90,
        step: 1,
        unit: 'deg',
        uiComponent: 'slider',
      },
      damping: {
        type: 'number',
        default: 0.02,
        label: 'Damping',
        description: 'Energy loss per cycle',
        group: 'Physics',
        order: 3,
        min: 0,
        max: 1,
        step: 0.01,
        uiComponent: 'slider',
      },
      gravity: {
        type: 'number',
        default: 9.81,
        label: 'Gravity',
        description: 'Gravity strength',
        group: 'Physics',
        order: 4,
        min: 0,
        max: 20,
        step: 0.1,
        unit: 'm/s²',
        uiComponent: 'slider',
      },
      plane: {
        type: 'enum',
        default: 'xz',
        label: 'Swing Plane',
        description: 'Plane of pendulum swing',
        group: 'Physics',
        order: 5,
        options: ['xy', 'xz', 'yz'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'anchorPoint', type: 'anchor' }
      ],
      generatePath: (controlPoints, params, segments = 30) => {
        if (controlPoints.length < 1) return []
        const anchor = controlPoints[0]
        const length = params.pendulumLength || 3
        const maxAngle = ((params.maxAngle || params.initialAngle || 45) * Math.PI) / 180
        const plane = params.plane || 'xz'
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * 2 - 1
          const angle = t * maxAngle
          const point = { x: anchor.x, y: anchor.y, z: anchor.z }
          
          if (plane === 'xz') {
            point.x += Math.sin(angle) * length
            point.z -= Math.cos(angle) * length
          } else if (plane === 'yz') {
            point.y += Math.cos(angle) * length
            point.z += Math.sin(angle) * length
          } else {
            point.x += Math.sin(angle) * length
            point.y -= Math.cos(angle) * length
          }
          points.push(point)
        }
        return points
      },
      pathStyle: { type: 'arc', segments: 30 },
      positionParameter: 'anchorPoint',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, anchorPoint: controlPoints[0] }
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
      // Initialize pendulum state
      const stateKey = context.trackId
      const initialAngleDeg = parameters.initialAngle || 45
      pendulumStates.set(stateKey, {
        angle: (initialAngleDeg * Math.PI) / 180,
        angularVelocity: 0,
        lastTime: 0
      })
    },
    
    cleanup: function(context: CalculationContext) {
      // Clean up state when animation stops
      const stateKey = context.trackId
      pendulumStates.delete(stateKey)
    },
    
    calculate: function(
      parameters: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      // V3: Pure function - just use parameters, no mode checks
      // Transforms are applied AFTER calculation in animationStore
      const anchorPoint = parameters.anchorPoint || { x: 0, y: 5, z: 0 }
      const length = parameters.length || 3
      const damping = parameters.damping || 0.02
      const gravity = parameters.gravity || 9.81
      const plane = parameters.plane || 'xz'
      
      // Get or create state
      const stateKey = context.trackId
      let state = pendulumStates.get(stateKey)
      
      if (!state || time < 0.01 || state.lastTime > time) {
        // Reset state
        const initialAngleDeg = parameters.initialAngle || 45
        state = {
          angle: (initialAngleDeg * Math.PI) / 180,
          angularVelocity: 0,
          lastTime: 0
        }
        pendulumStates.set(stateKey, state)
      }
      
      // Physics simulation
      const dt = Math.min(time - state.lastTime, 0.1)
      if (dt > 0) {
        const angularAcceleration = -(gravity / length) * Math.sin(state.angle) - damping * state.angularVelocity
        state.angularVelocity += angularAcceleration * dt
        state.angle += state.angularVelocity * dt
      }
      state.lastTime = time
      
      // Convert angle to position based on plane
      let x = anchorPoint.x
      let y = anchorPoint.y
      let z = anchorPoint.z
      
      switch (plane) {
        case 'xy':
          x = anchorPoint.x + length * Math.sin(state.angle)
          y = anchorPoint.y - length * Math.cos(state.angle)
          break
        case 'xz':
          x = anchorPoint.x + length * Math.sin(state.angle)
          z = anchorPoint.z - length * Math.cos(state.angle)
          break
        case 'yz':
          y = anchorPoint.y + length * Math.sin(state.angle)
          z = anchorPoint.z - length * Math.cos(state.angle)
          break
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        anchorPoint: { x: trackPosition.x, y: trackPosition.y + 5, z: trackPosition.z },
        length: 3,
        initialAngle: 45,
        damping: 0.02,
        gravity: 9.81,
        plane: 'xz',
      }
    },
  }
}

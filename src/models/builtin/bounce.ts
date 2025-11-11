import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createBounceModel(): AnimationModel {
  return {
    metadata: {
      name: 'Bounce Motion',
      version: '1.0.0',
      author: 'System',
      description: 'Realistic bouncing physics with gravity',
      category: 'physics',
      type: 'bounce',
      tags: ['physics', 'gravity', 'bounce'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      startHeight: { type: 'number', default: 5, min: 0, max: 20, label: 'Start Height' },
      groundLevel: { type: 'number', default: 0, min: -10, max: 10, label: 'Ground Level' },
      bounciness: { type: 'number', default: 0.7, min: 0, max: 1, label: 'Bounciness' },
      gravity: { type: 'number', default: 9.8, min: 0, max: 20, label: 'Gravity' },
      dampingPerBounce: { type: 'number', default: 0.1, min: 0, max: 1, label: 'Damping per Bounce' },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      
      // Determine center based on multi-track mode
      let centerX = params.centerX ?? 0
      let centerY = params.centerY ?? 0
      let centerZ = params.centerZ ?? 0
      
      
      const startHeight = params.startHeight ?? 5
      const groundLevel = params.groundLevel ?? 0
      const bounciness = params.bounciness ?? 0.7
      const gravity = params.gravity ?? 9.8
      const dampingPerBounce = params.dampingPerBounce ?? 0.1
      
      // Simplified bounce physics
      let totalTime = 0
      let currentHeight = startHeight
      let currentVelocity = 0
      let bounceCount = 0
      let effectiveDamping = 1
      
      // Calculate position at current time
      while (totalTime < time && bounceCount < 20) {
        // Time to hit ground from current height
        const fallTime = Math.sqrt(2 * (currentHeight - groundLevel) / gravity)
        
        if (totalTime + fallTime > time) {
          // We're in the falling phase
          const dt = time - totalTime
          const y = currentHeight - 0.5 * gravity * dt * dt
          return { x: centerX, y: Math.max(groundLevel, y), z: centerZ }
        }
        
        // Bounce
        totalTime += fallTime
        currentVelocity = Math.sqrt(2 * gravity * (currentHeight - groundLevel)) * bounciness * effectiveDamping
        
        // Time to reach peak after bounce
        const riseTime = currentVelocity / gravity
        
        if (totalTime + riseTime > time) {
          // We're in the rising phase
          const dt = time - totalTime
          const y = groundLevel + currentVelocity * dt - 0.5 * gravity * dt * dt
          return { x: centerX, y, z: centerZ }
        }
        
        // Prepare for next bounce
        totalTime += riseTime
        currentHeight = groundLevel + (currentVelocity * currentVelocity) / (2 * gravity)
        effectiveDamping *= (1 - dampingPerBounce)
        bounceCount++
        
        // Stop if bounce is too small
        if (currentHeight - groundLevel < 0.01) break
      }
      
      // After all bounces, stay on ground
      return { x: centerX, y: groundLevel, z: centerZ }
    },
    
    getDefaultParameters(position?: Position) {
      return {
        centerX: position?.x ?? 0,
        centerY: position?.y ?? 0,
        centerZ: position?.z ?? 0,
        startHeight: 5,
        groundLevel: 0,
        bounciness: 0.7,
        gravity: 9.8,
        dampingPerBounce: 0.1,
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 50) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const height = params.initialHeight || 5
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const y = center.y + height * (1 - (2 * t - 1) ** 2)
          points.push({ x: center.x, y, z: center.z })
        }
        return points
      },
      pathStyle: { type: 'arc', segments: 50 },
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

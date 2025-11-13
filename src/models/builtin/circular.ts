import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

/**
 * Create the circular animation model
 */
export function createCircularModel(): AnimationModel {
  return {
    metadata: {
      type: 'circular',
      name: 'Circular Motion',
      version: '3.0.0',
      category: 'builtin',
      description: 'Smooth circular motion in 3D space with configurable radius, speed, and orientation',
     
      tags: ['basic', 'rotation', 'orbit', 'circle'],
      icon: 'Circle',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the circular path',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Radius',
        description: 'Radius of the circular path',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 50,
        step: 0.1,
        unit: 'm',
        uiComponent: 'slider',
      },
      speed: {
        type: 'number',
        default: 1,
        label: 'Speed',
        description: 'Rotations per duration',
        group: 'Motion',
        order: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: 'rot/s',
        uiComponent: 'slider',
      },
      startAngle: {
        type: 'number',
        default: 0,
        label: 'Start Angle',
        description: 'Starting angle in degrees',
        group: 'Motion',
        order: 3,
        min: 0,
        max: 360,
        step: 1,
        unit: 'deg',
        uiComponent: 'slider',
      },
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the circular path in 3D space',
        group: 'Orientation',
        order: 4,
        uiComponent: 'rotation3d',
      },
      direction: {
        type: 'enum',
        default: 'clockwise',
        label: 'Direction',
        description: 'Direction of rotation',
        group: 'Motion',
        order: 5,
        options: ['clockwise', 'counterclockwise'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { 
          parameter: 'center', 
          type: 'center',
          enabledModes: ['translate', 'rotate']
        }
      ],
      generatePath: (controlPoints, params, segments = 64) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const radius = params.radius ?? 5
        const startAngle = ((params.startAngle || 0) * Math.PI) / 180
        const direction = params.direction || 'clockwise'
        const angleDirection = direction === 'clockwise' ? -1 : 1
        const points = []
        
        // Always generate circle in XY plane - rotation is applied generically after
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2
          const angle = startAngle + t * angleDirection
          points.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
            z: center.z
          })
        }
        return points
      },
      pathStyle: {
        type: 'closed',
        segments: 64
      },
      positionParameter: 'center',
      calculateRotationAngle: (time, duration, params) => {
        const speed = params.speed || 1
        const startAngle = (params.startAngle || 0) * Math.PI / 180
        const direction = params.direction || 'clockwise'
        const progress = duration > 0 ? time / duration : 0
        const rotations = progress * speed
        const angleDirection = direction === 'clockwise' ? -1 : 1
        return startAngle + (rotations * Math.PI * 2 * angleDirection)
      },
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
      cacheKey: ['radius', 'speed', 'rotation', 'direction'],
    },
    
    calculate: function(
      parameters: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      // V3: Pure function - just use parameters, no mode checks
      // Transforms are applied AFTER calculation in animationStore
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const radius = parameters.radius || 5
      const speed = parameters.speed || 1
      const startAngle = (parameters.startAngle || 0) * Math.PI / 180
      const rotation = parameters.rotation || { x: 0, y: 0, z: 0 }
      const direction = parameters.direction || 'clockwise'
      
      // Calculate angle based on time
      const progress = duration > 0 ? (time / duration) : 0
      const rotations = progress * speed
      const angleDirection = direction === 'clockwise' ? -1 : 1
      const angle = startAngle + (rotations * Math.PI * 2 * angleDirection)
      
      // Calculate position in XY plane
      const basePos: Position = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        z: center.z
      }
      
      // Apply rotation if specified
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        const rotated = applyRotationToPath([basePos], center, rotation)
        return rotated[0]
      }
      
      return basePos
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
        speed: 1,
        startAngle: 0,
        rotation: { x: 0, y: 0, z: 0 },
        direction: 'clockwise',
      }
    },
    
    validateParameters: function(parameters: Record<string, any>) {
      const errors: string[] = []
      
      if (parameters.radius !== undefined && parameters.radius <= 0) {
        errors.push('Radius must be positive')
      }
      
      if (parameters.speed !== undefined && parameters.speed <= 0) {
        errors.push('Speed must be positive')
      }
      
      return {
        valid: errors.length === 0,
        errors
      }
    }
  }
}

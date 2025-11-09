import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the circular scan animation model
 */
export function createCircularScanModel(): AnimationModel {
  return {
    metadata: {
      type: 'circular-scan',
      name: 'Circular Scan',
      version: '1.0.0',
      category: 'builtin',
      description: 'Scanning pattern sweeping around a circle',
      tags: ['spatial-audio', 'scan', 'sweep', 'circular'],
      icon: 'Radar',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the circular scan',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      radius: {
        type: 'number',
        default: 5,
        label: 'Radius',
        description: 'Radius of the scan circle',
        group: 'Shape',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      height: {
        type: 'number',
        default: 0,
        label: 'Height',
        description: 'Height offset from center',
        group: 'Shape',
        order: 2,
        min: -10,
        max: 10,
        uiComponent: 'slider',
      },
      sweepCount: {
        type: 'number',
        default: 2,
        label: 'Sweep Count',
        description: 'Number of complete scans',
        group: 'Motion',
        order: 1,
        min: 0.25,
        max: 10,
        step: 0.25,
        uiComponent: 'slider',
      },
      startAngle: {
        type: 'number',
        default: 0,
        label: 'Start Angle',
        description: 'Starting angle in degrees',
        group: 'Motion',
        order: 2,
        min: 0,
        max: 360,
        unit: 'deg',
        uiComponent: 'slider',
      },
    },
    
    supportedModes: ['identical', 'phase-offset'],
    defaultMultiTrackMode: 'phase-offset',
    
    visualization: {
      controlPoints: [{ parameter: 'center', type: 'center' }],
      generatePath: (controlPoints, params, segments = 64) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const radius = params.radius || 5
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          points.push({
            x: center.x + Math.cos(angle) * radius,
            y: center.y,
            z: center.z + Math.sin(angle) * radius
          })
        }
        return points
      },
      pathStyle: { type: 'closed', segments: 64 },
      positionParameter: 'center',
      calculateRotationAngle: (time, duration, params) => {
        const startAngle = (params.startAngle || 0) * Math.PI / 180
        const t = duration > 0 ? Math.min(time / duration, 1) : 0
        return startAngle + t * 2 * Math.PI
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
    },
    
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      const progress = Math.min(time / duration, 1)
      
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const radius = parameters.radius || 5
      const height = parameters.height || 0
      const sweepCount = parameters.sweepCount || 2
      const startAngle = (parameters.startAngle || 0) * Math.PI / 180
      
      // Calculate angle
      const angle = startAngle + progress * sweepCount * 2 * Math.PI
      
      // Circular position
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        z: center.z + height,
      }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        radius: 5,
        height: 0,
        sweepCount: 2,
        startAngle: 0,
      }
    },
  }
}

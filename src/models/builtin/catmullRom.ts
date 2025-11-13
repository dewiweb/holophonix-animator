import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the Catmull-Rom spline animation model
 */
export function createCatmullRomModel(): AnimationModel {
  return {
    metadata: {
      type: 'catmull-rom',
      name: 'Catmull-Rom Spline',
      version: '1.0.0',
      category: 'builtin',
      description: 'Smooth curve through multiple control points',
      tags: ['curve', 'spline', 'path', 'smooth'],
      icon: 'BezierCurve',
    },
    
    parameters: {
      controlPoints: {
        type: 'array',
        default: [
          { x: -5, y: 0, z: 0 },
          { x: -2, y: 3, z: 0 },
          { x: 2, y: -3, z: 0 },
          { x: 5, y: 0, z: 0 }
        ],
        label: 'Control Points',
        description: 'Array of positions defining the spline',
        group: 'Path',
        order: 1,
        arrayType: 'position',
        arrayMin: 4,
      },
      tension: {
        type: 'number',
        default: 0.5,
        label: 'Tension',
        description: 'Curve tension (0 = loose, 1 = tight)',
        group: 'Shape',
        order: 1,
        min: 0,
        max: 1,
        step: 0.1,
        uiComponent: 'slider',
      },
      closed: {
        type: 'boolean',
        default: false,
        label: 'Closed Loop',
        description: 'Whether the spline forms a closed loop',
        group: 'Shape',
        order: 2,
        uiComponent: 'checkbox',
      },
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [{ parameter: 'controlPoints', type: 'control' }],
      generatePath: (controlPoints, params, segments = 100) => {
        const points = params.controlPoints || controlPoints
        if (!points || points.length < 4) return points || []
        
        const tension = params.tension ?? 0.5
        const closed = params.closed === true
        const numSegments = closed ? points.length : points.length - 3
        
        const interpolatedPoints: Position[] = []
        
        const getPoint = (index: number): Position => {
          if (closed) {
            return points[index % points.length]
          }
          return points[Math.max(0, Math.min(points.length - 1, index))]
        }
        
        // Generate interpolated points along the spline
        const stepsPerSegment = Math.ceil(segments / numSegments)
        
        for (let seg = 0; seg < numSegments; seg++) {
          const p0 = getPoint(seg)
          const p1 = getPoint(seg + 1)
          const p2 = getPoint(seg + 2)
          const p3 = getPoint(seg + 3)
          
          for (let i = 0; i < stepsPerSegment; i++) {
            const t = i / stepsPerSegment
            const t2 = t * t
            const t3 = t2 * t
            
            // X coordinate
            const v0x = (p2.x - p0.x) * tension
            const v1x = (p3.x - p1.x) * tension
            const x = (2 * p1.x - 2 * p2.x + v0x + v1x) * t3 +
                      (-3 * p1.x + 3 * p2.x - 2 * v0x - v1x) * t2 +
                      v0x * t + p1.x
            
            // Y coordinate
            const v0y = (p2.y - p0.y) * tension
            const v1y = (p3.y - p1.y) * tension
            const y = (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
                      (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
                      v0y * t + p1.y
            
            // Z coordinate
            const v0z = (p2.z - p0.z) * tension
            const v1z = (p3.z - p1.z) * tension
            const z = (2 * p1.z - 2 * p2.z + v0z + v1z) * t3 +
                      (-3 * p1.z + 3 * p2.z - 2 * v0z - v1z) * t2 +
                      v0z * t + p1.z
            
            interpolatedPoints.push({ x, y, z })
          }
        }
        
        // Add final point if not closed
        if (!closed) {
          interpolatedPoints.push(points[points.length - 1])
        }
        
        return interpolatedPoints
      },
      pathStyle: { type: 'curve', segments: 100 },
      positionParameter: 'controlPoints',
      updateFromControlPoints: (controlPoints, params) => {
        return { ...params, controlPoints }
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
      const controlPoints = parameters.controlPoints || [
        { x: -5, y: 0, z: 0 },
        { x: -2, y: 3, z: 0 },
        { x: 2, y: -3, z: 0 },
        { x: 5, y: 0, z: 0 }
      ]
      const tension = parameters.tension ?? 0.5
      const closed = parameters.closed === true
      
      if (!controlPoints || controlPoints.length < 4) {
        return controlPoints?.[0] || { x: 0, y: 0, z: 0 }
      }
      
      const progress = Math.min(time / duration, 1)
      const numSegments = closed ? controlPoints.length : controlPoints.length - 3
      const totalProgress = progress * numSegments
      const segmentIndex = Math.floor(totalProgress)
      const segmentProgress = totalProgress - segmentIndex
      
      // Get four control points for this segment
      const getPoint = (index: number): Position => {
        if (closed) {
          return controlPoints[index % controlPoints.length]
        }
        return controlPoints[Math.max(0, Math.min(controlPoints.length - 1, index))]
      }
      
      let p0 = getPoint(segmentIndex)
      let p1 = getPoint(segmentIndex + 1)
      let p2 = getPoint(segmentIndex + 2)
      let p3 = getPoint(segmentIndex + 3)
      
      
      // Catmull-Rom interpolation
      const t = segmentProgress
      const t2 = t * t
      const t3 = t2 * t
      
      const v0 = (p2.x - p0.x) * tension
      const v1 = (p3.x - p1.x) * tension
      const x = (2 * p1.x - 2 * p2.x + v0 + v1) * t3 +
                (-3 * p1.x + 3 * p2.x - 2 * v0 - v1) * t2 +
                v0 * t + p1.x
      
      const v0y = (p2.y - p0.y) * tension
      const v1y = (p3.y - p1.y) * tension
      const y = (2 * p1.y - 2 * p2.y + v0y + v1y) * t3 +
                (-3 * p1.y + 3 * p2.y - 2 * v0y - v1y) * t2 +
                v0y * t + p1.y
      
      const v0z = (p2.z - p0.z) * tension
      const v1z = (p3.z - p1.z) * tension
      const z = (2 * p1.z - 2 * p2.z + v0z + v1z) * t3 +
                (-3 * p1.z + 3 * p2.z - 2 * v0z - v1z) * t2 +
                v0z * t + p1.z
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        controlPoints: [
          { ...trackPosition, x: trackPosition.x - 5 },
          { ...trackPosition, x: trackPosition.x - 2, y: trackPosition.y + 3 },
          { ...trackPosition, x: trackPosition.x + 2, y: trackPosition.y - 3 },
          { ...trackPosition, x: trackPosition.x + 5 },
        ],
        tension: 0.5,
        closed: false,
      }
    },
  }
}

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const t2 = t * t
  const t3 = t2 * t
  const mt = 1 - t
  const mt2 = mt * mt
  const mt3 = mt2 * mt
  return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3
}

export function createBezierModel(): AnimationModel {
  return {
    metadata: {
      name: 'Bezier Curve',
      version: '1.0.0',
      author: 'System',
      description: 'Cubic Bezier curve animation',
      category: 'curve',
      type: 'bezier',
      tags: ['curve', 'path', 'bezier'],
    },
    
    parameters: {
      startX: { type: 'number', default: -5, min: -100, max: 100, label: 'Start X' },
      startY: { type: 'number', default: 0, min: -100, max: 100, label: 'Start Y' },
      startZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Start Z' },
      control1X: { type: 'number', default: -2, min: -100, max: 100, label: 'Control 1 X' },
      control1Y: { type: 'number', default: 5, min: -100, max: 100, label: 'Control 1 Y' },
      control1Z: { type: 'number', default: 2, min: -100, max: 100, label: 'Control 1 Z' },
      control2X: { type: 'number', default: 2, min: -100, max: 100, label: 'Control 2 X' },
      control2Y: { type: 'number', default: 5, min: -100, max: 100, label: 'Control 2 Y' },
      control2Z: { type: 'number', default: -2, min: -100, max: 100, label: 'Control 2 Z' },
      endX: { type: 'number', default: 5, min: -100, max: 100, label: 'End X' },
      endY: { type: 'number', default: 0, min: -100, max: 100, label: 'End Y' },
      endZ: { type: 'number', default: 0, min: -100, max: 100, label: 'End Z' },
      easingType: {
        type: 'enum',
        default: 'linear',
        options: ['linear', 'ease-in', 'ease-out', 'ease-in-out'],
        label: 'Easing'
      },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      const progress = duration > 0 ? time / duration : 0
      
      // Get base points
      let start = { x: params.startX ?? -5, y: params.startY ?? 0, z: params.startZ ?? 0 }
      let control1 = { x: params.control1X ?? -2, y: params.control1Y ?? 5, z: params.control1Z ?? 2 }
      let control2 = { x: params.control2X ?? 2, y: params.control2Y ?? 5, z: params.control2Z ?? -2 }
      let end = { x: params.endX ?? 5, y: params.endY ?? 0, z: params.endZ ?? 0 }
      
      // Handle multi-track modes
      const multiTrackMode = params._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'relative') {
        // For position-relative, offset the entire curve
        if (context?.trackOffset) {
          const offset = context.trackOffset
          start = { x: start.x + offset.x, y: start.y + offset.y, z: start.z + offset.z }
          control1 = { x: control1.x + offset.x, y: control1.y + offset.y, z: control1.z + offset.z }
          control2 = { x: control2.x + offset.x, y: control2.y + offset.y, z: control2.z + offset.z }
          end = { x: end.x + offset.x, y: end.y + offset.y, z: end.z + offset.z }
        }
      } else if (multiTrackMode === 'formation' && params._isobarycenter) {
        // For formation mode, move entire curve to barycenter
        const center = params._isobarycenter
        const curveCenter = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          z: (start.z + end.z) / 2
        }
        const offset = {
          x: center.x - curveCenter.x,
          y: center.y - curveCenter.y,
          z: center.z - curveCenter.z
        }
        start = { x: start.x + offset.x, y: start.y + offset.y, z: start.z + offset.z }
        control1 = { x: control1.x + offset.x, y: control1.y + offset.y, z: control1.z + offset.z }
        control2 = { x: control2.x + offset.x, y: control2.y + offset.y, z: control2.z + offset.z }
        end = { x: end.x + offset.x, y: end.y + offset.y, z: end.z + offset.z }
        
        // Apply track offset for formation
        if (params._trackOffset) {
          const trackOffset = params._trackOffset
          start = { x: start.x + trackOffset.x, y: start.y + trackOffset.y, z: start.z + trackOffset.z }
          control1 = { x: control1.x + trackOffset.x, y: control1.y + trackOffset.y, z: control1.z + trackOffset.z }
          control2 = { x: control2.x + trackOffset.x, y: control2.y + trackOffset.y, z: control2.z + trackOffset.z }
          end = { x: end.x + trackOffset.x, y: end.y + trackOffset.y, z: end.z + trackOffset.z }
        }
      } else if (multiTrackMode === 'shared' && params._centeredPoint) {
        // For centered mode, move curve to center point
        const center = params._centeredPoint
        const curveCenter = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          z: (start.z + end.z) / 2
        }
        const offset = {
          x: center.x - curveCenter.x,
          y: center.y - curveCenter.y,
          z: center.z - curveCenter.z
        }
        start = { x: start.x + offset.x, y: start.y + offset.y, z: start.z + offset.z }
        control1 = { x: control1.x + offset.x, y: control1.y + offset.y, z: control1.z + offset.z }
        control2 = { x: control2.x + offset.x, y: control2.y + offset.y, z: control2.z + offset.z }
        end = { x: end.x + offset.x, y: end.y + offset.y, z: end.z + offset.z }
      }
      
      // Apply easing
      let t = progress
      const easing = params.easingType || 'linear'
      switch (easing) {
        case 'ease-in':
          t = t * t
          break
        case 'ease-out':
          t = 1 - (1 - t) * (1 - t)
          break
        case 'ease-in-out':
          t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
          break
      }
      
      return {
        x: cubicBezier(t, start.x, control1.x, control2.x, end.x),
        y: cubicBezier(t, start.y, control1.y, control2.y, end.y),
        z: cubicBezier(t, start.z, control1.z, control2.z, end.z),
      }
    },
    
    getDefaultParameters(position?: Position) {
      const pos = position || { x: 0, y: 0, z: 0 }
      return {
        startX: pos.x - 5,
        startY: pos.y,
        startZ: pos.z,
        control1X: pos.x - 2,
        control1Y: pos.y + 5,
        control1Z: pos.z + 2,
        control2X: pos.x + 2,
        control2Y: pos.y + 5,
        control2Z: pos.z - 2,
        endX: pos.x + 5,
        endY: pos.y,
        endZ: pos.z,
        easingType: 'linear',
      }
    },
    
    supportedModes: ['identical', 'phase-offset', 'position-relative', 'phase-offset-relative', 'isobarycenter', 'centered'],
    defaultMultiTrackMode: 'position-relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'start', type: 'start' },
        { parameter: 'control1', type: 'control' },
        { parameter: 'control2', type: 'control' },
        { parameter: 'end', type: 'end' }
      ],
      generatePath: (controlPoints, params, segments = 50) => {
        if (controlPoints.length < 4) return []
        const points = []
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const mt = 1 - t
          const mt2 = mt * mt
          const mt3 = mt2 * mt
          const t2 = t * t
          const t3 = t2 * t
          
          points.push({
            x: mt3 * controlPoints[0].x + 3 * mt2 * t * controlPoints[1].x + 3 * mt * t2 * controlPoints[2].x + t3 * controlPoints[3].x,
            y: mt3 * controlPoints[0].y + 3 * mt2 * t * controlPoints[1].y + 3 * mt * t2 * controlPoints[2].y + t3 * controlPoints[3].y,
            z: mt3 * controlPoints[0].z + 3 * mt2 * t * controlPoints[1].z + 3 * mt * t2 * controlPoints[2].z + t3 * controlPoints[3].z
          })
        }
        return points
      },
      pathStyle: { type: 'curve', segments: 50 },
      positionParameter: 'start',
      updateFromControlPoints: (controlPoints, params) => {
        const updated = { ...params }
        if (controlPoints.length > 0) {
          updated.startX = controlPoints[0].x
          updated.startY = controlPoints[0].y
          updated.startZ = controlPoints[0].z
        }
        if (controlPoints.length > 1) {
          updated.control1X = controlPoints[1].x
          updated.control1Y = controlPoints[1].y
          updated.control1Z = controlPoints[1].z
        }
        if (controlPoints.length > 2) {
          updated.control2X = controlPoints[2].x
          updated.control2Y = controlPoints[2].y
          updated.control2Z = controlPoints[2].z
        }
        if (controlPoints.length > 3) {
          updated.endX = controlPoints[3].x
          updated.endY = controlPoints[3].y
          updated.endZ = controlPoints[3].z
        }
        return updated
      }
    }
  }
}

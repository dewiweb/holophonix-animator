import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createEllipticalModel(): AnimationModel {
  return {
    metadata: {
      name: 'Elliptical Motion',
      version: '1.0.0',
      author: 'System',
      description: 'Smooth elliptical path animation',
      category: 'basic',
      type: 'elliptical',
      tags: ['basic', 'path', 'circular'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      radiusX: { type: 'number', default: 5, min: 0, max: 50, label: 'Radius X' },
      radiusY: { type: 'number', default: 3, min: 0, max: 50, label: 'Radius Y' },
      startAngle: { type: 'number', default: 0, min: 0, max: 360, label: 'Start Angle (deg)' },
      endAngle: { type: 'number', default: 360, min: 0, max: 720, label: 'End Angle (deg)' },
      plane: {
        type: 'enum',
        default: 'xy',
        options: ['xy', 'xz', 'yz'],
        label: 'Rotation Plane',
      },
      phase: { type: 'number', default: 0, min: -360, max: 360, label: 'Phase Offset (deg)' },
    },
    
    calculate: function(
      params: Record<string, any>, 
      time: number, 
      duration: number, 
      context: CalculationContext
    ): Position {
      const progress = duration > 0 ? time / duration : 0
      
      // Get center coordinates - support both individual coords and center object
      let centerX = params.center?.x ?? params.centerX ?? 0
      let centerY = params.center?.y ?? params.centerY ?? 0
      let centerZ = params.center?.z ?? params.centerZ ?? 0
      
      // Support multi-track modes
      const multiTrackMode = params._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Use barycenter as center of ellipse
        // STEP 2 (Store): Will add _trackOffset after calculation
        const baryCenter = params._isobarycenter || params._customCenter
        if (baryCenter) {
          centerX = baryCenter.x
          centerY = baryCenter.y
          centerZ = baryCenter.z
        }
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset center by track position
        centerX += context.trackOffset.x
        centerY += context.trackOffset.y
        centerZ += context.trackOffset.z
      }
      
      const startAngle = ((params.startAngle ?? 0) + (params.phase ?? 0)) * Math.PI / 180
      const endAngle = ((params.endAngle ?? 360) + (params.phase ?? 0)) * Math.PI / 180
      const angle = startAngle + (endAngle - startAngle) * progress
      
      const radiusX = params.radiusX ?? 5
      const radiusY = params.radiusY ?? 3
      const plane = params.plane || 'xy'
      
      let x = centerX
      let y = centerY
      let z = centerZ
      
      switch (plane) {
        case 'xy':
          x = centerX + radiusX * Math.cos(angle)
          y = centerY + radiusY * Math.sin(angle)
          break
        case 'xz':
          x = centerX + radiusX * Math.cos(angle)
          z = centerZ + radiusY * Math.sin(angle)
          break
        case 'yz':
          y = centerY + radiusX * Math.cos(angle)
          z = centerZ + radiusY * Math.sin(angle)
          break
      }
      
      // Apply track offset for position-relative mode
      if (context?.trackOffset) {
        x += context.trackOffset.x
        y += context.trackOffset.y
        z += context.trackOffset.z
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        centerX: trackPosition?.x ?? 0,
        centerY: trackPosition?.y ?? 0,
        centerZ: trackPosition?.z ?? 0,
        radiusX: 5,
        radiusY: 3,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy',
        phase: 0,
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 64) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const radiusX = params.radiusX || 5
        const radiusY = params.radiusY || 3
        const plane = params.plane || 'xy'
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const point = { x: center.x, y: center.y, z: center.z }
          
          if (plane === 'xy') {
            point.x += Math.cos(angle) * radiusX
            point.y += Math.sin(angle) * radiusY
          } else if (plane === 'xz') {
            point.x += Math.cos(angle) * radiusX
            point.z += Math.sin(angle) * radiusY
          } else if (plane === 'yz') {
            point.y += Math.cos(angle) * radiusX
            point.z += Math.sin(angle) * radiusY
          }
          points.push(point)
        }
        return points
      },
      pathStyle: { type: 'closed', segments: 64 },
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

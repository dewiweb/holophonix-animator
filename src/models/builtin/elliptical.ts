import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

export function createEllipticalModel(): AnimationModel {
  return {
    metadata: {
      name: 'Elliptical Motion',
      version: '2.0.0',
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
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the elliptical path in 3D space',
        group: 'Orientation',
        uiComponent: 'rotation3d',
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
      
      const startAngle = ((params.startAngle ?? 0) + (params.phase ?? 0)) * Math.PI / 180
      const endAngle = ((params.endAngle ?? 360) + (params.phase ?? 0)) * Math.PI / 180
      const angle = startAngle + (endAngle - startAngle) * progress
      
      const radiusX = params.radiusX ?? 5
      const radiusY = params.radiusY ?? 3
      const rotation = params.rotation || { x: 0, y: 0, z: 0 }
      
      // Calculate position in XY plane
      const basePos: Position = {
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
        z: centerZ
      }
      
      // Apply rotation if specified
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        const center = { x: centerX, y: centerY, z: centerZ }
        const rotated = applyRotationToPath([basePos], center, rotation)
        return rotated[0]
      }
      
      return basePos
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
        rotation: { x: 0, y: 0, z: 0 },
        phase: 0,
      }
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
        const radiusX = params.radiusX || 5
        const radiusY = params.radiusY || 3
        const startAngle = ((params.startAngle || 0) + (params.phase || 0)) * Math.PI / 180
        const endAngle = ((params.endAngle || 360) + (params.phase || 0)) * Math.PI / 180
        const points = []
        
        // Always generate ellipse in XY plane - rotation is applied generically after
        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = startAngle + (endAngle - startAngle) * t
          points.push({
            x: center.x + Math.cos(angle) * radiusX,
            y: center.y + Math.sin(angle) * radiusY,
            z: center.z
          })
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

import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createOrbitModel(): AnimationModel {
  return {
    metadata: {
      name: 'Orbit Motion',
      version: '1.0.0',
      author: 'System',
      description: 'Orbital motion with inclination',
      category: 'interactive',
      type: 'orbit',
      tags: ['interactive', 'orbit', 'circular'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      orbitalRadius: { type: 'number', default: 4, min: 0.5, max: 50, label: 'Orbital Radius' },
      orbitalSpeed: { type: 'number', default: 1, min: 0.1, max: 10, label: 'Orbital Speed' },
      phaseOffset: { type: 'number', default: 0, min: 0, max: 360, label: 'Phase Offset (deg)' },
      inclination: { type: 'number', default: 0, min: -90, max: 90, label: 'Inclination (deg)' },
      plane: {
        type: 'enum',
        default: 'xy',
        options: ['xy', 'xz', 'yz'],
        label: 'Orbital Plane',
      },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      const progress = duration > 0 ? time / duration : 0
      
      // Get center coordinates - support both individual coords and center object
      let centerX = params.center?.x ?? params.centerX ?? 0
      let centerY = params.center?.y ?? params.centerY ?? 0
      let centerZ = params.center?.z ?? params.centerZ ?? 0
      
      // Handle multi-track modes
      const multiTrackMode = params._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'centered' && params._centeredPoint) {
        centerX = params._centeredPoint.x
        centerY = params._centeredPoint.y
        centerZ = params._centeredPoint.z
      } else if (multiTrackMode === 'isobarycenter' && params._isobarycenter) {
        // For formation mode, use barycenter as center
        // Do NOT apply track offset here - it's applied after in animationStore.ts
        centerX = params._isobarycenter.x
        centerY = params._isobarycenter.y
        centerZ = params._isobarycenter.z
      } else if (multiTrackMode === 'position-relative') {
        if (context?.trackOffset) {
          centerX += context.trackOffset.x
          centerY += context.trackOffset.y
          centerZ += context.trackOffset.z
        }
      }
      
      const radius = params.orbitalRadius ?? 4
      const speed = params.orbitalSpeed ?? 1
      const phaseOffset = (params.phaseOffset ?? 0) * Math.PI / 180
      const inclination = (params.inclination ?? 0) * Math.PI / 180
      const plane = params.plane ?? 'xy'
      
      const angle = progress * speed * Math.PI * 2 + phaseOffset
      
      let x = centerX
      let y = centerY
      let z = centerZ
      
      // Calculate base orbital position
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      
      switch (plane) {
        case 'xy':
          x = centerX + radius * cosAngle
          y = centerY + radius * sinAngle * Math.cos(inclination)
          z = centerZ + radius * sinAngle * Math.sin(inclination)
          break
        case 'xz':
          x = centerX + radius * cosAngle * Math.cos(inclination)
          y = centerY + radius * cosAngle * Math.sin(inclination)
          z = centerZ + radius * sinAngle
          break
        case 'yz':
          x = centerX + radius * sinAngle * Math.sin(inclination)
          y = centerY + radius * cosAngle
          z = centerZ + radius * sinAngle * Math.cos(inclination)
          break
      }
      
      return { x, y, z }
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        centerX: trackPosition?.x ?? 0,
        centerY: trackPosition?.y ?? 0,
        centerZ: trackPosition?.z ?? 0,
        orbitalRadius: 4,
        orbitalSpeed: 1,
        phaseOffset: 0,
        inclination: 0,
        plane: 'xy',
      }
    },
    
    supportedModes: ['identical', 'phase-offset', 'position-relative', 'phase-offset-relative', 'isobarycenter', 'centered'],
    defaultMultiTrackMode: 'phase-offset',
  }
}

import { AnimationParameters, Position } from '@/types'

export function getDefaultParameters(
  type: string,
  trackPosition: Position = { x: 0, y: 0, z: 0 }
): AnimationParameters {
  const defaults: Record<string, AnimationParameters> = {
    linear: {
      startPosition: { ...trackPosition },
      endPosition: { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
    },
    circular: {
      center: { ...trackPosition },
      radius: 3,
      startAngle: 0,
      endAngle: 360,
      plane: 'xy'
    },
    elliptical: {
      centerX: trackPosition.x,
      centerY: trackPosition.y,
      centerZ: trackPosition.z,
      radiusX: 4,
      radiusY: 2,
      radiusZ: 0,
      startAngle: 0,
      endAngle: 360
    },
    spiral: {
      center: { ...trackPosition },
      startRadius: 1,
      endRadius: 5,
      rotations: 3,
      direction: 'clockwise',
      plane: 'xy'
    },
    random: {
      center: { ...trackPosition },
      bounds: { x: 5, y: 5, z: 5 },
      speed: 1,
      smoothness: 0.5,
      updateFrequency: 10
    },
    custom: {
      interpolation: 'linear'
    }
  }

  return defaults[type] || {}
}

import { AnimationType, AnimationParameters, Position } from '@/types'
import { getDefaultParametersForPosition } from './defaultParameters'

export const checkUserModifiedParameters = (
  animationType: AnimationType, 
  currentParams: AnimationParameters,
  originalParams: AnimationParameters | null,
  trackPosition: Position
): Record<string, boolean> => {
  const modified: Record<string, boolean> = {}
  const defaults = originalParams || getDefaultParametersForPosition(animationType, trackPosition)

  switch (animationType) {
    case 'linear':
    case 'bezier':
    case 'catmull-rom':
    case 'zigzag':
    case 'doppler':
      modified.startPosition = JSON.stringify(currentParams.startPosition) !== JSON.stringify(defaults.startPosition)
      break

    case 'circular':
    case 'spiral':
    case 'wave':
    case 'lissajous':
    case 'orbit':
    case 'rose-curve':
    case 'epicycloid':
    case 'circular-scan':
    case 'perlin-noise':
      modified.center = JSON.stringify(currentParams.center) !== JSON.stringify(defaults.center)
      break

    case 'elliptical':
      modified.centerX = currentParams.centerX !== defaults.centerX
      modified.centerY = currentParams.centerY !== defaults.centerY
      modified.centerZ = currentParams.centerZ !== defaults.centerZ
      break

    case 'pendulum':
      modified.anchorPoint = JSON.stringify(currentParams.anchorPoint) !== JSON.stringify(defaults.anchorPoint)
      break

    case 'spring':
      modified.restPosition = JSON.stringify(currentParams.restPosition) !== JSON.stringify(defaults.restPosition)
      break

    case 'bounce':
      modified.groundLevel = currentParams.groundLevel !== defaults.groundLevel
      break

    case 'attract-repel':
      modified.targetPosition = JSON.stringify(currentParams.targetPosition) !== JSON.stringify(defaults.targetPosition)
      break

    case 'zoom':
      modified.zoomCenter = JSON.stringify(currentParams.zoomCenter) !== JSON.stringify(defaults.zoomCenter)
      break

    case 'helix':
      modified.axisStart = JSON.stringify(currentParams.axisStart) !== JSON.stringify(defaults.axisStart)
      break

    case 'random':
      modified.center = JSON.stringify(currentParams.center) !== JSON.stringify(defaults.center)
      break
  }

  return modified
}

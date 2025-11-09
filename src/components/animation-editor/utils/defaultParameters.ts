import { AnimationType, AnimationParameters, Track, Position } from '@/types'
import { modelRegistry } from '@/models/registry'

export const getDefaultAnimationParameters = (type: AnimationType, track: Track | null): AnimationParameters => {
  const trackPosition = track?.initialPosition || track?.position || { x: 0, y: 0, z: 0 }
  
  // Try to get parameters from the model system first
  const model = modelRegistry.getModel(type)
  if (model && model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
    try {
      return model.getDefaultParameters(trackPosition) as AnimationParameters
    } catch (error) {
      console.warn(`Failed to get default parameters from model ${type}:`, error)
      // Fall through to legacy defaults
    }
  }
  
  // Legacy fallback (mainly for 'custom' type)
  const defaultParams: AnimationParameters = {}

  switch (type) {
    case 'linear':
      defaultParams.startPosition = { ...trackPosition }
      defaultParams.endPosition = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
      break

    case 'circular':
      defaultParams.center = { ...trackPosition }
      defaultParams.radius = 3
      defaultParams.startAngle = 0
      defaultParams.endAngle = 360
      defaultParams.plane = 'xy'
      break

    case 'elliptical':
      defaultParams.centerX = trackPosition.x
      defaultParams.centerY = trackPosition.y
      defaultParams.centerZ = trackPosition.z
      defaultParams.radiusX = 4
      defaultParams.radiusY = 2
      defaultParams.radiusZ = 0
      defaultParams.startAngle = 0
      defaultParams.endAngle = 360
      break

    case 'spiral':
      defaultParams.center = { ...trackPosition }
      defaultParams.startRadius = 1
      defaultParams.endRadius = 5
      defaultParams.rotations = 3
      defaultParams.direction = 'clockwise'
      defaultParams.plane = 'xy'
      break

    case 'random':
      defaultParams.center = { ...trackPosition }
      defaultParams.bounds = { x: 5, y: 5, z: 5 }
      defaultParams.speed = 1
      defaultParams.smoothness = 0.5
      defaultParams.updateFrequency = 10
      break

    case 'pendulum':
      defaultParams.anchorPoint = { x: trackPosition.x, y: trackPosition.y + 5, z: trackPosition.z }
      defaultParams.pendulumLength = 3
      defaultParams.initialAngle = 45
      defaultParams.damping = 0.02
      defaultParams.gravity = 9.81
      defaultParams.plane = 'xz'
      break

    case 'bounce':
      defaultParams.center = { ...trackPosition }
      defaultParams.startHeight = 10
      defaultParams.groundLevel = 0
      defaultParams.bounciness = 0.8
      defaultParams.dampingPerBounce = 0.1
      defaultParams.gravity = 9.81
      break

    case 'spring':
      defaultParams.restPosition = { ...trackPosition }
      defaultParams.springStiffness = 10
      defaultParams.dampingCoefficient = 0.5
      defaultParams.initialDisplacement = { x: 5, y: 5, z: 0 }
      defaultParams.mass = 1
      break

    case 'wave':
      defaultParams.center = { ...trackPosition }
      defaultParams.amplitude = { x: 2, y: 2, z: 1 }
      defaultParams.frequency = 1
      defaultParams.phaseOffset = 0
      defaultParams.waveType = 'sine'
      break

    case 'lissajous':
      defaultParams.center = { ...trackPosition }
      defaultParams.frequencyRatioA = 3
      defaultParams.frequencyRatioB = 2
      defaultParams.phaseDifference = 0
      defaultParams.amplitudeX = 3
      defaultParams.amplitudeY = 3
      defaultParams.amplitudeZ = 1
      break

    case 'helix':
      defaultParams.axisStart = { x: trackPosition.x, y: trackPosition.y - 5, z: trackPosition.z }
      defaultParams.axisEnd = { x: trackPosition.x, y: trackPosition.y + 5, z: trackPosition.z }
      defaultParams.helixRadius = 2
      defaultParams.helixRotations = 5
      defaultParams.direction = 'clockwise'
      break

    case 'bezier':
      defaultParams.bezierStart = { ...trackPosition }
      defaultParams.bezierControl1 = { x: trackPosition.x - 2, y: trackPosition.y + 5, z: trackPosition.z + 2 }
      defaultParams.bezierControl2 = { x: trackPosition.x + 2, y: trackPosition.y + 5, z: trackPosition.z - 2 }
      defaultParams.bezierEnd = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
      defaultParams.easingFunction = 'linear'
      break

    case 'catmull-rom':
      defaultParams.controlPoints = [
        { ...trackPosition },
        { x: trackPosition.x + 2, y: trackPosition.y + 3, z: trackPosition.z },
        { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
      ]
      defaultParams.tension = 0.5
      defaultParams.closedLoop = false
      break

    case 'zigzag':
      defaultParams.zigzagStart = { ...trackPosition }
      defaultParams.zigzagEnd = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
      defaultParams.zigzagCount = 5
      defaultParams.zigzagAmplitude = 2
      defaultParams.zigzagPlane = 'xy'
      break

    case 'perlin-noise':
      defaultParams.center = { ...trackPosition }
      defaultParams.bounds = { x: 5, y: 5, z: 5 }
      defaultParams.noiseFrequency = 1
      defaultParams.noiseOctaves = 3
      defaultParams.noisePersistence = 0.5
      defaultParams.noiseScale = 1
      defaultParams.noiseSeed = 12345
      break

    case 'rose-curve':
      defaultParams.center = { ...trackPosition }
      defaultParams.roseRadius = 3
      defaultParams.petalCount = 5
      defaultParams.roseRotation = 0
      defaultParams.plane = 'xy'
      break

    case 'epicycloid':
      defaultParams.center = { ...trackPosition }
      defaultParams.fixedCircleRadius = 3
      defaultParams.rollingCircleRadius = 1
      defaultParams.rollingSpeed = 1
      defaultParams.rollingType = 'epicycloid'
      defaultParams.plane = 'xy'
      break

    case 'orbit':
      defaultParams.center = { ...trackPosition }
      defaultParams.orbitalRadius = 4
      defaultParams.orbitalSpeed = 1
      defaultParams.orbitalPhase = 0
      defaultParams.inclination = 0
      break

    case 'formation':
      defaultParams.center = { ...trackPosition }
      defaultParams.formationShape = 'line'
      defaultParams.formationSpacing = 2
      defaultParams.followStiffness = 0.8
      break

    case 'attract-repel':
      defaultParams.center = { ...trackPosition }
      defaultParams.targetPosition = { x: 0, y: 0, z: 0 }
      defaultParams.attractionStrength = 5
      defaultParams.repulsionRadius = 1
      defaultParams.maxSpeed = 10
      break

    case 'doppler':
      defaultParams.pathStart = { x: -10, y: trackPosition.y, z: trackPosition.z }
      defaultParams.pathEnd = { x: 10, y: trackPosition.y, z: trackPosition.z }
      defaultParams.passBySpeed = 1
      break

    case 'circular-scan':
      defaultParams.center = { ...trackPosition }
      defaultParams.scanRadius = 5
      defaultParams.scanHeight = 0
      defaultParams.sweepCount = 1
      defaultParams.startAngleOffset = 0
      break

    case 'zoom':
      defaultParams.zoomCenter = { ...trackPosition }
      defaultParams.startDistance = 10
      defaultParams.endDistance = 1
      defaultParams.accelerationCurve = 'linear'
      break
  }

return defaultParams
}

export const getDefaultParametersForPosition = (animationType: AnimationType, trackPosition: Position): AnimationParameters => {
  // Use model's getDefaultParameters method instead of switch-case
  const model = modelRegistry.getModel(animationType)
  if (model && model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
    try {
      return model.getDefaultParameters(trackPosition) as AnimationParameters
    } catch (error) {
      console.warn(`Failed to get default parameters from model ${animationType}:`, error)
    }
  }
  
  // Fallback: return empty defaults (shouldn't happen with all models having getDefaultParameters)
  console.warn(`No getDefaultParameters for ${animationType}, returning empty defaults`)
  return {}
}

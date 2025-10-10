import { Position } from '@/types'

// ========================================
// KEYFRAME-BASED ANIMATIONS
// ========================================

export function calculateCustomPosition(parameters: any, time: number, duration: number, loopCount: number = 0): Position {
  const interpolation = parameters.interpolation || 'linear'
  const initialPosition = parameters.initialPosition || { x: 0, y: 0, z: 0 }
  const isFirstRide = loopCount === 0
  
  // Default keyframes for testing if none provided
  const keyframes = parameters.keyframes || [
    { time: 0, position: { x: -5, y: 0, z: 0 } },
    { time: 5, position: { x: 0, y: 5, z: 2 } },
    { time: 10, position: { x: 5, y: 0, z: 0 } }
  ]
  
  if (keyframes.length === 0) {
    return initialPosition
  }
  
  const sortedKeyframes = [...keyframes].sort((a: any, b: any) => a.time - b.time)
  const firstKeyframe = sortedKeyframes[0]
  const lastKeyframe = sortedKeyframes[sortedKeyframes.length - 1]
  
  if (keyframes.length === 1) {
    if (isFirstRide && time < firstKeyframe.time) {
      const t = Math.min(time / Math.max(firstKeyframe.time, 0.001), 1)
      return {
        x: initialPosition.x + (firstKeyframe.position.x - initialPosition.x) * t,
        y: initialPosition.y + (firstKeyframe.position.y - initialPosition.y) * t,
        z: initialPosition.z + (firstKeyframe.position.z - initialPosition.z) * t,
      }
    }
    return firstKeyframe.position
  }
  
  if (time < firstKeyframe.time && isFirstRide) {
    const t = Math.min(time / Math.max(firstKeyframe.time, 0.001), 1)
    return {
      x: initialPosition.x + (firstKeyframe.position.x - initialPosition.x) * t,
      y: initialPosition.y + (firstKeyframe.position.y - initialPosition.y) * t,
      z: initialPosition.z + (firstKeyframe.position.z - initialPosition.z) * t,
    }
  }
  
  let effectiveTime = time
  if (!isFirstRide) {
    const transitionTime = firstKeyframe.time
    const totalKeyframeTime = lastKeyframe.time - firstKeyframe.time + transitionTime
    effectiveTime = firstKeyframe.time + (time / duration) * totalKeyframeTime
  }
  
  if (effectiveTime > lastKeyframe.time) {
    const transitionTime = firstKeyframe.time || 1
    const t = Math.min((effectiveTime - lastKeyframe.time) / transitionTime, 1)
    return {
      x: lastKeyframe.position.x + (firstKeyframe.position.x - lastKeyframe.position.x) * t,
      y: lastKeyframe.position.y + (firstKeyframe.position.y - lastKeyframe.position.y) * t,
      z: lastKeyframe.position.z + (firstKeyframe.position.z - lastKeyframe.position.z) * t,
    }
  }
  
  let prevKeyframe = firstKeyframe
  let nextKeyframe = lastKeyframe
  
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (effectiveTime >= sortedKeyframes[i].time && effectiveTime <= sortedKeyframes[i + 1].time) {
      prevKeyframe = sortedKeyframes[i]
      nextKeyframe = sortedKeyframes[i + 1]
      break
    }
  }
  
  const timeDiff = nextKeyframe.time - prevKeyframe.time
  const t = timeDiff > 0 ? (effectiveTime - prevKeyframe.time) / timeDiff : 0
  
  let factor = t
  if (interpolation === 'bezier') {
    factor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  } else if (interpolation === 'step') {
    factor = t < 1 ? 0 : 1
  }
  
  return {
    x: prevKeyframe.position.x + (nextKeyframe.position.x - prevKeyframe.position.x) * factor,
    y: prevKeyframe.position.y + (nextKeyframe.position.y - prevKeyframe.position.y) * factor,
    z: prevKeyframe.position.z + (nextKeyframe.position.z - prevKeyframe.position.z) * factor,
  }
}

import { Animation, Position } from '@/types'
import { modelRuntime } from '@/models/runtime'

export interface PathPoint {
  position: Position
  time: number
  normalizedTime: number // 0 to 1
}

/**
 * Generate a path preview for an animation
 * @param animation The animation to generate path for
 * @param numPoints Number of sample points (default 100)
 * @returns Array of path points
 */
export function generateAnimationPath(
  animation: Animation,
  numPoints: number = 100
): PathPoint[] {
  const points: PathPoint[] = []
  const timeStep = animation.duration / numPoints

  for (let i = 0; i <= numPoints; i++) {
    const time = i * timeStep
    const normalizedTime = i / numPoints
    
    try {
      // Use ModelRuntime with 'preview' context to separate preview physics state from playback
      const position = modelRuntime.calculatePosition(animation, time, 0)
      
      // Validate position has valid numbers (not NaN or Infinity)
      if (
        typeof position.x === 'number' && isFinite(position.x) &&
        typeof position.y === 'number' && isFinite(position.y) &&
        typeof position.z === 'number' && isFinite(position.z)
      ) {
        points.push({ position, time, normalizedTime })
      } else {
        console.warn(`Invalid position at time ${time.toFixed(2)}s for ${animation.type} animation - skipping point`)
      }
    } catch (error) {
      console.warn(`Failed to calculate position at time ${time}:`, error)
    }
  }

  return points
}

/**
 * Generate line segments from path points for rendering
 * @param points Array of path points
 * @returns Array of segment pairs [start, end]
 */
export function generatePathSegments(
  points: PathPoint[]
): [Position, Position][] {
  const segments: [Position, Position][] = []
  
  for (let i = 0; i < points.length - 1; i++) {
    segments.push([points[i].position, points[i + 1].position])
  }
  
  return segments
}

/**
 * Generate direction indicators along the path
 * @param points Array of path points
 * @param indicatorCount Number of direction indicators
 * @returns Array of positions with direction vectors
 */
export function generateDirectionIndicators(
  points: PathPoint[],
  indicatorCount: number = 10
): Array<{ position: Position; direction: Position }> {
  const indicators: Array<{ position: Position; direction: Position }> = []
  const step = Math.max(1, Math.floor(points.length / indicatorCount))
  
  for (let i = 0; i < points.length - 1; i += step) {
    const current = points[i].position
    const next = points[i + 1].position
    
    // Calculate direction vector
    const direction = {
      x: next.x - current.x,
      y: next.y - current.y,
      z: next.z - current.z
    }
    
    // Normalize
    const length = Math.sqrt(
      direction.x ** 2 + direction.y ** 2 + direction.z ** 2
    )
    
    if (length > 0.001) {
      indicators.push({
        position: current,
        direction: {
          x: direction.x / length,
          y: direction.y / length,
          z: direction.z / length
        }
      })
    }
  }
  
  return indicators
}

/**
 * Calculate bounding box for animation path
 * @param points Array of path points
 * @returns Bounding box with min and max coordinates
 */
export function calculatePathBounds(points: PathPoint[]): {
  min: Position
  max: Position
  center: Position
  size: Position
} {
  if (points.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0, y: 0, z: 0 }
    }
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  for (const point of points) {
    minX = Math.min(minX, point.position.x)
    minY = Math.min(minY, point.position.y)
    minZ = Math.min(minZ, point.position.z)
    maxX = Math.max(maxX, point.position.x)
    maxY = Math.max(maxY, point.position.y)
    maxZ = Math.max(maxZ, point.position.z)
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    },
    size: {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ
    }
  }
}

/**
 * Get position along path at specific normalized time (0-1)
 * @param points Array of path points
 * @param normalizedTime Time from 0 to 1
 * @returns Interpolated position
 */
export function getPositionAtTime(
  points: PathPoint[],
  normalizedTime: number
): Position | null {
  if (points.length === 0) return null
  
  const clampedTime = Math.max(0, Math.min(1, normalizedTime))
  const targetIndex = clampedTime * (points.length - 1)
  const lowerIndex = Math.floor(targetIndex)
  const upperIndex = Math.ceil(targetIndex)
  
  if (lowerIndex === upperIndex) {
    return points[lowerIndex].position
  }
  
  const t = targetIndex - lowerIndex
  const lower = points[lowerIndex].position
  const upper = points[upperIndex].position
  
  return {
    x: lower.x + (upper.x - lower.x) * t,
    y: lower.y + (upper.y - lower.y) * t,
    z: lower.z + (upper.z - lower.z) * t
  }
}

/**
 * Calculate total path length
 * @param points Array of path points
 * @returns Total length of the path
 */
export function calculatePathLength(points: PathPoint[]): number {
  let totalLength = 0
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i].position
    const p2 = points[i + 1].position
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dz = p2.z - p1.z
    totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  
  return totalLength
}

import * as THREE from 'three'
import type { Animation } from '@/types'

/**
 * Generate path visualization for different animation types
 * Returns array of Vector3 points to draw as line
 */
export const generateAnimationPath = (
  animation: Animation | null,
  controlPoints: THREE.Vector3[]
): THREE.Vector3[] => {
  if (!animation || controlPoints.length === 0) {
    return []
  }

  const params = animation.parameters as any
  const points: THREE.Vector3[] = []

  switch (animation.type) {
    case 'linear':
    case 'zigzag':
    case 'doppler':
      // Straight line between points
      if (controlPoints.length >= 2) {
        return [controlPoints[0].clone(), controlPoints[controlPoints.length - 1].clone()]
      }
      break

    case 'bezier':
      // Bezier curve
      if (controlPoints.length === 4) {
        const curve = new THREE.CubicBezierCurve3(
          controlPoints[0],
          controlPoints[1],
          controlPoints[2],
          controlPoints[3]
        )
        return curve.getPoints(50)
      }
      break

    case 'catmull-rom':
      // Smooth curve through all points
      if (controlPoints.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5)
        return curve.getPoints(Math.max(50, controlPoints.length * 20))
      }
      break

    case 'circular':
    case 'orbit':
    case 'circular-scan':
      // Circle around center point
      // NOTE: params.plane is in APP coordinate space (Z-up)
      // Need to map to Three.js coordinate space (Y-up)
      if (controlPoints.length >= 1 && params.radius) {
        const center = controlPoints[0] // Already converted to Three.js space
        const radius = params.radius
        const segments = 64
        const plane = params.plane || 'xy' // App coordinate space

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const point = new THREE.Vector3()

          // Map app plane to Three.js plane
          // App XY (horizontal) → Three XZ (horizontal)
          // App XZ (vertical front) → Three XY (vertical front)
          // App YZ (vertical side) → Three YZ (vertical side)
          if (plane === 'xy') {
            // App XY (horizontal, Z up) → Three XZ (horizontal, Y up)
            point.x = center.x + Math.cos(angle) * radius
            point.y = center.y
            point.z = center.z + Math.sin(angle) * radius
          } else if (plane === 'xz') {
            // App XZ (vertical front, Y forward) → Three XY (vertical front, Z forward)
            point.x = center.x + Math.cos(angle) * radius
            point.y = center.y + Math.sin(angle) * radius
            point.z = center.z
          } else if (plane === 'yz') {
            // App YZ (vertical side, X right) → Three YZ (vertical side, X right)
            point.x = center.x
            point.y = center.y + Math.cos(angle) * radius
            point.z = center.z + Math.sin(angle) * radius
          }

          points.push(point)
        }
        return points
      }
      break

    case 'elliptical':
      // Ellipse around center
      if (controlPoints.length >= 1 && params.radiusX && params.radiusY) {
        const center = controlPoints[0]
        const segments = 64

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          points.push(new THREE.Vector3(
            center.x + Math.cos(angle) * params.radiusX,
            center.y + Math.sin(angle) * params.radiusY,
            center.z + (params.radiusZ ? Math.sin(angle) * params.radiusZ : 0)
          ))
        }
        return points
      }
      break

    case 'spiral':
      // Spiral expanding from center
      // NOTE: params.plane is in APP coordinate space (Z-up)
      if (controlPoints.length >= 1 && params.startRadius && params.endRadius) {
        const center = controlPoints[0] // Already converted to Three.js space
        const rotations = params.rotations || 3
        const segments = 100
        const plane = params.plane || 'xy' // App coordinate space

        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * rotations * Math.PI * 2
          const radius = params.startRadius + t * (params.endRadius - params.startRadius)
          const point = new THREE.Vector3()

          // Map app plane to Three.js plane
          if (plane === 'xy') {
            // App XY (horizontal) → Three XZ (horizontal)
            point.x = center.x + Math.cos(angle) * radius
            point.y = center.y
            point.z = center.z + Math.sin(angle) * radius
          } else if (plane === 'xz') {
            // App XZ (vertical front) → Three XY (vertical front)
            point.x = center.x + Math.cos(angle) * radius
            point.y = center.y + Math.sin(angle) * radius
            point.z = center.z
          } else if (plane === 'yz') {
            // App YZ (vertical side) → Three YZ (vertical side)
            point.x = center.x
            point.y = center.y + Math.cos(angle) * radius
            point.z = center.z + Math.sin(angle) * radius
          }

          points.push(point)
        }
        return points
      }
      break

    case 'helix':
      // Helix along axis
      if (controlPoints.length >= 2 && params.radius && params.rotations) {
        const start = controlPoints[0]
        const end = controlPoints[1]
        const segments = 100

        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * params.rotations * Math.PI * 2
          
          // Interpolate along axis
          const axisPoint = start.clone().lerp(end, t)
          
          // Add circular offset perpendicular to axis
          const axis = end.clone().sub(start).normalize()
          const perpendicular1 = new THREE.Vector3(
            axis.y,
            -axis.x,
            0
          ).normalize()
          const perpendicular2 = new THREE.Vector3().crossVectors(axis, perpendicular1).normalize()
          
          const offset = perpendicular1.multiplyScalar(Math.cos(angle) * params.radius)
            .add(perpendicular2.multiplyScalar(Math.sin(angle) * params.radius))
          
          points.push(axisPoint.add(offset))
        }
        return points
      }
      break

    case 'wave':
    case 'lissajous':
      // Oscillating path around center
      if (controlPoints.length >= 1 && params.amplitudeX) {
        const center = controlPoints[0]
        const segments = 100
        const ampX = params.amplitudeX || 1
        const ampY = params.amplitudeY || 1
        const ampZ = params.amplitudeZ || 0

        for (let i = 0; i <= segments; i++) {
          const t = i / segments
          const angle = t * Math.PI * 2 * (params.frequency || 1)
          
          points.push(new THREE.Vector3(
            center.x + Math.sin(angle) * ampX,
            center.y + Math.sin(angle * (params.frequencyRatioB || 1)) * ampY,
            center.z + Math.sin(angle) * ampZ
          ))
        }
        return points
      }
      break

    case 'pendulum':
      // Arc showing pendulum swing
      if (controlPoints.length >= 1 && params.length && params.maxAngle) {
        const anchor = controlPoints[0]
        const length = params.length
        const maxAngle = (params.maxAngle * Math.PI) / 180
        const segments = 30

        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * 2 - 1 // -1 to 1
          const angle = t * maxAngle
          
          points.push(new THREE.Vector3(
            anchor.x + Math.sin(angle) * length,
            anchor.y - Math.cos(angle) * length,
            anchor.z
          ))
        }
        return points
      }
      break

    case 'rose-curve':
    case 'epicycloid':
      // Complex parametric curves around center
      // NOTE: params.plane is in APP coordinate space (Z-up)
      if (controlPoints.length >= 1 && (params.radius || params.roseRadius || params.fixedCircleRadius)) {
        const center = controlPoints[0] // Already converted to Three.js space
        const segments = 200
        const radius = params.radius || params.roseRadius || params.fixedCircleRadius
        const n = params.petalCount || params.rollingCircleRadius || 5
        const plane = params.plane || 'xy' // App coordinate space

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const r = radius * Math.sin(n * angle)
          const point = new THREE.Vector3()
          
          // Map app plane to Three.js plane
          if (plane === 'xy') {
            // App XY (horizontal) → Three XZ (horizontal)
            point.x = center.x + Math.cos(angle) * r
            point.y = center.y
            point.z = center.z + Math.sin(angle) * r
          } else if (plane === 'xz') {
            // App XZ (vertical front) → Three XY (vertical front)
            point.x = center.x + Math.cos(angle) * r
            point.y = center.y + Math.sin(angle) * r
            point.z = center.z
          } else if (plane === 'yz') {
            // App YZ (vertical side) → Three YZ (vertical side)
            point.x = center.x
            point.y = center.y + Math.cos(angle) * r
            point.z = center.z + Math.sin(angle) * r
          }
          
          points.push(point)
        }
        return points
      }
      break

    default:
      // For other types, just connect control points if we have them
      if (controlPoints.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.5)
        return curve.getPoints(50)
      }
      break
  }

  return points
}

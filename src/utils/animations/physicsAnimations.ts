import { Position } from '@/types'

// ========================================
// PHYSICS-BASED ANIMATIONS
// ========================================

// Per-instance state using anchor/rest position as key
interface PendulumState {
  angle: number
  angularVelocity: number
  lastTime: number
}

interface SpringState {
  position: Position
  velocity: Position
  lastTime: number
}

const pendulumStates = new Map<string, PendulumState>()
const springStates = new Map<string, SpringState>()

function getStateKey(pos: Position, context: string = 'playback'): string {
  return `${context}_${pos.x.toFixed(2)}_${pos.y.toFixed(2)}_${pos.z.toFixed(2)}`
}

export function calculatePendulumPosition(params: any, time: number, duration: number, context: string = 'playback'): Position {
  const anchorPoint = params?.anchorPoint || { x: 0, y: 5, z: 0 }
  const length = Number(params?.pendulumLength) || 3
  const initialAngleDeg = Number(params?.initialAngle) || 45
  const damping = Number(params?.damping) || 0.02
  const gravity = Number(params?.gravity) || 9.81
  const plane = params?.plane || 'xz'  // Default to XZ (horizontal swing) for spatial audio
  
  // Get or create state for this instance
  const stateKey = getStateKey(anchorPoint, context)
  let state = pendulumStates.get(stateKey)
  
  // Initialize on first call or reset
  if (!state || time < 0.01 || state.lastTime > time) {
    state = {
      angle: (initialAngleDeg * Math.PI) / 180,
      angularVelocity: 0,
      lastTime: 0
    }
    pendulumStates.set(stateKey, state)
  }
  
  const dt = Math.min(time - state.lastTime, 0.1)
  if (dt > 0) {
    // Angular acceleration: α = -(g/L) * sin(θ) - damping * ω
    const angularAcceleration = -(gravity / length) * Math.sin(state.angle) - damping * state.angularVelocity
    
    state.angularVelocity += angularAcceleration * dt
    state.angle += state.angularVelocity * dt
  }
  state.lastTime = time
  
  // Convert angle to position based on plane
  let x = anchorPoint.x
  let y = anchorPoint.y
  let z = anchorPoint.z
  
  if (plane === 'xy') {
    // Swing in X, gravity in -Y
    x = anchorPoint.x + length * Math.sin(state.angle)
    y = anchorPoint.y - length * Math.cos(state.angle)
  } else if (plane === 'xz') {
    // Swing in X, gravity in -Z (horizontal swing, good for spatial audio)
    x = anchorPoint.x + length * Math.sin(state.angle)
    z = anchorPoint.z - length * Math.cos(state.angle)
  } else if (plane === 'yz') {
    // Swing in Y, gravity in -Z
    y = anchorPoint.y + length * Math.sin(state.angle)
    z = anchorPoint.z - length * Math.cos(state.angle)
  }
  
  return { x, y, z }
}

export function calculateBouncePosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const startHeight = Number(params?.startHeight) || 5  // Reduced for faster visible bounce
  const groundLevel = Number(params?.groundLevel) || 0
  const bounciness = Math.max(0, Math.min(1, Number(params?.bounciness) || 0.8))
  const dampingPerBounce = Number(params?.dampingPerBounce) || 0.05  // Reduced damping
  const gravity = Number(params?.gravity) || 20  // Increased for faster falling
  
  // For very early times, return in-flight position
  if (time < 0.01) {
    return { x: center.x, y: startHeight, z: center.z }
  }
  
  let currentHeight = startHeight
  let currentVelocity = 0
  let currentTime = 0
  let bounceCount = 0
  
  while (currentTime < time) {
    // Time to hit ground: solve h = h0 - 0.5*g*t^2 + v0*t
    const a = -0.5 * gravity
    const b = currentVelocity
    const c = currentHeight - groundLevel
    const discriminant = b * b - 4 * a * c
    
    if (discriminant < 0 || currentHeight <= groundLevel + 0.01) break
    
    const timeToGround = (-b - Math.sqrt(discriminant)) / (2 * a)
    
    if (currentTime + timeToGround >= time) {
      // Ball is in flight
      const dt = time - currentTime
      const y = currentHeight + currentVelocity * dt - 0.5 * gravity * dt * dt
      return { x: center.x, y: Math.max(y, groundLevel), z: center.z }
    }
    
    // Ball hit ground
    currentTime += timeToGround
    currentVelocity = -currentVelocity * bounciness * (1 - dampingPerBounce * bounceCount)
    currentHeight = groundLevel
    bounceCount++
  }
  
  return { x: center.x, y: groundLevel, z: center.z }
}

export function calculateSpringPosition(params: any, time: number, duration: number, context: string = 'playback'): Position {
  const restPosition = params?.restPosition || { x: 0, y: 0, z: 0 }
  const stiffness = Number(params?.springStiffness) || 10
  const dampingCoef = Number(params?.dampingCoefficient) || 0.5
  const displacement = params?.initialDisplacement || { x: 5, y: 5, z: 0 }
  const mass = Number(params?.mass) || 1
  
  // Get or create state for this instance
  const stateKey = getStateKey(restPosition, context)
  let state = springStates.get(stateKey)
  
  // Initialize on first call or reset
  if (!state || time < 0.01 || state.lastTime > time) {
    state = {
      position: {
        x: restPosition.x + displacement.x,
        y: restPosition.y + displacement.y,
        z: restPosition.z + displacement.z
      },
      velocity: { x: 0, y: 0, z: 0 },
      lastTime: 0
    }
    springStates.set(stateKey, state)
  }
  
  const dt = Math.min(time - state.lastTime, 0.1)
  if (dt > 0) {
    // Spring force: F = -k * x - c * v
    const forceX = -stiffness * (state.position.x - restPosition.x) - dampingCoef * state.velocity.x
    const forceY = -stiffness * (state.position.y - restPosition.y) - dampingCoef * state.velocity.y
    const forceZ = -stiffness * (state.position.z - restPosition.z) - dampingCoef * state.velocity.z
    
    // Update velocity: v = v + (F/m) * dt
    state.velocity.x += (forceX / mass) * dt
    state.velocity.y += (forceY / mass) * dt
    state.velocity.z += (forceZ / mass) * dt
    
    // Update position: p = p + v * dt
    state.position.x += state.velocity.x * dt
    state.position.y += state.velocity.y * dt
    state.position.z += state.velocity.z * dt
  }
  state.lastTime = time
  
  return { ...state.position }
}

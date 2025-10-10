import { Position } from '@/types'

// ========================================
// MULTI-OBJECT & INTERACTIVE ANIMATIONS
// ========================================

export function calculateOrbitPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const radius = Number(params?.orbitalRadius) || 4
  const speed = Number(params?.orbitalSpeed) || 1
  const phase = (Number(params?.orbitalPhase) || 0) * (Math.PI / 180)
  const inclination = (Number(params?.inclination) || 0) * (Math.PI / 180)
  
  const t = (time / duration) * speed * 2 * Math.PI + phase
  
  const x = radius * Math.cos(t)
  const y = radius * Math.sin(t) * Math.cos(inclination)
  const z = radius * Math.sin(t) * Math.sin(inclination)
  
  return {
    x: center.x + x,
    y: center.y + y,
    z: center.z + z
  }
}

// Formation animation requires track context, simplified version
export function calculateFormationPosition(params: any, time: number, duration: number): Position {
  // This is a simplified version - full implementation needs track list access
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const spacing = Number(params?.formationSpacing) || 2
  const shape = params?.formationShape || 'line'
  
  // For demo: just return offset positions
  return { x: center.x + spacing, y: center.y, z: center.z }
}

// Attract/repel with simple physics
let attractState = { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, lastTime: 0 }

export function calculateAttractRepelPosition(params: any, time: number, duration: number): Position {
  const target = params?.targetPosition || { x: 0, y: 0, z: 0 }
  const attractionStrength = Number(params?.attractionStrength) || 5
  const repulsionRadius = Number(params?.repulsionRadius) || 1
  const maxSpeed = Number(params?.maxSpeed) || 10
  const initialPos = params?.center || { x: 5, y: 5, z: 5 }
  
  // Initialize
  if (time < 0.1 && attractState.lastTime > time) {
    attractState.position = { ...initialPos }
    attractState.velocity = { x: 0, y: 0, z: 0 }
  }
  
  const dt = Math.min(time - attractState.lastTime, 0.1)
  if (dt > 0) {
    const dx = target.x - attractState.position.x
    const dy = target.y - attractState.position.y
    const dz = target.z - attractState.position.z
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    
    if (distance > 0.01) {
      let force = attractionStrength
      if (distance < repulsionRadius) {
        force = -attractionStrength * 2 // Repel when too close
      }
      
      const forceX = (dx / distance) * force
      const forceY = (dy / distance) * force
      const forceZ = (dz / distance) * force
      
      attractState.velocity.x += forceX * dt
      attractState.velocity.y += forceY * dt
      attractState.velocity.z += forceZ * dt
      
      // Limit speed
      const speed = Math.sqrt(
        attractState.velocity.x ** 2 + 
        attractState.velocity.y ** 2 + 
        attractState.velocity.z ** 2
      )
      if (speed > maxSpeed) {
        attractState.velocity.x = (attractState.velocity.x / speed) * maxSpeed
        attractState.velocity.y = (attractState.velocity.y / speed) * maxSpeed
        attractState.velocity.z = (attractState.velocity.z / speed) * maxSpeed
      }
      
      attractState.position.x += attractState.velocity.x * dt
      attractState.position.y += attractState.velocity.y * dt
      attractState.position.z += attractState.velocity.z * dt
    }
  }
  attractState.lastTime = time
  
  return { ...attractState.position }
}

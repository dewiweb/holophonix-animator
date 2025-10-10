import { Position } from '@/types'

// ========================================
// ADVANCED PROCEDURAL ANIMATIONS
// ========================================

// Simple Perlin-like noise implementation
class SimplexNoise {
  private perm: number[] = []
  
  constructor(seed: number = 0) {
    const p = []
    for (let i = 0; i < 256; i++) {
      p[i] = i
    }
    // Shuffle based on seed
    for (let i = 255; i > 0; i--) {
      const n = Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * (i + 1))
      seed = (seed * 9301 + 49297) % 233280
      const q: number = p[i]
      p[i] = p[n]
      p[n] = q
    }
    this.perm = [...p, ...p]
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }
  
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }
  
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
  
  noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const Z = Math.floor(z) & 255
    
    x -= Math.floor(x)
    y -= Math.floor(y)
    z -= Math.floor(z)
    
    const u = this.fade(x)
    const v = this.fade(y)
    const w = this.fade(z)
    
    const A = this.perm[X] + Y
    const AA = this.perm[A] + Z
    const AB = this.perm[A + 1] + Z
    const B = this.perm[X + 1] + Y
    const BA = this.perm[B] + Z
    const BB = this.perm[B + 1] + Z
    
    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))
      )
    )
  }
}

let noiseGenerator: SimplexNoise | null = null
let lastNoiseSeed = 0

export function calculatePerlinNoisePosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const bounds = params?.bounds || { x: 5, y: 5, z: 5 }
  const frequency = Number(params?.noiseFrequency) || 1
  const octaves = Number(params?.noiseOctaves) || 3
  const persistence = Number(params?.noisePersistence) || 0.5
  const scale = Number(params?.noiseScale) || 1
  const seed = Number(params?.noiseSeed) || 12345
  
  // Initialize noise generator
  if (!noiseGenerator || seed !== lastNoiseSeed) {
    noiseGenerator = new SimplexNoise(seed)
    lastNoiseSeed = seed
  }
  
  const t = time * frequency
  
  // Multi-octave noise
  let noiseX = 0, noiseY = 0, noiseZ = 0
  let amplitude = 1
  let maxAmplitude = 0
  
  for (let i = 0; i < octaves; i++) {
    const freq = Math.pow(2, i)
    noiseX += noiseGenerator.noise(t * freq, 0, 0) * amplitude
    noiseY += noiseGenerator.noise(0, t * freq, 100) * amplitude
    noiseZ += noiseGenerator.noise(100, 0, t * freq) * amplitude
    maxAmplitude += amplitude
    amplitude *= persistence
  }
  
  // Normalize and scale
  noiseX = (noiseX / maxAmplitude) * bounds.x * scale
  noiseY = (noiseY / maxAmplitude) * bounds.y * scale
  noiseZ = (noiseZ / maxAmplitude) * bounds.z * scale
  
  return {
    x: center.x + noiseX,
    y: center.y + noiseY,
    z: center.z + noiseZ
  }
}

export function calculateRoseCurvePosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const radius = Number(params?.roseRadius) || 3
  const k = Number(params?.petalCount) || 5
  const rotation = (Number(params?.roseRotation) || 0) * (Math.PI / 180)
  const plane = params?.plane || 'xy'
  
  const t = (time / duration) * 2 * Math.PI
  const r = radius * Math.cos(k * t)
  
  const x = r * Math.cos(t + rotation)
  const y = r * Math.sin(t + rotation)
  
  if (plane === 'xy') {
    return { x: center.x + x, y: center.y + y, z: center.z }
  } else if (plane === 'xz') {
    return { x: center.x + x, y: center.y, z: center.z + y }
  } else {
    return { x: center.x, y: center.y + x, z: center.z + y }
  }
}

export function calculateEpicycloidPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const R = Number(params?.fixedCircleRadius) || 3  // Fixed circle radius
  const r = Number(params?.rollingCircleRadius) || 1 // Rolling circle radius
  const speed = Number(params?.rollingSpeed) || 1
  const type = params?.rollingType || 'epicycloid'
  const plane = params?.plane || 'xy'
  
  const t = (time / duration) * speed * 2 * Math.PI
  
  let x, y
  if (type === 'epicycloid') {
    // Epicycloid (rolling outside)
    x = (R + r) * Math.cos(t) - r * Math.cos(((R + r) / r) * t)
    y = (R + r) * Math.sin(t) - r * Math.sin(((R + r) / r) * t)
  } else {
    // Hypocycloid (rolling inside)
    x = (R - r) * Math.cos(t) + r * Math.cos(((R - r) / r) * t)
    y = (R - r) * Math.sin(t) - r * Math.sin(((R - r) / r) * t)
  }
  
  if (plane === 'xy') {
    return { x: center.x + x, y: center.y + y, z: center.z }
  } else if (plane === 'xz') {
    return { x: center.x + x, y: center.y, z: center.z + y }
  } else {
    return { x: center.x, y: center.y + x, z: center.z + y }
  }
}

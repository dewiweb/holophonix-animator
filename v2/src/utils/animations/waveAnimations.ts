import { Position } from '@/types'

// ========================================
// WAVE-BASED ANIMATIONS
// ========================================

export function calculateWavePosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  // Handle amplitude - ensure non-zero defaults
  const defaultAmp = { x: 2, y: 2, z: 1 }
  const amplitude = params?.amplitude || defaultAmp
  const ampX = amplitude.x !== undefined ? Number(amplitude.x) || defaultAmp.x : defaultAmp.x
  const ampY = amplitude.y !== undefined ? Number(amplitude.y) || defaultAmp.y : defaultAmp.y
  const ampZ = amplitude.z !== undefined ? Number(amplitude.z) || defaultAmp.z : defaultAmp.z
  const frequency = Number(params?.frequency) || 1
  const phaseOffset = Number(params?.phaseOffset) || 0
  const waveType = params?.waveType || 'sine'
  
  const t = time * frequency * 2 * Math.PI + phaseOffset
  
  let waveValue = 0
  switch (waveType) {
    case 'sine':
      waveValue = Math.sin(t)
      break
    case 'square':
      waveValue = Math.sin(t) >= 0 ? 1 : -1
      break
    case 'triangle':
      waveValue = (2 / Math.PI) * Math.asin(Math.sin(t))
      break
    case 'sawtooth':
      waveValue = 2 * ((t / (2 * Math.PI)) - Math.floor((t / (2 * Math.PI)) + 0.5))
      break
  }
  
  return {
    x: center.x + ampX * waveValue,
    y: center.y + ampY * waveValue,
    z: center.z + ampZ * waveValue
  }
}

export function calculateLissajousPosition(params: any, time: number, duration: number): Position {
  const center = params?.center || { x: 0, y: 0, z: 0 }
  const freqA = Number(params?.frequencyRatioA) || 3
  const freqB = Number(params?.frequencyRatioB) || 2
  const phaseDiff = (Number(params?.phaseDifference) || 0) * (Math.PI / 180)
  const ampX = Number(params?.amplitudeX) || 3
  const ampY = Number(params?.amplitudeY) || 3
  const ampZ = Number(params?.amplitudeZ) || 1
  
  const t = (time / duration) * 2 * Math.PI
  
  return {
    x: center.x + ampX * Math.sin(freqA * t),
    y: center.y + ampY * Math.sin(freqB * t + phaseDiff),
    z: center.z + ampZ * Math.sin((freqA + freqB) / 2 * t)
  }
}

export function calculateHelixPosition(params: any, time: number, duration: number): Position {
  const axisStart = params?.axisStart || { x: 0, y: -5, z: 0 }
  const axisEnd = params?.axisEnd || { x: 0, y: 5, z: 0 }
  const radius = Number(params?.helixRadius) || 2
  const rotations = Number(params?.helixRotations) || 5
  const direction = params?.direction || 'clockwise'
  
  const t = time / duration
  const angle = t * rotations * 2 * Math.PI * (direction === 'clockwise' ? 1 : -1)
  
  // Linear interpolation along axis
  const axisX = axisStart.x + (axisEnd.x - axisStart.x) * t
  const axisY = axisStart.y + (axisEnd.y - axisStart.y) * t
  const axisZ = axisStart.z + (axisEnd.z - axisStart.z) * t
  
  // Circular motion perpendicular to axis (assuming vertical axis for simplicity)
  return {
    x: axisX + radius * Math.cos(angle),
    y: axisY,
    z: axisZ + radius * Math.sin(angle)
  }
}

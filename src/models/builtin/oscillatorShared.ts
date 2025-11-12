/**
 * Shared Oscillator Logic
 * 
 * Common waveform calculations and utilities used by both
 * stationary and path oscillator models
 */

import { Position } from '@/types'

export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth'
export type OscillationPlane = 'xy' | 'xz' | 'yz'

/**
 * Calculate waveform value at given angle
 */
export function calculateWaveform(waveform: WaveformType, angle: number): number {
  switch (waveform) {
    case 'sine':
      return Math.sin(angle)
    
    case 'triangle':
      // Triangle wave using arcsin approximation
      return (2 / Math.PI) * Math.asin(Math.sin(angle))
    
    case 'square':
      return Math.sin(angle) > 0 ? 1 : -1
    
    case 'sawtooth':
      return (2 * ((angle / (2 * Math.PI)) % 1)) - 1
    
    default:
      return Math.sin(angle)
  }
}

/**
 * Apply oscillation offset to a base position
 */
export function applyOscillation(
  basePosition: Position,
  waveValue: number,
  amplitude: number,
  plane: OscillationPlane
): Position {
  const offset = waveValue * amplitude
  const result = { ...basePosition }
  
  if (plane === 'xy') {
    result.y += offset
  } else if (plane === 'xz') {
    result.z += offset
  } else if (plane === 'yz') {
    result.z += offset
  }
  
  return result
}

/**
 * Generate visualization path for oscillation
 */
export function generateOscillationPath(
  basePoints: Position[],
  amplitude: number,
  frequency: number,
  plane: OscillationPlane,
  waveform: WaveformType
): Position[] {
  const points: Position[] = []
  
  for (let i = 0; i < basePoints.length; i++) {
    const t = i / (basePoints.length - 1)
    const angle = t * frequency * Math.PI * 2 * 2  // 2 full cycles
    const waveValue = calculateWaveform(waveform, angle)
    const point = applyOscillation(basePoints[i], waveValue, amplitude, plane)
    points.push(point)
  }
  
  return points
}

/**
 * Shared oscillator parameter definitions
 */
export const sharedOscillatorParameters = {
  waveform: {
    type: 'enum' as const,
    default: 'sine' as WaveformType,
    label: 'Waveform',
    description: 'Shape of the oscillation',
    group: 'Waveform',
    order: 1,
    options: ['sine', 'triangle', 'square', 'sawtooth'] as WaveformType[],
    uiComponent: 'select' as const,
  },
  
  amplitude: {
    type: 'number' as const,
    default: 2,
    label: 'Amplitude',
    description: 'Height of oscillation peaks',
    group: 'Waveform',
    order: 2,
    min: 0.1,
    max: 10,
    step: 0.1,
    uiComponent: 'slider' as const,
  },
  
  frequency: {
    type: 'number' as const,
    default: 1,
    label: 'Frequency',
    description: 'Oscillation speed',
    group: 'Waveform',
    order: 3,
    min: 0.1,
    max: 10,
    step: 0.1,
    unit: 'Hz',
    uiComponent: 'slider' as const,
  },
  
  phase: {
    type: 'number' as const,
    default: 0,
    label: 'Phase',
    description: 'Phase offset in degrees',
    group: 'Waveform',
    order: 4,
    min: 0,
    max: 360,
    step: 1,
    unit: 'deg',
    uiComponent: 'slider' as const,
  },
  
  plane: {
    type: 'enum' as const,
    default: 'xy' as OscillationPlane,
    label: 'Oscillation Plane',
    description: 'Plane for oscillation movement',
    group: 'Orientation',
    order: 1,
    options: ['xy', 'xz', 'yz'] as OscillationPlane[],
    uiComponent: 'select' as const,
  },
}

/**
 * Quick Animation Testing Utility
 * Run this to verify all animation types produce valid outputs
 */

import { modelRuntime } from '@/models/runtime'
import { Animation, AnimationType } from '@/types'

interface TestResult {
  type: AnimationType
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  position?: { x: number; y: number; z: number }
}

const animationTypes: AnimationType[] = [
  'linear', 'circular', 'elliptical', 'spiral', 'random',
  'pendulum', 'bounce', 'spring',
  'oscillator-stationary', 'lissajous', 'helix',
  'bezier', 'catmull-rom', 'oscillator-stationary',
  'perlin-noise', 'rose-curve', 'epicycloid',
  'doppler', 'circular-scan', 'zoom'
]

function createDefaultAnimation(type: AnimationType): Animation {
  return {
    id: `test-${type}`,
    name: `Test ${type}`,
    type,
    duration: 10,
    parameters: {}, // Use defaults
    loop: false,
    pingPong: false,
    coordinateSystem: { type: 'xyz' } // Default coordinate system
  }
}

function isValidPosition(pos: any): boolean {
  return (
    pos &&
    typeof pos.x === 'number' &&
    typeof pos.y === 'number' &&
    typeof pos.z === 'number' &&
    !isNaN(pos.x) &&
    !isNaN(pos.y) &&
    !isNaN(pos.z) &&
    isFinite(pos.x) &&
    isFinite(pos.y) &&
    isFinite(pos.z)
  )
}

function testAnimation(type: AnimationType): TestResult {
  try {
    const animation = createDefaultAnimation(type)
    
    // Test at multiple time points (offset slightly to avoid sampling exactly at wave zero-crossings)
    const timePoints = [0, 1.8, 4.3, 6.7, 9.2]
    const positions = timePoints.map(time => modelRuntime.calculatePosition(animation, time))
    
    // Verify all positions are valid
    const allValid = positions.every(isValidPosition)
    
    if (!allValid) {
      return {
        type,
        status: 'FAIL',
        message: 'Invalid position values (NaN or Infinity)'
      }
    }
    
    // Check for movement - compare consecutive positions to detect ANY movement
    let maxMovement = 0
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1]
      const curr = positions[i]
      const movement = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
        Math.pow(curr.y - prev.y, 2) +
        Math.pow(curr.z - prev.z, 2)
      )
      maxMovement = Math.max(maxMovement, movement)
    }
    
    if (maxMovement < 0.001) {
      console.log(`⚠️ ${type} - maxMovement: ${maxMovement}, positions:`, positions)
      return {
        type,
        status: 'WARNING',
        message: `No movement detected (maxMovement: ${maxMovement.toFixed(6)})`,
        position: positions[0]
      }
    }
    
    return {
      type,
      status: 'PASS',
      message: 'Animation calculation successful',
      position: positions[0]
    }
    
  } catch (error) {
    return {
      type,
      status: 'FAIL',
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

export function testAllAnimations(): TestResult[] {
  console.log('🧪 Testing all animation types...\n')
  
  const results = animationTypes.map(type => {
    const result = testAnimation(type)
    
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'
    console.log(`${icon} ${type.padEnd(20)} - ${result.message}`)
    
    return result
  })
  
  const passed = results.filter(r => r.status === 'PASS').length
  const warnings = results.filter(r => r.status === 'WARNING').length
  const failed = results.filter(r => r.status === 'FAIL').length
  
  console.log('\n📊 Test Summary:')
  console.log(`   ✅ Passed: ${passed}/${animationTypes.length}`)
  console.log(`   ⚠️  Warnings: ${warnings}`)
  console.log(`   ❌ Failed: ${failed}`)
  
  return results
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testAnimations = testAllAnimations
}

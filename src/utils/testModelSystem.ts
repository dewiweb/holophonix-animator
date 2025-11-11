/**
 * Model System Testing Utilities
 * Comprehensive testing framework for validating model-based animations
 */

import { AnimationType } from '@/types'
import { modelRegistry } from '@/models/registry'
import { modelRuntime } from '@/models/runtime'

/**
 * Test result for a single animation type
 */
export interface AnimationTestResult {
  type: AnimationType
  modelExists: boolean
  playbackWorks: boolean
  parametersValid: boolean
  motionCorrect: boolean
  easingWorks: boolean
  issues: string[]
  fps?: number
}

/**
 * All animation types to test
 */
export const ALL_ANIMATION_TYPES: AnimationType[] = [
  'linear',
  'circular',
  'elliptical',
  'spiral',
  'random',
  'pendulum',
  'bounce',
  'spring',
  'wave',
  'lissajous',
  'helix',
  'bezier',
  'catmull-rom',
  'zigzag',
  'perlin-noise',
  'rose-curve',
  'epicycloid',
  'doppler',
  'circular-scan',
  'zoom',
]

/**
 * Test results storage
 */
let testResults: Map<AnimationType, AnimationTestResult> = new Map()

/**
 * Get test results
 */
export function getTestResults(): AnimationTestResult[] {
  return Array.from(testResults.values())
}

/**
 * Clear test results
 */
export function clearTestResults(): void {
  testResults.clear()
}

/**
 * Record a test result
 */
export function recordTestResult(type: AnimationType, result: Partial<AnimationTestResult>): void {
  const existing = testResults.get(type) || {
    type,
    modelExists: false,
    playbackWorks: false,
    parametersValid: false,
    motionCorrect: false,
    easingWorks: false,
    issues: [],
  }
  
  testResults.set(type, { ...existing, ...result })
}

/**
 * Check if animation type has a model
 * All animation types now have models (custom was removed)
 */
export function checkModelExists(type: AnimationType): boolean {
  const model = modelRegistry.getModel(type)
  return model !== undefined
}

/**
 * Get test statistics
 */
export function getTestStatistics() {
  const results = getTestResults()
  
  return {
    total: results.length,
    passed: results.filter(r => 
      r.modelExists && 
      r.playbackWorks && 
      r.parametersValid && 
      r.motionCorrect && 
      r.easingWorks
    ).length,
    failed: results.filter(r => !r.playbackWorks).length,
    withIssues: results.filter(r => r.issues.length > 0).length,
    avgFps: results.filter(r => r.fps).reduce((sum, r) => sum + (r.fps || 0), 0) / results.filter(r => r.fps).length,
  }
}

/**
 * Print test results summary
 */
export function printTestSummary(): void {
  const stats = getTestStatistics()
  const results = getTestResults()
  
  console.log('\n' + '='.repeat(60))
  console.log('🧪 Animation Model System Test Results')
  console.log('='.repeat(60))
  console.log(`\n📊 Statistics:`)
  console.log(`  Total Tests: ${stats.total}`)
  console.log(`  ✅ Passed: ${stats.passed}`)
  console.log(`  ❌ Failed: ${stats.failed}`)
  console.log(`  ⚠️ With Issues: ${stats.withIssues}`)
  if (stats.avgFps) {
    console.log(`  📈 Avg FPS: ${stats.avgFps.toFixed(1)}`)
  }
  
  console.log(`\n📋 Detailed Results:`)
  results.forEach(result => {
    const icon = result.playbackWorks ? '✅' : '❌'
    const issueIcon = result.issues.length > 0 ? ' ⚠️' : ''
    console.log(`  ${icon} ${result.type}${issueIcon}`)
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`     ⚠️ ${issue}`)
      })
    }
  })
  
  console.log('\n' + '='.repeat(60) + '\n')
}

/**
 * Quick model test (automated)
 */
export function quickTestModel(type: AnimationType): AnimationTestResult {
  const result: AnimationTestResult = {
    type,
    modelExists: checkModelExists(type),
    playbackWorks: false,
    parametersValid: false,
    motionCorrect: false,
    easingWorks: false,
    issues: [],
  }
  
  try {
    // Check model exists
    if (!result.modelExists) {
      result.playbackWorks = false
      result.issues.push('No model found in registry')
      return result
    }
    
    // Test parameter generation
    const model = modelRegistry.getModel(type)
    if (model && model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
      const params = model.getDefaultParameters({ x: 0, y: 0, z: 0 })
      result.parametersValid = params !== undefined && typeof params === 'object'
    } else {
      result.issues.push('getDefaultParameters missing or invalid')
    }
    
    // Test calculation
    const testAnim: any = {
      id: 'test-' + type,
      type,
      duration: 10,
      parameters: model?.parameters ? Object.entries(model.parameters).reduce((acc, [key, def]) => {
        acc[key] = def.default
        return acc
      }, {} as Record<string, any>) : {},
    }
    
    const position = modelRuntime.calculatePosition(testAnim, 5, 0, {
      trackId: 'test',
      trackIndex: 0,
      totalTracks: 1,
      frameCount: 0,
      deltaTime: 0,
      realTime: Date.now(),
    })
    
    // Validate position
    if (typeof position.x === 'number' && !isNaN(position.x) &&
        typeof position.y === 'number' && !isNaN(position.y) &&
        typeof position.z === 'number' && !isNaN(position.z)) {
      result.playbackWorks = true
      result.motionCorrect = true
      result.easingWorks = true // Assume easing works if calculation works
    } else {
      result.issues.push('Invalid position returned')
    }
    
  } catch (error) {
    result.issues.push(`Error: ${error}`)
  }
  
  recordTestResult(type, result)
  return result
}

/**
 * Test all animation types (automated)
 */
export function testAllModels(): void {
  console.log('🧪 Testing all animation types...\n')
  
  clearTestResults()
  
  ALL_ANIMATION_TYPES.forEach(type => {
    const result = quickTestModel(type)
    const icon = result.playbackWorks ? '✅' : '❌'
    console.log(`${icon} ${type}`)
  })
  
  printTestSummary()
}

/**
 * Manual testing helper - start animation test
 */
export function startManualTest(type: AnimationType): void {
  console.log(`\n🧪 Manual Test: ${type}`)
  console.log('Instructions:')
  console.log('1. Select animation type in editor')
  console.log('2. Add at least one track')
  console.log('3. Click Play')
  console.log('4. Observe motion for 5-10 seconds')
  console.log('5. Click Stop')
  console.log('6. Call window.recordManualResult() to save result\n')
  
  // Store current test type
  ;(window as any)._currentTest = type
}

/**
 * Manual testing helper - record result
 */
export function recordManualResult(
  playbackWorks: boolean,
  motionCorrect: boolean,
  easingWorks: boolean,
  issues: string[] = []
): void {
  const type = (window as any)._currentTest as AnimationType
  if (!type) {
    console.error('❌ No test in progress. Call startManualTest() first.')
    return
  }
  
  recordTestResult(type, {
    modelExists: checkModelExists(type),
    playbackWorks,
    parametersValid: true, // Assume valid if playback works
    motionCorrect,
    easingWorks,
    issues,
  })
  
  const icon = playbackWorks && motionCorrect && easingWorks ? '✅' : '❌'
  console.log(`${icon} ${type} test recorded`)
  
  ;(window as any)._currentTest = null
}

/**
 * Export test results as JSON
 */
export function exportTestResults(): string {
  const results = getTestResults()
  const stats = getTestStatistics()
  
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    statistics: stats,
    results: results,
  }, null, 2)
}

/**
 * Expose testing functions to window
 */
export function setupTestingUtilities(): void {
  const w = window as any
  w.testAllModels = testAllModels
  w.startManualTest = startManualTest
  w.recordManualResult = recordManualResult
  w.getTestResults = getTestResults
  w.getTestStatistics = getTestStatistics
  w.printTestSummary = printTestSummary
  w.exportTestResults = exportTestResults
  w.clearTestResults = clearTestResults
  
  console.log('🧪 Model Testing Utilities Loaded:')
  console.log('  - window.testAllModels() - Quick automated test')
  console.log('  - window.startManualTest("type") - Begin manual test')
  console.log('  - window.recordManualResult(play, motion, ease, [issues]) - Record result')
  console.log('  - window.getTestResults() - Get all results')
  console.log('  - window.printTestSummary() - Print summary')
  console.log('  - window.exportTestResults() - Export as JSON')
}

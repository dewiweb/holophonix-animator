/**
 * Model System Verification
 * Tests that all 24 models are loaded and functional
 */

import { modelRegistry } from './registry'
import { modelRuntime } from './runtime'
import { EXPECTED_MODEL_TYPES, verifyAllModelsPresent } from './modelTypeMapping'
import { Position } from '@/types'

/**
 * Verification results
 */
export interface ModelVerificationResults {
  totalExpected: number
  totalLoaded: number
  missingModels: string[]
  extraModels: string[]
  testResults: Array<{
    type: string
    loaded: boolean
    calculationWorks: boolean
    error?: string
  }>
  allPassed: boolean
}

/**
 * Test a model's calculation function
 */
function testModelCalculation(modelType: string): { success: boolean; error?: string } {
  try {
    const model = modelRegistry.getModel(modelType)
    if (!model) {
      return { success: false, error: 'Model not found in registry' }
    }
    
    // Create a simple test animation
    const testAnimation: any = {
      id: 'test-' + modelType,
      name: 'Test Animation',
      type: modelType,
      duration: 10,
      loop: false,
      parameters: {},
    }
    
    // Get default parameters
    const testPosition: Position = { x: 0, y: 0, z: 0 }
    if (model.getDefaultParameters && typeof model.getDefaultParameters === 'function') {
      testAnimation.parameters = model.getDefaultParameters(testPosition)
    } else {
      // Use model's default parameters
      testAnimation.parameters = Object.entries(model.parameters).reduce((acc, [key, def]) => {
        acc[key] = def.default
        return acc
      }, {} as Record<string, any>)
    }
    
    // Try to calculate a position
    const testContext = {
      trackId: 'test-track',
      trackIndex: 0,
      totalTracks: 1,
      frameCount: 0,
      deltaTime: 0,
      realTime: Date.now(),
    }
    
    const position = modelRuntime.calculatePosition(testAnimation, 5, 0, testContext)
    
    // Verify position is valid
    if (typeof position.x !== 'number' || isNaN(position.x) ||
        typeof position.y !== 'number' || isNaN(position.y) ||
        typeof position.z !== 'number' || isNaN(position.z)) {
      return { success: false, error: 'Invalid position returned: ' + JSON.stringify(position) }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Verify all models are loaded and functional
 */
export function verifyModels(): ModelVerificationResults {
  console.log('🔍 Verifying Animation Model System...')
  
  // Get all registered models
  const allModels = modelRegistry.getAllModels()
  const registeredTypes = allModels.map(m => m.metadata.type)
  
  console.log(`📦 Found ${allModels.length} registered models`)
  
  // Check which models are missing
  const verification = verifyAllModelsPresent(registeredTypes)
  
  if (verification.missing.length > 0) {
    console.warn('⚠️ Missing models:', verification.missing)
  }
  
  if (verification.extra.length > 0) {
    console.log('ℹ️ Extra models (not in legacy types):', verification.extra)
  }
  
  // Test each expected model
  const testResults = EXPECTED_MODEL_TYPES.map(modelType => {
    const loaded = registeredTypes.includes(modelType)
    let calculationWorks = false
    let error: string | undefined
    
    if (loaded) {
      const testResult = testModelCalculation(modelType)
      calculationWorks = testResult.success
      error = testResult.error
      
      if (calculationWorks) {
        console.log(`✅ ${modelType}: Loaded and functional`)
      } else {
        console.error(`❌ ${modelType}: Calculation failed - ${error}`)
      }
    } else {
      console.error(`❌ ${modelType}: Not loaded`)
    }
    
    return {
      type: modelType,
      loaded,
      calculationWorks,
      error,
    }
  })
  
  const allPassed = testResults.every(r => r.loaded && r.calculationWorks)
  
  console.log('\n📊 Verification Summary:')
  console.log(`  Expected models: ${EXPECTED_MODEL_TYPES.length}`)
  console.log(`  Loaded models: ${allModels.length}`)
  console.log(`  Missing models: ${verification.missing.length}`)
  console.log(`  Working models: ${testResults.filter(r => r.calculationWorks).length}`)
  console.log(`  Failed models: ${testResults.filter(r => !r.calculationWorks).length}`)
  console.log(`  Overall status: ${allPassed ? '✅ PASS' : '❌ FAIL'}`)
  
  return {
    totalExpected: EXPECTED_MODEL_TYPES.length,
    totalLoaded: allModels.length,
    missingModels: verification.missing,
    extraModels: verification.extra,
    testResults,
    allPassed,
  }
}

/**
 * Run verification on app startup
 */
export function runStartupVerification(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 Animation Model System Startup Verification')
    console.log('='.repeat(60))
    
    const results = verifyModels()
    
    if (!results.allPassed) {
      console.error('\n⚠️ WARNING: Some models failed verification!')
      console.error('Please check the errors above.')
    }
    
    console.log('='.repeat(60) + '\n')
  }
}

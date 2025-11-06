import { Position, Animation } from '@/types'
import { AnimationModel, CalculationContext } from './types'
import { modelRegistry } from './registry'
import { validateParameters } from './validation'

// Import legacy calculation functions
import { calculatePosition as calculateLegacyPosition } from '@/utils/animations'

/**
 * Runtime engine for executing animation models
 * Provides backward compatibility with legacy animation system
 */
export class ModelRuntime {
  private static instance: ModelRuntime
  private contextCache: Map<string, CalculationContext> = new Map()
  private stateMap: Map<string, Map<string, any>> = new Map()
  
  private constructor() {}
  
  static getInstance(): ModelRuntime {
    if (!ModelRuntime.instance) {
      ModelRuntime.instance = new ModelRuntime()
    }
    return ModelRuntime.instance
  }
  
  /**
   * Calculate position using either model system or legacy system
   */
  calculatePosition(
    animation: Animation,
    time: number,
    loopCount: number = 0,
    context?: Partial<CalculationContext>
  ): Position {
    // Check if this animation type has a registered model
    const model = modelRegistry.getModel(animation.type)
    
    if (model) {
      // Use model system
      return this.calculateWithModel(model, animation, time, loopCount, context)
    } else {
      // Fall back to legacy system
      return this.calculateWithLegacy(animation, time, loopCount)
    }
  }
  
  /**
   * Calculate position using model system
   */
  private calculateWithModel(
    model: AnimationModel,
    animation: Animation,
    time: number,
    loopCount: number,
    partialContext?: Partial<CalculationContext>
  ): Position {
    // Build calculation context
    const context = this.buildContext(animation, partialContext)
    
    // Initialize model if needed
    if (model.initialize && !this.isInitialized(model, context)) {
      model.initialize(animation.parameters, context)
      this.markInitialized(model, context)
    }
    
    // Validate parameters
    const validation = validateParameters(model, animation.parameters)
    if (!validation.valid) {
      console.warn(`Animation parameters invalid: ${validation.errors.join(', ')}`)
      return { x: 0, y: 0, z: 0 }
    }
    
    // Execute calculation
    let position: Position
    
    if (typeof model.calculate === 'function') {
      position = model.calculate(
        animation.parameters,
        time,
        animation.duration,
        context
      )
    } else {
      // Handle string-based calculation (from JSON)
      try {
        const calcFunc = new Function(
          'parameters', 'time', 'duration', 'context',
          model.calculate as string
        ) as any
        position = calcFunc(
          animation.parameters,
          time,
          animation.duration,
          context
        )
      } catch (error) {
        console.error('Error executing model calculation:', error)
        return { x: 0, y: 0, z: 0 }
      }
    }
    
    // Apply multi-track handlers if needed
    if (context.multiTrackMode && model.multiTrackHandlers) {
      const handler = model.multiTrackHandlers.find(h => h.mode === context.multiTrackMode)
      if (handler) {
        position = this.applyMultiTrackHandler(handler, position, context, animation.parameters)
      }
    }
    
    return position
  }
  
  /**
   * Calculate position using legacy system
   */
  private calculateWithLegacy(
    animation: Animation,
    time: number,
    loopCount: number
  ): Position {
    return calculateLegacyPosition(animation, time, loopCount, 'playback')
  }
  
  /**
   * Build calculation context
   */
  private buildContext(
    animation: Animation,
    partial?: Partial<CalculationContext>
  ): CalculationContext {
    const cacheKey = `${animation.id}_${partial?.trackId || 'default'}`
    
    // Check cache
    let context = this.contextCache.get(cacheKey)
    if (!context) {
      context = {
        trackId: '',
        trackIndex: 0,
        totalTracks: 1,
        frameCount: 0,
        deltaTime: 0,
        realTime: Date.now(),
        state: this.getStateMap(animation.id),
        ...partial
      }
      this.contextCache.set(cacheKey, context)
    } else {
      // Update time-dependent fields
      const now = Date.now()
      context.deltaTime = now - context.realTime
      context.realTime = now
      context.frameCount++
      
      // Apply partial updates
      if (partial) {
        Object.assign(context, partial)
      }
    }
    
    return context
  }
  
  /**
   * Apply multi-track handler
   */
  private applyMultiTrackHandler(
    handler: any,
    basePosition: Position,
    context: CalculationContext,
    parameters: Record<string, any>
  ): Position {
    if (typeof handler.handler === 'function') {
      return handler.handler(basePosition, context, parameters)
    } else {
      // Handle string-based handler (from JSON)
      try {
        const handlerFunc = new Function(
          'basePosition', 'context', 'parameters',
          handler.handler
        )
        return handlerFunc(basePosition, context, parameters) as Position
      } catch (error) {
        console.error('Error executing multi-track handler:', error)
        return basePosition
      }
    }
  }
  
  /**
   * Get state map for an animation
   */
  private getStateMap(animationId: string): Map<string, any> {
    if (!this.stateMap.has(animationId)) {
      this.stateMap.set(animationId, new Map())
    }
    return this.stateMap.get(animationId)!
  }
  
  /**
   * Check if model is initialized for context
   */
  private isInitialized(model: AnimationModel, context: CalculationContext): boolean {
    const key = `${model.metadata.type}_${context.trackId}`
    return context.state?.has(key) || false
  }
  
  /**
   * Mark model as initialized for context
   */
  private markInitialized(model: AnimationModel, context: CalculationContext): void {
    const key = `${model.metadata.type}_${context.trackId}`
    context.state?.set(key, true)
  }
  
  /**
   * Clean up model state
   */
  cleanupModel(model: AnimationModel, context: CalculationContext): void {
    if (model.cleanup) {
      model.cleanup(context)
    }
    
    // Clear state
    const key = `${model.metadata.type}_${context.trackId}`
    context.state?.delete(key)
  }
  
  /**
   * Clear all cached contexts
   */
  clearCache(): void {
    this.contextCache.clear()
    this.stateMap.clear()
  }
}

// Export singleton instance
export const modelRuntime = ModelRuntime.getInstance()

/**
 * Enhanced calculatePosition that uses model runtime
 * This will replace the existing calculatePosition function
 */
export function calculatePositionWithModels(
  animation: Animation,
  time: number,
  loopCount: number = 0,
  context?: Partial<CalculationContext>
): Position {
  return modelRuntime.calculatePosition(animation, time, loopCount, context)
}

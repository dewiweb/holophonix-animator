import { 
  AnimationModel, 
  ModelRegistrationOptions, 
  ModelValidationResult,
  ModelSource,
  ModelLoadResult
} from './types'
import { validateModel } from './validation'
import { createBuiltinModels } from './builtin/index'

/**
 * Animation Model Registry
 * Central repository for all animation models
 */
export class AnimationModelRegistry {
  private models: Map<string, AnimationModel> = new Map()
  private activeModels: Set<string> = new Set()
  private modelCache: Map<string, any> = new Map()
  private listeners: Set<(event: ModelRegistryEvent) => void> = new Set()

  constructor() {
    // Initialize with built-in models
    this.loadBuiltinModels()
  }

  /**
   * Register a new animation model
   */
  register(model: AnimationModel, options: ModelRegistrationOptions = {}): ModelValidationResult {
    const { override = false, validate = true, activate = true } = options
    
    // Check if model already exists
    if (this.models.has(model.metadata.type) && !override) {
      return {
        valid: false,
        errors: [{
          field: 'type',
          message: `Model with type '${model.metadata.type}' already exists`,
          severity: 'error'
        }]
      }
    }
    
    // Validate model if requested
    if (validate) {
      const validationResult = validateModel(model)
      if (!validationResult.valid) {
        return validationResult
      }
    }
    
    // Store the model
    this.models.set(model.metadata.type, model)
    
    // Activate if requested
    if (activate) {
      this.activeModels.add(model.metadata.type)
    }
    
    // Notify listeners
    this.notifyListeners({
      type: 'register',
      modelType: model.metadata.type,
      model
    })
    
    return { valid: true, errors: [] }
  }
  
  /**
   * Unregister an animation model
   */
  unregister(type: string): boolean {
    if (!this.models.has(type)) {
      return false
    }
    
    // Check if it's a built-in model (cannot unregister)
    const model = this.models.get(type)!
    if (model.metadata.category === 'builtin') {
      console.warn(`Cannot unregister built-in model: ${type}`)
      return false
    }
    
    // Remove from registry
    this.models.delete(type)
    this.activeModels.delete(type)
    this.clearCache(type)
    
    // Notify listeners
    this.notifyListeners({
      type: 'unregister',
      modelType: type
    })
    
    return true
  }
  
  /**
   * Get a model by type
   */
  getModel(type: string): AnimationModel | undefined {
    return this.models.get(type)
  }
  
  /**
   * Get all registered models
   */
  getAllModels(): AnimationModel[] {
    return Array.from(this.models.values())
  }
  
  /**
   * Get active models
   */
  getActiveModels(): AnimationModel[] {
    return Array.from(this.activeModels)
      .map(type => this.models.get(type))
      .filter(Boolean) as AnimationModel[]
  }
  
  /**
   * Get models by category
   */
  getModelsByCategory(category: string): AnimationModel[] {
    return this.getAllModels().filter(model => model.metadata.category === category)
  }
  
  /**
   * Search models by query
   */
  searchModels(query: string): AnimationModel[] {
    const lowerQuery = query.toLowerCase()
    return this.getAllModels().filter(model => {
      const metadata = model.metadata
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.type.toLowerCase().includes(lowerQuery) ||
        metadata.description?.toLowerCase().includes(lowerQuery) ||
        metadata.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    })
  }
  
  /**
   * Check if a model is registered
   */
  hasModel(type: string): boolean {
    return this.models.has(type)
  }
  
  /**
   * Check if a model is active
   */
  isActive(type: string): boolean {
    return this.activeModels.has(type)
  }
  
  /**
   * Activate a model
   */
  activate(type: string): boolean {
    if (!this.models.has(type)) {
      return false
    }
    
    this.activeModels.add(type)
    
    // Notify listeners
    this.notifyListeners({
      type: 'activate',
      modelType: type
    })
    
    return true
  }
  
  /**
   * Deactivate a model
   */
  deactivate(type: string): boolean {
    if (!this.activeModels.has(type)) {
      return false
    }
    
    this.activeModels.delete(type)
    this.clearCache(type)
    
    // Notify listeners
    this.notifyListeners({
      type: 'deactivate',
      modelType: type
    })
    
    return true
  }
  
  /**
   * Load a model from source
   */
  async loadModel(source: ModelSource): Promise<ModelLoadResult> {
    try {
      let model: AnimationModel | undefined
      
      switch (source.type) {
        case 'builtin':
          model = this.loadBuiltinModel(source.name)
          break
          
        case 'file':
          model = await this.loadModelFromFile(source.path)
          break
          
        case 'url':
          model = await this.loadModelFromUrl(source.url)
          break
          
        case 'json':
          model = this.parseJsonModel(source.data)
          break
          
        case 'function':
          model = source.model
          break
      }
      
      if (!model) {
        return {
          success: false,
          error: 'Failed to load model'
        }
      }
      
      // Validate the model
      const validationResult = validateModel(model)
      if (!validationResult.valid) {
        return {
          success: false,
          error: 'Model validation failed',
          warnings: validationResult.errors.map((e: any) => e.message)
        }
      }
      
      // Register the model
      const registrationResult = this.register(model)
      
      return {
        success: registrationResult.valid,
        model,
        error: registrationResult.valid ? undefined : 'Registration failed',
        warnings: registrationResult.warnings
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Load built-in models
   */
  private loadBuiltinModels(): void {
    const builtinModels = createBuiltinModels()
    
    for (const model of builtinModels) {
      this.register(model, {
        override: false,
        validate: false, // Skip validation for built-in models
        activate: true
      })
    }
    
    console.log(`Loaded ${builtinModels.length} built-in animation models`)
  }
  
  /**
   * Load a specific built-in model
   */
  private loadBuiltinModel(name: string): AnimationModel | undefined {
    // This would load from the built-in models
    return this.models.get(name)
  }
  
  /**
   * Load model from file
   */
  private async loadModelFromFile(path: string): Promise<AnimationModel | undefined> {
    // In Electron environment
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const result = await (window as any).electronAPI.readFile(path)
      if (result.success) {
        return this.parseJsonModel(JSON.parse(result.data))
      }
    }
    
    return undefined
  }
  
  /**
   * Load model from URL
   */
  private async loadModelFromUrl(url: string): Promise<AnimationModel | undefined> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`)
      }
      
      const data = await response.json()
      return this.parseJsonModel(data)
    } catch (error) {
      console.error('Error loading model from URL:', error)
      return undefined
    }
  }
  
  /**
   * Parse JSON model data
   */
  private parseJsonModel(data: any): AnimationModel | undefined {
    try {
      // Convert string functions to actual functions
      if (typeof data.calculate === 'string') {
        data.calculate = new Function('parameters', 'time', 'duration', 'context', data.calculate)
      }
      
      if (typeof data.getDefaultParameters === 'string') {
        data.getDefaultParameters = new Function('trackPosition', data.getDefaultParameters)
      }
      
      // Parse multi-track handlers
      if (data.multiTrackHandlers) {
        data.multiTrackHandlers = data.multiTrackHandlers.map((handler: any) => ({
          mode: handler.mode,
          handler: typeof handler.handler === 'string' 
            ? new Function('basePosition', 'context', 'parameters', handler.handler) as any
            : handler.handler
        }))
      }
      
      return data as AnimationModel
    } catch (error) {
      console.error('Error parsing JSON model:', error)
      return undefined
    }
  }
  
  /**
   * Export a model to JSON
   */
  exportModel(type: string): any {
    const model = this.models.get(type)
    if (!model) {
      return null
    }
    
    // Convert functions to strings for export
    const exported: any = { ...model }
    
    if (typeof model.calculate === 'function') {
      exported.calculate = model.calculate.toString()
    }
    
    if (typeof model.getDefaultParameters === 'function') {
      exported.getDefaultParameters = model.getDefaultParameters.toString()
    }
    
    if (model.multiTrackHandlers) {
      exported.multiTrackHandlers = model.multiTrackHandlers.map(handler => ({
        mode: handler.mode,
        handler: typeof handler.handler === 'function' 
          ? handler.handler.toString() 
          : handler.handler
      }))
    }
    
    return exported
  }
  
  /**
   * Clear cache for a model
   */
  private clearCache(type?: string): void {
    if (type) {
      // Clear cache for specific model
      for (const key of this.modelCache.keys()) {
        if (key.startsWith(`${type}:`)) {
          this.modelCache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.modelCache.clear()
    }
  }
  
  /**
   * Get cached value
   */
  getCached<T>(key: string): T | undefined {
    return this.modelCache.get(key)
  }
  
  /**
   * Set cached value
   */
  setCached<T>(key: string, value: T): void {
    this.modelCache.set(key, value)
  }
  
  /**
   * Subscribe to registry events
   */
  subscribe(listener: (event: ModelRegistryEvent) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: ModelRegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (error) {
        console.error('Error in registry listener:', error)
      }
    }
  }
}

/**
 * Registry event types
 */
export type ModelRegistryEvent = 
  | { type: 'register'; modelType: string; model: AnimationModel }
  | { type: 'unregister'; modelType: string }
  | { type: 'activate'; modelType: string }
  | { type: 'deactivate'; modelType: string }
  | { type: 'update'; modelType: string; model: AnimationModel }

// Create singleton instance
export const modelRegistry = new AnimationModelRegistry()

// Export convenience functions
export const registerModel = (model: AnimationModel, options?: ModelRegistrationOptions) => 
  modelRegistry.register(model, options)

export const getModel = (type: string) => 
  modelRegistry.getModel(type)

export const getAllModels = () => 
  modelRegistry.getAllModels()

export const searchModels = (query: string) => 
  modelRegistry.searchModels(query)

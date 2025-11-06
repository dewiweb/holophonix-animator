import { Position } from '@/types'

// ========================================
// ANIMATION MODEL SYSTEM TYPES
// ========================================

/**
 * Parameter type definitions for animation models
 */
export type ParameterType = 'number' | 'position' | 'boolean' | 'string' | 'enum' | 'array'

/**
 * Validation rules for parameters
 */
export interface ValidationRule {
  type: 'min' | 'max' | 'range' | 'pattern' | 'custom'
  value?: any
  message?: string
  validator?: (value: any) => boolean
}

/**
 * Definition of a single parameter in an animation model
 */
export interface ParameterDefinition {
  type: ParameterType
  default: any
  label?: string                // Display name in UI
  description?: string          // Tooltip/help text
  group?: string               // UI grouping
  order?: number               // Display order in group
  
  // Validation
  required?: boolean
  validation?: ValidationRule[]
  
  // Type-specific options
  min?: number                // For number type
  max?: number                // For number type
  step?: number               // For number type
  unit?: string              // Display unit (m, deg, Hz, etc.)
  
  options?: string[]         // For enum type
  
  arrayType?: ParameterType  // For array type
  arrayMin?: number          // Minimum array length
  arrayMax?: number          // Maximum array length
  
  // UI hints
  uiComponent?: 'slider' | 'input' | 'position3d' | 'select' | 'checkbox' | 'color'
  hidden?: boolean          // Hide from UI (internal parameter)
  advanced?: boolean        // Show in advanced section
  
  // Dependencies
  dependsOn?: {
    parameter: string
    condition: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
    value: any
  }[]
}

/**
 * Calculation context provided to animation models
 */
export interface CalculationContext {
  // Track information
  trackId: string
  trackIndex: number
  totalTracks: number
  trackPosition?: Position      // Current track position
  initialPosition?: Position    // Starting position
  
  // Multi-track mode
  multiTrackMode?: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  isobarycenter?: Position     // Formation center
  centerPoint?: Position       // User-defined center
  trackOffset?: Position       // Offset from center
  
  // Timing
  frameCount: number
  deltaTime: number           // Time since last frame
  realTime: number           // Real time since start
  
  // Physics state (for stateful animations)
  state?: Map<string, any>
}

/**
 * Multi-track handler for custom behavior in different modes
 */
export interface MultiTrackHandler {
  mode: string
  handler: (
    basePosition: Position,
    context: CalculationContext,
    parameters: Record<string, any>
  ) => Position
}

/**
 * Model metadata for organization and discovery
 */
export interface ModelMetadata {
  type: string               // Unique identifier (e.g., 'circular', 'pendulum')
  name: string               // Display name
  version: string            // Semantic version (e.g., '1.0.0')
  author?: string            // Author name
  license?: string           // License identifier (e.g., 'MIT')
  description?: string       // Detailed description
  category: string          // Category for organization
  tags?: string[]           // Searchable tags
  icon?: string             // Icon name or URL
  preview?: string          // Preview image URL
  documentation?: string    // Documentation URL or markdown
  
  // Compatibility
  minAppVersion?: string    // Minimum app version required
  maxAppVersion?: string    // Maximum app version supported
  dependencies?: string[]   // Required model dependencies
}

/**
 * Performance hints for optimization
 */
export interface PerformanceHints {
  complexity: 'constant' | 'linear' | 'quadratic' | 'exponential'
  stateful: boolean         // Maintains state between frames
  gpuAccelerated?: boolean  // Can use GPU acceleration
  maxTracks?: number        // Recommended max tracks
  cacheKey?: string[]       // Parameters that affect caching
}

/**
 * Complete animation model definition
 */
export interface AnimationModel {
  // Metadata
  metadata: ModelMetadata
  
  // Parameter definitions
  parameters: Record<string, ParameterDefinition>
  
  // Multi-track support
  supportedModes?: ('identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered')[]
  defaultMultiTrackMode?: string
  multiTrackHandlers?: MultiTrackHandler[]
  
  // Performance hints
  performance?: PerformanceHints
  
  // Lifecycle hooks
  initialize?: (parameters: Record<string, any>, context: CalculationContext) => void
  cleanup?: (context: CalculationContext) => void
  onParameterChange?: (key: string, value: any, parameters: Record<string, any>) => Record<string, any>
  
  // Position calculation (can be function or string for dynamic loading)
  calculate: ((
    parameters: Record<string, any>,
    time: number,
    duration: number,
    context: CalculationContext
  ) => Position) | string
  
  // Default parameter generator
  getDefaultParameters: ((trackPosition: Position) => Record<string, any>) | string
  
  // Validation
  validateParameters?: (parameters: Record<string, any>) => { valid: boolean; errors?: string[] }
  
  // Export/Import
  exportParameters?: (parameters: Record<string, any>) => any
  importParameters?: (data: any) => Record<string, any>
}

/**
 * Model validation result
 */
export interface ModelValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings?: string[]
  info?: string[]
}

/**
 * Model registration options
 */
export interface ModelRegistrationOptions {
  override?: boolean         // Override existing model
  validate?: boolean         // Validate model before registration
  activate?: boolean         // Activate model immediately
}

/**
 * Model source for loading
 */
export type ModelSource = 
  | { type: 'builtin'; name: string }
  | { type: 'file'; path: string }
  | { type: 'url'; url: string }
  | { type: 'json'; data: any }
  | { type: 'function'; model: AnimationModel }

/**
 * Model loader result
 */
export interface ModelLoadResult {
  success: boolean
  model?: AnimationModel
  error?: string
  warnings?: string[]
}

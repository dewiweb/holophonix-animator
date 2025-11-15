/**
 * Position Preset Types
 * 
 * Defines types for storing and managing track position presets.
 * Presets enable quick recall of complex spatial configurations.
 */

import { Position, Track, TrackType } from './index'

// ========================================
// POSITION PRESETS
// ========================================

/**
 * Position Preset
 * A saved snapshot of track positions
 */
export interface PositionPreset {
  id: string
  name: string
  description?: string
  
  // Position data
  positions: Record<string, Position>  // trackId -> position
  trackIds: string[]                   // All tracks in this preset
  
  // Metadata
  category?: PresetCategory
  tags?: string[]
  thumbnail?: string                   // Base64 or URL to preset visualization
  
  // Creation info
  created: Date
  modified: Date
  author?: string
  
  // Versioning
  version: number                      // For migration compatibility
  projectId?: string                   // Link to source project
  
  // Scope
  scope: 'project' | 'global'         // Project-specific or shared library
  
  // Advanced features
  mode?: 'absolute' | 'relative'      // Absolute positions or relative offsets
  referencePosition?: Position         // For relative mode
}

/**
 * Preset Category
 * Organizational categories for presets
 */
export type PresetCategory = 
  | 'scene'           // Complete scene configurations
  | 'formation'       // Track formations (line, circle, grid)
  | 'effect'          // Effect start/end positions
  | 'safety'          // Safe positions (home, park)
  | 'custom'          // User-defined

/**
 * Position Preset Library
 * Manages collection of presets
 */
export interface PositionPresetLibrary {
  presets: PositionPreset[]
  categories: PresetCategory[]
  
  // Organization
  folders?: PresetFolder[]
  favorites?: string[]               // Preset IDs
  recentlyUsed?: string[]           // Preset IDs in order of recent use
}

/**
 * Preset Folder
 * Organizational folder for grouping presets
 */
export interface PresetFolder {
  id: string
  name: string
  presetIds: string[]
  parentId?: string                  // For nested folders
  color?: string
  icon?: string
  isExpanded?: boolean
}

/**
 * Track Filter
 * Dynamic track selection for presets
 */
export interface TrackFilter {
  mode: 'include' | 'exclude'
  
  // Filter criteria
  trackType?: TrackType[]
  groups?: string[]
  tags?: string[]
  indices?: number[]                  // Holophonix indices
  names?: string[]                    // Name patterns (supports wildcards)
  
  // Conditions
  conditions?: FilterCondition[]
}

export interface FilterCondition {
  property: keyof Track
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between'
  value: any
  value2?: any                        // For 'between' operator
}

// ========================================
// PRESET OPERATIONS
// ========================================

/**
 * Capture Options
 * Options for capturing current positions as preset
 */
export interface CaptureOptions {
  name: string
  description?: string
  category?: PresetCategory
  tags?: string[]
  scope?: 'project' | 'global'
  includeInactive?: boolean          // Include tracks not in current project
  mode?: 'absolute' | 'relative'
  referencePosition?: Position        // For relative mode
}

/**
 * Apply Preset Options
 * Options for applying a preset to tracks
 */
export interface ApplyPresetOptions {
  trackIds?: string[]                // Override preset tracks
  trackFilter?: TrackFilter          // Dynamic track selection
  transition?: PositionTransition
  interruptAnimations?: boolean
  respectBounds?: boolean            // Clip positions to safe bounds
  maxSpeed?: number                  // Max track velocity (m/s)
}

/**
 * Position Transition
 * Configuration for transitioning between positions
 */
export interface PositionTransition {
  duration: number                    // Seconds
  easing: EasingFunction
  
  // Advanced interpolation
  mode: InterpolationMode
  
  // Per-track overrides (optional)
  perTrackDuration?: Record<string, number>
  perTrackEasing?: Record<string, EasingFunction>
  
  // Delay options
  stagger?: StaggerConfig             // Stagger track movements
}

/**
 * Interpolation Mode
 * Strategy for interpolating between positions
 */
export type InterpolationMode = 
  | 'cartesian'      // Linear interpolation in XYZ space
  | 'spherical'      // Spherical interpolation (SLERP)
  | 'bezier'         // Bezier curve with auto-generated control points
  | 'circular'       // Maintain constant distance from origin
  | 'custom'         // User-defined interpolation function

/**
 * Easing Function
 * Timing curves for transitions
 */
export type EasingFunction = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'ease-in-expo'
  | 'ease-out-expo'
  | 'ease-in-out-expo'
  | 'ease-in-back'
  | 'ease-out-back'
  | 'ease-in-out-back'
  | 'ease-in-elastic'
  | 'ease-out-elastic'
  | 'ease-in-out-elastic'

/**
 * Stagger Configuration
 * Delay track movements sequentially
 */
export interface StaggerConfig {
  enabled: boolean
  mode: StaggerMode
  delay: number                       // Delay between tracks (seconds)
  overlap: number                     // Overlap factor (0-1)
}

export type StaggerMode = 
  | 'sequential'     // Order by track index
  | 'random'         // Random order
  | 'inside-out'     // From center outward
  | 'outside-in'     // From edges inward
  | 'distance'       // By distance from origin
  | 'custom'         // Custom order array

// ========================================
// PRESET COMPARISON & ANALYSIS
// ========================================

/**
 * Preset Diff
 * Comparison between two presets
 */
export interface PresetDiff {
  added: string[]                    // Tracks in preset2 not in preset1
  removed: string[]                  // Tracks in preset1 not in preset2
  moved: MovedTrack[]
  unchanged: string[]
  
  // Statistics
  stats: {
    totalTracks: number
    movedCount: number
    averageDistance: number
    maxDistance: number
    minDistance: number
  }
}

export interface MovedTrack {
  trackId: string
  trackName: string
  from: Position
  to: Position
  distance: number
  direction: Position                // Normalized direction vector
}

/**
 * Preset Statistics
 * Analytical data about a preset
 */
export interface PresetStats {
  trackCount: number
  
  // Spatial distribution
  bounds: {
    min: Position
    max: Position
    center: Position
  }
  
  // Distances
  averageDistanceFromOrigin: number
  maxDistanceFromOrigin: number
  averageDistanceBetweenTracks: number
  
  // Density
  spatialDensity: number             // Tracks per cubic meter
  spreadFactor: number               // How spread out tracks are (0-1)
}

// ========================================
// PRESET BLENDING
// ========================================

/**
 * Preset Blend
 * Blend between multiple presets
 */
export interface PresetBlend {
  mode: BlendMode
  
  // Multiple presets with weights
  presets: Array<{
    presetId: string
    weight: number                    // 0-1
  }>
  
  // Conflict resolution
  conflictStrategy: ConflictStrategy
}

export type BlendMode = 
  | 'crossfade'      // Linear blend between presets
  | 'additive'       // Add positions together
  | 'selective'      // Use different presets for different tracks
  | 'morph'          // Smooth morphing with intermediate positions

export type ConflictStrategy = 
  | 'first-wins'     // First preset takes precedence
  | 'last-wins'      // Last preset takes precedence
  | 'average'        // Average all positions
  | 'weighted'       // Use preset weights

// ========================================
// VALIDATION & SAFETY
// ========================================

/**
 * Preset Validation Result
 */
export interface PresetValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  
  // Safety checks
  safetyChecks: {
    boundsCheck: boolean             // All positions within bounds
    collisionCheck: boolean          // No overlapping tracks
    velocityCheck: boolean           // Velocity within limits
  }
}

/**
 * Safety Bounds
 * Safe operating area for track positions
 */
export interface SafetyBounds {
  min: Position
  max: Position
  enabled: boolean
  warnOnly: boolean                  // Only warn, don't prevent
}

// ========================================
// IMPORT/EXPORT
// ========================================

/**
 * Preset Export Format
 * Standardized format for sharing presets
 */
export interface PresetExportFormat {
  version: string                    // Format version
  exportDate: Date
  preset: PositionPreset
  
  // Additional metadata
  appVersion?: string
  trackMetadata?: Record<string, Partial<Track>>  // Preserve track info
  
  // Preview
  thumbnail?: string
}

/**
 * Library Export Format
 * Export entire preset library
 */
export interface LibraryExportFormat {
  version: string
  exportDate: Date
  library: PositionPresetLibrary
  
  // Metadata
  appVersion?: string
  projectName?: string
}

// ========================================
// HELPER TYPES
// ========================================

/**
 * Transition Target
 * Internal type for transition execution
 */
export interface TransitionTarget {
  trackId: string
  from: Position
  to: Position
  distance: number
  duration: number
  easing: EasingFunction
  delay?: number                     // For stagger
}

/**
 * Preset Action
 * User action on a preset
 */
export type PresetAction = 
  | 'apply'          // Apply preset to tracks
  | 'update'         // Update preset from current positions
  | 'duplicate'      // Duplicate preset
  | 'delete'         // Delete preset
  | 'export'         // Export preset
  | 'share'          // Share preset

/**
 * Preset Sort Options
 */
export interface PresetSortOptions {
  by: 'name' | 'created' | 'modified' | 'category' | 'trackCount' | 'recentlyUsed'
  order: 'asc' | 'desc'
}

/**
 * Preset Search Options
 */
export interface PresetSearchOptions {
  query: string
  categories?: PresetCategory[]
  tags?: string[]
  scope?: 'project' | 'global' | 'all'
  minTracks?: number
  maxTracks?: number
}

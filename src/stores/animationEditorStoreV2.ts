import { create } from 'zustand'
import { Animation, AnimationType, Keyframe, Position, Track } from '@/types'
import { AnimationModel } from '@/models/types'
import { getDefaultAnimationParameters } from '@/components/animation-editor/utils/defaultParameters'
import { extractUIState } from '@/utils/transformBuilder'
import { generateDefaultAnimationName } from '@/utils/animationNameGenerator'
import { useProjectStore } from './projectStore'
import { modelRegistry } from '@/models/registry'

// ============================================
// STATE INTERFACE
// ============================================

export interface AnimationEditorState {
  // --------------------------------------------
  // FORM STATE (Core Animation Data)
  // --------------------------------------------
  animationForm: Partial<Animation>
  keyframes: Keyframe[]
  originalAnimationParams: any | null
  selectedModel: AnimationModel | null
  loadedAnimationId: string | null
  
  // --------------------------------------------
  // MULTI-TRACK STATE (2-mode architecture: relative + barycentric)
  // --------------------------------------------
  multiTrackMode: 'relative' | 'barycentric'
  barycentricVariant: 'shared' | 'isobarycentric' | 'centered' | 'custom'
  customCenter?: Position
  preserveOffsets?: boolean
  phaseOffsetSeconds: number
  multiTrackParameters: Record<string, any>
  activeEditingTrackIds: string[]
  lockTracks: boolean
  
  // --------------------------------------------
  // SUBANIMATION SETTINGS (Fade-in/Fade-out)
  // --------------------------------------------
  fadeInEnabled: boolean
  fadeInDuration: number
  fadeInEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  fadeOutEnabled: boolean
  fadeOutDuration: number
  fadeOutEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  
  // --------------------------------------------
  // UI STATE
  // --------------------------------------------
  showPresetBrowser: boolean
  showPresetNameDialog: boolean
  showAnimationLibrary: boolean
  activeWorkPane: 'preview' | 'control'
  isFormPanelOpen: boolean
  
  // --------------------------------------------
  // COMPUTED/DERIVED STATE
  // --------------------------------------------
  isDirty: () => boolean
  canSave: () => boolean
  hasUnsavedChanges: () => boolean
  
  // --------------------------------------------
  // FORM ACTIONS
  // --------------------------------------------
  setAnimationForm: (form: Partial<Animation>) => void
  updateAnimationForm: (updates: Partial<Animation>) => void
  setAnimationType: (type: AnimationType, track?: Track) => void
  setAnimationTypeWithTracks: (type: AnimationType, tracks: Track[], multiTrackParams: Record<string, any>) => void
  updateParameter: (key: string, value: any) => void
  updateParameters: (params: Record<string, any>) => void
  resetToDefaults: (track?: Track) => void
  loadAnimation: (animation: Animation) => void
  clearForm: () => void
  
  // --------------------------------------------
  // KEYFRAME ACTIONS
  // --------------------------------------------
  setKeyframes: (keyframes: Keyframe[]) => void
  addKeyframe: (keyframe: Keyframe) => void
  updateKeyframe: (id: string, updates: Partial<Keyframe>) => void
  deleteKeyframe: (id: string) => void
  
  // --------------------------------------------
  // MULTI-TRACK ACTIONS
  // --------------------------------------------
  setMultiTrackMode: (mode: 'relative' | 'barycentric') => void
  setBarycentricVariant: (variant: 'shared' | 'isobarycentric' | 'centered' | 'custom') => void
  setCustomCenter: (center: Position | undefined) => void
  setPreserveOffsets: (preserve: boolean | undefined) => void
  setPhaseOffsetSeconds: (seconds: number) => void
  setMultiTrackParameters: (params: Record<string, any>) => void
  updateMultiTrackParameter: (trackId: string, key: string, value: any) => void
  setActiveEditingTrackIds: (ids: string[]) => void
  setLockTracks: (lock: boolean) => void
  
  // --------------------------------------------
  // SUBANIMATION ACTIONS
  // --------------------------------------------
  setFadeInEnabled: (enabled: boolean) => void
  setFadeInDuration: (duration: number) => void
  setFadeInEasing: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
  setFadeOutEnabled: (enabled: boolean) => void
  setFadeOutDuration: (duration: number) => void
  setFadeOutEasing: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
  
  // --------------------------------------------
  // UI ACTIONS
  // --------------------------------------------
  setShowPresetBrowser: (show: boolean) => void
  setShowPresetNameDialog: (show: boolean) => void
  setShowAnimationLibrary: (show: boolean) => void
  setActiveWorkPane: (pane: 'preview' | 'control') => void
  setIsFormPanelOpen: (open: boolean) => void
  
  // --------------------------------------------
  // UTILITY ACTIONS
  // --------------------------------------------
  reset: () => void
  setSelectedModel: (model: AnimationModel | null) => void
}

// ============================================
// INITIAL STATE
// ============================================

const getInitialState = () => ({
  // Form State
  animationForm: {
    name: 'Linear Animation', // Auto-generated default name
    type: 'linear' as AnimationType,
    duration: 10,
    loop: false,
    pingPong: false,
    coordinateSystem: { type: 'xyz' as const },
    parameters: {}
  },
  keyframes: [],
  originalAnimationParams: null,
  selectedModel: null,
  loadedAnimationId: null,
  
  // Multi-Track State (relative by default - most flexible)
  multiTrackMode: 'relative' as const,
  barycentricVariant: 'isobarycentric' as const,
  customCenter: undefined,
  preserveOffsets: undefined,
  phaseOffsetSeconds: 0, // Default: no phase offset
  multiTrackParameters: {},
  activeEditingTrackIds: [],
  lockTracks: false,
  
  // Subanimation Settings (Fade-in/Fade-out)
  fadeInEnabled: true,
  fadeInDuration: 0.5,
  fadeInEasing: 'ease-out' as const,
  fadeOutEnabled: true, // Enabled by default so tracks return to initial positions
  fadeOutDuration: 0.5,
  fadeOutEasing: 'ease-in' as const,
  
  // UI State
  showPresetBrowser: false,
  showPresetNameDialog: false,
  showAnimationLibrary: false,
  activeWorkPane: 'preview' as const,
  isFormPanelOpen: false,
})

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAnimationEditorStoreV2 = create<AnimationEditorState>((set, get) => ({
  ...getInitialState(),
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  isDirty: () => {
    const state = get()
    return state.originalAnimationParams !== null &&
           JSON.stringify(state.animationForm.parameters) !== JSON.stringify(state.originalAnimationParams)
  },
  
  canSave: () => {
    const state = get()
    return !!(state.animationForm.name && state.animationForm.type)
  },
  
  hasUnsavedChanges: () => {
    const state = get()
    return state.isDirty() && state.canSave()
  },
  
  // ============================================
  // FORM ACTIONS
  // ============================================
  
  setAnimationForm: (form) => {
    set({ animationForm: form })
  },
  
  updateAnimationForm: (updates) => {
    set((state) => ({
      animationForm: { ...state.animationForm, ...updates }
    }))
  },
  
  setAnimationType: (type, track) => {
    const defaultParams = track 
      ? getDefaultAnimationParameters(type, track)
      : getDefaultAnimationParameters(type, { position: { x: 0, y: 0, z: 0 }, initialPosition: { x: 0, y: 0, z: 0 } } as Track)
    
    // Get existing animation names from project store
    const animations = useProjectStore.getState().animations
    const existingNames = animations.map((a: Animation) => a.name)
    
    // Generate unique default name based on type
    const defaultName = generateDefaultAnimationName(type, existingNames)
    
    set((state) => ({
      animationForm: {
        ...state.animationForm,
        name: defaultName,
        type,
        parameters: defaultParams
      }
    }))
  },
  
  setAnimationTypeWithTracks: (type, tracks, multiTrackParams) => {
    console.log('🏪 STORE: setAnimationTypeWithTracks called', {
      type,
      trackCount: tracks.length,
      multiTrackParamKeys: Object.keys(multiTrackParams),
      firstTrackParams: multiTrackParams[Object.keys(multiTrackParams)[0]] 
        ? Object.keys(multiTrackParams[Object.keys(multiTrackParams)[0]]) 
        : []
    })
    
    set((state) => {
      // Use first track or default position for base parameters
      const firstTrack = tracks[0]
      const currentPosition = firstTrack?.position || 
                             firstTrack?.initialPosition || 
                             { x: 0, y: 0, z: 0 }
      
      const trackWithPosition = firstTrack || { 
        position: currentPosition, 
        initialPosition: currentPosition 
      } as Track
      
      // Generate default parameters for new type
      const defaultParams = getDefaultAnimationParameters(type, trackWithPosition)
      
      console.log('🏪 STORE: Updating state with:', {
        newType: type,
        newBaseParams: Object.keys(defaultParams),
        multiTrackParamCount: Object.keys(multiTrackParams).length
      })
      
      // Get existing animation names from project store
      const animations = useProjectStore.getState().animations
      const existingNames = animations.map((a: Animation) => a.name)
      
      // Generate unique default name based on type
      const defaultName = generateDefaultAnimationName(type, existingNames)
      
      // ATOMIC UPDATE: name + type + parameters + multiTrackParameters
      return {
        animationForm: {
          ...state.animationForm,
          name: defaultName,
          type,
          parameters: defaultParams
        },
        multiTrackParameters: { ...multiTrackParams }
      }
    })
  },
  
  updateParameter: (key, value) => {
    set((state) => ({
      animationForm: {
        ...state.animationForm,
        parameters: {
          ...state.animationForm.parameters,
          [key]: value
        }
      }
    }))
  },
  
  updateParameters: (params) => {
    set((state) => ({
      animationForm: {
        ...state.animationForm,
        parameters: {
          ...state.animationForm.parameters,
          ...params
        }
      }
    }))
  },
  
  resetToDefaults: (track) => {
    set((state) => {
      if (!state.animationForm.type) return state
      
      // Preserve position when resetting to defaults
      const currentPosition = state.animationForm.parameters?.startPosition || 
                             state.animationForm.parameters?.center || 
                             track?.position || 
                             track?.initialPosition || 
                             { x: 0, y: 0, z: 0 }
      
      const trackWithPosition = track || { 
        position: currentPosition, 
        initialPosition: currentPosition 
      } as Track
      
      const defaultParams = getDefaultAnimationParameters(state.animationForm.type, trackWithPosition)
      
      return {
        animationForm: {
          ...state.animationForm,
          parameters: { ...defaultParams }
        }
      }
    })
  },
  
  loadAnimation: (animation) => {
    console.log('📥 Loading animation:', animation.name, {
      type: animation.type,
      hasParameters: !!animation.parameters,
      parameterKeys: animation.parameters ? Object.keys(animation.parameters) : []
    })
    
    // V3: Extract UI state from transform
    const uiState = extractUIState(animation.transform)
    
    // Extract phase offset from transform
    const phaseOffset = animation.transform && Object.values(animation.transform.tracks)[0]?.timeShift || 0
    
    // CRITICAL: In relative mode, extract per-track parameters from tracks
    const multiTrackParams: Record<string, any> = {}
    
    if (uiState.mode === 'relative') {
      console.log('📥 Loading relative mode animation - extracting per-track parameters from tracks')
      const projectStore = useProjectStore.getState()
      const trackIds = animation.trackIds || []
      
      trackIds.forEach(trackId => {
        const track = projectStore.tracks.find((t: Track) => t.id === trackId)
        if (track?.animationState?.animation) {
          // Extract per-track parameters from the track's animation
          const trackAnimation = track.animationState.animation
          if (trackAnimation.parameters) {
            multiTrackParams[trackId] = JSON.parse(JSON.stringify(trackAnimation.parameters))
            console.log(`  📍 Track ${track.name || trackId}: Loaded per-track params`, trackAnimation.parameters)
          }
        }
      })
    } else {
      // In barycentric mode, animation.parameters contains the shared parameters
      console.log('📥 Loading barycentric mode animation - using shared parameters from animation')
    }
    
    // Restore track selection from trackIds or extract from transform (for old animations)
    let trackIdsToRestore = animation.trackIds
    if (!trackIdsToRestore && animation.transform?.tracks) {
      // Fallback: extract track IDs from transform for old animations
      trackIdsToRestore = Object.keys(animation.transform.tracks)
      console.log('📦 Extracted track IDs from transform (old animation):', trackIdsToRestore)
    }
    
    if (trackIdsToRestore && trackIdsToRestore.length > 0) {
      const projectStore = useProjectStore.getState()
      console.log('🔄 Restoring track selection:', trackIdsToRestore)
      projectStore.selectTracks(trackIdsToRestore)
    }
    
    // Load the model from registry so dropdown and form update correctly
    const model = modelRegistry.getModel(animation.type)
    if (model) {
      console.log('📦 Loading model from registry:', model.metadata.name)
    } else {
      console.warn('⚠️ Model not found in registry:', animation.type)
    }
    
    set({
      animationForm: animation,
      keyframes: animation.keyframes || [],
      originalAnimationParams: JSON.parse(JSON.stringify(animation.parameters || {})),
      loadedAnimationId: animation.id,
      selectedModel: model || null,  // Set the model so dropdown and form update
      multiTrackMode: uiState.mode,
      barycentricVariant: uiState.variant || 'isobarycentric',
      customCenter: uiState.customCenter,
      preserveOffsets: true,  // V3 always preserves offsets in formation mode
      multiTrackParameters: multiTrackParams,  // Load per-track params in relative mode
      phaseOffsetSeconds: phaseOffset,
      lockTracks: animation.trackSelectionLocked || false
    })
    
    console.log('✅ Animation loaded into form:', {
      name: animation.name,
      type: animation.type,
      model: model?.metadata.name || 'none',
      parameters: animation.parameters,
      mode: uiState.mode,
      restoredTracks: trackIdsToRestore?.length || 0,
      trackIdsSource: animation.trackIds ? 'saved' : (animation.transform?.tracks ? 'transform' : 'none')
    })
  },
  
  clearForm: () => {
    const initial = getInitialState()
    set({
      animationForm: initial.animationForm,
      keyframes: initial.keyframes,
      originalAnimationParams: null,
      loadedAnimationId: null
    })
  },
  
  // ============================================
  // KEYFRAME ACTIONS
  // ============================================
  
  setKeyframes: (keyframes) => {
    set({ keyframes })
  },
  
  addKeyframe: (keyframe) => {
    set((state) => ({
      keyframes: [...state.keyframes, keyframe]
    }))
  },
  
  updateKeyframe: (id, updates) => {
    set((state) => ({
      keyframes: state.keyframes.map(kf => 
        kf.id === id ? { ...kf, ...updates } : kf
      )
    }))
  },
  
  deleteKeyframe: (id) => {
    set((state) => ({
      keyframes: state.keyframes.filter(kf => kf.id !== id)
    }))
  },
  
  // ============================================
  // MULTI-TRACK ACTIONS
  // ============================================
  
  setMultiTrackMode: (mode) => {
    set({ multiTrackMode: mode })
  },
  
  setBarycentricVariant: (variant) => {
    set((state) => {
      // Initialize customCenter if switching to a variant that uses it and it doesn't exist
      const needsCustomCenter = variant === 'shared' || variant === 'centered' || variant === 'custom'
      const updates: Partial<AnimationEditorState> = { barycentricVariant: variant }
      
      if (needsCustomCenter && !state.customCenter) {
        updates.customCenter = { x: 0, y: 0, z: 0 }
        console.log('🎯 Initialized customCenter to origin for variant:', variant)
      }
      
      return updates
    })
  },
  
  setCustomCenter: (center) => {
    set({ customCenter: center })
  },
  
  setPreserveOffsets: (preserve) => {
    set({ preserveOffsets: preserve })
  },
  
  setPhaseOffsetSeconds: (seconds) => {
    set({ phaseOffsetSeconds: seconds })
  },
  
  setMultiTrackParameters: (params) => {
    set({ multiTrackParameters: params })
  },
  
  updateMultiTrackParameter: (trackId, key, value) => {
    set((state) => ({
      multiTrackParameters: {
        ...state.multiTrackParameters,
        [trackId]: {
          ...state.multiTrackParameters[trackId],
          [key]: value
        }
      }
    }))
  },
  
  setActiveEditingTrackIds: (ids) => {
    set({ activeEditingTrackIds: ids })
  },
  
  setLockTracks: (lock) => {
    set({ lockTracks: lock })
  },
  
  // ============================================
  // SUBANIMATION ACTIONS
  // ============================================
  
  setFadeInEnabled: (enabled) => {
    set({ fadeInEnabled: enabled })
  },
  
  setFadeInDuration: (duration) => {
    set({ fadeInDuration: Math.max(0.1, Math.min(duration, 10)) }) // Clamp 0.1-10s
  },
  
  setFadeInEasing: (easing) => {
    set({ fadeInEasing: easing })
  },
  
  setFadeOutEnabled: (enabled) => {
    set({ fadeOutEnabled: enabled })
  },
  
  setFadeOutDuration: (duration) => {
    set({ fadeOutDuration: Math.max(0.1, Math.min(duration, 10)) }) // Clamp 0.1-10s
  },
  
  setFadeOutEasing: (easing) => {
    set({ fadeOutEasing: easing })
  },
  
  // ============================================
  // UI ACTIONS
  // ============================================
  
  setShowPresetBrowser: (show) => {
    set({ showPresetBrowser: show })
  },
  
  setShowPresetNameDialog: (show) => {
    set({ showPresetNameDialog: show })
  },
  
  setShowAnimationLibrary: (show) => {
    set({ showAnimationLibrary: show })
  },
  
  setActiveWorkPane: (pane) => {
    set({ activeWorkPane: pane })
  },
  
  setIsFormPanelOpen: (open) => {
    set({ isFormPanelOpen: open })
  },
  
  // ============================================
  // UTILITY ACTIONS
  // ============================================
  
  reset: () => {
    set(getInitialState())
  },
  
  setSelectedModel: (model) => {
    set({ selectedModel: model })
  },
}))

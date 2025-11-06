import { create } from 'zustand'
import { Animation, Keyframe } from '@/types'

interface AnimationEditorState {
  // Form state
  savedFormState: Partial<Animation> | null
  savedKeyframes: Keyframe[]
  savedOriginalParams: any | null
  savedMultiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  savedPhaseOffsetSeconds: number
  savedCenterPoint: { x: number; y: number; z: number }
  savedMultiTrackParameters: Record<string, any>
  savedActiveEditingTrackIds: string[]
  savedLoadedAnimationId: string | null
  
  // Actions
  saveEditorState: (state: {
    animationForm: Partial<Animation>
    keyframes: Keyframe[]
    originalAnimationParams: any | null
    multiTrackMode: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
    phaseOffsetSeconds: number
    centerPoint: { x: number; y: number; z: number }
    multiTrackParameters: Record<string, any>
    activeEditingTrackIds: string[]
    loadedAnimationId: string | null
  }) => void
  
  clearEditorState: () => void
  
  hasRestoredState: () => boolean
}

export const useAnimationEditorStore = create<AnimationEditorState>((set, get) => ({
  // Initial state
  savedFormState: null,
  savedKeyframes: [],
  savedOriginalParams: null,
  savedMultiTrackMode: 'position-relative',
  savedPhaseOffsetSeconds: 0.5,
  savedCenterPoint: { x: 0, y: 0, z: 0 },
  savedMultiTrackParameters: {},
  savedActiveEditingTrackIds: [],
  savedLoadedAnimationId: null,
  
  // Save current editor state (called when navigating away)
  saveEditorState: (state) => {
    console.log('💾 Saving animation editor state for navigation', {
      hasForm: !!state.animationForm.name,
      animationName: state.animationForm.name,
      type: state.animationForm.type
    })
    
    set({
      savedFormState: state.animationForm,
      savedKeyframes: state.keyframes,
      savedOriginalParams: state.originalAnimationParams,
      savedMultiTrackMode: state.multiTrackMode,
      savedPhaseOffsetSeconds: state.phaseOffsetSeconds,
      savedCenterPoint: state.centerPoint,
      savedMultiTrackParameters: state.multiTrackParameters,
      savedActiveEditingTrackIds: state.activeEditingTrackIds,
      savedLoadedAnimationId: state.loadedAnimationId
    })
  },
  
  // Clear saved state (called after restoration or when creating new animation)
  clearEditorState: () => {
    console.log('🧹 Clearing saved animation editor state')
    set({
      savedFormState: null,
      savedKeyframes: [],
      savedOriginalParams: null,
      savedMultiTrackMode: 'position-relative',
      savedPhaseOffsetSeconds: 0.5,
      savedCenterPoint: { x: 0, y: 0, z: 0 },
      savedMultiTrackParameters: {},
      savedActiveEditingTrackIds: [],
      savedLoadedAnimationId: null
    })
  },
  
  // Check if there's state to restore
  hasRestoredState: () => {
    const state = get()
    return state.savedFormState !== null && !!state.savedFormState.name
  }
}))

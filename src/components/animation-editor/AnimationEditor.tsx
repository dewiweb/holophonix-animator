import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { usePresetStore } from '@/stores/presetStore'
import { useAnimationEditorStoreV2 } from '@/stores/animationEditorStoreV2'
import { cn } from '@/utils'
import { Track, Position, Animation, AnimationType, AnimationState, Keyframe, CoordinateSystem } from '@/types'
import { AnimationModel } from '@/models/types'
import { modelRuntime } from '@/models/runtime'
import { Save, Target, PanelRightOpen, PanelRightClose } from 'lucide-react'

// Import modular components
import { UnifiedThreeJsEditor } from './components/threejs-editor/UnifiedThreeJsEditor'
import { PresetBrowser } from './components/modals/PresetBrowser'
import { PresetNameDialog } from './components/modals/PresetNameDialog'
import { ModelParametersForm } from './components/models-forms/ModelParametersForm'
import { AnimationLibrary } from './components/AnimationLibrary'
import { MultiTrackModeManager } from './components/MultiTrackModeManager'
import { AnimationSettingsPanel } from './components/settings'
import {
  MultiTrackModeSelector,
  SelectedTracksIndicator,
  AnimationTypeSelector,
  PlaybackControlBar,
  ModelSelector
} from './components/controls'

// Import constants and utilities
import { animationCategories, getAnimationInfo, supportsControlPointsTypes } from './constants/animationCategories'
import { getCompatibleModes } from './utils/compatibility'
import { getDefaultAnimationParameters } from './utils/defaultParameters'

// Import custom hooks
import { useKeyframeManagement } from './hooks/useKeyframeManagement'

// Import handlers
import { handleParameterChange } from './handlers/parameterHandlers'
import { handleUseTrackPosition } from './handlers/trackPositionHandler'
import { handleSaveAnimation } from './handlers/saveAnimationHandler'

interface AnimationEditorProps {
  onAnimationSelect?: (animationId: string) => void;
}

export const AnimationEditor: React.FC<AnimationEditorProps> = ({ onAnimationSelect }) => {
  const { currentProject, tracks, selectedTracks, selectTracks, updateTrack, animations, addAnimation, updateAnimation } = useProjectStore()
  const { isPlaying: globalIsPlaying, globalTime, playAnimation, pauseAnimation, stopAnimation, currentAnimationId: playingAnimationId } = useAnimationStore()
  const { addPreset } = usePresetStore()
  
  // NEW: Use primary store for all state
  const {
    // Form state
    animationForm,
    keyframes,
    originalAnimationParams,
    selectedModel,
    loadedAnimationId,
    // Multi-track state
    multiTrackMode,
    barycentricVariant,
    customCenter,
    preserveOffsets,
    phaseOffsetSeconds,
    multiTrackParameters,
    activeEditingTrackIds,
    lockTracks,
    // Subanimation state
    fadeInEnabled,
    fadeInDuration,
    fadeInEasing,
    fadeOutEnabled,
    fadeOutDuration,
    fadeOutEasing,
    // UI state
    showPresetBrowser,
    showPresetNameDialog,
    showAnimationLibrary,
    activeWorkPane,
    isFormPanelOpen,
    // Form actions
    updateAnimationForm,
    setAnimationType,
    setAnimationTypeWithTracks,
    updateParameter,
    updateParameters,
    resetToDefaults,
    loadAnimation,
    // Keyframe actions
    setKeyframes,
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
    // Multi-track actions
    setMultiTrackMode,
    setBarycentricVariant,
    setCustomCenter,
    setPreserveOffsets,
    setPhaseOffsetSeconds,
    setMultiTrackParameters,
    updateMultiTrackParameter,
    setActiveEditingTrackIds,
    setLockTracks,
    // Subanimation actions
    setFadeInEnabled,
    setFadeInDuration,
    setFadeInEasing,
    setFadeOutEnabled,
    setFadeOutDuration,
    setFadeOutEasing,
    // UI actions
    setShowPresetBrowser,
    setShowPresetNameDialog,
    setShowAnimationLibrary,
    setActiveWorkPane,
    setIsFormPanelOpen,
    // Utility
    setSelectedModel
  } = useAnimationEditorStoreV2()

  // FEATURE FLAG: Enable unified 3D editor (set to false for easy rollback)
  const USE_UNIFIED_EDITOR = true

  // Track Selection - memoize to prevent new array reference on every render
  const selectedTrackIds = useMemo(() => 
    selectedTracks.length > 0 ? selectedTracks : tracks.map(t => t.id),
    [selectedTracks, tracks]
  )
  const selectedTrack = tracks.find(t => selectedTrackIds.includes(t.id))
  // Get the animation from the project store instead of the track's state to avoid corruption
  const trackAnimationId = selectedTrack?.animationState?.animation?.id
  
  // CRITICAL: Per-track animations have IDs like "base-id-track-trackid"
  // Extract base animation ID to find it in animations array
  const baseAnimationId = trackAnimationId?.includes('-track-') 
    ? trackAnimationId.split('-track-')[0] 
    : trackAnimationId
  const currentAnimation = baseAnimationId ? animations.find(a => a.id === baseAnimationId) ?? null : null
  // Use global animation store state for accurate playing/paused status
  // Simply use globalIsPlaying - works correctly with pendingAnimations during easing phase
  const isAnimationPlaying = globalIsPlaying

  const selectedTrackObjects = useMemo(() => (
    selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
  ), [selectedTrackIds, tracks])

  // Load active track's parameters when switching tracks in position-relative or phase-offset-relative mode
  // Only reload when the TRACK changes, not when its parameters update (to avoid breaking drag)
  // If multiple tracks are selected for editing, use the first one's parameters as the base
  // NOTE: multiTrackParameters is intentionally NOT a dependency to avoid re-syncing on every parameter change
  useEffect(() => {
    if ((multiTrackMode === 'relative') && activeEditingTrackIds.length > 0) {
      const firstActiveTrackId = activeEditingTrackIds[0]
      const trackParams = multiTrackParameters[firstActiveTrackId]
      console.log('🔄 Active track changed:', {
        trackId: firstActiveTrackId,
        hasParams: !!trackParams,
        paramsKeys: trackParams ? Object.keys(trackParams) : []
      })
      if (trackParams) {
        updateParameters(trackParams)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditingTrackIds, multiTrackMode])

  /**
   * Helper function to update multi-track parameters and sync to animationForm
   * Centralizes the common pattern of updating multiTrackParameters and keeping
   * animationForm.parameters in sync with the first active track
   */
  const syncMultiTrackParameters = (updatedParams: Record<string, any>) => {
    // Update multiTrackParameters in store
    setMultiTrackParameters(updatedParams)
    
    // Sync animationForm to reflect the first active track's parameters
    if (activeEditingTrackIds.length > 0 && updatedParams[activeEditingTrackIds[0]]) {
      updateParameters(updatedParams[activeEditingTrackIds[0]])
    }
  }

  // Keyframe management hook (still needed for keyframe-specific logic)
  // Note: keyframes state comes from store, but this hook manages selection/placement

  const {
    selectedKeyframeId,
    setSelectedKeyframeId,
    isKeyframePlacementMode,
    setIsKeyframePlacementMode,
    handleKeyframeAdd,
    handleKeyframeRemove,
    handleKeyframeUpdate
  } = useKeyframeManagement(keyframes, setKeyframes)

  // NOTE: No more save/restore effects needed!
  // State now persists automatically in the Zustand store across tab switches

  // Derived state
  const supportsControlPoints = useMemo(() => 
    supportsControlPointsTypes.includes((animationForm.type || 'linear')),
    [animationForm.type]
  )

  const trackColors = useMemo(() => (
    tracks.reduce((acc, track) => {
      if (track.color) {
        acc[track.id] = track.color
      }
      return acc
    }, {} as Record<string, { r: number; g: number; b: number; a: number }>)
  ), [tracks])

  const trackPositions = useMemo(() => (
    tracks.reduce((acc, track) => {
      const basePosition = track.initialPosition || track.position
      if (basePosition) {
        acc[track.id] = basePosition
      }
      return acc
    }, {} as Record<string, Position>)
  ), [tracks])

  // Stable preview ID for unsaved animations (prevents control point reload loop)
  const previewIdRef = useRef<string>(`preview-${Date.now()}`)
  
  // Reset preview ID when loading a different animation
  useEffect(() => {
    if (loadedAnimationId) {
      previewIdRef.current = loadedAnimationId
    }
  }, [loadedAnimationId])
  
  // Serialize multi-track parameters for deep comparison
  // Include animation type to force re-computation on type change
  const activeTrackParamsKey = useMemo(() => {
    const typePrefix = animationForm.type ? `${animationForm.type}:` : ''
    if ((multiTrackMode === 'relative') && activeEditingTrackIds.length > 0) {
      const params = multiTrackParameters[activeEditingTrackIds[0]]
      return typePrefix + (params ? JSON.stringify(params) : 'null')
    }
    return typePrefix + JSON.stringify(animationForm.parameters || {})
  }, [animationForm.type, animationForm.parameters, multiTrackMode, activeEditingTrackIds, multiTrackParameters])

  // Multi-track mode manager will handle barycentric calculations and track positions

  // Base animation object (without barycentric enhancements)
  const baseAnimation = useMemo<Animation | null>(() => {
    if (!animationForm.type || !USE_UNIFIED_EDITOR) {
      console.log('❌ No animation object created:', { hasType: !!animationForm.type, useUnified: USE_UNIFIED_EDITOR })
      return null
    }
    
    // Use form parameters as base
    const parameters = animationForm.parameters || {}
    
    // V3: Build transform for preview (if multi-track)
    const selectedTracksForPreview = selectedTracks.length > 0 
      ? tracks.filter(t => selectedTracks.includes(t.id))
      : []
    
    const transform = selectedTracksForPreview.length > 1 
      ? require('@/utils/transformBuilder').buildTransform(
          multiTrackMode,
          barycentricVariant,
          selectedTracksForPreview,
          animationForm.type,          // Pass animation type
          parameters,                  // Pass animation parameters
          customCenter,
          phaseOffsetSeconds
        )
      : undefined
    
    // Create base animation object
    const animation: Animation = {
      id: loadedAnimationId || previewIdRef.current,
      name: animationForm.name || 'Untitled Animation',
      type: animationForm.type,
      parameters,
      duration: animationForm.duration || 10,
      loop: animationForm.loop || false,
      pingPong: animationForm.pingPong || false,
      coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' },
      transform,  // V3
      keyframes: []
    }
    
    console.log('🎬 Base animation created:', {
      id: animation.id,
      type: animation.type,
      multiTrackMode,
      barycentricVariant
    })
    
    return animation
  }, [
    animationForm.id,
    animationForm.name,
    animationForm.type,
    animationForm.duration,
    animationForm.loop,
    animationForm.pingPong,
    animationForm.parameters,
    animationForm.coordinateSystem,
    loadedAnimationId,
    multiTrackMode,
    barycentricVariant,
    customCenter,
    preserveOffsets,
    USE_UNIFIED_EDITOR
  ])

  // Handle updates from unified editor
  const handleUnifiedEditorChange = React.useCallback((updatedAnimation: Animation) => {
    console.log('📝 AnimationEditor received update:', {
      animationId: updatedAnimation.id,
      parameters: updatedAnimation.parameters,
      multiTrackMode,
      activeEditingTrack: activeEditingTrackIds[0],
      loadedAnimationId
    })
    
    // In position-relative mode, update the active track's parameters
    if ((multiTrackMode === 'relative') 
        && activeEditingTrackIds.length > 0) {
      const activeTrackId = activeEditingTrackIds[0]
      
      // Update per-track parameters
      const updatedMultiTrackParams = {
        ...multiTrackParameters,
        [activeTrackId]: updatedAnimation.parameters
      }
      setMultiTrackParameters(updatedMultiTrackParams)
      
      console.log('✅ Parameters updated for track:', activeTrackId)
    }
    
    // Update form parameters with changes from control point editing
    updateParameters(updatedAnimation.parameters)
    
    console.log('✅ Parameters updated in form')
    
    // If we have a loaded animation, update it in the project store
    if (loadedAnimationId) {
      updateAnimation(loadedAnimationId, updatedAnimation)
      console.log('✅ Animation updated in project store')
    }
  }, [
    loadedAnimationId, 
    updateParameters, 
    updateAnimation,
    multiTrackMode,
    activeEditingTrackIds,
    setMultiTrackParameters,
    multiTrackParameters
  ])

  // Effects
  useEffect(() => {
    if (!supportsControlPoints && activeWorkPane === 'control') {
      setActiveWorkPane('preview')
    }
  }, [supportsControlPoints, activeWorkPane])

  // Initialize active editing tracks when selection changes
  useEffect(() => {
    if ((multiTrackMode === 'relative') && selectedTrackIds.length > 0) {
      // If no tracks are actively being edited, or if the active tracks are not in selection, reset to first track
      if (activeEditingTrackIds.length === 0 || !activeEditingTrackIds.every(id => selectedTrackIds.includes(id))) {
        setActiveEditingTrackIds([selectedTrackIds[0]])
      }
      // Initialize per-track parameters if not already set
      const newMultiTrackParams: Record<string, any> = { ...multiTrackParameters }
      let needsUpdate = false
      selectedTrackIds.forEach(trackId => {
        if (!newMultiTrackParams[trackId]) {
          const track = tracks.find(t => t.id === trackId)
          if (track) {
            // Generate complete default parameters centered on this track's position
            // This ensures all position-dependent params (endPosition, control points, etc.) are correct
            const trackParams = getDefaultAnimationParameters(animationForm.type || 'linear', track)
            
            newMultiTrackParams[trackId] = trackParams
            needsUpdate = true
          }
        }
      })
      if (needsUpdate) {
        syncMultiTrackParameters(newMultiTrackParams)
      }
    } else {
      // Only clear if not already empty (prevent unnecessary re-renders)
      if (activeEditingTrackIds.length > 0) {
        setActiveEditingTrackIds([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackIds, multiTrackMode, animationForm.type]) // Only depend on type, not parameters object (prevents infinite loop)

  // Reinitialize parameters when switching to relative mode from formation mode
  useEffect(() => {
    if (multiTrackMode === 'relative' && selectedTrackIds.length > 0 && animationForm.type) {
      // Check if shared parameters OR any track has formation mode parameters
      const sharedHasFormationParams = animationForm.parameters?._isobarycenter || animationForm.parameters?._trackOffset
      const trackHasFormationParams = Object.values(multiTrackParameters).some(
        params => params._isobarycenter || params._trackOffset
      )
      
      if (sharedHasFormationParams || trackHasFormationParams || Object.keys(multiTrackParameters).length === 0) {
        console.log('🔄 Switching to relative mode - reinitializing ALL parameters')
        
        // Regenerate parameters for each track centered on its position
        const newParams: Record<string, any> = {}
        selectedTrackIds.forEach(trackId => {
          const track = tracks.find(t => t.id === trackId)
          if (track) {
            // Get fresh parameters centered on this track's position
            const trackParams = getDefaultAnimationParameters(animationForm.type!, track)
            newParams[trackId] = trackParams
            console.log(`  Track ${track.name}: center at`, trackParams.center || trackParams.startPosition)
          }
        })
        
        setMultiTrackParameters(newParams)
        
        // Also clean the shared animationForm parameters
        if (sharedHasFormationParams) {
          const params = animationForm.parameters as any
          const { _isobarycenter, _trackOffset, ...cleanSharedParams } = params
          updateAnimationForm({ parameters: cleanSharedParams })
        }
      }
    }
  }, [multiTrackMode, selectedTrackIds, animationForm.type])

  // Ensure all active editing tracks have their parameters initialized
  useEffect(() => {
    if ((multiTrackMode === 'relative') && activeEditingTrackIds.length > 0) {
      const newMultiTrackParams: Record<string, any> = { ...multiTrackParameters }
      let needsUpdate = false
      
      activeEditingTrackIds.forEach(trackId => {
        if (!newMultiTrackParams[trackId]) {
          const track = tracks.find(t => t.id === trackId)
          if (track) {
            const trackParams = getDefaultAnimationParameters(animationForm.type || 'linear', track)
            newMultiTrackParams[trackId] = trackParams
            needsUpdate = true
          }
        }
      })
      
      if (needsUpdate) {
        syncMultiTrackParameters(newMultiTrackParams)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEditingTrackIds, multiTrackMode, animationForm.type]) // tracks array has new ref each render, causes infinite loop

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 1280px)')
    const setFromMatch = (matches: boolean) => {
      if (matches) setIsFormPanelOpen(true)
    }
    setFromMatch(mq.matches)
    const listener = (event: MediaQueryListEvent) => setFromMatch(event.matches)
    if (mq.addEventListener) {
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
    mq.addListener(listener)
    return () => mq.removeListener(listener)
  }, [])

  // Handlers
  const handleAnimationTypeChange = (type: AnimationType) => {
    console.log('🔄 handleAnimationTypeChange called:', {
      newType: type,
      multiTrackMode,
      selectedTrackCount: selectedTrackIds.length,
      willUseAtomicUpdate: (multiTrackMode === 'relative') && selectedTrackIds.length > 0
    })
    
    // In position-relative or phase-offset-relative mode, use atomic update to prevent race condition
    if ((multiTrackMode === 'relative') && selectedTrackIds.length > 0) {
      const newMultiTrackParams: Record<string, any> = {}
      const selectedTracks: Track[] = []
      
      selectedTrackIds.forEach(trackId => {
        const track = tracks.find(t => t.id === trackId)
        if (track) {
          selectedTracks.push(track)
          // CRITICAL FIX: Use getDefaultAnimationParameters which looks up the NEW type from registry
          // Don't use selectedModel because it's stale (still pointing to the OLD model)
          const trackParams = getDefaultAnimationParameters(type, track)
          newMultiTrackParams[trackId] = trackParams
          console.log(`  📦 Track ${trackId} params:`, Object.keys(trackParams))
        }
      })
      
      console.log('🔄 Calling setAnimationTypeWithTracks with:', {
        type,
        trackCount: selectedTracks.length,
        paramKeys: Object.keys(newMultiTrackParams)
      })
      
      // ATOMIC UPDATE: type + all track parameters in one operation
      // This prevents race condition where visual renders with new type but old params
      setAnimationTypeWithTracks(type, selectedTracks, newMultiTrackParams)
      console.log('✅ setAnimationTypeWithTracks called')
      
      // CRITICAL: Immediately sync the first track's parameters to animationForm
      // This ensures ThreeJS gets the new default parameters for visualization
      if (activeEditingTrackIds.length > 0 && newMultiTrackParams[activeEditingTrackIds[0]]) {
        const paramsToSync = newMultiTrackParams[activeEditingTrackIds[0]]
        console.log('📤 About to sync parameters:', {
          trackId: activeEditingTrackIds[0],
          paramKeys: Object.keys(paramsToSync),
          startPosition: paramsToSync.startPosition,
          endPosition: paramsToSync.endPosition,
          center: paramsToSync.center
        })
        updateParameters(paramsToSync)
        console.log('✅ Synced parameters to form - checking if form updated...', {
          formParamsKeys: Object.keys(animationForm.parameters || {}),
          formStartPosition: animationForm.parameters?.startPosition
        })
      }
    } else {
      console.log('🔄 Using single-track update')
      // Single track mode - use simple update
      setAnimationType(type, selectedTrack)
    }
    
    // Check compatibility and reset to default mode if needed
    if (selectedTrackIds.length > 1) {
      const compatibleModes = getCompatibleModes(type)
      if (!compatibleModes[multiTrackMode].compatible) {
        console.log(`⚠️ Current mode "${multiTrackMode}" incompatible with ${type}, switching to "position-relative"`)
        setMultiTrackMode('relative')
      }
    }
  }

  const onParameterChange = (key: string, value: any) => {
    // In position-relative or phase-offset-relative mode, update ALL active editing tracks' parameters
    if ((multiTrackMode === 'relative') && activeEditingTrackIds.length > 0) {
      // For Position objects, merge with existing values to preserve all coordinates
      const isPositionKey = ['startPosition', 'endPosition', 'center', 'bounds', 'anchorPoint', 'restPosition', 'targetPosition', 'bezierStart', 'bezierControl1', 'bezierControl2', 'bezierEnd', 'zigzagStart', 'zigzagEnd', 'axisStart', 'axisEnd', 'zoomCenter'].includes(key)
      
      if (isPositionKey && typeof value === 'object') {
        // When editing multiple tracks: apply RELATIVE offset, not absolute value
        // This preserves each track's individual position while moving them in parallel
        
        // Get current multiTrackParameters
        const prev = multiTrackParameters
        const updated = { ...prev }
        
        if (activeEditingTrackIds.length === 1) {
          // Single track: just update directly
          const trackId = activeEditingTrackIds[0]
          const trackParams = prev[trackId] as any
          const formParams = animationForm.parameters as any
          const existingValue = trackParams?.[key] || formParams?.[key] || { x: 0, y: 0, z: 0 }
          const newValue = { ...existingValue, ...value }
          
          updated[trackId] = {
            ...updated[trackId],
            [key]: newValue
          }
        } else {
            // Multiple tracks: calculate offset from first track's original value and apply to all
            const firstTrackId = activeEditingTrackIds[0]
            const firstTrackParams = prev[firstTrackId] as any
            const formParams = animationForm.parameters as any
            const firstTrackOriginal = firstTrackParams?.[key] || formParams?.[key] || { x: 0, y: 0, z: 0 }
            
            // Calculate the offset (delta) from the first track's original value
            const offset = {
              x: (value.x !== undefined ? value.x : firstTrackOriginal.x) - firstTrackOriginal.x,
              y: (value.y !== undefined ? value.y : firstTrackOriginal.y) - firstTrackOriginal.y,
              z: (value.z !== undefined ? value.z : firstTrackOriginal.z) - firstTrackOriginal.z
            }
            
            // Apply the same offset to all active editing tracks
            activeEditingTrackIds.forEach(trackId => {
              const trackParams = prev[trackId] as any
              const existingValue = trackParams?.[key] || formParams?.[key] || { x: 0, y: 0, z: 0 }
              
              const newValue = {
                x: existingValue.x + offset.x,
                y: existingValue.y + offset.y,
                z: existingValue.z + offset.z
              }
              
              updated[trackId] = {
                ...updated[trackId],
                [key]: newValue
              }
            })
        }
        
        // Update and sync multi-track parameters
        syncMultiTrackParameters(updated)
      } else {
        // Non-position parameters - apply to all active editing tracks
        const prev = multiTrackParameters
        const updated = { ...prev }
        activeEditingTrackIds.forEach(trackId => {
          updated[trackId] = {
            ...updated[trackId],
            [key]: value
          }
        })
        
        // Update and sync multi-track parameters
        syncMultiTrackParameters(updated)
      }
    } else {
      // For other modes (single track or identical mode), update directly via store
      const isPositionKey = ['startPosition', 'endPosition', 'center', 'bounds', 'anchorPoint', 'restPosition', 'targetPosition', 'bezierStart', 'bezierControl1', 'bezierControl2', 'bezierEnd', 'zigzagStart', 'zigzagEnd', 'axisStart', 'axisEnd', 'zoomCenter'].includes(key)
      
      if (isPositionKey && typeof value === 'object') {
        // Merge with existing position to preserve all x, y, z values
        const existingValue = (animationForm.parameters as any)?.[key] || { x: 0, y: 0, z: 0 }
        const newValue = { ...existingValue, ...value }
        updateParameter(key, newValue)
        
        // Apply relative changes to other tracks if in relative mode
        if (selectedTrackIds.length > 1 && multiTrackMode === 'relative') {
          // Call the relative change handler with store actions
          handleParameterChange(
            key,
            value,
            animationForm.parameters,
            updateParameter,
            multiTrackMode,
            selectedTrackIds,
            tracks,
            updateTrack
          )
        }
      } else {
        // Simple parameter - update directly
        updateParameter(key, value)
      }
    }
  }

  const onUseTrackPosition = () => {
    if (!animationForm.type) return
    
    handleUseTrackPosition(
      animationForm.type,
      animationForm.parameters,
      updateParameters,
      selectedTrackIds,
      tracks,
      multiTrackMode
    )
  }

  const onSaveAnimation = useCallback(() => {
    if (!animationForm.name) {
      console.warn('Cannot save animation: Name is required')
      return
    }

    console.log('💾 onSaveAnimation called with:', {
      name: animationForm.name,
      duration: animationForm.duration,
      loop: animationForm.loop,
      pingPong: animationForm.pingPong,
      type: animationForm.type
    })

    // Get the project store state directly
    const projectStore = useProjectStore.getState()
    
    // Use the proper handleSaveAnimation with full multi-track support + subanimations
    handleSaveAnimation({
      animationForm,
      keyframes,
      selectedTrackIds,
      tracks,
      multiTrackMode,
      barycentricVariant,
      customCenter,
      preserveOffsets,
      phaseOffsetSeconds,
      currentAnimation: loadedAnimationId ? { id: loadedAnimationId } as Animation : currentAnimation,
      originalAnimationParams: originalAnimationParams,
      addAnimation: projectStore.addAnimation,
      updateAnimation: projectStore.updateAnimation,
      updateTrack: projectStore.updateTrack,
      multiTrackParameters,
      lockTracks,
      // Subanimation settings
      fadeInEnabled,
      fadeInDuration,
      fadeInEasing,
      fadeOutEnabled,
      fadeOutDuration,
      fadeOutEasing
    })
    
    // Update the current animation in the parent component if callback exists
    if (onAnimationSelect && loadedAnimationId) {
      onAnimationSelect(loadedAnimationId)
    }
  }, [
    animationForm,
    keyframes,
    selectedTrackIds,
    tracks,
    multiTrackMode,
    barycentricVariant,
    customCenter,
    preserveOffsets,
    phaseOffsetSeconds,
    loadedAnimationId,
    currentAnimation,
    originalAnimationParams,
    multiTrackParameters,
    lockTracks,
    fadeInEnabled,
    fadeInDuration,
    fadeInEasing,
    fadeOutEnabled,
    fadeOutDuration,
    fadeOutEasing,
    onAnimationSelect
  ])

  // Keyboard shortcuts - useCallback ensures we always have the latest state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (animationForm.name) {
          onSaveAnimation() // useCallback ensures this has latest state
          console.log('💾 Animation saved via keyboard shortcut (Ctrl+S / Cmd+S)')
        } else {
          console.warn('⚠️ Cannot save: Animation name is required')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [animationForm.name, onSaveAnimation]) // Depend on onSaveAnimation to update when deps change

  const handlePlayPreview = () => {
    if (isAnimationPlaying) {
      pauseAnimation()
    } else {
      console.log('🎬 handlePlayPreview:', {
        hasCurrentAnimation: !!currentAnimation,
        currentAnimationId: currentAnimation?.id,
        trackAnimationId,
        baseAnimationId,
        animationFormName: animationForm.name
      })
      
      // If animation is not saved yet, save it first before playing
      if (!currentAnimation && animationForm.name && animationForm.type) {
        console.log('💾 Auto-saving animation before preview playback')
        onSaveAnimation()
        // Wait a bit for state to update
        setTimeout(() => {
          const savedAnimation = animations.find(a => a.name === animationForm.name)
          if (savedAnimation) {
            console.log('▶️ Playing saved animation:', savedAnimation.id)
            playAnimation(savedAnimation.id, selectedTrackIds)
          }
        }, 200)
      } else if (currentAnimation) {
        console.log('▶️ Playing current animation:', currentAnimation.id)
        playAnimation(currentAnimation.id, selectedTrackIds)
      }
    }
  }

  const handleStopAnimation = () => {
    stopAnimation()
  }

  const handleLoadPreset = (preset: any) => {
    updateAnimationForm({
      name: preset.animation.name,
      type: preset.animation.type,
      duration: preset.animation.duration,
      loop: preset.animation.loop || false,
      pingPong: preset.animation.pingPong || false,
      parameters: preset.animation.parameters,
      coordinateSystem: preset.animation.coordinateSystem
    })
    setShowPresetBrowser(false)
  }

  const handleSaveAsPreset = () => {
    if (!animationForm.name || !animationForm.type) {
      alert('Please configure an animation before saving as preset')
      return
    }
    setShowPresetNameDialog(true)
  }

  const handleLoadAnimation = (animation: Animation) => {
    // V3: Store's loadAnimation extracts UI state from transform
    loadAnimation(animation)
    
    // Close the library
    setShowAnimationLibrary(false)
  }

  const handleConfirmPresetSave = (presetName: string, description: string) => {
    const preset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      description: description || `Saved from ${animationForm.type} animation`,
      category: 'user' as const,
      tags: [],
      author: 'User',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      animation: {
        name: animationForm.name || 'Untitled Animation',
        type: animationForm.type!,
        duration: animationForm.duration || 10,
        loop: animationForm.loop || false,
        pingPong: animationForm.pingPong || false,
        parameters: animationForm.parameters || {},
        coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' }
      }
    }
    addPreset(preset)
    setShowPresetNameDialog(false)
    alert(`Preset "${presetName}" saved successfully!`)
  }

  // Render functions
  
  // NEW: Unified editor pane (replaces both preview and control panes)
const unifiedPane = (
<div className="h-full flex flex-col min-h-0">
  <div className="flex-1 min-h-0 bg-gray-900">
    {USE_UNIFIED_EDITOR && baseAnimation && (
      <MultiTrackModeManager
        animation={baseAnimation}
        tracks={tracks}
        selectedTrackIds={selectedTrackIds}
        multiTrackMode={multiTrackMode}
        barycentricVariant={barycentricVariant}
        customCenter={customCenter}
      >
        {(enhancedAnimation: Animation | null) => {
          // Calculate animated barycenter position during preview (when globalTime is active)
          // NOTE: Don't use useMemo here as it prevents re-calculation on globalTime updates
          // This needs to recalculate on every render when globalTime changes
          let animatedBarycentricPosition: Position | undefined = undefined
          
          if (enhancedAnimation && multiTrackMode === 'barycentric' && globalIsPlaying && globalTime !== undefined) {
            // Calculate barycenter's position along the animation path at current time
            // The model calculates the path for the barycenter, not individual tracks
            try {
              animatedBarycentricPosition = modelRuntime.calculatePosition(
                enhancedAnimation,
                globalTime,
                0,
                {
                  trackId: 'barycenter',
                  time: globalTime,
                  duration: baseAnimation.duration,
                  deltaTime: 0,
                  frameCount: 0,
                }
              )
              console.log('🎬 Animated barycenter at time', globalTime.toFixed(2), ':', animatedBarycentricPosition)
            } catch (error) {
              console.error('Error calculating animated barycenter position:', error)
            }
          }
          
          return enhancedAnimation && (
            <UnifiedThreeJsEditor
              animation={enhancedAnimation}
              selectedTracks={selectedTrackObjects}
              multiTrackMode={multiTrackMode}
              barycentricVariant={barycentricVariant}
              barycentricCenter={customCenter}
              animatedBarycentricPosition={animatedBarycentricPosition}
              onAnimationChange={handleUnifiedEditorChange}
              onSelectionChange={(selectedIndices) => {
                // Optional: Track which control point is selected
                console.log('Control point selection:', selectedIndices)
              }}
              readOnly={false}
              className="w-full h-full"
            />
          )
        }}
      </MultiTrackModeManager>
    )}
  </div>
      <div className="border-t border-gray-700 px-4 py-2 bg-gray-800/50 text-xs text-gray-300">
        <span>💡 <kbd className="px-1 bg-gray-700 rounded text-xs">Tab</kbd> Preview/Edit | <kbd className="px-1 bg-gray-700 rounded text-xs">Q/W/E/R</kbd> Views | <kbd className="px-1 bg-gray-700 rounded text-xs">ESC</kbd> Deselect</span>
      </div>
    </div>
  )

  if (!selectedTrack) {
    return (
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Animation Editor</h1>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Target className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracks Selected</h3>
            <p className="text-gray-600 mb-2">Select one or more tracks from the track list to create animations</p>
            <p className="text-sm text-gray-500">💡 Tip: Use checkboxes or hold Ctrl while clicking to select multiple tracks</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Animation Editor</h1>
      </div>

      {/* Keyboard shortcuts hint */}
      {USE_UNIFIED_EDITOR && (
        <div className="flex items-center gap-2 bg-blue-900/70 text-blue-200 text-xs px-3 py-1.5 rounded backdrop-blur-sm mb-3">
          <span>💡 Press <kbd className="px-1 bg-gray-700 rounded">Tab</kbd> to toggle Preview/Edit modes | <kbd className="px-1 bg-gray-700 rounded">Q/W/E/R</kbd> for views</span>
        </div>
      )}

      {/* Playback Control Bar - unified and clean */}
      <PlaybackControlBar
        isPlaying={isAnimationPlaying}
        hasAnimation={!!(animationForm.name && animationForm.type)}
        onPlay={handlePlayPreview}
        onStop={handleStopAnimation}
        currentAnimationId={currentAnimation?.id}
        onLoadAnimation={() => setShowAnimationLibrary(true)}
        onSaveAnimation={onSaveAnimation}
        canSave={!!animationForm.name}
        onLoadPreset={() => setShowPresetBrowser(true)}
        onSaveAsPreset={handleSaveAsPreset}
        isSettingsPanelOpen={isFormPanelOpen}
        onToggleSettingsPanel={() => setIsFormPanelOpen(!isFormPanelOpen)}
      />

      {/* Track Selection Info with Locking Option */}
      {selectedTrackIds.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedTrackIds.length} track{selectedTrackIds.length > 1 ? 's' : ''} selected
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockTracks}
                  onChange={(e) => setLockTracks(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Lock tracks to animation
                </span>
              </label>
            </div>
            {lockTracks && (
              <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>🔒</span>
                <span>Locked (cues cannot reassign)</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Work Pane Selector (for non-unified editor) */}
      {!USE_UNIFIED_EDITOR && (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
          <button
            onClick={() => setActiveWorkPane('preview')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeWorkPane === 'preview'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            3D Preview
          </button>
          <button
            onClick={() => setActiveWorkPane('control')}
            disabled={!supportsControlPoints}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeWorkPane === 'control'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : supportsControlPoints
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
            )}
          >
            Control Points
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-6 overflow-hidden">
        {isFormPanelOpen ? (
          <div className="flex flex-1 flex-col lg:flex-row gap-6 overflow-hidden">
            <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
                <p className="text-sm text-gray-600">
                  {USE_UNIFIED_EDITOR 
                    ? 'Unified 3D editor with preview and edit modes (Tab to toggle)'
                    : (activeWorkPane === 'preview' ? '3D preview of the current animation.' : 'Adjust control points to refine the path.')
                  }
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                {unifiedPane}
              </div>
            </div>

            <AnimationSettingsPanel
              selectedTracks={selectedTrackObjects}
              selectedTrackIds={selectedTrackIds}
              activeEditingTrackIds={activeEditingTrackIds}
              onReorderTracks={(reorderedIds) => selectTracks(reorderedIds)}
              onSetActiveTracks={setActiveEditingTrackIds}
              multiTrackMode={multiTrackMode}
              barycentricVariant={barycentricVariant}
              customCenter={customCenter}
              preserveOffsets={preserveOffsets}
              phaseOffsetSeconds={phaseOffsetSeconds}
              onModeChange={setMultiTrackMode}
              onVariantChange={setBarycentricVariant}
              onCustomCenterChange={setCustomCenter}
              onPreserveOffsetsChange={setPreserveOffsets}
              onPhaseOffsetChange={setPhaseOffsetSeconds}
              animationForm={animationForm}
              onUpdateForm={updateAnimationForm}
              selectedModel={selectedModel}
              selectedTrack={selectedTrack}
              onModelSelect={(model) => {
                setSelectedModel(model)
                if (model) {
                  handleAnimationTypeChange(model.metadata.type as AnimationType)
                }
              }}
              onTypeChange={handleAnimationTypeChange}
              onParameterChange={onParameterChange}
              onUseTrackPosition={onUseTrackPosition}
              onResetToDefaults={resetToDefaults}
              fadeInEnabled={fadeInEnabled}
              fadeInDuration={fadeInDuration}
              fadeInEasing={fadeInEasing}
              fadeOutEnabled={fadeOutEnabled}
              fadeOutDuration={fadeOutDuration}
              fadeOutEasing={fadeOutEasing}
              onFadeInEnabledChange={setFadeInEnabled}
              onFadeInDurationChange={setFadeInDuration}
              onFadeInEasingChange={setFadeInEasing}
              onFadeOutEnabledChange={setFadeOutEnabled}
              onFadeOutDurationChange={setFadeOutDuration}
              onFadeOutEasingChange={setFadeOutEasing}
              onClose={() => setIsFormPanelOpen(false)}
            />
          </div>
        ) : (
          USE_UNIFIED_EDITOR ? (
            // Single unified editor pane
            <div className="flex-1 bg-gray-900 rounded-lg shadow-sm border border-gray-700 flex flex-col overflow-hidden">
              <div className="border-b border-gray-700 px-4 py-3 bg-gray-800/50">
                <p className="text-sm text-gray-300">
                  Unified 3D editor - Press Tab for Preview/Edit modes, Q/W/E/R for view angles
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                {unifiedPane}
              </div>
            </div>
          ) : (
            // Old dual-pane layout
            <div className="flex-1 grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm text-gray-600">3D preview of the current animation.</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  {unifiedPane}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm text-gray-600">Adjust control points to refine the path.</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  {unifiedPane}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {showPresetBrowser && (
        <PresetBrowser
          onSelectPreset={handleLoadPreset}
          onClose={() => setShowPresetBrowser(false)}
        />
      )}

      <PresetNameDialog
        isOpen={showPresetNameDialog}
        defaultName={animationForm.name || 'My Preset'}
        onConfirm={handleConfirmPresetSave}
        onCancel={() => setShowPresetNameDialog(false)}
      />

      {showAnimationLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Animation Library</h2>
              <button
                onClick={() => setShowAnimationLibrary(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AnimationLibrary
                onAnimationSelect={handleLoadAnimation}
                currentAnimationId={loadedAnimationId}
                showActions={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

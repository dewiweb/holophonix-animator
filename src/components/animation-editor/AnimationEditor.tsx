import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { usePresetStore } from '@/stores/presetStore'
import { useAnimationEditorStoreV2 } from '@/stores/animationEditorStoreV2'
import { cn } from '@/utils'
import { Track, Position, Animation, AnimationType, AnimationState, Keyframe, CoordinateSystem } from '@/types'
import { AnimationModel } from '@/models/types'
import { Save, Target, PanelRightOpen, PanelRightClose } from 'lucide-react'

// Import modular components
import { AnimationPreview3D } from './components/3d-preview/AnimationPreview3D'
import { ControlPointEditor } from './components/control-points-editor/ControlPointEditor'
import { UnifiedThreeJsEditor } from './components/threejs-editor/UnifiedThreeJsEditor'
import { PresetBrowser } from './components/modals/PresetBrowser'
import { PresetNameDialog } from './components/modals/PresetNameDialog'
import { ModelParametersForm } from './components/models-forms/ModelParametersForm'
import { AnimationLibrary } from './components/AnimationLibrary'
import { AnimationSettingsPanel } from './components/settings'
import {
  MultiTrackModeSelector,
  SelectedTracksIndicator,
  AnimationTypeSelector,
  AnimationControlButtons,
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
    phaseOffsetSeconds,
    centerPoint,
    multiTrackParameters,
    activeEditingTrackIds,
    lockTracks,
    // UI state
    previewMode,
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
    setPhaseOffsetSeconds,
    setCenterPoint,
    setMultiTrackParameters,
    updateMultiTrackParameter,
    setActiveEditingTrackIds,
    setLockTracks,
    // UI actions
    setPreviewMode,
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
  const currentAnimation = trackAnimationId ? animations.find(a => a.id === trackAnimationId) ?? null : null
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
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0) {
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
    console.log('🔑 Computing activeTrackParamsKey', {
      type: animationForm.type,
      paramsKeys: animationForm.parameters ? Object.keys(animationForm.parameters) : [],
      multiTrackMode,
      isMultiTrack: (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
                    && activeEditingTrackIds.length > 0
    })
    
    const typePrefix = `type:${animationForm.type}|`
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
        && activeEditingTrackIds.length > 0 
        && multiTrackParameters[activeEditingTrackIds[0]]) {
      return typePrefix + JSON.stringify(multiTrackParameters[activeEditingTrackIds[0]])
    }
    return typePrefix + JSON.stringify(animationForm.parameters || {})
  }, [animationForm.type, animationForm.parameters, multiTrackMode, activeEditingTrackIds, multiTrackParameters])

  // Create animation object for unified editor
  const unifiedEditorAnimation = useMemo<Animation | null>(() => {
    if (!animationForm.type || !USE_UNIFIED_EDITOR) {
      console.log('❌ No animation object created:', { hasType: !!animationForm.type, useUnified: USE_UNIFIED_EDITOR })
      return null
    }
    
    // Determine which parameters to use based on multi-track mode
    let parameters = animationForm.parameters || {}
    
    // In position-relative mode, use the active track's parameters
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
        && activeEditingTrackIds.length > 0) {
      // Use first active track's parameters
      const activeTrackParams = multiTrackParameters[activeEditingTrackIds[0]]
      if (activeTrackParams) {
        parameters = activeTrackParams
        console.log('🎯 Using parameters from active track:', activeEditingTrackIds[0])
      }
    }
    
    // Generate unique ID for position-relative mode to ensure visual updates when switching tracks
    let animationId = loadedAnimationId || previewIdRef.current
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
        && activeEditingTrackIds.length > 0) {
      // Include active track ID to make animation unique per track
      animationId = `${animationId}-track-${activeEditingTrackIds[0]}`
    }
    
    const animation = {
      id: animationId,
      name: animationForm.name || 'Untitled Animation',
      type: animationForm.type,
      parameters, // Use track-specific parameters
      duration: animationForm.duration || 10,
      loop: animationForm.loop || false,
      coordinateSystem: (animationForm.coordinateSystem as CoordinateSystem) || 'xyz',
      multiTrackMode: multiTrackMode,
      trackIds: selectedTrackIds,
      trackSelectionLocked: lockTracks,
      phaseOffsetSeconds: multiTrackMode.includes('phase-offset') ? phaseOffsetSeconds : undefined,
      centerPoint: multiTrackMode === 'centered' ? centerPoint : undefined,
    } as Animation
    
    console.log('🎬 Animation object created for unified editor:', {
      id: animation.id,
      type: animation.type,
      multiTrackMode,
      activeEditingTrack: activeEditingTrackIds[0],
      trackCount: activeEditingTrackIds.length,
      paramsKey: activeTrackParamsKey.substring(0, 100) + '...',
      usingTrackParams: (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
                        && activeEditingTrackIds.length > 0,
      parameters: animation.parameters,
      hasStartPosition: !!animation.parameters.startPosition,
      hasEndPosition: !!animation.parameters.endPosition,
      hasCenter: !!animation.parameters.center
    })
    
    return animation
  }, [
    animationForm.name,
    animationForm.duration,
    animationForm.loop,
    animationForm.coordinateSystem,
    loadedAnimationId, 
    multiTrackMode, 
    selectedTrackIds, 
    lockTracks, 
    phaseOffsetSeconds, 
    centerPoint, 
    USE_UNIFIED_EDITOR,
    activeEditingTrackIds,    // ✅ Re-compute when active track changes
    activeTrackParamsKey      // ✅ Deep comparison includes type + params
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
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') 
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
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && selectedTrackIds.length > 0) {
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

  // Ensure all active editing tracks have their parameters initialized
  useEffect(() => {
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0) {
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
      willUseAtomicUpdate: (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && selectedTrackIds.length > 0
    })
    
    // In position-relative or phase-offset-relative mode, use atomic update to prevent race condition
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && selectedTrackIds.length > 0) {
      const newMultiTrackParams: Record<string, any> = {}
      const selectedTracks: Track[] = []
      
      selectedTrackIds.forEach(trackId => {
        const track = tracks.find(t => t.id === trackId)
        if (track) {
          selectedTracks.push(track)
          // If using a model, get default parameters from the model
          let trackParams: any
          if (selectedModel && selectedModel.getDefaultParameters && typeof selectedModel.getDefaultParameters === 'function') {
            trackParams = selectedModel.getDefaultParameters(track.position || { x: 0, y: 0, z: 0 })
          } else {
            // Generate complete default parameters centered on this track's position
            // This ensures all position-dependent params (endPosition, control points, etc.) are correct
            trackParams = getDefaultAnimationParameters(type, track)
          }
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
        setMultiTrackMode('position-relative')
      }
    }
  }

  const onParameterChange = (key: string, value: any) => {
    // In position-relative or phase-offset-relative mode, update ALL active editing tracks' parameters
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0) {
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
        
        // Apply relative changes to other tracks if in multi-track mode
        if (selectedTrackIds.length > 1 && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative' || multiTrackMode === 'isobarycenter')) {
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

  const onSaveAnimation = () => {
    if (!animationForm.name) {
      console.warn('Cannot save animation: Name is required')
      return
    }

    // Get the project store state directly
    const projectStore = useProjectStore.getState()
    
    // Use the proper handleSaveAnimation with full multi-track support
    handleSaveAnimation({
      animationForm,
      keyframes,
      selectedTrackIds,
      tracks,
      multiTrackMode,
      phaseOffsetSeconds,
      centerPoint,
      currentAnimation: loadedAnimationId ? { id: loadedAnimationId } as Animation : currentAnimation,
      originalAnimationParams: originalAnimationParams,
      addAnimation: projectStore.addAnimation,
      updateAnimation: projectStore.updateAnimation,
      updateTrack: projectStore.updateTrack,
      multiTrackParameters,
      lockTracks
    })
    
    // Update the current animation in the parent component if callback exists
    if (onAnimationSelect && loadedAnimationId) {
      onAnimationSelect(loadedAnimationId)
    }
  }

  const handlePlayPreview = () => {
    if (isAnimationPlaying) {
      pauseAnimation()
    } else {
      // If animation is not saved yet, save it first before playing
      if (!currentAnimation && animationForm.name && animationForm.type) {
        console.log('💾 Auto-saving animation before preview playback')
        onSaveAnimation()
        // Wait a bit for state to update
        setTimeout(() => {
          const savedAnimation = animations.find(a => a.name === animationForm.name)
          if (savedAnimation) {
            playAnimation(savedAnimation.id, selectedTrackIds)
          }
        }, 200)
      } else if (currentAnimation) {
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
    // Use store's loadAnimation method
    loadAnimation(animation)
    
    // Set multi-track settings if available
    if (animation.multiTrackMode) {
      setMultiTrackMode(animation.multiTrackMode)
    }
    if (animation.phaseOffsetSeconds !== undefined) {
      setPhaseOffsetSeconds(animation.phaseOffsetSeconds)
    }
    if (animation.centerPoint) {
      setCenterPoint(animation.centerPoint)
    }
    
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
  const previewPane = (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 bg-gray-100">
        <AnimationPreview3D
          key={`preview-${animationForm.type}-${multiTrackMode}`}
          tracks={selectedTrackObjects}
          animation={previewMode ? null : currentAnimation}
          animationType={animationForm.type}
          animationParameters={animationForm.parameters}
          currentTime={globalTime}
          keyframes={animationForm.type === 'custom' ? keyframes : []}
          onUpdateKeyframe={handleKeyframeUpdate}
          isKeyframePlacementMode={isKeyframePlacementMode && animationForm.type === 'custom'}
          selectedKeyframeId={selectedKeyframeId}
          onSelectKeyframe={setSelectedKeyframeId}
          isFormPanelOpen={isFormPanelOpen}
          multiTrackMode={multiTrackMode}
        />
      </div>
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        {previewMode ? (
          <p className="text-sm text-blue-700">
            Preview mode active. Configure animation parameters to see real-time preview.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Tip: Toggle control points to adjust path waypoints visually.
          </p>
        )}
      </div>
    </div>
  )

  const controlPaneContent = supportsControlPoints ? (
    <ControlPointEditor
      key={`control-${animationForm.type}-${multiTrackMode}-${activeEditingTrackIds.join(',')}`}
      animationType={animationForm.type || 'linear'}
      parameters={animationForm.parameters || {}}
      keyframes={keyframes}
      onParameterChange={onParameterChange}
      onKeyframeUpdate={handleKeyframeUpdate}
      trackPosition={
        // In position-relative or phase-offset-relative mode, show the first active editing track's position
        (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0
          ? tracks.find(t => t.id === activeEditingTrackIds[0])?.position || selectedTrack?.position
          : selectedTrack?.initialPosition || selectedTrack?.position
      }
      trackColors={trackColors}
      trackNames={tracks.reduce((acc, track) => {
        acc[track.id] = track.name
        return acc
      }, {} as Record<string, string>)}
      selectedTracks={selectedTrackIds}
      trackPositions={trackPositions}
      multiTrackMode={multiTrackMode}
      activeEditingTrackIds={activeEditingTrackIds}
      allActiveTrackParameters={multiTrackParameters}
    />
  ) : (
    <div className="h-full flex items-center justify-center text-sm text-gray-500 px-6">
      Control points are not available for the selected animation type.
    </div>
  )

  // NEW: Unified editor pane (replaces both preview and control panes)
  const unifiedPane = (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 bg-gray-900">
        <UnifiedThreeJsEditor
          animation={unifiedEditorAnimation}
          selectedTracks={selectedTrackObjects}
          multiTrackMode={multiTrackMode}
          onAnimationChange={handleUnifiedEditorChange}
          onSelectionChange={(selectedIndices) => {
            // Optional: Track which control point is selected
            console.log('Control point selection:', selectedIndices)
          }}
          readOnly={false}
          className="w-full h-full"
        />
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {!USE_UNIFIED_EDITOR && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
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

        {USE_UNIFIED_EDITOR && (
          <div className="flex items-center gap-2 bg-blue-900/70 text-blue-200 text-xs px-3 py-1.5 rounded backdrop-blur-sm">
            <span>💡 Press <kbd className="px-1 bg-gray-700 rounded">Tab</kbd> to toggle Preview/Edit modes | <kbd className="px-1 bg-gray-700 rounded">Q/W/E/R</kbd> for views</span>
          </div>
        )}

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <AnimationControlButtons
              previewMode={previewMode}
              isAnimationPlaying={isAnimationPlaying}
              hasAnimation={!!(animationForm.name && animationForm.type)}
              isCustomAnimation={animationForm.type === 'custom'}
              showKeyframeEditor={false}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              onPlay={handlePlayPreview}
              onStop={handleStopAnimation}
              onToggleKeyframeEditor={() => {}}
              onLoadPreset={() => setShowPresetBrowser(true)}
              onSaveAsPreset={handleSaveAsPreset}
              canSavePreset={!!animationForm.name && !!animationForm.type}
              currentAnimationId={currentAnimation?.id}
            />

            {/* Track Locking Option */}
            {selectedTrackIds.length > 0 && (
              <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockTracks}
                    onChange={(e) => setLockTracks(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Lock tracks to this animation
                  </span>
                </label>
                {lockTracks && (
                  <div className="mt-2 text-xs text-blue-600 flex items-start gap-1">
                    <span>🔒</span>
                    <span>
                      This animation will be locked to {selectedTrackIds.length} track(s). 
                      Cues cannot reassign it to different tracks.
                    </span>
                  </div>
                )}
                {!lockTracks && (
                  <p className="mt-1 text-xs text-gray-500">
                    Unchecked: This animation can be applied to any tracks in cue editor.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowAnimationLibrary(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center"
              >
                Load Animation
              </button>
              <button
                onClick={onSaveAnimation}
                disabled={!animationForm.name}
                className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Animation
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsFormPanelOpen(!isFormPanelOpen)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
          >
            {isFormPanelOpen ? (
              <>
                <PanelRightClose className="w-4 h-4" />
                Hide Settings
              </>
            ) : (
              <>
                <PanelRightOpen className="w-4 h-4" />
                Show Settings
              </>
            )}
          </button>
        </div>
      </div>

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
                {USE_UNIFIED_EDITOR ? unifiedPane : (activeWorkPane === 'preview' ? previewPane : controlPaneContent)}
              </div>
            </div>

            <AnimationSettingsPanel
              selectedTracks={selectedTrackObjects}
              selectedTrackIds={selectedTrackIds}
              activeEditingTrackIds={activeEditingTrackIds}
              onReorderTracks={(reorderedIds) => selectTracks(reorderedIds)}
              onSetActiveTracks={setActiveEditingTrackIds}
              multiTrackMode={multiTrackMode}
              phaseOffsetSeconds={phaseOffsetSeconds}
              centerPoint={centerPoint}
              onModeChange={setMultiTrackMode}
              onPhaseOffsetChange={setPhaseOffsetSeconds}
              onCenterPointChange={setCenterPoint}
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
                  {previewPane}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm text-gray-600">Adjust control points to refine the path.</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  {controlPaneContent}
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

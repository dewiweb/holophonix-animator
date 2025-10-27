import React, { useState, useEffect, useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { usePresetStore } from '@/stores/presetStore'
import { cn } from '@/utils'
import { Track, Position } from '@/types'
import { Save, Target, PanelRightOpen, PanelRightClose } from 'lucide-react'

// Import modular components
import { AnimationPreview3D } from './components/3d-preview/AnimationPreview3D'
import { ControlPointEditor } from './components/control-points-editor/ControlPointEditor'
import { PresetBrowser } from './components/modals/PresetBrowser'
import { PresetNameDialog } from './components/modals/PresetNameDialog'
import { AnimationParametersRenderer } from './components/models-forms'
import {
  MultiTrackModeSelector,
  SelectedTracksIndicator,
  AnimationTypeSelector,
  AnimationControlButtons
} from './components/controls'

// Import constants and utilities
import { animationCategories, getAnimationInfo, supportsControlPointsTypes } from './constants/animationCategories'
import { getCompatibleModes } from './utils/compatibility'
import { getDefaultAnimationParameters } from './utils/defaultParameters'

// Import custom hooks
import { useAnimationForm } from './hooks/useAnimationForm'
import { useKeyframeManagement } from './hooks/useKeyframeManagement'

// Import handlers
import { handleParameterChange } from './handlers/parameterHandlers'
import { handleUseTrackPosition } from './handlers/trackPositionHandler'
import { handleSaveAnimation } from './handlers/saveAnimationHandler'

export const AnimationEditor: React.FC = () => {
  const { currentProject, tracks, selectedTracks, selectTracks, updateTrack, animations, addAnimation, updateAnimation } = useProjectStore()
  const { isPlaying, globalTime, playAnimation, pauseAnimation, stopAnimation } = useAnimationStore()
  const { addPreset } = usePresetStore()

  // UI State
  const [previewMode, setPreviewMode] = useState(false)
  const [showPresetBrowser, setShowPresetBrowser] = useState(false)
  const [showPresetNameDialog, setShowPresetNameDialog] = useState(false)
  const [activeWorkPane, setActiveWorkPane] = useState<'preview' | 'control'>('preview')
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false)
  const [multiTrackMode, setMultiTrackMode] = useState<'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'>('position-relative')
  const [phaseOffsetSeconds, setPhaseOffsetSeconds] = useState(0.5)
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0, z: 0 })
  const [activeEditingTrackIds, setActiveEditingTrackIds] = useState<string[]>([])
  const [multiTrackParameters, setMultiTrackParameters] = useState<Record<string, any>>({})

  // Track Selection - memoize to prevent new array reference on every render
  const selectedTrackIds = useMemo(() => 
    selectedTracks.length > 0 ? selectedTracks : tracks.map(t => t.id),
    [selectedTracks, tracks]
  )
  const selectedTrack = tracks.find(t => selectedTrackIds.includes(t.id))
  const currentAnimation = selectedTrack?.animationState?.animation || null
  const isAnimationPlaying = selectedTrack?.animationState?.isPlaying || false

  const selectedTrackObjects = useMemo(() => (
    selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
  ), [selectedTrackIds, tracks])

  // Load active track's parameters when switching tracks in position-relative or phase-offset-relative mode
  // Only reload when the TRACK changes, not when its parameters update (to avoid breaking drag)
  // If multiple tracks are selected for editing, use the first one's parameters as the base
  useEffect(() => {
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0) {
      const firstActiveTrackId = activeEditingTrackIds[0]
      const trackParams = multiTrackParameters[firstActiveTrackId]
      if (trackParams) {
        setAnimationForm(prev => ({
          ...prev,
          parameters: trackParams
        }))
      }
    }
  }, [activeEditingTrackIds, multiTrackMode])

  // Use custom hooks
  const {
    animationForm,
    setAnimationForm,
    keyframes,
    setKeyframes,
    originalAnimationParams,
    handleAnimationTypeChange: onAnimationTypeChange,
    handleResetToDefaults
  } = useAnimationForm(selectedTrack, currentAnimation)

  const {
    selectedKeyframeId,
    setSelectedKeyframeId,
    isKeyframePlacementMode,
    setIsKeyframePlacementMode,
    handleKeyframeAdd,
    handleKeyframeRemove,
    handleKeyframeUpdate
  } = useKeyframeManagement(keyframes, setKeyframes)

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
        setMultiTrackParameters(newMultiTrackParams)
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
        setMultiTrackParameters(newMultiTrackParams)
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
  const handleAnimationTypeChange = (type: any) => {
    onAnimationTypeChange(type)
    
    // In position-relative or phase-offset-relative mode, reinitialize all track parameters with their positions
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && selectedTrackIds.length > 0) {
      const newMultiTrackParams: Record<string, any> = {}
      selectedTrackIds.forEach(trackId => {
        const track = tracks.find(t => t.id === trackId)
        if (track) {
          // Generate complete default parameters centered on this track's position
          // This ensures all position-dependent params (endPosition, control points, etc.) are correct
          const trackParams = getDefaultAnimationParameters(type, track)
          newMultiTrackParams[trackId] = trackParams
        }
      })
      setMultiTrackParameters(newMultiTrackParams)
      
      // Load first active editing track's parameters into form
      if (activeEditingTrackIds.length > 0 && newMultiTrackParams[activeEditingTrackIds[0]]) {
        setAnimationForm(prev => ({
          ...prev,
          parameters: newMultiTrackParams[activeEditingTrackIds[0]]
        }))
      }
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
        setMultiTrackParameters(prev => {
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
          
          // Update animationForm to reflect the first active track's parameters
          // This ensures form inputs show current values
          const firstTrackId = activeEditingTrackIds[0]
          setAnimationForm(prev => ({
            ...prev,
            parameters: {
              ...prev.parameters,
              ...updated[firstTrackId]
            }
          }))
          
          return updated
        })
      } else {
        // Non-position parameters - apply to all active editing tracks
        setMultiTrackParameters(prev => {
          const updated = { ...prev }
          activeEditingTrackIds.forEach(trackId => {
            updated[trackId] = {
              ...updated[trackId],
              [key]: value
            }
          })
          
          // Update animationForm to reflect the first active track's parameters
          const firstTrackId = activeEditingTrackIds[0]
          setAnimationForm(prev2 => ({
            ...prev2,
            parameters: {
              ...prev2.parameters,
              ...updated[firstTrackId]
            }
          }))
          
          return updated
        })
      }
    } else {
      // For other modes, use the standard handler
      handleParameterChange(
        key,
        value,
        animationForm,
        setAnimationForm,
        multiTrackMode,
        selectedTrackIds,
        tracks,
        updateTrack
      )
    }
  }

  const onUseTrackPosition = () => {
    handleUseTrackPosition(
      animationForm,
      setAnimationForm,
      selectedTrackIds,
      tracks,
      multiTrackMode
    )
  }

  const onSaveAnimation = () => {
    handleSaveAnimation({
      animationForm,
      keyframes,
      selectedTrackIds,
      tracks,
      multiTrackMode,
      phaseOffsetSeconds,
      centerPoint,
      currentAnimation,
      originalAnimationParams,
      addAnimation,
      updateAnimation,
      updateTrack,
      multiTrackParameters
    })
  }

  const handlePlayPreview = () => {
    if (isAnimationPlaying) {
      pauseAnimation()
    } else {
      if (!currentAnimation) return
      playAnimation(currentAnimation.id, selectedTrackIds)
    }
  }

  const handleStopAnimation = () => {
    stopAnimation()
  }

  const handleLoadPreset = (preset: any) => {
    setAnimationForm({
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
      animationType={animationForm.type || 'linear'}
      parameters={
        // In position-relative or phase-offset-relative mode, use the first active track's parameters from multiTrackParameters
        // This allows drag operations to update without re-rendering from animationForm changes
        (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0 && multiTrackParameters[activeEditingTrackIds[0]]
          ? multiTrackParameters[activeEditingTrackIds[0]]
          : animationForm.parameters || {}
      }
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

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <AnimationControlButtons
              previewMode={previewMode}
              isAnimationPlaying={isAnimationPlaying}
              hasAnimation={!!currentAnimation}
              isCustomAnimation={animationForm.type === 'custom'}
              showKeyframeEditor={false}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              onPlay={handlePlayPreview}
              onStop={handleStopAnimation}
              onToggleKeyframeEditor={() => {}}
              onLoadPreset={() => setShowPresetBrowser(true)}
              onSaveAsPreset={handleSaveAsPreset}
              canSavePreset={!!animationForm.name && !!animationForm.type}
            />

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
                  {activeWorkPane === 'preview' ? '3D preview of the current animation.' : 'Adjust control points to refine the path.'}
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                {activeWorkPane === 'preview' ? previewPane : controlPaneContent}
              </div>
            </div>

            <div className="lg:w-4/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Animation Settings</h2>
                <button
                  onClick={() => setIsFormPanelOpen(false)}
                  className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <PanelRightClose className="w-4 h-4" />
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <SelectedTracksIndicator 
                  selectedTracks={selectedTrackObjects} 
                  onReorder={(reorderedIds: string[]) => {
                    selectTracks(reorderedIds)
                  }}
                  activeEditingTrackIds={activeEditingTrackIds}
                  onSetActiveTracks={setActiveEditingTrackIds}
                  multiTrackMode={multiTrackMode}
                />

                {selectedTrackIds.length > 1 && (
                  <MultiTrackModeSelector
                    animationType={animationForm.type || 'linear'}
                    multiTrackMode={multiTrackMode}
                    phaseOffsetSeconds={phaseOffsetSeconds}
                    centerPoint={centerPoint}
                    onModeChange={setMultiTrackMode}
                    onPhaseOffsetChange={setPhaseOffsetSeconds}
                    onCenterPointChange={setCenterPoint}
                    getCompatibleModes={getCompatibleModes}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Animation Name</label>
                  <input
                    type="text"
                    value={animationForm.name || ''}
                    onChange={(e) => setAnimationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter animation name"
                  />
                </div>

                <AnimationTypeSelector
                  selectedType={animationForm.type || 'linear'}
                  onTypeChange={handleAnimationTypeChange}
                  categories={animationCategories}
                  getAnimationInfo={getAnimationInfo}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                    <input
                      type="number"
                      min="0.1"
                      max="300"
                      step="0.1"
                      value={animationForm.duration || 10}
                      onChange={(e) => setAnimationForm(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Loop</label>
                      <p className="text-xs text-gray-500">Repeat animation when it ends</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationForm.loop || false}
                        onChange={(e) => setAnimationForm(prev => ({ ...prev, loop: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {animationForm.loop && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div>
                      <label className="text-sm font-medium text-blue-900">Ping-Pong Mode</label>
                      <p className="text-xs text-blue-700">Play forward then backward (bounce effect)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationForm.pingPong || false}
                        onChange={(e) => setAnimationForm(prev => ({ ...prev, pingPong: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">Animation Parameters</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={onUseTrackPosition}
                        disabled={!selectedTrack}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Use Track Position
                      </button>
                      <button
                        onClick={handleResetToDefaults}
                        disabled={!animationForm.type}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <AnimationParametersRenderer
                      type={animationForm.type || 'linear'}
                      parameters={animationForm.parameters || {}}
                      keyframesCount={keyframes.length}
                      onParameterChange={onParameterChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
    </div>
  )
}

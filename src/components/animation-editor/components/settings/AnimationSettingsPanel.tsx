import React from 'react'
import { PanelRightClose } from 'lucide-react'
import { Track, AnimationType, Position, Animation } from '@/types'
import { AnimationModel } from '@/models/types'
import {
  SelectedTracksIndicator,
  MultiTrackModeSelector,
  AnimationTypeSelector,
  ModelSelector
} from '../controls'
import { ModelParametersForm } from '../models-forms/ModelParametersForm'
import { SubanimationSettings } from './SubanimationSettings'
import { CollapsibleSection } from './CollapsibleSection'
import { animationCategories, getAnimationInfo } from '../../constants/animationCategories'
import { getCompatibleModes } from '../../utils/compatibility'

type MultiTrackMode = 'relative' | 'barycentric'
type BarycentricVariant = 'shared' | 'isobarycentric' | 'centered' | 'custom'

interface AnimationSettingsPanelProps {
  // Track selection
  selectedTracks: Track[]
  selectedTrackIds: string[]
  activeEditingTrackIds: string[]
  onReorderTracks: (ids: string[]) => void
  onSetActiveTracks: (ids: string[]) => void
  
  // Multi-track mode
  multiTrackMode: MultiTrackMode
  barycentricVariant?: BarycentricVariant
  customCenter?: Position
  preserveOffsets?: boolean
  phaseOffsetSeconds: number
  onModeChange: (mode: MultiTrackMode) => void
  onVariantChange?: (variant: BarycentricVariant) => void
  onCustomCenterChange?: (center: Position | undefined) => void
  onPreserveOffsetsChange?: (preserve: boolean | undefined) => void
  onPhaseOffsetChange: (seconds: number) => void
  
  // Animation form
  animationForm: Partial<Animation>
  onUpdateForm: (updates: Partial<Animation>) => void
  
  // Model selection
  selectedModel: AnimationModel | null
  selectedTrack: Track | undefined
  onModelSelect: (model: AnimationModel | null) => void
  onTypeChange: (type: AnimationType) => void
  
  // Parameters
  onParameterChange: (key: string, value: any) => void
  onUseTrackPosition: () => void
  onResetToDefaults: (track: Track | undefined) => void
  
  // Subanimation settings
  fadeInEnabled: boolean
  fadeInDuration: number
  fadeInEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  fadeOutEnabled: boolean
  fadeOutDuration: number
  fadeOutEasing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
  onFadeInEnabledChange: (enabled: boolean) => void
  onFadeInDurationChange: (duration: number) => void
  onFadeInEasingChange: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
  onFadeOutEnabledChange: (enabled: boolean) => void
  onFadeOutDurationChange: (duration: number) => void
  onFadeOutEasingChange: (easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear') => void
  
  // UI control
  onClose?: () => void
}

export const AnimationSettingsPanel: React.FC<AnimationSettingsPanelProps> = ({
  selectedTracks,
  selectedTrackIds,
  activeEditingTrackIds,
  onReorderTracks,
  onSetActiveTracks,
  multiTrackMode,
  barycentricVariant,
  customCenter,
  preserveOffsets,
  phaseOffsetSeconds,
  onModeChange,
  onVariantChange,
  onCustomCenterChange,
  onPreserveOffsetsChange,
  onPhaseOffsetChange,
  animationForm,
  onUpdateForm,
  selectedModel,
  selectedTrack,
  onModelSelect,
  onTypeChange,
  onParameterChange,
  onUseTrackPosition,
  onResetToDefaults,
  fadeInEnabled,
  fadeInDuration,
  fadeInEasing,
  fadeOutEnabled,
  fadeOutDuration,
  fadeOutEasing,
  onFadeInEnabledChange,
  onFadeInDurationChange,
  onFadeInEasingChange,
  onFadeOutEnabledChange,
  onFadeOutDurationChange,
  onFadeOutEasingChange,
  onClose
}) => {
  return (
    <div className="lg:w-4/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Animation Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <PanelRightClose className="w-4 h-4" />
            Close
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Track Selection - Always visible */}
        <SelectedTracksIndicator 
          selectedTracks={selectedTracks} 
          onReorder={onReorderTracks}
          activeEditingTrackIds={activeEditingTrackIds}
          onSetActiveTracks={onSetActiveTracks}
          multiTrackMode={multiTrackMode}
        />

        {/* Multi-Track Mode - Always visible when multiple tracks */}
        {selectedTrackIds.length > 1 && (
          <MultiTrackModeSelector
            animationType={animationForm.type || 'linear'}
            multiTrackMode={multiTrackMode}
            barycentricVariant={barycentricVariant}
            customCenter={customCenter}
            preserveOffsets={preserveOffsets}
            phaseOffsetSeconds={phaseOffsetSeconds}
            tracks={selectedTracks}
            onModeChange={onModeChange}
            onVariantChange={onVariantChange}
            onCustomCenterChange={onCustomCenterChange}
            onPreserveOffsetsChange={onPreserveOffsetsChange}
            onPhaseOffsetChange={onPhaseOffsetChange}
            getCompatibleModes={getCompatibleModes}
          />
        )}

        {/* SECTION 1: Animation Setup */}
        <CollapsibleSection title="Animation Setup" defaultExpanded={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Animation Name</label>
              <input
                type="text"
                value={animationForm.name || ''}
                onChange={(e) => onUpdateForm({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter animation name"
              />
            </div>

            <ModelSelector
              onModelSelect={onModelSelect}
              currentType={animationForm.type || 'linear'}
              selectedModel={selectedModel}
            />

            {/* Show legacy animation selector if no model selected */}
            {!selectedModel && (
              <AnimationTypeSelector
                selectedType={animationForm.type || 'linear'}
                onTypeChange={onTypeChange}
                categories={animationCategories}
                getAnimationInfo={getAnimationInfo}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* SECTION 2: Timing */}
        <CollapsibleSection 
          title="Timing" 
          defaultExpanded={false}
          badge={`${animationForm.duration || 10}s${animationForm.loop ? ' • Loop' : ''}${animationForm.pingPong ? ' • Ping-Pong' : ''}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (seconds)</label>
              <input
                type="number"
                min="0.1"
                max="300"
                step="0.1"
                value={animationForm.duration || 10}
                onChange={(e) => onUpdateForm({ duration: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Loop</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Repeat animation when it ends</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={animationForm.loop || false}
                  onChange={(e) => onUpdateForm({ loop: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {animationForm.loop && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div>
                  <label className="text-sm font-medium text-blue-900 dark:text-blue-300">Ping-Pong Mode</label>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Play forward then backward (bounce effect)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={animationForm.pingPong || false}
                    onChange={(e) => onUpdateForm({ pingPong: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-blue-200 dark:bg-blue-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* SECTION 3: Subanimations */}
        <CollapsibleSection 
          title="Subanimations" 
          defaultExpanded={false}
          badge={fadeInEnabled || fadeOutEnabled ? `${fadeInEnabled ? 'Fade-In' : ''}${fadeInEnabled && fadeOutEnabled ? ' • ' : ''}${fadeOutEnabled ? 'Fade-Out' : ''}` : undefined}
        >
          <SubanimationSettings
            fadeInEnabled={fadeInEnabled}
            fadeInDuration={fadeInDuration}
            fadeInEasing={fadeInEasing}
            onFadeInEnabledChange={onFadeInEnabledChange}
            onFadeInDurationChange={onFadeInDurationChange}
            onFadeInEasingChange={onFadeInEasingChange}
            fadeOutEnabled={fadeOutEnabled}
            fadeOutDuration={fadeOutDuration}
            fadeOutEasing={fadeOutEasing}
            onFadeOutEnabledChange={onFadeOutEnabledChange}
            onFadeOutDurationChange={onFadeOutDurationChange}
            onFadeOutEasingChange={onFadeOutEasingChange}
          />
        </CollapsibleSection>

        {/* SECTION 4: Parameters */}
        <CollapsibleSection title="Parameters" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Animation Parameters</h3>
            <div className="flex gap-2">
              <button
                onClick={onUseTrackPosition}
                disabled={!selectedTrack}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Use Track Position
              </button>
              <button
                onClick={() => onResetToDefaults(selectedTrack)}
                disabled={!animationForm.type}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
            {selectedModel ? (
              <ModelParametersForm
                model={selectedModel}
                parameters={animationForm.parameters || {}}
                onChange={onParameterChange}
                trackPosition={selectedTrack?.position}
              />
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No model selected</p>
                <p className="text-xs mt-1">Select an animation type above</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}

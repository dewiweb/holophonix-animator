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
  loadedAnimationId: string | null  // Add this to track which animation is loaded
  
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
  loadedAnimationId,
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
    <div className="lg:w-4/12 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Animation Settings</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Press <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Ctrl+S</kbd> to save
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <PanelRightClose className="w-4 h-4" />
            Close
          </button>
        )}
      </div>

      <div className="space-y-4">
        <CollapsibleSection title="Animation Setup" defaultExpanded={true}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Animation Name</label>
              <input
                type="text"
                value={animationForm.name || ''}
                onChange={(e) => onUpdateForm({ name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter animation name"
              />
            </div>

            <ModelSelector
              onModelSelect={onModelSelect}
              currentType={animationForm.type || 'linear'}
              selectedModel={selectedModel}
            />

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

        <CollapsibleSection 
          title="Track Selection" 
          defaultExpanded={true}
          badge={`${selectedTracks.length} track${selectedTracks.length !== 1 ? 's' : ''}`}
        >
          <SelectedTracksIndicator 
            selectedTracks={selectedTracks} 
            onReorder={onReorderTracks}
            activeEditingTrackIds={activeEditingTrackIds}
            onSetActiveTracks={onSetActiveTracks}
            multiTrackMode={multiTrackMode}
          />
        </CollapsibleSection>

        {selectedTrackIds.length > 1 && (
          <CollapsibleSection 
            title="Multi-Track Mode" 
            defaultExpanded={false}
            badge={`${multiTrackMode === 'relative' ? 'Relative' : 'Barycentric'}${phaseOffsetSeconds ? ` • ${phaseOffsetSeconds}s offset` : ''}`}
          >
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
          </CollapsibleSection>
        )}

        <CollapsibleSection 
          title="Timing & Transitions" 
          defaultExpanded={false}
          badge={`${animationForm.duration || 10}s${animationForm.loop ? ' • Loop' : ''}${animationForm.pingPong ? ' • Ping-Pong' : ''}${fadeInEnabled || fadeOutEnabled ? ' • Transitions' : ''}`}
        >
          <div className="space-y-4">
            {/* Animation Duration */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Animation Duration</label>
              <input
                type="number"
                min="0.1"
                max="300"
                step="0.1"
                value={animationForm.duration || 10}
                onChange={(e) => onUpdateForm({ duration: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Main animation playback duration in seconds</p>
            </div>

            {/* Loop Toggle */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Loop</label>
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

            {/* Ping-Pong (only when loop enabled) */}
            {animationForm.loop && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2">
                <div>
                  <label className="text-xs font-medium text-blue-900 dark:text-blue-300">Ping-Pong Mode</label>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Play forward then backward</p>
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

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Entry & Exit Transitions</h4>
              
              {/* Subanimation Settings */}
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
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Model Parameters" defaultExpanded={true}>
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-2">
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
            {selectedModel ? (
              <ModelParametersForm
                key={loadedAnimationId || 'new'}
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

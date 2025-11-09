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
import { animationCategories, getAnimationInfo } from '../../constants/animationCategories'
import { getCompatibleModes } from '../../utils/compatibility'

type MultiTrackMode = 'shared' | 'relative' | 'formation'

interface AnimationSettingsPanelProps {
  // Track selection
  selectedTracks: Track[]
  selectedTrackIds: string[]
  activeEditingTrackIds: string[]
  onReorderTracks: (ids: string[]) => void
  onSetActiveTracks: (ids: string[]) => void
  
  // Multi-track mode
  multiTrackMode: MultiTrackMode
  phaseOffsetSeconds: number
  onModeChange: (mode: MultiTrackMode) => void
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
  phaseOffsetSeconds,
  onModeChange,
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
        <SelectedTracksIndicator 
          selectedTracks={selectedTracks} 
          onReorder={onReorderTracks}
          activeEditingTrackIds={activeEditingTrackIds}
          onSetActiveTracks={onSetActiveTracks}
          multiTrackMode={multiTrackMode}
        />

        {selectedTrackIds.length > 1 && (
          <MultiTrackModeSelector
            animationType={animationForm.type || 'linear'}
            multiTrackMode={multiTrackMode}
            phaseOffsetSeconds={phaseOffsetSeconds}
            onModeChange={onModeChange}
            onPhaseOffsetChange={onPhaseOffsetChange}
            getCompatibleModes={getCompatibleModes}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Animation Name</label>
          <input
            type="text"
            value={animationForm.name || ''}
            onChange={(e) => onUpdateForm({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
            <input
              type="number"
              min="0.1"
              max="300"
              step="0.1"
              value={animationForm.duration || 10}
              onChange={(e) => onUpdateForm({ duration: parseFloat(e.target.value) })}
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
                onChange={(e) => onUpdateForm({ loop: e.target.checked })}
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
                onChange={(e) => onUpdateForm({ pingPong: e.target.checked })}
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
                onClick={() => onResetToDefaults(selectedTrack)}
                disabled={!animationForm.type}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {selectedModel ? (
              <ModelParametersForm
                model={selectedModel}
                parameters={animationForm.parameters || {}}
                onChange={onParameterChange}
                trackPosition={selectedTrack?.position}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No model selected</p>
                <p className="text-xs mt-1">Select an animation type above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { modelRegistry } from '@/models/registry'
import { AnimationModel } from '@/models/types'
import { AnimationType } from '@/types'
import { Sparkles, Layers, Info } from 'lucide-react'

interface ModelSelectorProps {
  onModelSelect: (model: AnimationModel | null) => void
  onLegacySelect: (type: AnimationType) => void
  currentType: AnimationType
  selectedModel: AnimationModel | null
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  onLegacySelect,
  currentType,
  selectedModel
}) => {
  const [mode, setMode] = useState<'legacy' | 'model'>('legacy')
  const [availableModels, setAvailableModels] = useState<AnimationModel[]>([])
  const [selectedModelType, setSelectedModelType] = useState<string>('')

  useEffect(() => {
    // Load available models from registry
    const models = modelRegistry.getAllModels()
    setAvailableModels(models)
    
    // Check if current type has a model
    if (modelRegistry.hasModel(currentType)) {
      setMode('model')
      setSelectedModelType(currentType)
      const model = modelRegistry.getModel(currentType)
      if (model) {
        onModelSelect(model)
      }
    }
  }, [])

  const handleModeChange = (newMode: 'legacy' | 'model') => {
    setMode(newMode)
    if (newMode === 'legacy') {
      onModelSelect(null)
      setSelectedModelType('')
    } else if (availableModels.length > 0 && !selectedModelType) {
      // Select first available model
      const firstModel = availableModels[0]
      setSelectedModelType(firstModel.metadata.type)
      onModelSelect(firstModel)
    }
  }

  const handleModelTypeChange = (type: string) => {
    setSelectedModelType(type)
    const model = modelRegistry.getModel(type)
    if (model) {
      onModelSelect(model)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          onClick={() => handleModeChange('legacy')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
            mode === 'legacy'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-sm font-medium">Legacy Animations</span>
        </button>
        <button
          onClick={() => handleModeChange('model')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors ${
            mode === 'model'
              ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Model System</span>
          {availableModels.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded">
              {availableModels.length}
            </span>
          )}
        </button>
      </div>

      {/* Model Selection */}
      {mode === 'model' && (
        <div className="space-y-3">
          {availableModels.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Select Animation Model
                </label>
                <select
                  value={selectedModelType}
                  onChange={(e) => handleModelTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Choose a model...</option>
                  {availableModels.map((model) => (
                    <option key={model.metadata.type} value={model.metadata.type}>
                      {model.metadata.name} - {model.metadata.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model Info Card */}
              {selectedModel && (
                <div className="bg-gradient-to-r from-purple-50 dark:from-purple-900/20 to-pink-50 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {selectedModel.metadata.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {selectedModel.metadata.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded">
                          {selectedModel.metadata.category}
                        </span>
                        {selectedModel.metadata.version && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            v{selectedModel.metadata.version}
                          </span>
                        )}
                        {selectedModel.metadata.tags?.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Hints */}
                  {selectedModel.performance && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Info className="w-3 h-3" />
                        <span>
                          Complexity: {selectedModel.performance.complexity || 'medium'} | 
                          {selectedModel.performance.stateful && ' Stateful | '}
                          {selectedModel.performance.gpuAccelerated && ' GPU Accelerated | '}
                          {selectedModel.performance.maxTracks && `Max ${selectedModel.performance.maxTracks} tracks`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No animation models available</p>
              <p className="text-xs mt-1">Models may not be properly registered</p>
            </div>
          )}
        </div>
      )}

      {/* Legacy Mode Info */}
      {mode === 'legacy' && (
        <div className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 text-gray-600 dark:text-gray-400">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Legacy Animation System
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Using the traditional animation system with hardcoded animation types and parameters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

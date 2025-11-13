import React, { useState, useEffect } from 'react'
import { modelRegistry } from '@/models/registry'
import { AnimationModel } from '@/models/types'
import { AnimationType } from '@/types'
import { Sparkles, Info } from 'lucide-react'

interface ModelSelectorProps {
  onModelSelect: (model: AnimationModel | null) => void
  currentType: AnimationType
  selectedModel: AnimationModel | null
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelSelect,
  currentType,
  selectedModel
}) => {
  const [availableModels, setAvailableModels] = useState<AnimationModel[]>([])
  const [selectedModelType, setSelectedModelType] = useState<string>('')

  useEffect(() => {
    // Load available models from registry
    const models = modelRegistry.getAllModels()
    setAvailableModels(models)
    
    // Auto-select current type if it has a model
    if (modelRegistry.hasModel(currentType)) {
      setSelectedModelType(currentType)
      const model = modelRegistry.getModel(currentType)
      if (model) {
        onModelSelect(model)
      }
    } else if (models.length > 0) {
      // Or select first available model
      const firstModel = models[0]
      setSelectedModelType(firstModel.metadata.type)
      onModelSelect(firstModel)
    }
  }, [])

  // Sync dropdown with selectedModel prop when it changes externally (e.g., loading animation)
  useEffect(() => {
    if (selectedModel && selectedModel.metadata.type !== selectedModelType) {
      console.log('🔄 ModelSelector: Syncing dropdown to loaded model:', selectedModel.metadata.type)
      setSelectedModelType(selectedModel.metadata.type)
    } else if (!selectedModel && selectedModelType) {
      // Model was cleared
      console.log('🔄 ModelSelector: Clearing dropdown selection')
      setSelectedModelType('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]) // selectedModelType intentionally not in deps to avoid circular updates

  const handleModelTypeChange = (type: string) => {
    setSelectedModelType(type)
    const model = modelRegistry.getModel(type)
    if (model) {
      onModelSelect(model)
    }
  }

  return (
    <div className="space-y-4">
      {/* Model Selection */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Animation Models</span>
          {availableModels.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded">
              {availableModels.length}
            </span>
          )}
        </div>
      </div>
      
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
    </div>
  )
}

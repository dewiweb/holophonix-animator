import React, { useState } from 'react'
import { usePresetStore } from '@/stores/presetStore'
import { AnimationPreset } from '@/types'
import { Search, X, Tag, User, Calendar, Trash2, Download } from 'lucide-react'

interface PresetBrowserProps {
  onSelectPreset: (preset: AnimationPreset) => void
  onClose: () => void
}

export const PresetBrowser: React.FC<PresetBrowserProps> = ({ onSelectPreset, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { presets, searchPresets, removePreset, getPresetsByCategory } = usePresetStore()
  
  const categories = [
    { id: 'all', label: 'All Presets' },
    { id: 'user', label: 'User Presets' },
    { id: 'basic', label: 'Basic' },
    { id: 'physics', label: 'Physics' },
    { id: 'wave', label: 'Wave' },
    { id: 'curve', label: 'Curve' },
    { id: 'procedural', label: 'Procedural' },
    { id: 'interactive', label: 'Interactive' },
    { id: 'spatial', label: 'Spatial Audio' }
  ]

  const filteredPresets = searchQuery 
    ? searchPresets(searchQuery) 
    : selectedCategory === 'all'
    ? presets
    : getPresetsByCategory(selectedCategory)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user: 'bg-indigo-100 text-indigo-800',
      basic: 'bg-gray-100 text-gray-800',
      physics: 'bg-blue-100 text-blue-800',
      wave: 'bg-purple-100 text-purple-800',
      curve: 'bg-green-100 text-green-800',
      procedural: 'bg-orange-100 text-orange-800',
      interactive: 'bg-pink-100 text-pink-800',
      spatial: 'bg-cyan-100 text-cyan-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Animation Presets</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search presets by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b bg-gray-50 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No presets found</h3>
              <p className="text-gray-600">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPresets.map(preset => (
                <div
                  key={preset.id}
                  className="border rounded-lg hover:shadow-lg cursor-pointer transition-all bg-white overflow-hidden group"
                  onClick={() => onSelectPreset(preset)}
                >
                  {/* Preset Header */}
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 flex-1">{preset.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(preset.category)}`}>
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>
                    
                    {/* Animation Info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{preset.animation.type}</span>
                      </span>
                      <span>•</span>
                      <span>{preset.animation.duration}s</span>
                      {preset.animation.loop && (
                        <>
                          <span>•</span>
                          <span>Loop</span>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    {preset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {preset.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {preset.author && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {preset.author}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Delete preset "${preset.name}"?`)) {
                            removePreset(preset.id)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Click on a preset to load it into the animation editor
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Preset Manager
 * 
 * Main UI for managing position presets.
 * Lists all presets with search, filter, and actions.
 */

import React, { useState, useMemo } from 'react'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { useProjectStore } from '@/stores/projectStore'
import { Button } from '@/components/common/Button'
import { cn } from '@/utils'
import {
  Search,
  Plus,
  Star,
  Clock,
  Folder,
  Play,
  Download,
  Upload,
  Settings,
  Trash2,
  Copy,
  Edit,
  Home,
  X
} from 'lucide-react'
import type { PositionPreset, PresetCategory } from '@/types/positionPreset'

interface PresetManagerProps {
  onClose?: () => void
  onPresetSelect?: (presetId: string) => void
  onCapture?: () => void
  onApply?: (presetId: string) => void
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  onClose,
  onPresetSelect,
  onCapture,
  onApply
}) => {
  const {
    presets,
    library,
    searchQuery,
    setSearchQuery,
    deletePreset,
    duplicatePreset,
    toggleFavorite,
    exportPreset,
    importPreset
  } = usePositionPresetStore()
  
  const { tracks } = useProjectStore()

  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Category icons
  const categoryIcons: Record<PresetCategory, React.ReactNode> = {
    scene: '🎭',
    formation: '📐',
    effect: '✨',
    safety: '🏠',
    custom: '📦'
  }

  // Filtered presets
  const filteredPresets = useMemo(() => {
    let filtered = [...presets]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(preset =>
        preset.name.toLowerCase().includes(query) ||
        preset.description?.toLowerCase().includes(query) ||
        preset.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(preset => preset.category === selectedCategory)
    }

    // Sort by modified date (newest first)
    filtered.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())

    return filtered
  }, [presets, searchQuery, selectedCategory])

  // Favorites
  const favoritePresets = useMemo(() => {
    return presets.filter(p => library.favorites?.includes(p.id))
  }, [presets, library.favorites])

  // Recently used
  const recentPresets = useMemo(() => {
    const recentIds = library.recentlyUsed || []
    return recentIds
      .map(id => presets.find(p => p.id === id))
      .filter(Boolean) as PositionPreset[]
  }, [presets, library.recentlyUsed])

  const handlePresetClick = (presetId: string) => {
    if (onPresetSelect) {
      onPresetSelect(presetId)
    }
  }

  const handleApply = (presetId: string) => {
    if (onApply) {
      onApply(presetId)
    }
  }

  const handleDuplicate = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      duplicatePreset(presetId, `${preset.name} (Copy)`)
    }
  }

  const handleDelete = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset && confirm(`Delete preset "${preset.name}"?`)) {
      deletePreset(presetId)
    }
  }

  const handleExport = (presetId: string) => {
    const json = exportPreset(presetId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `preset-${presetId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const json = e.target?.result as string
          importPreset(json)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return new Date(date).toLocaleDateString()
  }

  const PresetItem: React.FC<{ preset: PositionPreset }> = ({ preset }) => {
    const isFavorite = library.favorites?.includes(preset.id)
    const isInitialPreset = preset.name === 'Initial Positions' && preset.category === 'safety'

    return (
      <div
        className={cn(
          'group relative p-3 rounded-lg border transition-all cursor-pointer',
          'hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md',
          'border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-800'
        )}
        onClick={() => handleApply(preset.id)}
        title="Click to apply this preset"
      >
        {/* Top row: name and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">
              {preset.category ? categoryIcons[preset.category] : '📦'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-2">
                {preset.name}
                {isInitialPreset && <span className="text-xs">⭐</span>}
                {isFavorite && <Star size={12} className="text-yellow-500 fill-yellow-500" />}
              </h3>
            </div>
          </div>

          {/* Actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleApply(preset.id)
              }}
              className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400"
              title="Apply preset"
            >
              <Play size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(preset.id)
              }}
              className="p-1 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900 text-yellow-600 dark:text-yellow-400"
              title="Toggle favorite"
            >
              <Star size={14} className={isFavorite ? 'fill-yellow-500' : ''} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDuplicate(preset.id)
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExport(preset.id)
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="Export"
            >
              <Download size={14} />
            </button>
            {!isInitialPreset && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(preset.id)
                }}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{preset.trackIds.length} tracks</span>
          <span>•</span>
          <span className="capitalize">{preset.category || 'custom'}</span>
          <span>•</span>
          <span>{formatDate(preset.modified)}</span>
          {preset.scope === 'global' && (
            <>
              <span>•</span>
              <span className="text-blue-600 dark:text-blue-400">Global</span>
            </>
          )}
        </div>

        {/* Description */}
        {preset.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {preset.description}
          </p>
        )}

        {/* Tags */}
        {preset.tags && preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {preset.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px]"
              >
                {tag}
              </span>
            ))}
            {preset.tags.length > 3 && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                +{preset.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Home size={20} />
            Position Presets
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              icon={Plus}
              onClick={onCapture}
            >
              Capture
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={Upload}
              onClick={handleImport}
            >
              Import
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Close preset library"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2 border rounded-md text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                'text-gray-900 dark:text-gray-100'
              )}
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              All ({presets.length})
            </button>
            {library.categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1',
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                <span>{categoryIcons[category]}</span>
                <span className="capitalize">{category}</span>
                <span className="opacity-60">
                  ({presets.filter(p => p.category === category).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Favorites section */}
          {favoritePresets.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Star size={14} className="text-yellow-500" />
                Favorites
              </h3>
              <div className="grid gap-2">
                {favoritePresets.map(preset => (
                  <PresetItem key={preset.id} preset={preset} />
                ))}
              </div>
            </div>
          )}

          {/* Recently used section */}
          {recentPresets.length > 0 && selectedCategory === 'all' && !searchQuery && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Clock size={14} />
                Recently Used
              </h3>
              <div className="grid gap-2">
                {recentPresets.slice(0, 3).map(preset => (
                  <PresetItem key={preset.id} preset={preset} />
                ))}
              </div>
            </div>
          )}

          {/* All presets */}
          <div>
            {(favoritePresets.length > 0 || recentPresets.length > 0) && selectedCategory === 'all' && !searchQuery && (
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Folder size={14} />
                All Presets
              </h3>
            )}
            <div className="grid gap-2">
              {filteredPresets.map(preset => (
                <PresetItem key={preset.id} preset={preset} />
              ))}
            </div>
          </div>

          {/* Empty state */}
          {filteredPresets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'No presets found' : 'No presets yet'}
              </p>
              {!searchQuery && onCapture && (
                <Button icon={Plus} onClick={onCapture}>
                  Create Your First Preset
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{filteredPresets.length} presets</span>
          <span>{tracks.length} tracks in project</span>
        </div>
      </div>
    </div>
  )
}

import React, { useState, useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { Animation, AnimationType } from '@/types'
import { themeColors } from '@/theme'
import { cn } from '@/utils'

interface AnimationLibraryProps {
  onAnimationSelect: (animation: Animation) => void
  currentAnimationId?: string | null
  showActions?: boolean
  onAnimationDelete?: (animationId: string) => void
  onAnimationDuplicate?: (animation: Animation) => void
}

const animationTypeIcons: Record<AnimationType, string> = {
  linear: '➡️',
  circular: '🔄',
  elliptical: '🔁',
  spiral: '🌀',
  random: '🎲',
  bezier: '〰️',
  bounce: '⛹️',
  pendulum: 'Pendulum',
  spring: '🌿',
  wave: '🌊',
  lissajous: '∞',
  zigzag: '⚡',
  helix: '🧬',
  'catmull-rom': '🎨',
  doppler: '📢',
  zoom: '🔍',
  'rose-curve': '🌹',
  epicycloid: '⚙️',
  'circular-scan': '📡',
  'perlin-noise': '🌫️',
}

export const AnimationLibrary: React.FC<AnimationLibraryProps> = ({
  onAnimationSelect,
  currentAnimationId,
  showActions = true,
  onAnimationDelete,
  onAnimationDuplicate,
}) => {
  const { animations, removeAnimation } = useProjectStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<AnimationType | 'all'>('all')

  const filteredAnimations = useMemo(() => {
    return animations.filter(anim => {
      const matchesSearch = anim.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'all' || anim.type === selectedType
      return matchesSearch && matchesType
    })
  }, [animations, searchTerm, selectedType])

  const animationTypes = useMemo(() => {
    const types = new Set(animations.map(a => a.type))
    return Array.from(types).sort()
  }, [animations])

  const handleDelete = (e: React.MouseEvent, animationId: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this animation?')) {
      removeAnimation(animationId)
      onAnimationDelete?.(animationId)
    }
  }

  const handleDuplicate = (e: React.MouseEvent, animation: Animation) => {
    e.stopPropagation()
    const duplicatedAnimation: Animation = {
      ...animation,
      id: `anim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `${animation.name} (Copy)`,
    }
    useProjectStore.getState().addAnimation(duplicatedAnimation)
    onAnimationDuplicate?.(duplicatedAnimation)
  }

  const handleNewAnimation = () => {
    const newAnimation: Animation = {
      id: `anim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: `New Animation ${animations.length + 1}`,
      type: 'circular',
      duration: 10,
      loop: false,
      parameters: {},
      coordinateSystem: { type: 'xyz' }
    }
    useProjectStore.getState().addAnimation(newAnimation)
    onAnimationSelect(newAnimation)
  }

  return (
    <div className={`p-4 ${themeColors.background.secondary} rounded-lg`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>
          Animation Library ({animations.length})
        </h3>
        <button
          onClick={handleNewAnimation}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            "bg-green-600 hover:bg-green-700 text-white"
          )}
        >
          ➕ New Animation
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Search animations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-md text-sm",
            themeColors.background.primary,
            themeColors.text.primary,
            "border border-gray-300 dark:border-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
        />
        
        {animationTypes.length > 0 && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AnimationType | 'all')}
            className={cn(
              "w-full px-3 py-2 rounded-md text-sm",
              themeColors.background.primary,
              themeColors.text.primary,
              "border border-gray-300 dark:border-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-blue-500"
            )}
          >
            <option value="all">All Types</option>
            {animationTypes.map(type => (
              <option key={type} value={type}>
                {animationTypeIcons[type]} {type}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Animation List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredAnimations.length === 0 ? (
          <div className={`text-center py-8 ${themeColors.text.muted}`}>
            {animations.length === 0 
              ? "No animations saved yet. Click 'New Animation' to create one."
              : "No animations match your search."}
          </div>
        ) : (
          filteredAnimations.map((animation) => (
            <div
              key={animation.id}
              onClick={() => onAnimationSelect(animation)}
              className={cn(
                "p-3 rounded-md cursor-pointer transition-all",
                "border",
                currentAnimationId === animation.id
                  ? `border-blue-500 ${themeColors.accent.background.medium}`
                  : `border-gray-300 dark:border-gray-600 ${themeColors.background.primary} hover:border-blue-400`,
                "group"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{animationTypeIcons[animation.type]}</span>
                  <div>
                    <div className={`font-medium ${themeColors.text.primary}`}>
                      {animation.name}
                    </div>
                    <div className={`text-xs ${themeColors.text.muted}`}>
                      {animation.type} • {animation.duration}s
                      {animation.loop && ' • Loop'}
                      {animation.pingPong && ' • Ping-pong'}
                    </div>
                  </div>
                </div>
                
                {showActions && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button
                      onClick={(e) => handleDuplicate(e, animation)}
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, animation.id)}
                      className={cn(
                        "px-2 py-1 text-xs rounded",
                        "bg-red-600 hover:bg-red-700 text-white"
                      )}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
              
              {/* Multi-track info */}
              {animation.transform && (
                <div className={`mt-2 text-xs ${themeColors.text.muted}`}>
                  Multi-track: {animation.transform.mode}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

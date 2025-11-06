import React from 'react'
import { Target, Circle, Zap, Activity, Waves, Pen, Sparkles, Users, Radio } from 'lucide-react'
import { AnimationType } from '@/types'
import { modelRegistry } from '@/models/registry'

export interface AnimationInfo {
  type: AnimationType
  label: string
  icon: React.ReactNode
  description: string
}

export interface AnimationCategory {
  name: string
  color: string
  animations: AnimationInfo[]
}

// Category configuration (maps model categories to UI categories)
const CATEGORY_CONFIG: Record<string, { color: string; icon: typeof Target; order: number }> = {
  'Basic': { color: 'blue', icon: Target, order: 0 },
  'Physics': { color: 'orange', icon: Activity, order: 1 },
  'Wave': { color: 'cyan', icon: Waves, order: 2 },
  'Path': { color: 'purple', icon: Pen, order: 3 },
  'Procedural': { color: 'green', icon: Sparkles, order: 4 },
  'Interactive': { color: 'amber', icon: Users, order: 5 },
  'Spatial': { color: 'pink', icon: Radio, order: 6 },
}

// Default icon for uncategorized models
const DEFAULT_ICON = Zap

/**
 * Auto-generate animation categories from model registry
 * This replaces the hardcoded category list and automatically
 * includes custom models when they're loaded
 */
function generateAnimationCategories(): AnimationCategory[] {
  const models = modelRegistry.getAllModels()
  const categoryMap = new Map<string, AnimationInfo[]>()

  // Group models by category
  models.forEach(model => {
    const category = model.metadata.category || 'Other'
    const IconComponent = CATEGORY_CONFIG[category]?.icon || DEFAULT_ICON
    
    const animInfo: AnimationInfo = {
      type: model.metadata.type as AnimationType,
      label: model.metadata.name,
      icon: <IconComponent className="w-5 h-5" />,
      description: model.metadata.description || ''
    }

    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(animInfo)
  })

  // Convert to array and sort
  const categories: AnimationCategory[] = Array.from(categoryMap.entries())
    .map(([name, animations]) => ({
      name,
      color: CATEGORY_CONFIG[name]?.color || 'gray',
      animations: animations.sort((a, b) => a.label.localeCompare(b.label))
    }))
    .sort((a, b) => {
      const orderA = CATEGORY_CONFIG[a.name]?.order ?? 999
      const orderB = CATEGORY_CONFIG[b.name]?.order ?? 999
      return orderA - orderB
    })

  return categories
}

// Export the generated categories (will auto-update when models are registered)
export const animationCategories: AnimationCategory[] = generateAnimationCategories()

export const getAnimationInfo = (type: AnimationType): AnimationInfo | null => {
  for (const category of animationCategories) {
    const animation = category.animations.find(a => a.type === type)
    if (animation) return animation
  }
  return null
}

// All registered models support control points (managed by models themselves)
export const supportsControlPointsTypes: AnimationType[] = 
  modelRegistry.getAllModels().map(m => m.metadata.type as AnimationType)

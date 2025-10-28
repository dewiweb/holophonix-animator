import React from 'react'
import { AnimationType } from '@/types'
import { Target, Circle, Zap } from 'lucide-react'

interface AnimationCategory {
  name: string
  color: string
  animations: {
    type: AnimationType
    label: string
    icon: React.ReactNode
    description: string
  }[]
}

interface AnimationTypeSelectorProps {
  selectedType: AnimationType
  onTypeChange: (type: AnimationType) => void
  categories: AnimationCategory[]
  getAnimationInfo: (type: AnimationType) => { label: string; icon: React.ReactNode; description: string } | null
}

export const AnimationTypeSelector: React.FC<AnimationTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  categories,
  getAnimationInfo
}) => {
  const selectedAnim = getAnimationInfo(selectedType)

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Select Animation Type</label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as AnimationType)}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {categories.map((category) => (
            <optgroup key={category.name} label={category.name}>
              {category.animations.map((animType) => (
                <option key={animType.type} value={animType.type}>
                  {animType.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Currently Selected Animation Card */}
      {selectedAnim && (
        <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/20 to-indigo-50 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
              {selectedAnim.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {selectedAnim.label}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedAnim.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

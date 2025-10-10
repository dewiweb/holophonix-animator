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
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Animation Type</label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as AnimationType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 text-blue-600">
              {selectedAnim.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {selectedAnim.label}
              </h3>
              <p className="text-xs text-gray-600">
                {selectedAnim.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

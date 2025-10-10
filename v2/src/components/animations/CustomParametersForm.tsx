import React from 'react'
import { AnimationParameters, Keyframe } from '@/types'

interface CustomParametersFormProps {
  parameters: AnimationParameters
  keyframes: Keyframe[]
  onChange: (key: string, value: any) => void
}

export const CustomParametersForm: React.FC<CustomParametersFormProps> = ({
  parameters,
  keyframes,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Custom Path Animation</h3>
            <p className="mt-1 text-sm text-blue-700">
              Custom animations use keyframes to define specific positions at specific times.
              Use the Timeline view to add and edit keyframes for precise control.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Interpolation Type</label>
        <select
          value={parameters.interpolation || 'linear'}
          onChange={(e) => onChange('interpolation', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="linear">Linear</option>
          <option value="bezier">Bezier (Smooth)</option>
          <option value="step">Step (No interpolation)</option>
        </select>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Keyframes:</strong> {keyframes.length}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Switch to Timeline view to manage keyframes
        </p>
      </div>
    </div>
  )
}

import React from 'react'
import { AnimationParameters } from '@/types'

interface RoseCurveParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const RoseCurveParametersForm: React.FC<RoseCurveParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          {['x', 'y', 'z'].map(axis => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={(parameters as any)?.center?.[axis] || 0}
              onChange={(e) => onParameterChange('center', {
                ...(parameters as any)?.center,
                [axis]: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={axis.toUpperCase()}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.roseRadius || 3}
            onChange={(e) => onParameterChange('roseRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Petal Count</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(parameters as any)?.petalCount || 5}
            onChange={(e) => onParameterChange('petalCount', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rotation (°)</label>
          <input
            type="number"
            min="0"
            max="360"
            value={(parameters as any)?.roseRotation || 0}
            onChange={(e) => onParameterChange('roseRotation', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
        <select
          value={(parameters as any)?.plane || 'xy'}
          onChange={(e) => onParameterChange('plane', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="xy">XY Plane</option>
          <option value="xz">XZ Plane</option>
          <option value="yz">YZ Plane</option>
        </select>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
        <p className="text-xs text-pink-800">
          <strong>🌹 Rose Pattern:</strong> Mathematical flower shape. Try 3, 5, or 7 petals for beautiful symmetric patterns.
        </p>
      </div>
    </div>
  )
}

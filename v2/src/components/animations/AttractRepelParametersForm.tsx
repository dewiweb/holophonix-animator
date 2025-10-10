import React from 'react'
import { AnimationParameters } from '@/types'

interface AttractRepelParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const AttractRepelParametersForm: React.FC<AttractRepelParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target Position</label>
        <div className="grid grid-cols-3 gap-2">
          {['x', 'y', 'z'].map(axis => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={(parameters as any)?.targetPosition?.[axis] || 0}
              onChange={(e) => onParameterChange('targetPosition', {
                ...(parameters as any)?.targetPosition,
                [axis]: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={axis.toUpperCase()}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attraction Strength</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={(parameters as any)?.attractionStrength || 5}
            onChange={(e) => onParameterChange('attractionStrength', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Force pulling toward target</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Repulsion Radius</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={(parameters as any)?.repulsionRadius || 2}
            onChange={(e) => onParameterChange('repulsionRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Push away when too close</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Max Speed</label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={(parameters as any)?.maxSpeed || 5}
          onChange={(e) => onParameterChange('maxSpeed', parseFloat(e.target.value))}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Speed limit</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-xs text-red-800">
          <strong>🧲 Force-Based:</strong> Attracts toward target but repels when too close. Creates organic orbiting behavior.
        </p>
      </div>
    </div>
  )
}

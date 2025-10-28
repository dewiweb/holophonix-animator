import React from 'react'
import { AnimationParameters } from '@/types'

interface BounceParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const BounceParametersForm: React.FC<BounceParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.center?.x || 0}
            onChange={(e) => onParameterChange('center', {
              ...(parameters as any)?.center,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.center?.y || 0}
            onChange={(e) => onParameterChange('center', {
              ...(parameters as any)?.center,
              y: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Y"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.center?.z || 0}
            onChange={(e) => onParameterChange('center', {
              ...(parameters as any)?.center,
              z: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Z"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Start Height</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.startHeight || 10}
            onChange={(e) => onParameterChange('startHeight', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Ground Level</label>
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.groundLevel || 0}
            onChange={(e) => onParameterChange('groundLevel', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Bounciness (0-1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={(parameters as any)?.bounciness || 0.8}
            onChange={(e) => onParameterChange('bounciness', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Damping/Bounce</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={(parameters as any)?.dampingPerBounce || 0.1}
            onChange={(e) => onParameterChange('dampingPerBounce', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Gravity</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.gravity || 9.81}
            onChange={(e) => onParameterChange('gravity', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
        <p className="text-xs text-orange-800 dark:text-orange-200">
          <strong>🏀 Bouncing Ball:</strong> Realistic vertical bouncing with decreasing height. Higher bounciness = more energy retained.
        </p>
      </div>
    </div>
  )
}

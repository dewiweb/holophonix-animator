import React from 'react'
import { AnimationParameters } from '@/types'

interface PendulumParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const PendulumParametersForm: React.FC<PendulumParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Anchor Point</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.anchorPoint?.x || 0}
            onChange={(e) => onParameterChange('anchorPoint', {
              ...(parameters as any)?.anchorPoint,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.anchorPoint?.y || 0}
            onChange={(e) => onParameterChange('anchorPoint', {
              ...(parameters as any)?.anchorPoint,
              y: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Y"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.anchorPoint?.z || 0}
            onChange={(e) => onParameterChange('anchorPoint', {
              ...(parameters as any)?.anchorPoint,
              z: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Z"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Pendulum Length</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.pendulumLength || 3}
            onChange={(e) => onParameterChange('pendulumLength', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Initial Angle (°)</label>
          <input
            type="number"
            min="-180"
            max="180"
            value={(parameters as any)?.initialAngle || 45}
            onChange={(e) => onParameterChange('initialAngle', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Damping (0-1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={(parameters as any)?.damping || 0.02}
            onChange={(e) => onParameterChange('damping', parseFloat(e.target.value))}
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

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Swing Plane</label>
        <select
          value={(parameters as any)?.plane || 'xz'}
          onChange={(e) => onParameterChange('plane', e.target.value)}
          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="xy">XY (Vertical swing, gravity down)</option>
          <option value="xz">XZ (Horizontal swing, gravity forward) - Recommended</option>
          <option value="yz">YZ (Side swing, gravity forward)</option>
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          XZ plane works best for spatial audio - creates horizontal arc around listener
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>⚖️ Physics:</strong> Realistic swinging motion with gravity simulation. Lower damping = longer swing. Use XZ plane for horizontal spatial audio effects.
        </p>
      </div>
    </div>
  )
}

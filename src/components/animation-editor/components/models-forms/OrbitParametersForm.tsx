import React from 'react'
import { AnimationParameters } from '@/types'

interface OrbitParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const OrbitParametersForm: React.FC<OrbitParametersFormProps> = ({ parameters, onParameterChange }) => {
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
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Orbital Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.orbitalRadius || 4}
            onChange={(e) => onParameterChange('orbitalRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Speed Multiplier</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.orbitalSpeed || 1}
            onChange={(e) => onParameterChange('orbitalSpeed', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Phase Offset (°)</label>
          <input
            type="number"
            min="0"
            max="360"
            value={(parameters as any)?.orbitalPhase || 0}
            onChange={(e) => onParameterChange('orbitalPhase', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Starting angle in orbit</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Inclination (°)</label>
          <input
            type="number"
            min="0"
            max="90"
            value={(parameters as any)?.inclination || 0}
            onChange={(e) => onParameterChange('inclination', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Tilt of orbital plane</p>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
        <p className="text-xs text-purple-800 dark:text-purple-200">
          <strong>🪐 Orbital Motion:</strong> Perfect for satellite-like movement around a point. Inclination adds 3D tilt.
        </p>
      </div>
    </div>
  )
}

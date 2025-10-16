import React from 'react'
import { AnimationParameters } from '@/types'

interface WaveParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const WaveParametersForm: React.FC<WaveParametersFormProps> = ({ parameters, onParameterChange }) => {
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

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Amplitude</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.amplitude?.x || 2}
            onChange={(e) => onParameterChange('amplitude', {
              ...(parameters as any)?.amplitude,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="X"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.amplitude?.y || 2}
            onChange={(e) => onParameterChange('amplitude', {
              ...(parameters as any)?.amplitude,
              y: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Y"
          />
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.amplitude?.z || 1}
            onChange={(e) => onParameterChange('amplitude', {
              ...(parameters as any)?.amplitude,
              z: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Z"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Frequency (Hz)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.frequency || 1}
            onChange={(e) => onParameterChange('frequency', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Phase Offset</label>
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.phaseOffset || 0}
            onChange={(e) => onParameterChange('phaseOffset', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Wave Type</label>
        <select
          value={(parameters as any)?.waveType || 'sine'}
          onChange={(e) => onParameterChange('waveType', e.target.value)}
          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="sine">Sine Wave</option>
          <option value="square">Square Wave</option>
          <option value="triangle">Triangle Wave</option>
          <option value="sawtooth">Sawtooth Wave</option>
        </select>
      </div>
    </div>
  )
}

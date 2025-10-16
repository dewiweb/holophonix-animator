import React from 'react'
import { AnimationParameters } from '@/types'

interface LissajousParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const LissajousParametersForm: React.FC<LissajousParametersFormProps> = ({ parameters, onParameterChange }) => {
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
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Frequency Ratio A</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(parameters as any)?.frequencyRatioA || 3}
            onChange={(e) => onParameterChange('frequencyRatioA', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Frequency Ratio B</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(parameters as any)?.frequencyRatioB || 2}
            onChange={(e) => onParameterChange('frequencyRatioB', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Phase Difference (°)</label>
        <input
          type="number"
          min="0"
          max="360"
          value={(parameters as any)?.phaseDifference || 0}
          onChange={(e) => onParameterChange('phaseDifference', parseFloat(e.target.value))}
          className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Amplitude</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">X</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={(parameters as any)?.amplitudeX || 3}
              onChange={(e) => onParameterChange('amplitudeX', parseFloat(e.target.value))}
              className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Y</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={(parameters as any)?.amplitudeY || 3}
              onChange={(e) => onParameterChange('amplitudeY', parseFloat(e.target.value))}
              className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Z</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={(parameters as any)?.amplitudeZ || 1}
              onChange={(e) => onParameterChange('amplitudeZ', parseFloat(e.target.value))}
              className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>💡 Tip:</strong> Try ratios like 3:2 for figure-8 patterns, 5:4 for flower shapes, or 1:1 for circles.
        </p>
      </div>
    </div>
  )
}

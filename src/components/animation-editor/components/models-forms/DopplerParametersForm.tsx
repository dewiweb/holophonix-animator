import React from 'react'
import { AnimationParameters } from '@/types'

interface DopplerParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const DopplerParametersForm: React.FC<DopplerParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Path Start</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(axis => (
              <input
                key={axis}
                type="number"
                step="0.1"
                value={(parameters as any)?.pathStart?.[axis] || (axis === 'x' ? -10 : axis === 'z' ? 5 : 0)}
                onChange={(e) => onParameterChange('pathStart', {
                  ...(parameters as any)?.pathStart,
                  [axis]: parseFloat(e.target.value)
                })}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={axis.toUpperCase()}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Path End</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(axis => (
              <input
                key={axis}
                type="number"
                step="0.1"
                value={(parameters as any)?.pathEnd?.[axis] || (axis === 'x' ? 10 : axis === 'z' ? 5 : 0)}
                onChange={(e) => onParameterChange('pathEnd', {
                  ...(parameters as any)?.pathEnd,
                  [axis]: parseFloat(e.target.value)
                })}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={axis.toUpperCase()}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pass-By Speed</label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={(parameters as any)?.passBySpeed || 2}
          onChange={(e) => onParameterChange('passBySpeed', parseFloat(e.target.value))}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <p className="text-xs text-gray-500 mt-1">Higher = faster fly-by</p>
      </div>

      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
        <p className="text-xs text-sky-800">
          <strong>✈️ Doppler Effect:</strong> Fast linear pass-by path ideal for Doppler frequency shift effects.
        </p>
      </div>
    </div>
  )
}

import React from 'react'
import { AnimationParameters } from '@/types'

interface ZigzagParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const ZigzagParametersForm: React.FC<ZigzagParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Point</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(axis => (
              <input
                key={axis}
                type="number"
                step="0.1"
                value={(parameters as any)?.zigzagStart?.[axis] || (axis === 'x' ? -5 : 0)}
                onChange={(e) => onParameterChange('zigzagStart', {
                  ...(parameters as any)?.zigzagStart,
                  [axis]: parseFloat(e.target.value)
                })}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={axis.toUpperCase()}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Point</label>
          <div className="grid grid-cols-3 gap-2">
            {['x', 'y', 'z'].map(axis => (
              <input
                key={axis}
                type="number"
                step="0.1"
                value={(parameters as any)?.zigzagEnd?.[axis] || (axis === 'x' ? 5 : 0)}
                onChange={(e) => onParameterChange('zigzagEnd', {
                  ...(parameters as any)?.zigzagEnd,
                  [axis]: parseFloat(e.target.value)
                })}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={axis.toUpperCase()}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zigzag Count</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(parameters as any)?.zigzagCount || 5}
            onChange={(e) => onParameterChange('zigzagCount', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amplitude</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.zigzagAmplitude || 2}
            onChange={(e) => onParameterChange('zigzagAmplitude', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
          <select
            value={(parameters as any)?.zigzagPlane || 'xy'}
            onChange={(e) => onParameterChange('zigzagPlane', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="xy">XY Plane</option>
            <option value="xz">XZ Plane</option>
            <option value="yz">YZ Plane</option>
          </select>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          <strong>⚡ Sharp Angles:</strong> Creates angular zigzag path. Higher count = more frequent turns.
        </p>
      </div>
    </div>
  )
}

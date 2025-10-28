import React from 'react'
import { AnimationParameters } from '@/types'

interface ZoomParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const ZoomParametersForm: React.FC<ZoomParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zoom Center</label>
        <div className="grid grid-cols-3 gap-2">
          {['x', 'y', 'z'].map(axis => (
            <input
              key={axis}
              type="number"
              step="0.1"
              value={(parameters as any)?.zoomCenter?.[axis] || 0}
              onChange={(e) => onParameterChange('zoomCenter', {
                ...(parameters as any)?.zoomCenter,
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Distance</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.startDistance || 15}
            onChange={(e) => onParameterChange('startDistance', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Distance</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.endDistance || 2}
            onChange={(e) => onParameterChange('endDistance', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Acceleration Curve</label>
        <select
          value={(parameters as any)?.accelerationCurve || 'ease-in-out'}
          onChange={(e) => onParameterChange('accelerationCurve', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In (Accelerate)</option>
          <option value="ease-out">Ease Out (Decelerate)</option>
          <option value="ease-in-out">Ease In-Out</option>
        </select>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
        <p className="text-xs text-violet-800">
          <strong>🎯 Dramatic Zoom:</strong> Radial movement toward or away from a point. Perfect for dramatic approach or retreat effects.
        </p>
      </div>
    </div>
  )
}

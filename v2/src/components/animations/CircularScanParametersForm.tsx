import React from 'react'
import { AnimationParameters } from '@/types'

interface CircularScanParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const CircularScanParametersForm: React.FC<CircularScanParametersFormProps> = ({ parameters, onParameterChange }) => {
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scan Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.scanRadius || 6}
            onChange={(e) => onParameterChange('scanRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.scanHeight || 2}
            onChange={(e) => onParameterChange('scanHeight', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sweep Count</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(parameters as any)?.sweepCount || 2}
            onChange={(e) => onParameterChange('sweepCount', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Full rotations</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Angle Offset (°)</label>
          <input
            type="number"
            min="0"
            max="360"
            value={(parameters as any)?.startAngleOffset || 0}
            onChange={(e) => onParameterChange('startAngleOffset', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
        <p className="text-xs text-cyan-800">
          <strong>📡 Radar Scan:</strong> Circular sweeping motion around a listener position, like a radar or sonar scan.
        </p>
      </div>
    </div>
  )
}

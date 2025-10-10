import React from 'react'
import { AnimationParameters } from '@/types'

interface HelixParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const HelixParametersForm: React.FC<HelixParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Axis Start</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisStart?.x || 0}
              onChange={(e) => onParameterChange('axisStart', {
                ...(parameters as any)?.axisStart,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisStart?.y || 0}
              onChange={(e) => onParameterChange('axisStart', {
                ...(parameters as any)?.axisStart,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisStart?.z || 0}
              onChange={(e) => onParameterChange('axisStart', {
                ...(parameters as any)?.axisStart,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Axis End</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisEnd?.x || 0}
              onChange={(e) => onParameterChange('axisEnd', {
                ...(parameters as any)?.axisEnd,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisEnd?.y || 0}
              onChange={(e) => onParameterChange('axisEnd', {
                ...(parameters as any)?.axisEnd,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.axisEnd?.z || 10}
              onChange={(e) => onParameterChange('axisEnd', {
                ...(parameters as any)?.axisEnd,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.helixRadius || 2}
            onChange={(e) => onParameterChange('helixRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rotations</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.helixRotations || 3}
            onChange={(e) => onParameterChange('helixRotations', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <select
            value={(parameters as any)?.helixDirection || 'clockwise'}
            onChange={(e) => onParameterChange('helixDirection', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="clockwise">Clockwise</option>
            <option value="counterclockwise">Counter-clockwise</option>
          </select>
        </div>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
        <p className="text-xs text-cyan-800">
          <strong>🌀 3D Spiral:</strong> Creates a helical path along an axis, like a corkscrew or spring shape.
        </p>
      </div>
    </div>
  )
}

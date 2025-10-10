import React from 'react'
import { AnimationParameters } from '@/types'

interface EpicycloidParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const EpicycloidParametersForm: React.FC<EpicycloidParametersFormProps> = ({ parameters, onParameterChange }) => {
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Fixed Circle Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.fixedRadius || 3}
            onChange={(e) => onParameterChange('fixedRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rolling Circle Radius</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.rollingRadius || 1}
            onChange={(e) => onParameterChange('rollingRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.epicycloidSpeed || 1}
            onChange={(e) => onParameterChange('epicycloidSpeed', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={(parameters as any)?.epicycloidType || 'epicycloid'}
            onChange={(e) => onParameterChange('epicycloidType', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="epicycloid">Epicycloid (Outside)</option>
            <option value="hypocycloid">Hypocycloid (Inside)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
        <select
          value={(parameters as any)?.plane || 'xy'}
          onChange={(e) => onParameterChange('plane', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="xy">XY Plane</option>
          <option value="xz">XZ Plane</option>
          <option value="yz">YZ Plane</option>
        </select>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <p className="text-xs text-indigo-800">
          <strong>⚙️ Circle Rolling:</strong> Path traced by a point on a circle rolling around another circle.
        </p>
      </div>
    </div>
  )
}

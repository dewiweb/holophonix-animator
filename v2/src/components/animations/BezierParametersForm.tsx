import React from 'react'
import { AnimationParameters } from '@/types'

interface BezierParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const BezierParametersForm: React.FC<BezierParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Point</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierStart?.x || -5}
              onChange={(e) => onParameterChange('bezierStart', {
                ...(parameters as any)?.bezierStart,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierStart?.y || 0}
              onChange={(e) => onParameterChange('bezierStart', {
                ...(parameters as any)?.bezierStart,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierStart?.z || 0}
              onChange={(e) => onParameterChange('bezierStart', {
                ...(parameters as any)?.bezierStart,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Point</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierEnd?.x || 5}
              onChange={(e) => onParameterChange('bezierEnd', {
                ...(parameters as any)?.bezierEnd,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierEnd?.y || 0}
              onChange={(e) => onParameterChange('bezierEnd', {
                ...(parameters as any)?.bezierEnd,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierEnd?.z || 0}
              onChange={(e) => onParameterChange('bezierEnd', {
                ...(parameters as any)?.bezierEnd,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Control Point 1</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl1?.x || -2}
              onChange={(e) => onParameterChange('bezierControl1', {
                ...(parameters as any)?.bezierControl1,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl1?.y || 5}
              onChange={(e) => onParameterChange('bezierControl1', {
                ...(parameters as any)?.bezierControl1,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl1?.z || 0}
              onChange={(e) => onParameterChange('bezierControl1', {
                ...(parameters as any)?.bezierControl1,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Control Point 2</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl2?.x || 2}
              onChange={(e) => onParameterChange('bezierControl2', {
                ...(parameters as any)?.bezierControl2,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl2?.y || -5}
              onChange={(e) => onParameterChange('bezierControl2', {
                ...(parameters as any)?.bezierControl2,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.bezierControl2?.z || 0}
              onChange={(e) => onParameterChange('bezierControl2', {
                ...(parameters as any)?.bezierControl2,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Easing Function</label>
        <select
          value={(parameters as any)?.bezierEasing || 'linear'}
          onChange={(e) => onParameterChange('bezierEasing', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="linear">Linear</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
        </select>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-800">
          <strong>📐 Bézier Curve:</strong> Smooth curved path defined by control points. Adjust control points to shape the curve.
        </p>
      </div>
    </div>
  )
}

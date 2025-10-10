import React from 'react'
import { AnimationParameters } from '@/types'

interface SpringParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const SpringParametersForm: React.FC<SpringParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rest Position</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.restPosition?.x || 0}
              onChange={(e) => onParameterChange('restPosition', {
                ...(parameters as any)?.restPosition,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.restPosition?.y || 0}
              onChange={(e) => onParameterChange('restPosition', {
                ...(parameters as any)?.restPosition,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.restPosition?.z || 0}
              onChange={(e) => onParameterChange('restPosition', {
                ...(parameters as any)?.restPosition,
                z: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Z"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Initial Displacement</label>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.initialDisplacement?.x || 5}
              onChange={(e) => onParameterChange('initialDisplacement', {
                ...(parameters as any)?.initialDisplacement,
                x: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="X"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.initialDisplacement?.y || 5}
              onChange={(e) => onParameterChange('initialDisplacement', {
                ...(parameters as any)?.initialDisplacement,
                y: parseFloat(e.target.value)
              })}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Y"
            />
            <input
              type="number"
              step="0.1"
              value={(parameters as any)?.initialDisplacement?.z || 0}
              onChange={(e) => onParameterChange('initialDisplacement', {
                ...(parameters as any)?.initialDisplacement,
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Stiffness</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.springStiffness || 10}
            onChange={(e) => onParameterChange('springStiffness', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Damping</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={(parameters as any)?.dampingCoefficient || 0.5}
            onChange={(e) => onParameterChange('dampingCoefficient', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mass</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.mass || 1}
            onChange={(e) => onParameterChange('mass', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <p className="text-xs text-indigo-800">
          <strong>🔵 Spring Dynamics:</strong> Oscillating motion with overshoot. Higher stiffness = faster oscillation.
        </p>
      </div>
    </div>
  )
}

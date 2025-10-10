import React from 'react'
import { AnimationParameters } from '@/types'

interface PerlinNoiseParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const PerlinNoiseParametersForm: React.FC<PerlinNoiseParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(parameters as any)?.center?.x || 0}
            onChange={(e) => onParameterChange('center', {
              ...(parameters as any)?.center,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Z"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bounds (Movement Area)</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.bounds?.x || 5}
            onChange={(e) => onParameterChange('bounds', {
              ...(parameters as any)?.bounds,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="±X"
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.bounds?.y || 5}
            onChange={(e) => onParameterChange('bounds', {
              ...(parameters as any)?.bounds,
              y: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="±Y"
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.bounds?.z || 5}
            onChange={(e) => onParameterChange('bounds', {
              ...(parameters as any)?.bounds,
              z: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="±Z"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.noiseFrequency || 1}
            onChange={(e) => onParameterChange('noiseFrequency', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Higher = faster movement</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.noiseScale || 1}
            onChange={(e) => onParameterChange('noiseScale', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Multiplier for movement</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Octaves (Detail)</label>
          <input
            type="number"
            min="1"
            max="8"
            step="1"
            value={(parameters as any)?.noiseOctaves || 3}
            onChange={(e) => onParameterChange('noiseOctaves', parseInt(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">More = more detail (slower)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Persistence</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={(parameters as any)?.noisePersistence || 0.5}
            onChange={(e) => onParameterChange('noisePersistence', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Roughness vs smoothness</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Random Seed</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="1"
            value={(parameters as any)?.noiseSeed || 12345}
            onChange={(e) => onParameterChange('noiseSeed', parseInt(e.target.value))}
            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => onParameterChange('noiseSeed', Math.floor(Math.random() * 999999))}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Randomize
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Change for different patterns</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs text-green-800">
          <strong>🌿 Perfect for:</strong> Organic, natural movements like clouds, leaves, or floating objects
        </p>
      </div>
    </div>
  )
}

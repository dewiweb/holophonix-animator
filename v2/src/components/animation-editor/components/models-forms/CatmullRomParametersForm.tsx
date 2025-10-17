import React from 'react'
import { AnimationParameters } from '@/types'

interface CatmullRomParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const CatmullRomParametersForm: React.FC<CatmullRomParametersFormProps> = ({ parameters, onParameterChange }) => {
  const controlPoints = (parameters as any)?.controlPoints || [
    { x: -5, y: 0, z: 0 },
    { x: -2, y: 3, z: 2 },
    { x: 2, y: -3, z: -2 },
    { x: 5, y: 0, z: 0 }
  ]

  const handlePointChange = (index: number, axis: 'x' | 'y' | 'z', value: string) => {
    const newPoints = [...controlPoints]
    newPoints[index] = { ...newPoints[index], [axis]: parseFloat(value) || 0 }
    onParameterChange('controlPoints', newPoints)
  }

  const addPoint = () => {
    const lastPoint = controlPoints[controlPoints.length - 1]
    onParameterChange('controlPoints', [...controlPoints, { ...lastPoint }])
  }

  const removePoint = (index: number) => {
    if (controlPoints.length > 2) {
      onParameterChange('controlPoints', controlPoints.filter((_: any, i: number) => i !== index))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Control Points</label>
          <button
            onClick={addPoint}
            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            + Add Point
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {controlPoints.map((point: any, index: number) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <span className="text-xs font-medium text-gray-500 w-8">P{index + 1}</span>
              <input
                type="number"
                step="0.1"
                value={point.x}
                onChange={(e) => handlePointChange(index, 'x', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="X"
              />
              <input
                type="number"
                step="0.1"
                value={point.y}
                onChange={(e) => handlePointChange(index, 'y', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Y"
              />
              <input
                type="number"
                step="0.1"
                value={point.z}
                onChange={(e) => handlePointChange(index, 'z', e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Z"
              />
              {controlPoints.length > 2 && (
                <button
                  onClick={() => removePoint(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tension (0-1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={(parameters as any)?.catmullRomTension || 0.5}
            onChange={(e) => onParameterChange('catmullRomTension', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Lower = tighter curves</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={(parameters as any)?.closedLoop || false}
              onChange={(e) => onParameterChange('closedLoop', e.target.checked)}
              className="rounded border-gray-300 focus:ring-2 focus:ring-primary-500"
            />
            Closed Loop
          </label>
          <p className="text-xs text-gray-500 mt-1">Connect last to first</p>
        </div>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
        <p className="text-xs text-teal-800">
          <strong>🎢 Smooth Spline:</strong> Creates smooth curves through all control points. Add points to shape the path.
        </p>
      </div>
    </div>
  )
}

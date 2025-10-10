import React from 'react'
import { AnimationParameters } from '@/types'

interface FormationParametersFormProps {
  parameters: AnimationParameters
  onParameterChange: (key: string, value: any) => void
}

export const FormationParametersForm: React.FC<FormationParametersFormProps> = ({ parameters, onParameterChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Formation Shape</label>
        <select
          value={(parameters as any)?.formationShape || 'line'}
          onChange={(e) => onParameterChange('formationShape', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="line">Line</option>
          <option value="circle">Circle</option>
          <option value="grid">Grid</option>
          <option value="v-shape">V-Shape</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(parameters as any)?.formationSpacing || 2}
            onChange={(e) => onParameterChange('formationSpacing', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Distance between objects</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Follow Stiffness</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={(parameters as any)?.followStiffness || 0.5}
            onChange={(e) => onParameterChange('followStiffness', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">How rigid the formation is</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800">
          <strong>👥 Formation:</strong> Maintains relative positions between multiple objects. Useful for coordinated movement.
        </p>
      </div>
    </div>
  )
}

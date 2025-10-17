import React from 'react'
import { AnimationParameters } from '@/types'
import { PositionInput, FormInput } from '@/components/common'

interface CircularParametersFormProps {
  parameters: AnimationParameters
  onChange: (key: string, value: any) => void
}

export const CircularParametersForm: React.FC<CircularParametersFormProps> = ({
  parameters,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PositionInput
          label="Center"
          value={parameters.center || { x: 0, y: 0, z: 0 }}
          onChange={(value) => onChange('center', value)}
        />
        <FormInput
          label="Radius"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.radius || 3}
          onChange={(value) => onChange('radius', value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Start Angle (°)"
          type="number"
          min={-360}
          max={360}
          value={parameters.startAngle || 0}
          onChange={(value) => onChange('startAngle', value)}
        />
        <FormInput
          label="End Angle (°)"
          type="number"
          min={-360}
          max={360}
          value={parameters.endAngle || 360}
          onChange={(value) => onChange('endAngle', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
        <select
          value={parameters.plane || 'xy'}
          onChange={(e) => onChange('plane', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="xy">XY Plane</option>
          <option value="xz">XZ Plane</option>
          <option value="yz">YZ Plane</option>
        </select>
      </div>
    </div>
  )
}

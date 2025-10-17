import React from 'react'
import { AnimationParameters } from '@/types'
import { PositionInput, FormInput } from '@/components/common'

interface SpiralParametersFormProps {
  parameters: AnimationParameters
  onChange: (key: string, value: any) => void
}

export const SpiralParametersForm: React.FC<SpiralParametersFormProps> = ({
  parameters,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <PositionInput
        label="Center Position"
        value={parameters.center || { x: 0, y: 0, z: 0 }}
        onChange={(value) => onChange('center', value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Start Radius"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.startRadius || 1}
          onChange={(value) => onChange('startRadius', value)}
        />
        <FormInput
          label="End Radius"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.endRadius || 5}
          onChange={(value) => onChange('endRadius', value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Rotations"
          type="number"
          min={0.5}
          step={0.5}
          value={parameters.rotations || 3}
          onChange={(value) => onChange('rotations', value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
          <select
            value={parameters.direction || 'clockwise'}
            onChange={(e) => onChange('direction', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="clockwise">Clockwise</option>
            <option value="counterclockwise">Counterclockwise</option>
          </select>
        </div>
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

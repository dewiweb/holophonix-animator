import React from 'react'
import { AnimationParameters } from '@/types'
import { FormInput } from '@/components/common'

interface EllipticalParametersFormProps {
  parameters: AnimationParameters
  onChange: (key: string, value: any) => void
}

export const EllipticalParametersForm: React.FC<EllipticalParametersFormProps> = ({
  parameters,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          <FormInput
            label=""
            type="number"
            step={0.1}
            value={parameters.centerX || 0}
            onChange={(value) => onChange('centerX', value)}
            placeholder="X"
            inputClassName="px-2 py-1 text-sm"
          />
          <FormInput
            label=""
            type="number"
            step={0.1}
            value={parameters.centerY || 0}
            onChange={(value) => onChange('centerY', value)}
            placeholder="Y"
            inputClassName="px-2 py-1 text-sm"
          />
          <FormInput
            label=""
            type="number"
            step={0.1}
            value={parameters.centerZ || 0}
            onChange={(value) => onChange('centerZ', value)}
            placeholder="Z"
            inputClassName="px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormInput
          label="Radius X"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.radiusX || 4}
          onChange={(value) => onChange('radiusX', value)}
        />
        <FormInput
          label="Radius Y"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.radiusY || 2}
          onChange={(value) => onChange('radiusY', value)}
        />
        <FormInput
          label="Radius Z"
          type="number"
          min={0.1}
          step={0.1}
          value={parameters.radiusZ || 0}
          onChange={(value) => onChange('radiusZ', value)}
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
    </div>
  )
}

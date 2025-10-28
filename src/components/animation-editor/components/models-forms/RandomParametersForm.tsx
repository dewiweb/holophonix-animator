import React from 'react'
import { AnimationParameters } from '@/types'
import { PositionInput, FormInput } from '@/components/common'

interface RandomParametersFormProps {
  parameters: AnimationParameters
  onChange: (key: string, value: any) => void
}

export const RandomParametersForm: React.FC<RandomParametersFormProps> = ({
  parameters,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PositionInput
          label="Center Position"
          value={parameters.center || { x: 0, y: 0, z: 0 }}
          onChange={(value) => onChange('center', value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bounds (±)</label>
          <div className="grid grid-cols-3 gap-2">
            <FormInput
              label=""
              type="number"
              min={0.1}
              step={0.1}
              value={parameters.bounds?.x || 5}
              onChange={(value) => onChange('bounds', {
                ...(parameters.bounds || { x: 5, y: 5, z: 5 }),
                x: value,
              })}
              placeholder="X"
              inputClassName="px-2 py-1 text-sm"
            />
            <FormInput
              label=""
              type="number"
              min={0.1}
              step={0.1}
              value={parameters.bounds?.y || 5}
              onChange={(value) => onChange('bounds', {
                ...(parameters.bounds || { x: 5, y: 5, z: 5 }),
                y: value,
              })}
              placeholder="Y"
              inputClassName="px-2 py-1 text-sm"
            />
            <FormInput
              label=""
              type="number"
              min={0.1}
              step={0.1}
              value={parameters.bounds?.z || 5}
              onChange={(value) => onChange('bounds', {
                ...(parameters.bounds || { x: 5, y: 5, z: 5 }),
                z: value,
              })}
              placeholder="Z"
              inputClassName="px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Speed"
          type="number"
          min={0.1}
          max={10}
          step={0.1}
          value={parameters.speed || 1}
          onChange={(value) => onChange('speed', value)}
        />
        <FormInput
          label="Smoothness"
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={parameters.smoothness || 0.5}
          onChange={(value) => onChange('smoothness', value)}
        />
      </div>

      <FormInput
        label="Update Frequency (Hz)"
        type="number"
        min={1}
        max={60}
        value={parameters.updateFrequency || 10}
        onChange={(value) => onChange('updateFrequency', value)}
      />
    </div>
  )
}

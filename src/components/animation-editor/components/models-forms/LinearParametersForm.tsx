import React from 'react'
import { AnimationParameters } from '@/types'
import { PositionInput } from '@/components/common'

interface LinearParametersFormProps {
  parameters: AnimationParameters
  onChange: (key: string, value: any) => void
}

export const LinearParametersForm: React.FC<LinearParametersFormProps> = ({
  parameters,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <PositionInput
          label="Start Position"
          value={parameters.startPosition || { x: 0, y: 0, z: 0 }}
          onChange={(value) => onChange('startPosition', value)}
        />
        <PositionInput
          label="End Position"
          value={parameters.endPosition || { x: 5, y: 5, z: 5 }}
          onChange={(value) => onChange('endPosition', value)}
        />
      </div>
    </div>
  )
}

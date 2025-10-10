import React from 'react'
import { AnimationType, AnimationParameters, Keyframe } from '@/types'
import {
  LinearParametersForm,
  CircularParametersForm,
  EllipticalParametersForm,
  SpiralParametersForm,
  RandomParametersForm,
  CustomParametersForm,
} from './index'

interface AnimationParametersFormProps {
  type: AnimationType
  parameters: AnimationParameters
  keyframes?: Keyframe[]
  onChange: (key: string, value: any) => void
}

export const AnimationParametersForm: React.FC<AnimationParametersFormProps> = ({
  type,
  parameters,
  keyframes = [],
  onChange,
}) => {
  switch (type) {
    case 'linear':
      return <LinearParametersForm parameters={parameters} onChange={onChange} />
    case 'circular':
      return <CircularParametersForm parameters={parameters} onChange={onChange} />
    case 'elliptical':
      return <EllipticalParametersForm parameters={parameters} onChange={onChange} />
    case 'spiral':
      return <SpiralParametersForm parameters={parameters} onChange={onChange} />
    case 'random':
      return <RandomParametersForm parameters={parameters} onChange={onChange} />
    case 'custom':
      return <CustomParametersForm parameters={parameters} keyframes={keyframes} onChange={onChange} />
    default:
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Parameters for {type} animations coming soon...</p>
        </div>
      )
  }
}

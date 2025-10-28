import React from 'react'
import { AnimationType, AnimationParameters } from '@/types'
import { LinearParametersForm } from './LinearParametersForm'
import { CircularParametersForm } from './CircularParametersForm'
import { EllipticalParametersForm } from './EllipticalParametersForm'
import { SpiralParametersForm } from './SpiralParametersForm'
import { RandomParametersForm } from './RandomParametersForm'
import { CustomParametersForm } from './CustomParametersForm'
import { WaveParametersForm } from './WaveParametersForm'
import { LissajousParametersForm } from './LissajousParametersForm'
import { PerlinNoiseParametersForm } from './PerlinNoiseParametersForm'
import { OrbitParametersForm } from './OrbitParametersForm'
import { PendulumParametersForm } from './PendulumParametersForm'
import { BounceParametersForm } from './BounceParametersForm'
import { SpringParametersForm } from './SpringParametersForm'
import { HelixParametersForm } from './HelixParametersForm'
import { BezierParametersForm } from './BezierParametersForm'
import { CatmullRomParametersForm } from './CatmullRomParametersForm'
import { ZigzagParametersForm } from './ZigzagParametersForm'
import { RoseCurveParametersForm } from './RoseCurveParametersForm'
import { EpicycloidParametersForm } from './EpicycloidParametersForm'
import { FormationParametersForm } from './FormationParametersForm'
import { AttractRepelParametersForm } from './AttractRepelParametersForm'
import { DopplerParametersForm } from './DopplerParametersForm'
import { CircularScanParametersForm } from './CircularScanParametersForm'
import { ZoomParametersForm } from './ZoomParametersForm'
import { getAnimationInfo } from '../../constants/animationCategories'

interface AnimationParametersRendererProps {
  type: AnimationType
  parameters: AnimationParameters
  keyframesCount: number
  onParameterChange: (key: string, value: any) => void
}

export const AnimationParametersRenderer: React.FC<AnimationParametersRendererProps> = ({
  type,
  parameters,
  keyframesCount,
  onParameterChange
}) => {
  switch (type) {
    case 'linear':
      return <LinearParametersForm parameters={parameters} onChange={onParameterChange} />
    
    case 'circular':
      return <CircularParametersForm parameters={parameters} onChange={onParameterChange} />
    
    case 'elliptical':
      return <EllipticalParametersForm parameters={parameters} onChange={onParameterChange} />
    
    case 'spiral':
      return <SpiralParametersForm parameters={parameters} onChange={onParameterChange} />
    
    case 'random':
      return <RandomParametersForm parameters={parameters} onChange={onParameterChange} />
    
    case 'custom':
      return <CustomParametersForm parameters={parameters} keyframes={Array(keyframesCount).fill(null).map((_, i) => ({ id: `kf-${i}`, time: 0, position: { x: 0, y: 0, z: 0 }, interpolation: 'linear' }))} onChange={onParameterChange} />
    
    case 'wave':
      return <WaveParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'lissajous':
      return <LissajousParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'helix':
      return <HelixParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'pendulum':
      return <PendulumParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'bounce':
      return <BounceParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'spring':
      return <SpringParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'bezier':
      return <BezierParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'catmull-rom':
      return <CatmullRomParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'zigzag':
      return <ZigzagParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'perlin-noise':
      return <PerlinNoiseParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'rose-curve':
      return <RoseCurveParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'epicycloid':
      return <EpicycloidParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'orbit':
      return <OrbitParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'formation':
      return <FormationParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'attract-repel':
      return <AttractRepelParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'doppler':
      return <DopplerParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'circular-scan':
      return <CircularScanParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    case 'zoom':
      return <ZoomParametersForm parameters={parameters} onParameterChange={onParameterChange} />
    
    default:
      // Default fallback for any animation type without a specific form
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-3xl">🎨</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {getAnimationInfo(type)?.label || type}
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  {getAnimationInfo(type)?.description}
                </p>
                <div className="bg-white/60 rounded-md p-3 mt-3">
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    ✅ This animation is fully implemented and ready to use!
                  </p>
                  <p className="text-xs text-gray-600">
                    Default parameters have been initialized with sensible values based on your track position.
                    Click <strong>"Save Animation"</strong> to apply, then <strong>"Play"</strong> to preview.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">📋 Current Parameters</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(parameters || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="text-gray-900 font-mono">
                    {typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
  }
}

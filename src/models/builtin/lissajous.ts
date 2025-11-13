import { AnimationModel, CalculationContext, Rotation } from '../types'
import { Position } from '@/types'
import { applyRotationToPath } from '@/utils/pathTransforms'

export function createLissajousModel(): AnimationModel {
  return {
    metadata: {
      name: 'Lissajous Curve',
      version: '2.0.0',
      author: 'System',
      description: 'Complex periodic patterns using Lissajous curves',
      category: 'wave',
      type: 'lissajous',
      tags: ['wave', 'periodic', 'lissajous'],
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center point of the Lissajous curve',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      frequencyRatioA: { type: 'number', default: 3, min: 1, max: 10, label: 'Frequency A' },
      frequencyRatioB: { type: 'number', default: 2, min: 1, max: 10, label: 'Frequency B' },
      phaseDifference: { type: 'number', default: 90, min: 0, max: 360, label: 'Phase Difference (deg)' },
      amplitudeX: { type: 'number', default: 5, min: 0, max: 20, label: 'Amplitude X' },
      amplitudeY: { type: 'number', default: 5, min: 0, max: 20, label: 'Amplitude Y' },
      amplitudeZ: { type: 'number', default: 2, min: 0, max: 20, label: 'Amplitude Z' },
      rotation: {
        type: 'rotation',
        default: { x: 0, y: 0, z: 0 },
        label: 'Rotation',
        description: 'Rotate the Lissajous curve in 3D space',
        group: 'Orientation',
        uiComponent: 'rotation3d',
      },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      const progress = duration > 0 ? time / duration : 0
      
      // Get center coordinates
      const center = params.center || { x: 0, y: 0, z: 0 }
      const rotation = params.rotation || { x: 0, y: 0, z: 0 }
      
      // Handle multi-track modes
      
      const freqA = params.frequencyRatioA ?? 3
      const freqB = params.frequencyRatioB ?? 2
      const phaseDiff = (params.phaseDifference ?? 90) * Math.PI / 180
      const ampX = params.amplitudeX ?? 5
      const ampY = params.amplitudeY ?? 5
      const ampZ = params.amplitudeZ ?? 2
      
      const angle = progress * Math.PI * 2
      
      // Calculate position
      const basePos: Position = {
        x: center.x + ampX * Math.sin(freqA * angle + phaseDiff),
        y: center.y + ampY * Math.sin(freqB * angle),
        z: center.z + ampZ * Math.sin((freqA + freqB) * angle * 0.5),
      }
      
      // Apply rotation if specified
      if (rotation.x !== 0 || rotation.y !== 0 || rotation.z !== 0) {
        const rotated = applyRotationToPath([basePos], center, rotation)
        return rotated[0]
      }
      
      return basePos
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        frequencyRatioA: 3,
        frequencyRatioB: 2,
        phaseDifference: 90,
        amplitudeX: 5,
        amplitudeY: 5,
        amplitudeZ: 2,
        rotation: { x: 0, y: 0, z: 0 },
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { 
          parameter: 'center', 
          type: 'center',
          enabledModes: ['translate', 'rotate']
        }
      ],
      generatePath: (controlPoints, params, segments = 200) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const ampX = params.amplitudeX || 5
        const ampY = params.amplitudeY || 5
        const ampZ = params.amplitudeZ || 2
        const freqX = params.frequencyRatioA || 3
        const freqY = params.frequencyRatioB || 2
        const phaseDiff = ((params.phaseDifference || 90) * Math.PI) / 180
        const points = []
        
        // Generate Lissajous curve matching calculate() logic
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2
          points.push({
            x: center.x + ampX * Math.sin(freqX * t + phaseDiff),
            y: center.y + ampY * Math.sin(freqY * t),
            z: center.z + ampZ * Math.sin((freqX + freqY) * t * 0.5)
          })
        }
        return points
      },
      pathStyle: { type: 'closed', segments: 200 },
      positionParameter: 'center',
      updateFromControlPoints: (controlPoints, params) => {
        if (controlPoints.length > 0) {
          return { ...params, center: controlPoints[0] }
        }
        return params
      }
    }
  }
}

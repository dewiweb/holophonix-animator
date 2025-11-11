import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

export function createLissajousModel(): AnimationModel {
  return {
    metadata: {
      name: 'Lissajous Curve',
      version: '1.0.0',
      author: 'System',
      description: 'Complex periodic patterns using Lissajous curves',
      category: 'wave',
      type: 'lissajous',
      tags: ['wave', 'periodic', 'lissajous'],
    },
    
    parameters: {
      centerX: { type: 'number', default: 0, min: -100, max: 100, label: 'Center X' },
      centerY: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Y' },
      centerZ: { type: 'number', default: 0, min: -100, max: 100, label: 'Center Z' },
      frequencyRatioA: { type: 'number', default: 3, min: 1, max: 10, label: 'Frequency A' },
      frequencyRatioB: { type: 'number', default: 2, min: 1, max: 10, label: 'Frequency B' },
      phaseDifference: { type: 'number', default: 90, min: 0, max: 360, label: 'Phase Difference (deg)' },
      amplitudeX: { type: 'number', default: 5, min: 0, max: 20, label: 'Amplitude X' },
      amplitudeY: { type: 'number', default: 5, min: 0, max: 20, label: 'Amplitude Y' },
      amplitudeZ: { type: 'number', default: 2, min: 0, max: 20, label: 'Amplitude Z' },
    },
    
    calculate(parameters, time, duration, context) {
      const params = parameters as any
      const progress = duration > 0 ? time / duration : 0
      
      // Get center coordinates - support both individual coords and center object
      let centerX = params.center?.x ?? params.centerX ?? 0
      let centerY = params.center?.y ?? params.centerY ?? 0
      let centerZ = params.center?.z ?? params.centerZ ?? 0
      
      // Handle multi-track modes
      const multiTrackMode = params._multiTrackMode || context?.multiTrackMode
      
      if (multiTrackMode === 'barycentric') {
        // STEP 1 (Model): Use barycenter as center of Lissajous curve
        // STEP 2 (Store): Will add _trackOffset
        const baryCenter = params._isobarycenter || params._customCenter
        if (baryCenter) {
          centerX = baryCenter.x
          centerY = baryCenter.y
          centerZ = baryCenter.z
        }
      } else if (multiTrackMode === 'relative' && context?.trackOffset) {
        // Relative mode: offset center by track position
        centerX += context.trackOffset.x
        centerY += context.trackOffset.y
        centerZ += context.trackOffset.z
      }
      
      const freqA = params.frequencyRatioA ?? 3
      const freqB = params.frequencyRatioB ?? 2
      const phaseDiff = (params.phaseDifference ?? 90) * Math.PI / 180
      const ampX = params.amplitudeX ?? 5
      const ampY = params.amplitudeY ?? 5
      const ampZ = params.amplitudeZ ?? 2
      
      const angle = progress * Math.PI * 2
      
      return {
        x: centerX + ampX * Math.sin(freqA * angle + phaseDiff),
        y: centerY + ampY * Math.sin(freqB * angle),
        z: centerZ + ampZ * Math.sin((freqA + freqB) * angle * 0.5),
      }
    },
    
    getDefaultParameters: function(trackPosition?: Position): Record<string, any> {
      return {
        center: { x: trackPosition?.x ?? 0, y: trackPosition?.y ?? 0, z: trackPosition?.z ?? 0 },
        centerX: trackPosition?.x ?? 0,
        centerY: trackPosition?.y ?? 0,
        centerZ: trackPosition?.z ?? 0,
        frequencyRatioA: 3,
        frequencyRatioB: 2,
        phaseDifference: 90,
        amplitudeX: 5,
        amplitudeY: 5,
        amplitudeZ: 2,
      }
    },
    
    supportedModes: ['relative', 'barycentric'],
    supportedBarycentricVariants: ['shared', 'isobarycentric', 'centered'],
    defaultMultiTrackMode: 'relative',
    
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ],
      generatePath: (controlPoints, params, segments = 200) => {
        if (controlPoints.length < 1) return []
        const center = controlPoints[0]
        const ampX = params.amplitudeX || 5
        const ampY = params.amplitudeY || 3
        const ampZ = params.amplitudeZ || 0
        const freqX = params.frequencyRatioA || 3
        const freqY = params.frequencyRatioB || 2
        const freqZ = 0
        const points = []
        
        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2
          points.push({
            x: center.x + Math.sin(t * freqX) * ampX,
            y: center.y + Math.sin(t * freqY) * ampY,
            z: center.z + Math.sin(t * freqZ) * ampZ
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

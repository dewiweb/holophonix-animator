import * as THREE from 'three'
import type { Animation } from '@/types'
import { modelRegistry } from '@/models/registry'
import { appToThreePosition } from './coordinateConversion'
import { applyRotationToPath } from '@/utils/pathTransforms'
import type { Rotation } from '@/models/types'

/**
 * Generate path visualization for different animation types
 * Uses model generatePath - all models have this defined
 */
export const generateAnimationPath = (
  animation: Animation | null,
  controlPoints: THREE.Vector3[]
): THREE.Vector3[] => {
  if (!animation || controlPoints.length === 0) {
    return []
  }

  const params = animation.parameters as any
  
  const model = modelRegistry.getModel(animation.type)
  if (model?.visualization?.generatePath) {
    try {
      const appControlPoints = controlPoints.map(threePos => ({
        x: threePos.x,
        y: -threePos.z,
        z: threePos.y
      }))
      
      const segments = model.visualization.pathStyle?.segments ?? 64
      // Pass animation duration as part of params so path preview matches playback
      const paramsWithDuration = { ...params, _animationDuration: animation.duration }
      let generatedPoints = model.visualization.generatePath(appControlPoints, paramsWithDuration, segments)
      
      if (generatedPoints && generatedPoints.length > 0) {
        // Apply rotation if rotation parameter exists (generic transform)
        const rotation = params.rotation as Rotation | undefined
        if (rotation && appControlPoints.length > 0) {
          // Use first control point as rotation center
          const rotationCenter = appControlPoints[0]
          generatedPoints = applyRotationToPath(generatedPoints, rotationCenter, rotation)
        }
        
        const threePoints = generatedPoints.map(p => appToThreePosition(p))
        return threePoints
      }
    } catch (error) {
      console.warn('Model path generation failed:', error)
    }
  }
  
  console.warn('No path generator for type:', animation.type)
  return []
}

import * as THREE from 'three'
import type { Animation } from '@/types'
import { modelRegistry } from '@/models/registry'
import { appToThreePosition } from './coordinateConversion'

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
      const generatedPoints = model.visualization.generatePath(appControlPoints, params, segments)
      
      if (generatedPoints && generatedPoints.length > 0) {
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

import * as THREE from 'three'
import type { Animation, Position } from '@/types'
import { appToThreePosition, threeToAppPosition } from './coordinateConversion'
import { modelRegistry } from '@/models/registry'

/**
 * Helper to convert Position to THREE.Vector3 with coordinate system conversion
 * App uses Z-up (spatial audio), Three.js uses Y-up (graphics)
 */
export const positionToVector3 = (pos: Position): THREE.Vector3 => {
  return appToThreePosition(pos)
}

/**
 * Extract control points from animation parameters for visualization
 * Uses model visualization config
 */
export function extractControlPointsFromAnimation(animation: Animation | null): THREE.Vector3[] {
  if (!animation || !animation.parameters) {
    return []
  }
  
  const points: THREE.Vector3[] = []
  const params = animation.parameters as any
  
  console.log('🔍 extractControlPoints - params:', {
    type: animation.type,
    hasIsobarycenter: !!params._isobarycenter,
    isobarycenter: params._isobarycenter,
    hasTrackOffset: !!params._trackOffset,
    trackOffset: params._trackOffset
  })
  
  const model = modelRegistry.getModel(animation.type)
  if (model?.visualization?.controlPoints) {
    for (const cpConfig of model.visualization.controlPoints) {
      const paramValue = params[cpConfig.parameter]
      let positions: Position[] = []
      
      if (paramValue) {
        // Check if it's an array of positions (e.g., Catmull-Rom controlPoints)
        if (Array.isArray(paramValue)) {
          // Extract all positions from the array
          positions = paramValue.filter(p => 
            typeof p === 'object' && 'x' in p && 'y' in p && 'z' in p
          )
        }
        // Single position object
        else if (typeof paramValue === 'object' && 'x' in paramValue && 'y' in paramValue && 'z' in paramValue) {
          positions = [paramValue as Position]
        }
      } else {
        // Try split X/Y/Z parameters (legacy support)
        const baseParam = cpConfig.parameter.replace(/(X|Y|Z)$/, '')
        const x = params[`${baseParam}X`]
        const y = params[`${baseParam}Y`]
        const z = params[`${baseParam}Z`]
        if (x !== undefined && y !== undefined && z !== undefined) {
          positions = [{ x, y, z }]
        }
      }
      
      // Process each position (could be multiple for array parameters)
      for (let position of positions) {
        const originalPosition = { ...position }
        
        // Apply barycentric center offset (for any barycentric variant)
        // In editor, check for _isobarycenter OR _customCenter
        const barycenterOffset = params._isobarycenter || params._customCenter
        
        if (barycenterOffset) {
          position = {
            x: position.x + barycenterOffset.x,
            y: position.y + barycenterOffset.y,
            z: position.z + barycenterOffset.z
          }
          console.log('🎯 Applied barycenter offset:', {
            parameter: cpConfig.parameter,
            originalPosition,
            barycenter: barycenterOffset,
            type: params._isobarycenter ? 'auto' : 'custom',
            finalPosition: position
          })
        } else if (params._trackOffset) {
          console.warn('⚠️ _trackOffset should not be present in editor! This is for playback only:', {
            parameter: cpConfig.parameter,
            trackOffset: params._trackOffset,
            originalPosition
          })
          position = {
            x: position.x + params._trackOffset.x,
            y: position.y + params._trackOffset.y,
            z: position.z + params._trackOffset.z
          }
        }
        points.push(positionToVector3(position))
      }
    }
  }
  
  return points
}

/**
 * Convert control points back to animation parameters
 * Used when user edits control points via gizmo
 * Converts from Three.js coordinates back to app coordinates
 * CRITICAL: Must subtract barycentric offset since visual positions include it
 */
export const controlPointsToParameters = (
  animationType: string,
  points: THREE.Vector3[],
  originalParams: any
): any => {
  // Convert Three.js Vector3 back to app Position (with coordinate conversion)
  const vector3ToPosition = (vec: THREE.Vector3): Position => {
    return threeToAppPosition(vec)
  }
  
  // Convert points to app coordinates
  let appPoints = points.map(vector3ToPosition)
  
  // CRITICAL: If barycentric mode, subtract the center offset
  // because extractControlPoints ADDS it, we must SUBTRACT it when saving
  const barycenterOffset = originalParams._isobarycenter || originalParams._customCenter
  
  if (barycenterOffset) {
    console.log('🔄 Subtracting barycentric offset from control points:', barycenterOffset)
    appPoints = appPoints.map(point => ({
      x: point.x - barycenterOffset.x,
      y: point.y - barycenterOffset.y,
      z: point.z - barycenterOffset.z
    }))
  }
  
  // Use model's updateFromControlPoints method
  const model = modelRegistry.getModel(animationType)
  if (model?.visualization?.updateFromControlPoints) {
    return model.visualization.updateFromControlPoints(appPoints, originalParams)
  }
  
  // No updateFromControlPoints method
  console.warn(`No updateFromControlPoints for ${animationType}`)
  return originalParams
}

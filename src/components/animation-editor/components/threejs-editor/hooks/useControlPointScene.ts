import { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { ControlPoint3D, ControlPointSceneState } from '../types'
import { extractControlPointsFromAnimation } from '../utils/extractControlPoints'
import { generateAnimationPath } from '../utils/generateAnimationPath'

/**
 * Hook to manage the Three.js scene with control points and curve
 * SIMPLE ARCHITECTURE: Control points are derived from animation.parameters
 * React handles caching and re-rendering automatically
 */
export const useControlPointScene = (
  animation: any | null,
  forceUpdateTrigger?: any
): ControlPointSceneState => {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const curveRef = useRef<THREE.Line | null>(null)
  const meshesRef = useRef<THREE.Mesh[]>([]) // Track meshes for proper cleanup
  const [controlPoints, setControlPoints] = useState<ControlPoint3D[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // ========================================
  // STEP 1: Derive control points from animation (cached by React)
  // ========================================
  // Serialize parameters to detect deep changes
  const paramsKey = animation?.parameters ? JSON.stringify(animation.parameters) : ''
  
  const controlPointPositions = useMemo(() => {
    console.log('🔍 Computing control points from animation:', {
      type: animation?.type,
      hasParams: !!animation?.parameters,
      animationId: animation?.id,
      paramsKey: paramsKey.substring(0, 50) + '...',
      forceUpdateTrigger
    })
    const points = extractControlPointsFromAnimation(animation)
    console.log('✅ Control points computed:', points.length)
    
    return points
  }, [animation?.id, animation?.type, paramsKey, forceUpdateTrigger])

  // ========================================
  // STEP 2: Initialize scene once
  // ========================================
  useEffect(() => {
    console.log('🎬 Initializing Three.js scene')
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a) // Dark grey instead of black

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x555555, 0x333333)
    scene.add(gridHelper)

    // Add axes (X=red, Y=green, Z=blue)
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Enhanced lighting for better UI visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6)
    dirLight1.position.set(5, 10, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
    dirLight2.position.set(-5, 5, -5)
    scene.add(dirLight2)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.5)
    scene.add(hemiLight)

    sceneRef.current = scene
    console.log('✅ Scene initialized')

    return () => {
      console.log('🧹 Cleaning up scene')
      scene.clear()
      sceneRef.current = null
    }
  }, [])

  // ========================================
  // STEP 3: Update meshes and control points when positions change  
  // ========================================
  useEffect(() => {
    if (!sceneRef.current) return

    // Check if we can update in place (same number of points AND meshes exist)
    const canUpdateInPlace = meshesRef.current.length > 0 && 
                              meshesRef.current.length === controlPointPositions.length

    if (canUpdateInPlace) {
      console.log('✨ Updating control point positions in place:', controlPointPositions.length)
      
      // Update existing meshes in place (don't recreate!)
      const updatedControlPoints: ControlPoint3D[] = controlPointPositions.map((position, index) => {
        const mesh = meshesRef.current[index]
        const isSelected = index === selectedIndex
        
        // Update mesh position
        mesh.position.copy(position)
        
        // Update color
        let color: number
        if (isSelected) {
          color = 0xffff00
        } else if (index === 0) {
          color = 0x00ff00
        } else {
          color = 0x4a9eff
        }
        (mesh.material as THREE.MeshBasicMaterial).color.setHex(color)
        
        return {
          id: `cp-${index}`,
          index,
          position: position.clone(),
          mesh,
          isSelected,
        }
      })
      
      // Also regenerate curve/path when updating in place
      const pathPoints = generateAnimationPath(animation, controlPointPositions)
      
      if (pathPoints.length >= 2) {
        // Remove old curve
        if (curveRef.current) {
          sceneRef.current.remove(curveRef.current)
          curveRef.current.geometry.dispose()
          ;(curveRef.current.material as THREE.Material).dispose()
        }
        
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints)
        const colors = new Float32Array(pathPoints.length * 3)
        for (let i = 0; i < pathPoints.length; i++) {
          const t = i / (pathPoints.length - 1)
          const color = new THREE.Color()
          color.setHSL(0.3 - t * 0.3, 1.0, 0.5)
          colors[i * 3] = color.r
          colors[i * 3 + 1] = color.g
          colors[i * 3 + 2] = color.b
        }
        curveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        
        const curveMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          linewidth: 2,
          depthTest: false,
          depthWrite: false,
        })
        
        const curveLine = new THREE.Line(curveGeometry, curveMaterial)
        curveLine.renderOrder = 998
        sceneRef.current.add(curveLine)
        curveRef.current = curveLine
      }
      
      setControlPoints(updatedControlPoints)
      console.log('✅ Control points updated in place:', updatedControlPoints.length)
      return
    }

    // Full recreation (only when point count changes)
    console.log('🔄 Recreating control point meshes:', controlPointPositions.length, '(cleaning up', meshesRef.current.length, 'old meshes)')

    // Remove old meshes
    meshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      mesh.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          ;(child.material as THREE.Material).dispose()
        }
      })
    })
    meshesRef.current = []

    // Remove old curve
    if (curveRef.current) {
      sceneRef.current.remove(curveRef.current)
      curveRef.current.geometry.dispose()
      ;(curveRef.current.material as THREE.Material).dispose()
      curveRef.current = null
    }

    // Create new control points
    const newControlPoints: ControlPoint3D[] = controlPointPositions.map((position, index) => {
      // Determine color
      const isSelected = index === selectedIndex
      let color: number
      if (isSelected) {
        color = 0xffff00 // Yellow for selected
      } else if (index === 0) {
        color = 0x00ff00 // Green for start
      } else {
        color = 0x4a9eff // Blue for others
      }

      // Create sphere
      const geometry = new THREE.SphereGeometry(0.2, 16, 16)
      const material = new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      mesh.userData.index = index
      mesh.renderOrder = 999

      // Add outline if selected
      if (isSelected) {
        const outlineGeometry = new THREE.SphereGeometry(0.22, 16, 16)
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.3,
          depthTest: false,
        })
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
        mesh.add(outline)
      }

      sceneRef.current!.add(mesh)
      meshesRef.current.push(mesh) // Track for cleanup

      return {
        id: `cp-${index}`,
        index,
        position: position.clone(),
        mesh,
        isSelected,
      }
    })

    // Generate animation-specific path visualization
    const pathPoints = generateAnimationPath(animation, controlPointPositions)
    
    if (pathPoints.length >= 2) {
      const curveGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints)

      // Add gradient color
      const colors = new Float32Array(pathPoints.length * 3)
      for (let i = 0; i < pathPoints.length; i++) {
        const t = i / (pathPoints.length - 1)
        const color = new THREE.Color()
        color.setHSL(0.3 - t * 0.3, 1.0, 0.5) // Green to red
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }
      curveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const curveMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        linewidth: 2,
      })

      const curve = new THREE.Line(curveGeometry, curveMaterial)
      sceneRef.current.add(curve)
      curveRef.current = curve
      
      console.log('✅ Path generated:', pathPoints.length, 'points for type:', animation?.type)
    } else {
      console.log('⚠️ No path generated for type:', animation?.type, '(need 2+ points)')
    }

    setControlPoints(newControlPoints)
    console.log('✅ Control points updated:', newControlPoints.length)
  }, [controlPointPositions, selectedIndex])

  // ========================================
  // STEP 4: Provide updateControlPoint to modify points
  // ========================================
  const updateControlPoint = useCallback((index: number, position: THREE.Vector3) => {
    setControlPoints(prevPoints => {
      const newPoints = [...prevPoints]
      if (newPoints[index]) {
        // Update position
        newPoints[index] = {
          ...newPoints[index],
          position: position.clone(),
        }
        // Also update mesh position immediately
        if (newPoints[index].mesh) {
          newPoints[index].mesh.position.copy(position)
        }
      }
      return newPoints
    })
  }, [])

  const selectControlPoint = useCallback((index: number | null) => {
    setSelectedIndex(index)
  }, [])

  const getSelectedPoint = useCallback(() => {
    if (selectedIndex === null) return null
    return controlPoints[selectedIndex] || null
  }, [selectedIndex, controlPoints])

  // Dummy functions for compatibility (not needed in simple architecture)
  const addControlPoint = useCallback(() => {
    console.warn('addControlPoint not implemented in simple architecture')
  }, [])

  const removeControlPoint = useCallback(() => {
    console.warn('removeControlPoint not implemented in simple architecture')
  }, [])

  return {
    scene: sceneRef.current,
    controlPoints,
    curve: curveRef.current,
    selectedIndex,
    updateControlPoint,
    addControlPoint,
    removeControlPoint,
    selectControlPoint,
    getSelectedPoint,
  }
}

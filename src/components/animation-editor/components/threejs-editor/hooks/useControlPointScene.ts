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
    scene.background = new THREE.Color(0x1a1a1a)

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Add axes (X=red, Y=green, Z=blue)
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight1.position.set(5, 10, 5)
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    dirLight2.position.set(-5, 5, -5)
    scene.add(dirLight2)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4)
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

    console.log('🔄 Updating control point meshes:', controlPointPositions.length, '(cleaning up', meshesRef.current.length, 'old meshes)')

    // Remove old meshes (from ref, not state!)
    meshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      // Also dispose children (outlines)
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
  // Helper functions
  // ========================================
  const updateControlPoint = useCallback((index: number, position: THREE.Vector3) => {
    setControlPoints(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index].position.copy(position)
        updated[index].mesh.position.copy(position)
      }
      return updated
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
    updateControlPoint,
    addControlPoint,
    removeControlPoint,
    selectControlPoint,
    getSelectedPoint,
  }
}

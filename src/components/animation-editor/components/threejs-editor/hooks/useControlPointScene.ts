import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import type { ControlPoint3D, ControlPointSceneState } from '../types'

/**
 * Hook to manage the Three.js scene with control points and curve
 */
export const useControlPointScene = (
  animation: any | null
): ControlPointSceneState => {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const [controlPoints, setControlPoints] = useState<ControlPoint3D[]>([])
  const [curve, setCurve] = useState<THREE.Line | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // Initialize scene
  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a1a)

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Add axes helper (X=red, Y=green, Z=blue)
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
    dirLight.position.set(5, 10, 5)
    scene.add(dirLight)

    sceneRef.current = scene

    return () => {
      // Cleanup
      scene.clear()
      sceneRef.current = null
    }
  }, [])

  // Create control point mesh
  const createControlPointMesh = useCallback(
    (position: THREE.Vector3, index: number, isSelected: boolean) => {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16)
      
      // Color based on index and selection state
      let color: number
      if (isSelected) {
        color = 0xffff00 // Yellow for selected
      } else if (index === 0) {
        color = 0x00ff00 // Green for start
      } else {
        color = 0x4a9eff // Blue for regular points
      }

      const material = new THREE.MeshBasicMaterial({
        color,
        depthTest: false, // Always render on top
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      mesh.userData.index = index
      mesh.renderOrder = 999 // Render last (on top)

      // Add hover effect with outline
      const outlineGeometry = new THREE.SphereGeometry(0.22, 16, 16)
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3,
        depthTest: false,
      })
      const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
      outline.visible = isSelected
      outline.userData.isOutline = true
      mesh.add(outline)

      return mesh
    },
    []
  )

  // Update curve visualization
  const updateCurve = useCallback(
    (points: ControlPoint3D[]) => {
      if (!sceneRef.current) return

      // Remove old curve using state setter callback to get current value
      setCurve((prevCurve) => {
        if (prevCurve) {
          sceneRef.current?.remove(prevCurve)
          prevCurve.geometry.dispose()
          ;(prevCurve.material as THREE.Material).dispose()
        }

        if (points.length < 2) {
          return null
        }

        // Create Catmull-Rom curve through points
        const curvePoints = points.map((p) => p.position.clone())
        const curve3D = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5)

        // Generate points along curve
        const curveSegments = Math.max(50, points.length * 20)
        const curveGeometry = new THREE.BufferGeometry().setFromPoints(
          curve3D.getPoints(curveSegments)
        )

        // Create gradient material (start=green, end=red)
        const colors = new Float32Array(curveSegments * 3)
        for (let i = 0; i <= curveSegments; i++) {
          const t = i / curveSegments
          const color = new THREE.Color()
          color.setHSL(0.3 - t * 0.3, 1.0, 0.5) // Green to red gradient
          colors[i * 3] = color.r
          colors[i * 3 + 1] = color.g
          colors[i * 3 + 2] = color.b
        }
        curveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const curveMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          linewidth: 2,
        })

        const newCurve = new THREE.Line(curveGeometry, curveMaterial)
        sceneRef.current?.add(newCurve)
        return newCurve
      })
    },
    [] // Remove curve dependency to break infinite loop
  )

  // Load control points from animation
  useEffect(() => {
    if (!animation || !sceneRef.current) return

    // Clear existing control points
    controlPoints.forEach((point) => {
      sceneRef.current?.remove(point.mesh)
      point.mesh.geometry.dispose()
      ;(point.mesh.material as THREE.Material).dispose()
    })

    // Extract control points from animation
    // TODO: Adapt to actual animation data structure
    const animationPoints: THREE.Vector3[] = []
    
    if (animation.controlPoints) {
      // V3 format (already 3D)
      animationPoints.push(...animation.controlPoints)
    } else if (animation.keyframes) {
      // Extract from keyframes
      animation.keyframes.forEach((kf: any) => {
        animationPoints.push(
          new THREE.Vector3(
            kf.position?.x ?? 0,
            kf.position?.y ?? 0,
            kf.position?.z ?? 0
          )
        )
      })
    }

    // Create control point objects
    const newPoints: ControlPoint3D[] = animationPoints.map((pos, index) => {
      const mesh = createControlPointMesh(pos.clone(), index, false)
      sceneRef.current!.add(mesh)

      return {
        id: `cp-${index}-${Date.now()}`,
        index,
        position: pos.clone(),
        mesh,
        isSelected: false,
      }
    })

    setControlPoints(newPoints)
    updateCurve(newPoints)
  }, [animation, createControlPointMesh, updateCurve])

  // Update control point position
  const updateControlPoint = useCallback(
    (index: number, position: THREE.Vector3) => {
      setControlPoints((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index].position.copy(position)
          updated[index].mesh.position.copy(position)
          updateCurve(updated)
        }
        return updated
      })
    },
    [updateCurve]
  )

  // Add new control point
  const addControlPoint = useCallback(
    (position: THREE.Vector3, insertIndex?: number) => {
      if (!sceneRef.current) return

      const index = insertIndex ?? controlPoints.length
      const mesh = createControlPointMesh(position, index, false)
      sceneRef.current.add(mesh)

      const newPoint: ControlPoint3D = {
        id: `cp-${index}-${Date.now()}`,
        index,
        position: position.clone(),
        mesh,
        isSelected: false,
      }

      setControlPoints((prev) => {
        const updated = [...prev]
        updated.splice(index, 0, newPoint)
        
        // Re-index all points after insertion
        updated.forEach((p, i) => {
          p.index = i
          p.mesh.userData.index = i
        })
        
        updateCurve(updated)
        return updated
      })
    },
    [controlPoints.length, createControlPointMesh, updateCurve]
  )

  // Remove control point
  const removeControlPoint = useCallback(
    (index: number) => {
      if (!sceneRef.current) return

      setControlPoints((prev) => {
        const updated = [...prev]
        const removed = updated[index]
        
        if (removed) {
          sceneRef.current!.remove(removed.mesh)
          removed.mesh.geometry.dispose()
          ;(removed.mesh.material as THREE.Material).dispose()
          
          updated.splice(index, 1)
          
          // Re-index remaining points
          updated.forEach((p, i) => {
            p.index = i
            p.mesh.userData.index = i
          })
          
          updateCurve(updated)
        }
        
        return updated
      })
    },
    [updateCurve]
  )

  // Select control point
  const selectControlPoint = useCallback((index: number | null) => {
    setSelectedIndex(index)
    
    setControlPoints((prev) => {
      const updated = prev.map((point) => {
        const isSelected = point.index === index
        point.isSelected = isSelected
        
        // Update mesh color
        const material = point.mesh.material as THREE.MeshBasicMaterial
        if (isSelected) {
          material.color.set(0xffff00) // Yellow
        } else if (point.index === 0) {
          material.color.set(0x00ff00) // Green
        } else {
          material.color.set(0x4a9eff) // Blue
        }
        
        // Show/hide outline
        const outline = point.mesh.children.find((child) => child.userData.isOutline)
        if (outline) {
          outline.visible = isSelected
        }
        
        return point
      })
      
      return updated
    })
  }, [])

  // Get selected point
  const getSelectedPoint = useCallback(() => {
    return controlPoints.find((p) => p.isSelected) ?? null
  }, [controlPoints])

  return {
    scene: sceneRef.current,
    controlPoints,
    curve,
    updateControlPoint,
    addControlPoint,
    removeControlPoint,
    selectControlPoint,
    getSelectedPoint,
  }
}

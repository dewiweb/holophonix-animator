import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Track } from '@/types'
import { appToThreePosition } from '../utils/coordinateConversion'

interface UseTrackVisualizationProps {
  scene: THREE.Scene | null
  tracks: Track[]
  showTracks: boolean
}

/**
 * Hook to visualize tracks in preview mode
 * Renders tracks as colored spheres at their positions
 */
export const useTrackVisualization = ({
  scene,
  tracks,
  showTracks,
}: UseTrackVisualizationProps) => {
  const trackMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())

  // Update track visualizations
  useEffect(() => {
    if (!scene || !showTracks) {
      // Remove all track meshes when not showing
      trackMeshesRef.current.forEach((mesh) => {
        scene?.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      })
      trackMeshesRef.current.clear()
      return
    }

    // Create/update track meshes
    const existingIds = new Set<string>()

    tracks.forEach((track) => {
      existingIds.add(track.id)
      
      let mesh = trackMeshesRef.current.get(track.id)
      
      if (!mesh) {
        // Create new mesh for this track
        const geometry = new THREE.SphereGeometry(0.3, 32, 32)
        const color = track.color
          ? new THREE.Color(track.color.r, track.color.g, track.color.b)
          : new THREE.Color(0x00aaff)
        
        const material = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.3,
          roughness: 0.5,
          metalness: 0.1,
        })

        mesh = new THREE.Mesh(geometry, material)
        
        // Add label
        const sprite = createTextSprite(track.name)
        sprite.position.set(0, 0.5, 0)
        mesh.add(sprite)
        
        scene.add(mesh)
        trackMeshesRef.current.set(track.id, mesh)
      }

      // Update position (convert from app coordinates to Three.js coordinates)
      const threePos = appToThreePosition(track.position)
      mesh.position.copy(threePos)
      
      // Update color if changed
      const material = mesh.material as THREE.MeshStandardMaterial
      if (track.color) {
        const newColor = new THREE.Color(track.color.r, track.color.g, track.color.b)
        material.color.copy(newColor)
        material.emissive.copy(newColor)
      }
    })

    // Remove meshes for tracks that no longer exist
    trackMeshesRef.current.forEach((mesh, id) => {
      if (!existingIds.has(id)) {
        scene.remove(mesh)
        mesh.geometry.dispose()
        const material = mesh.material as THREE.MeshStandardMaterial
        material.dispose()
        // Cleanup label sprite textures
        mesh.children.forEach(child => {
          if (child.userData.texture) {
            child.userData.texture.dispose()
          }
          if (child instanceof THREE.Sprite && child.material.map) {
            child.material.map.dispose()
            child.material.dispose()
          }
        })
        trackMeshesRef.current.delete(id)
      }
    })

    return () => {
      // Cleanup on unmount
      trackMeshesRef.current.forEach((mesh) => {
        scene?.remove(mesh)
        mesh.geometry.dispose()
        const material = mesh.material as THREE.Material
        material.dispose()
        // Cleanup label sprite textures
        mesh.children.forEach(child => {
          if (child.userData.texture) {
            child.userData.texture.dispose()
          }
          if (child instanceof THREE.Sprite && child.material.map) {
            child.material.map.dispose()
            child.material.dispose()
          }
        })
      })
      trackMeshesRef.current.clear()
    }
  }, [scene, tracks, showTracks])

  return {}
}

/**
 * Create a text sprite for track labels
 */
function createTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  
  canvas.width = 256
  canvas.height = 64
  
  context.font = 'Bold 28px Arial'
  context.fillStyle = 'rgba(255, 255, 255, 1)'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 128, 32)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  // Don't set flipY for canvas textures as they're already in the correct orientation
  
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(2, 0.5, 1)
  
  // Store texture reference for cleanup
  sprite.userData.texture = texture
  
  return sprite
}

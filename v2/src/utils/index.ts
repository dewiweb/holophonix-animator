import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Math utilities for 3D coordinate transformations
export const mathUtils = {
  // Convert XYZ to AED (Azimuth, Elevation, Distance)
  xyzToAED: (position: { x: number; y: number; z: number }) => {
    const { x, y, z } = position
    const distance = Math.sqrt(x * x + y * y + z * z)
    const azimuth = Math.atan2(y, x) * (180 / Math.PI)
    const elevation = Math.asin(z / distance) * (180 / Math.PI)

    return { azimuth, elevation, distance }
  },

  // Convert AED to XYZ
  aedToXYZ: (aed: { azimuth: number; elevation: number; distance: number }) => {
    const { azimuth, elevation, distance } = aed
    const azimuthRad = azimuth * (Math.PI / 180)
    const elevationRad = elevation * (Math.PI / 180)

    const x = distance * Math.cos(elevationRad) * Math.cos(azimuthRad)
    const y = distance * Math.cos(elevationRad) * Math.sin(azimuthRad)
    const z = distance * Math.sin(elevationRad)

    return { x, y, z }
  },

  // Interpolate between two positions
  lerpPosition: (
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    t: number
  ) => {
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      z: start.z + (end.z - start.z) * t,
    }
  },

  // Calculate distance between two positions
  distance: (
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number }
  ) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  },

  // Clamp value between min and max
  clamp: (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max)
  },
}

// Animation utilities
export const animationUtils = {
  // Linear interpolation for animation values
  lerp: (start: number, end: number, t: number) => {
    return start + (end - start) * t
  },

  // Clamp value between min and max
  clamp: (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max)
  },

  // Convert time to progress (0-1)
  timeToProgress: (currentTime: number, duration: number) => {
    return mathUtils.clamp(currentTime / duration, 0, 1)
  },

  // Generate circular motion position
  circularPosition: (
    center: { x: number; y: number; z: number },
    radius: number,
    angle: number, // in radians
    plane: 'xy' | 'xz' | 'yz'
  ) => {
    switch (plane) {
      case 'xy':
        return {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
          z: center.z,
        }
      case 'xz':
        return {
          x: center.x + radius * Math.cos(angle),
          y: center.y,
          z: center.z + radius * Math.sin(angle),
        }
      case 'yz':
        return {
          x: center.x,
          y: center.y + radius * Math.cos(angle),
          z: center.z + radius * Math.sin(angle),
        }
    }
  },
}

// OSC message utilities
export const oscUtils = {
  // Create OSC message for track position
  createPositionMessage: (
    trackId: string,
    position: { x: number; y: number; z: number }
  ) => ({
    address: `/track/${trackId}/position`,
    args: [position.x, position.y, position.z],
  }),

  // Create OSC message for track mute
  createMuteMessage: (trackId: string, muted: boolean) => ({
    address: `/track/${trackId}/mute`,
    args: [muted ? 1 : 0],
  }),

  // Create OSC message for track volume
  createVolumeMessage: (trackId: string, volume: number) => ({
    address: `/track/${trackId}/volume`,
    args: [volume],
  }),
}

// UUID generator polyfill for environments that don't support crypto.randomUUID
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback UUID generator for older environments
  return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
export const storageUtils = {
  // Save project to localStorage
  saveProject: (projectId: string, data: any) => {
    try {
      localStorage.setItem(`holophonix-project-${projectId}`, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Failed to save project:', error)
      return false
    }
  },

  // Load project from localStorage
  loadProject: (projectId: string) => {
    try {
      const data = localStorage.getItem(`holophonix-project-${projectId}`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  },

  // List all saved projects
  listProjects: () => {
    try {
      const projects = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('holophonix-project-')) {
          const projectId = key.replace('holophonix-project-', '')
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          projects.push({
            id: projectId,
            name: data.name || 'Untitled Project',
            modified: data.metadata?.modified || new Date().toISOString(),
          })
        }
      }
      return projects.sort((a, b) =>
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      )
    } catch (error) {
      console.error('Failed to list projects:', error)
      return []
    }
  },
}

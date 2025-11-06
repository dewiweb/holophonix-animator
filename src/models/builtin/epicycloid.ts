import { AnimationModel, CalculationContext } from '../types'
import { Position } from '@/types'

/**
 * Create the epicycloid animation model
 */
export function createEpicycloidModel(): AnimationModel {
  return {
    metadata: {
      type: 'epicycloid',
      name: 'Epicycloid',
      version: '1.0.0',
      category: 'builtin',
      description: 'Path traced by a point on a circle rolling around another circle',
      tags: ['mathematical', 'rolling', 'circle', 'curve'],
      icon: 'Circle',
    },
    
    parameters: {
      center: {
        type: 'position',
        default: { x: 0, y: 0, z: 0 },
        label: 'Center',
        description: 'Center of the fixed circle',
        group: 'Position',
        order: 1,
        uiComponent: 'position3d',
      },
      fixedRadius: {
        type: 'number',
        default: 3,
        label: 'Fixed Circle Radius',
        description: 'Radius of the stationary circle',
        group: 'Shape',
        order: 1,
        min: 0.1,
        max: 20,
        uiComponent: 'slider',
      },
      rollingRadius: {
        type: 'number',
        default: 1,
        label: 'Rolling Circle Radius',
        description: 'Radius of the rolling circle',
        group: 'Shape',
        order: 2,
        min: 0.1,
        max: 10,
        uiComponent: 'slider',
      },
      speed: {
        type: 'number',
        default: 1,
        label: 'Speed',
        description: 'Rolling speed multiplier',
        group: 'Motion',
        order: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        uiComponent: 'slider',
      },
      type: {
        type: 'enum',
        default: 'epicycloid',
        label: 'Type',
        description: 'Epicycloid (outside) or Hypocycloid (inside)',
        group: 'Motion',
        order: 2,
        options: ['epicycloid', 'hypocycloid'],
        uiComponent: 'select',
      },
      plane: {
        type: 'enum',
        default: 'xy',
        label: 'Plane',
        description: 'Plane for the curve',
        group: 'Orientation',
        order: 1,
        options: ['xy', 'xz', 'yz'],
        uiComponent: 'select',
      },
    },
    
    supportedModes: ['identical', 'position-relative', 'phase-offset', 'centered'],
    defaultMultiTrackMode: 'identical',
    
    performance: {
      complexity: 'constant',
      stateful: false,
      gpuAccelerated: false,
    },
    
    calculate: function(
      parameters: Record<string, any>,
      time: number,
      duration: number,
      context: CalculationContext
    ): Position {
      const progress = Math.min(time / duration, 1)
      
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const R = parameters.fixedRadius || 3
      const r = parameters.rollingRadius || 1
      const speed = parameters.speed || 1
      const type = parameters.type || 'epicycloid'
      const plane = parameters.plane || 'xy'
      
      const theta = progress * 2 * Math.PI * speed
      
      let x: number, y: number
      
      if (type === 'epicycloid') {
        // Epicycloid: point on circle rolling outside
        x = (R + r) * Math.cos(theta) - r * Math.cos(((R + r) / r) * theta)
        y = (R + r) * Math.sin(theta) - r * Math.sin(((R + r) / r) * theta)
      } else {
        // Hypocycloid: point on circle rolling inside
        x = (R - r) * Math.cos(theta) + r * Math.cos(((R - r) / r) * theta)
        y = (R - r) * Math.sin(theta) - r * Math.sin(((R - r) / r) * theta)
      }
      
      // Apply to correct plane
      let position: Position
      if (plane === 'xy') {
        position = { x: center.x + x, y: center.y + y, z: center.z }
      } else if (plane === 'xz') {
        position = { x: center.x + x, y: center.y, z: center.z + y }
      } else { // yz
        position = { x: center.x, y: center.y + x, z: center.z + y }
      }
      
      return position
    },
    
    getDefaultParameters: function(trackPosition: Position): Record<string, any> {
      return {
        center: { ...trackPosition },
        fixedRadius: 3,
        rollingRadius: 1,
        speed: 1,
        type: 'epicycloid',
        plane: 'xy',
      }
    },
  }
}

import { AnimationModel } from '../types'

// Basic animations
import { createLinearModel } from './linear'
import { createCircularModel } from './circular'
import { createEllipticalModel } from './elliptical'
import { createSpiralModel } from './spiral'
import { createRandomModel } from './random'

// Physics-based
import { createPendulumModel } from './pendulum'
import { createBounceModel } from './bounce'
import { createSpringModel } from './spring'

// Wave-based
import { createWaveModel } from './wave'
import { createLissajousModel } from './lissajous'
import { createHelixModel } from './helix'

// Curve & path-based
import { createBezierModel } from './bezier'
import { createCatmullRomModel } from './catmullRom'
import { createZigzagModel } from './zigzag'

// Procedural
import { createPerlinNoiseModel } from './perlinNoise'
import { createRoseCurveModel } from './roseCurve'
import { createEpicycloidModel } from './epicycloid'

// Multi-object & interactive
import { createOrbitModel } from './orbit'
import { createFormationModel } from './formation'
import { createAttractRepelModel } from './attractRepel'

// Spatial audio
import { createDopplerModel } from './doppler'
import { createCircularScanModel } from './circularScan'
import { createZoomModel } from './zoom'

/**
 * Create all built-in animation models
 * Total: 24 models across 6 categories
 */
export function createBuiltinModels(): AnimationModel[] {
  return [
    // Basic animations (5)
    createLinearModel(),
    createCircularModel(),
    createEllipticalModel(),
    createSpiralModel(),
    createRandomModel(),
    
    // Physics-based (3)
    createPendulumModel(),
    createBounceModel(),
    createSpringModel(),
    
    // Wave-based (3)
    createWaveModel(),
    createLissajousModel(),
    createHelixModel(),
    
    // Curve & path-based (3)
    createBezierModel(),
    createCatmullRomModel(),
    createZigzagModel(),
    
    // Procedural (3)
    createPerlinNoiseModel(),
    createRoseCurveModel(),
    createEpicycloidModel(),
    
    // Multi-object & interactive (3)
    createOrbitModel(),
    createFormationModel(),
    createAttractRepelModel(),
    
    // Spatial audio (3)
    createDopplerModel(),
    createCircularScanModel(),
    createZoomModel(),
  ]
}

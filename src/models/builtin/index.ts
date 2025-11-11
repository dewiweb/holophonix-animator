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

// Spatial audio
import { createDopplerModel } from './doppler'
import { createCircularScanModel } from './circularScan'
import { createZoomModel } from './zoom'

/**
 * Create all built-in animation models
 * Total: 21 models across 5 categories (removed confusing group/multi-object models)
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
    
    // Spatial audio (3)
    createDopplerModel(),
    createCircularScanModel(),
    createZoomModel(),
  ]
}

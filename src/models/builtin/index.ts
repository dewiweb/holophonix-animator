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
import { createStationaryOscillatorModel } from './oscillatorStationary'
import { createPathOscillatorModel } from './oscillatorPath'
import { createLissajousModel } from './lissajous'
import { createHelixModel } from './helix'

// Curve & path-based
import { createBezierModel } from './bezier'
import { createCatmullRomModel } from './catmullRom'

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
 * Total: 20 models across 5 categories
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
    
    // Wave-based (4)
    createStationaryOscillatorModel(),
    createPathOscillatorModel(),
    createLissajousModel(),
    createHelixModel(),
    
    // Curve & path-based (2)
    createBezierModel(),
    createCatmullRomModel(),
    
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

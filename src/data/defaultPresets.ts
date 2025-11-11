import { AnimationPreset } from '@/types'

export const defaultPresets: AnimationPreset[] = [
  // Basic animations
  {
    id: 'preset-linear-simple',
    name: 'Simple Linear Path',
    description: 'Straight line movement from left to right',
    category: 'basic',
    tags: ['simple', 'linear', 'beginner'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Linear Path',
      type: 'linear',
      duration: 10,
      loop: false,
      parameters: {
        startPosition: { x: -5, y: 0, z: 0 },
        endPosition: { x: 5, y: 0, z: 0 }
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-circular-simple',
    name: 'Circular Loop',
    description: 'Perfect circle in XY plane',
    category: 'basic',
    tags: ['circular', 'loop', 'simple'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Circular Motion',
      type: 'circular',
      duration: 10,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radius: 4,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-elliptical-orbit',
    name: 'Elliptical Orbit',
    description: 'Ellipse with smooth looping',
    category: 'basic',
    tags: ['elliptical', 'orbit', 'loop'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Elliptical Orbit',
      type: 'elliptical',
      duration: 12,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        radiusX: 5,
        radiusY: 3,
        startAngle: 0,
        endAngle: 360,
        plane: 'xy'
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-linear-pingpong',
    name: 'Ping-Pong Path',
    description: 'Linear motion with ping-pong (goes forward then backward)',
    category: 'basic',
    tags: ['linear', 'ping-pong', 'back-forth'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Ping-Pong Path',
      type: 'linear',
      duration: 8,
      loop: true,
      pingPong: true,
      parameters: {
        startPosition: { x: -6, y: 0, z: 0 },
        endPosition: { x: 6, y: 0, z: 0 }
      },
      coordinateSystem: { type: 'xyz' }
    }
  },

  // Physics-based presets
  {
    id: 'preset-pendulum-slow',
    name: 'Gentle Pendulum',
    description: 'Slow swinging motion with subtle damping',
    category: 'physics',
    tags: ['pendulum', 'slow', 'gentle'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Gentle Pendulum',
      type: 'pendulum',
      duration: 20,
      loop: false,
      parameters: {
        anchorPoint: { x: 0, y: 5, z: 0 },
        pendulumLength: 3,
        initialAngle: 30,
        damping: 0.05,
        gravity: 9.81
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-bounce-ball',
    name: 'Bouncing Ball',
    description: 'Realistic ball bouncing with decreasing height',
    category: 'physics',
    tags: ['bounce', 'ball', 'realistic'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Bouncing Ball',
      type: 'bounce',
      duration: 15,
      loop: false,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        startHeight: 10,
        groundLevel: 0,
        bounciness: 0.7,
        dampingPerBounce: 0.15,
        gravity: 9.81
      },
      coordinateSystem: { type: 'xyz' }
    }
  },

  // Wave-based presets
  {
    id: 'preset-wave-gentle',
    name: 'Gentle Wave',
    description: 'Smooth sine wave motion',
    category: 'wave',
    tags: ['wave', 'sine', 'smooth'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Gentle Wave',
      type: 'wave',
      duration: 10,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        amplitude: { x: 2, y: 2, z: 1 },
        frequency: 0.5,
        phaseOffset: 0,
        waveType: 'sine'
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-lissajous-figure8',
    name: 'Figure-8 Pattern',
    description: 'Classic Lissajous figure-8 curve',
    category: 'wave',
    tags: ['lissajous', 'figure-8', 'pattern'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Figure-8',
      type: 'lissajous',
      duration: 10,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        frequencyRatioA: 2,
        frequencyRatioB: 1,
        phaseDifference: 90,
        amplitudeX: 3,
        amplitudeY: 3,
        amplitudeZ: 0
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-lissajous-flower',
    name: 'Flower Pattern',
    description: 'Beautiful 5-petal flower shape',
    category: 'wave',
    tags: ['lissajous', 'flower', 'beautiful'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Flower',
      type: 'lissajous',
      duration: 12,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        frequencyRatioA: 5,
        frequencyRatioB: 4,
        phaseDifference: 0,
        amplitudeX: 4,
        amplitudeY: 4,
        amplitudeZ: 1
      },
      coordinateSystem: { type: 'xyz' }
    }
  },

  // Procedural presets
  {
    id: 'preset-perlin-organic',
    name: 'Organic Drift',
    description: 'Smooth, natural movement like floating',
    category: 'procedural',
    tags: ['perlin', 'organic', 'natural'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Organic Drift',
      type: 'perlin-noise',
      duration: 30,
      loop: false,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        bounds: { x: 5, y: 5, z: 3 },
        noiseFrequency: 0.5,
        noiseOctaves: 3,
        noisePersistence: 0.5,
        noiseScale: 1,
        noiseSeed: 12345
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-rose-5petal',
    name: '5-Petal Rose',
    description: 'Mathematical rose curve with 5 petals',
    category: 'procedural',
    tags: ['rose', 'flower', 'mathematical'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: '5-Petal Rose',
      type: 'rose-curve',
      duration: 10,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        roseRadius: 3,
        petalCount: 5,
        roseRotation: 0,
        plane: 'xy'
      },
      coordinateSystem: { type: 'xyz' }
    }
  },

  // Spatial audio presets
  {
    id: 'preset-doppler-flyby',
    name: 'Jet Fly-By',
    description: 'Fast pass-by for Doppler effect',
    category: 'spatial',
    tags: ['doppler', 'flyby', 'fast'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Jet Fly-By',
      type: 'doppler',
      duration: 5,
      loop: false,
      parameters: {
        pathStart: { x: -15, y: 0, z: 5 },
        pathEnd: { x: 15, y: 0, z: 5 },
        passBySpeed: 2
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-scan-radar',
    name: 'Radar Scan',
    description: 'Circular scanning motion',
    category: 'spatial',
    tags: ['scan', 'radar', 'circular'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Radar Scan',
      type: 'circular-scan',
      duration: 8,
      loop: true,
      parameters: {
        center: { x: 0, y: 0, z: 0 },
        scanRadius: 6,
        scanHeight: 2,
        sweepCount: 2,
        startAngleOffset: 0
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  {
    id: 'preset-zoom-approach',
    name: 'Dramatic Approach',
    description: 'Zoom in with ease-in effect',
    category: 'spatial',
    tags: ['zoom', 'approach', 'dramatic'],
    author: 'Holophonix',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    animation: {
      name: 'Dramatic Approach',
      type: 'zoom',
      duration: 10,
      loop: false,
      parameters: {
        zoomCenter: { x: 0, y: 0, z: 0 },
        startDistance: 15,
        endDistance: 2,
        accelerationCurve: 'ease-in-out'
      },
      coordinateSystem: { type: 'xyz' }
    }
  }
]

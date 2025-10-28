import React from 'react'
import { Target, Circle, Zap } from 'lucide-react'
import { AnimationType } from '@/types'

export interface AnimationInfo {
  type: AnimationType
  label: string
  icon: React.ReactNode
  description: string
}

export interface AnimationCategory {
  name: string
  color: string
  animations: AnimationInfo[]
}

export const animationCategories: AnimationCategory[] = [
  {
    name: 'Basic Animations',
    color: 'blue',
    animations: [
      {
        type: 'linear' as AnimationType,
        label: 'Linear Motion',
        icon: <Target className="w-5 h-5" />,
        description: 'Straight line movement'
      },
      {
        type: 'circular' as AnimationType,
        label: 'Circular Motion',
        icon: <Circle className="w-5 h-5" />,
        description: 'Circular path around center'
      },
      {
        type: 'elliptical' as AnimationType,
        label: 'Elliptical Motion',
        icon: <Circle className="w-5 h-5" />,
        description: 'Elliptical path'
      },
      {
        type: 'spiral' as AnimationType,
        label: 'Spiral Motion',
        icon: <Zap className="w-5 h-5" />,
        description: 'Expanding/contracting spiral'
      },
      {
        type: 'random' as AnimationType,
        label: 'Random Motion',
        icon: <Zap className="w-5 h-5" />,
        description: 'Random within bounds'
      },
      {
        type: 'custom' as AnimationType,
        label: 'Custom Path',
        icon: <Zap className="w-5 h-5" />,
        description: 'Keyframe-based animation'
      }
    ]
  },
  {
    name: 'Physics-Based',
    color: 'orange',
    animations: [
      {
        type: 'pendulum' as AnimationType,
        label: 'Pendulum',
        icon: <Zap className="w-5 h-5" />,
        description: 'Swinging with gravity'
      },
      {
        type: 'bounce' as AnimationType,
        label: 'Bounce',
        icon: <Zap className="w-5 h-5" />,
        description: 'Bouncing with physics'
      },
      {
        type: 'spring' as AnimationType,
        label: 'Spring',
        icon: <Zap className="w-5 h-5" />,
        description: 'Spring dynamics'
      }
    ]
  },
  {
    name: 'Wave-Based',
    color: 'cyan',
    animations: [
      {
        type: 'wave' as AnimationType,
        label: 'Wave',
        icon: <Zap className="w-5 h-5" />,
        description: 'Sinusoidal wave motion'
      },
      {
        type: 'lissajous' as AnimationType,
        label: 'Lissajous',
        icon: <Circle className="w-5 h-5" />,
        description: 'Complex periodic patterns'
      },
      {
        type: 'helix' as AnimationType,
        label: 'Helix',
        icon: <Zap className="w-5 h-5" />,
        description: '3D spiral along axis'
      }
    ]
  },
  {
    name: 'Curve & Path',
    color: 'purple',
    animations: [
      {
        type: 'bezier' as AnimationType,
        label: 'Bézier Curve',
        icon: <Target className="w-5 h-5" />,
        description: 'Smooth curve with control points'
      },
      {
        type: 'catmull-rom' as AnimationType,
        label: 'Catmull-Rom',
        icon: <Target className="w-5 h-5" />,
        description: 'Spline through points'
      },
      {
        type: 'zigzag' as AnimationType,
        label: 'Zigzag',
        icon: <Zap className="w-5 h-5" />,
        description: 'Sharp angular movements'
      }
    ]
  },
  {
    name: 'Procedural',
    color: 'green',
    animations: [
      {
        type: 'perlin-noise' as AnimationType,
        label: 'Perlin Noise',
        icon: <Zap className="w-5 h-5" />,
        description: 'Organic random movement'
      },
      {
        type: 'rose-curve' as AnimationType,
        label: 'Rose Curve',
        icon: <Circle className="w-5 h-5" />,
        description: 'Mathematical flower patterns'
      },
      {
        type: 'epicycloid' as AnimationType,
        label: 'Epicycloid',
        icon: <Circle className="w-5 h-5" />,
        description: 'Circle rolling around circle'
      }
    ]
  },
  {
    name: 'Interactive',
    color: 'amber',
    animations: [
      {
        type: 'orbit' as AnimationType,
        label: 'Orbit',
        icon: <Circle className="w-5 h-5" />,
        description: 'Orbital motion'
      },
      {
        type: 'formation' as AnimationType,
        label: 'Formation',
        icon: <Target className="w-5 h-5" />,
        description: 'Maintain relative positions'
      },
      {
        type: 'attract-repel' as AnimationType,
        label: 'Attract/Repel',
        icon: <Target className="w-5 h-5" />,
        description: 'Force-based movement'
      }
    ]
  },
  {
    name: 'Spatial Audio',
    color: 'pink',
    animations: [
      {
        type: 'doppler' as AnimationType,
        label: 'Doppler Path',
        icon: <Target className="w-5 h-5" />,
        description: 'Fly-by with Doppler effect'
      },
      {
        type: 'circular-scan' as AnimationType,
        label: 'Circular Scan',
        icon: <Circle className="w-5 h-5" />,
        description: 'Sweep around listener'
      },
      {
        type: 'zoom' as AnimationType,
        label: 'Zoom',
        icon: <Target className="w-5 h-5" />,
        description: 'Radial in/out movement'
      }
    ]
  }
]

export const getAnimationInfo = (type: AnimationType): AnimationInfo | null => {
  for (const category of animationCategories) {
    const animation = category.animations.find(a => a.type === type)
    if (animation) return animation
  }
  return null
}

export const supportsControlPointsTypes: AnimationType[] = [
  'linear', 'circular', 'elliptical', 'spiral', 'random', 'pendulum', 'bounce', 'spring', 'wave', 'lissajous', 'helix',
  'bezier', 'catmull-rom', 'zigzag', 'perlin-noise', 'rose-curve', 'epicycloid', 'orbit', 'formation', 'attract-repel',
  'doppler', 'circular-scan', 'zoom', 'custom'
]

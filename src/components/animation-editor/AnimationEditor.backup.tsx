import React, { useState, useEffect, useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/utils'
import { generateRandomWaypoints } from '@/utils/animations/basicAnimations'
import {
  Animation,
  AnimationType,
  Keyframe,
  Position,
  AnimationParameters,
  Track
} from '@/types'
import {
  Play,
  Pause,
  Square,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  Clock,
  Target,
  Circle,
  Zap,
  PanelRightOpen,
  PanelRightClose
} from 'lucide-react'
import { AnimationPreview3D } from './components/3d-preview/AnimationPreview3D'
import { PresetBrowser } from './components/modals/PresetBrowser'
import { PresetNameDialog } from './components/modals/PresetNameDialog'
import { usePresetStore } from '@/stores/presetStore'
import {
  WaveParametersForm,
  LissajousParametersForm,
  PerlinNoiseParametersForm,
  OrbitParametersForm,
  PendulumParametersForm,
  BounceParametersForm,
  SpringParametersForm,
  HelixParametersForm,
  BezierParametersForm,
  CatmullRomParametersForm,
  ZigzagParametersForm,
  RoseCurveParametersForm,
  EpicycloidParametersForm,
  FormationParametersForm,
  AttractRepelParametersForm,
  DopplerParametersForm,
  CircularScanParametersForm,
  ZoomParametersForm
} from './components/models-forms'
import { ControlPointEditor } from './components/control-points-editor/ControlPointEditor'
import {
  MultiTrackModeSelector,
  SelectedTracksIndicator,
  AnimationTypeSelector,
  AnimationControlButtons
} from './components/controls'

export const AnimationEditor: React.FC = () => {
  const { currentProject, tracks, selectedTracks, selectTracks, updateTrack, animations, addAnimation, updateAnimation } = useProjectStore()
  const { isPlaying, globalTime, playAnimation, pauseAnimation, stopAnimation } = useAnimationStore()
  const { animation: animationSettings } = useSettingsStore()
  const { addPreset } = usePresetStore()

  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [showKeyframeEditor, setShowKeyframeEditor] = useState(false)
  const [isKeyframePlacementMode, setIsKeyframePlacementMode] = useState(false)
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null)
  const [showPresetBrowser, setShowPresetBrowser] = useState(false)
  const [showPresetNameDialog, setShowPresetNameDialog] = useState(false)
  const [activeWorkPane, setActiveWorkPane] = useState<'preview' | 'control'>('preview')
  const [isFormPanelOpen, setIsFormPanelOpen] = useState(false)
  const [animationForm, setAnimationForm] = useState<Partial<Animation>>({
    name: '',
    type: 'linear',
    duration: animationSettings.defaultAnimationDuration,
    loop: false,
    coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
    parameters: {}
  })

  const selectedTrackIds = selectedTracks.length > 0 ? selectedTracks : tracks.map(t => t.id)
  const selectedTrack = tracks.find(t => selectedTrackIds.includes(t.id))

  // Get animation for selected track
  const currentAnimation = selectedTrack?.animationState?.animation || null
  const isAnimationPlaying = selectedTrack?.animationState?.isPlaying || false

  const selectedTrackObjects = useMemo(() => (
    selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
  ), [selectedTrackIds, tracks])

  const supportsControlPoints = useMemo(() => {
    const supportedTypes: AnimationType[] = [
      'linear', 'circular', 'elliptical', 'spiral', 'random', 'pendulum', 'bounce', 'spring', 'wave', 'lissajous', 'helix',
      'bezier', 'catmull-rom', 'zigzag', 'perlin-noise', 'rose-curve', 'epicycloid', 'orbit', 'formation', 'attract-repel',
      'doppler', 'circular-scan', 'zoom', 'custom'
    ]
    return supportedTypes.includes((animationForm.type || 'linear') as AnimationType)
  }, [animationForm.type])

  const trackColors = useMemo(() => (
    tracks.reduce((acc, track) => {
      if (track.color) {
        acc[track.id] = track.color
      }
      return acc
    }, {} as Record<string, { r: number; g: number; b: number; a: number }>)
  ), [tracks])

  const trackPositions = useMemo(() => (
    tracks.reduce((acc, track) => {
      const basePosition = track.initialPosition || track.position
      if (basePosition) {
        acc[track.id] = basePosition
      }
      return acc
    }, {} as Record<string, Position>)
  ), [tracks])

  useEffect(() => {
    if (!supportsControlPoints && activeWorkPane === 'control') {
      setActiveWorkPane('preview')
    }
  }, [supportsControlPoints, activeWorkPane])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia('(min-width: 1280px)')

    const setFromMatch = (matches: boolean) => {
      if (matches) {
        setIsFormPanelOpen(true)
      }
    }

    setFromMatch(mq.matches)

    const listener = (event: MediaQueryListEvent) => setFromMatch(event.matches)

    if (mq.addEventListener) {
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }

    mq.addListener(listener)
    return () => mq.removeListener(listener)
  }, [])

  // Animation types with their parameters
  const animationCategories = [
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

  // Helper to get animation info from categories
  const getAnimationInfo = (type: AnimationType) => {
    for (const category of animationCategories) {
      const animation = category.animations.find(a => a.type === type)
      if (animation) return animation
    }
    return null
  }

  // Helper to check which multi-track modes are compatible with an animation type
  const getCompatibleModes = (animationType: AnimationType) => {
    const modes = {
      identical: { compatible: true, reason: '' },
      'phase-offset': { compatible: true, reason: '' },
      'position-relative': { compatible: true, reason: '' },
      'phase-offset-relative': { compatible: true, reason: '' }
    }

    switch (animationType) {
      // Always incompatible with position-relative
      case 'linear':
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'Linear needs explicit start/end points, not center position' 
        }
        break

      case 'random':
        // All modes work:
        // - Identical: Same center, same random path
        // - Phase-offset: Same center, time-staggered random walk
        // - Position-relative: Each track has own center
        // - Phase-offset-relative: Each track has own center + time offset
        break

      case 'custom':
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'Custom keyframes define explicit positions' 
        }
        modes['phase-offset-relative'] = { 
          compatible: false, 
          reason: 'Custom keyframes define explicit positions' 
        }
        break

      // Directional/path animations - phase offset works, position-relative may not
      case 'doppler':
      case 'zoom':
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'This animation has a specific directional path' 
        }
        modes['phase-offset-relative'] = { 
          compatible: false, 
          reason: 'This animation has a specific directional path' 
        }
        break

      case 'bezier':
      case 'catmull-rom':
      case 'zigzag':
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'Path is defined by explicit control points' 
        }
        modes['phase-offset-relative'] = { 
          compatible: false, 
          reason: 'Path is defined by explicit control points' 
        }
        break

      // Formation is a special case
      case 'formation':
        modes['phase-offset'] = { 
          compatible: false, 
          reason: 'Formation requires tracks to move together' 
        }
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'Formation manages relative positions itself' 
        }
        modes['phase-offset-relative'] = { 
          compatible: false, 
          reason: 'Formation manages relative positions itself' 
        }
        break

      // Attract/Repel has specific target
      case 'attract-repel':
        modes['position-relative'] = { 
          compatible: false, 
          reason: 'Animation uses specific target position' 
        }
        modes['phase-offset-relative'] = { 
          compatible: false, 
          reason: 'Animation uses specific target position' 
        }
        break

      // All other animations (circular, spiral, wave, helix, pendulum, bounce, spring, 
      // lissajous, orbit, perlin-noise, rose-curve, epicycloid, circular-scan)
      // are compatible with all modes
      default:
        break
    }

    return modes
  }

  const [originalAnimationParams, setOriginalAnimationParams] = useState<AnimationParameters | null>(null)

  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [multiTrackMode, setMultiTrackMode] = useState<'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative'>('identical')
  const [phaseOffsetSeconds, setPhaseOffsetSeconds] = useState(0.5)

  // Load existing animation when track is selected
  useEffect(() => {
    if (currentAnimation) {
      // Load existing animation - preserve its original parameters
      // DO NOT modify parameters based on current track position
      // This prevents corruption when user pauses and re-saves
      setAnimationForm(currentAnimation)
      setKeyframes(currentAnimation.keyframes || [])
      setOriginalAnimationParams(currentAnimation.parameters)
    } else {
      // Reset form for new animation
      setAnimationForm({
        name: '',
        type: 'linear',
        duration: animationSettings.defaultAnimationDuration,
        loop: false,
        coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
        parameters: {}
      })
      setKeyframes([])
      setOriginalAnimationParams(null)
    }
  }, [selectedTrack?.id, currentAnimation])

  const handleAnimationTypeChange = (type: AnimationType) => {
    setAnimationForm(prev => ({ ...prev, type }))

    if (selectedTrackIds.length > 1) {
      const compatibleModes = getCompatibleModes(type)
      if (!compatibleModes[multiTrackMode].compatible) {
        console.log(`⚠️ Current mode "${multiTrackMode}" incompatible with ${type}, switching to "identical"`)
        setMultiTrackMode('identical')
      }
    }

    const defaultParams = getDefaultAnimationParameters(type, selectedTrack ?? null)
    setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))
  }

  const handleParameterChange = (key: string, value: any) => {
    setAnimationForm(prev => {
      // For Position objects, ensure we merge with existing values
      const isPositionKey = ['startPosition', 'endPosition', 'center', 'bounds', 'anchorPoint', 'restPosition', 'targetPosition'].includes(key)

      if (isPositionKey && typeof value === 'object') {
        // Merge with existing position to preserve all x, y, z values
        const existingValue = (prev.parameters as any)?.[key] || { x: 0, y: 0, z: 0 }
        const newValue = { ...existingValue, ...value }

        // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
        if (selectedTrackIds.length > 1 && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative')) {
          applyRelativeControlPointChange(key, newValue, existingValue)
        }

        return {
          ...prev,
          parameters: {
            ...prev.parameters,
            [key]: newValue
          }
        }
      }

      // If we're in relative modes and this is a position parameter, apply relative changes to other tracks
      if (selectedTrackIds.length > 1 && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && isPositionKey) {
        applyRelativeControlPointChange(key, value, (prev.parameters as any)?.[key])
      }

      return {
        ...prev,
        parameters: { ...prev.parameters, [key]: value }
      }
    })
  }

  // Apply relative control point changes to other selected tracks
  const applyRelativeControlPointChange = (key: string, newValue: any, oldValue: any) => {
    if (!oldValue || !newValue) return

    // Calculate the relative offset
    const offset = {
      x: newValue.x - oldValue.x,
      y: newValue.y - oldValue.y,
      z: newValue.z - oldValue.z
    }

    // Apply this offset to other selected tracks (skip the first track as it was already updated)
    selectedTrackIds.slice(1).forEach(trackId => {
      const track = tracks.find(t => t.id === trackId)
      if (!track) return

      // Get the current parameter value for this track
      const currentValue = getCurrentTrackParameter(trackId, key)

      if (currentValue) {
        // Apply the same relative offset
        const updatedValue = {
          x: currentValue.x + offset.x,
          y: currentValue.y + offset.y,
          z: currentValue.z + offset.z
        }

        // Update this track's parameter
        updateTrackParameter(trackId, key, updatedValue)
      }
    })
  }

  // Get current parameter value for a specific track
  const getCurrentTrackParameter = (trackId: string, key: string): Position | null => {
    const track = tracks.find(t => t.id === trackId)
    if (!track || !track.animationState?.animation?.parameters) return null

    const params = track.animationState.animation.parameters as any
    return params[key] || null
  }

  // Update a specific parameter for a specific track
  const updateTrackParameter = (trackId: string, key: string, value: any) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track || !track.animationState?.animation) return

    const updatedAnimation = {
      ...track.animationState.animation,
      parameters: {
        ...(track.animationState.animation.parameters as any),
        [key]: value
      }
    }

    updateTrack(trackId, {
      animationState: {
        ...track.animationState,
        animation: updatedAnimation
      }
    })
  }

  const handleResetToDefaults = () => {
    if (!animationForm.type) return
    const defaultParams = getDefaultAnimationParameters(animationForm.type, selectedTrack ?? null)
    setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))
  }

  const getDefaultAnimationParameters = (type: string, track: Track | null) => {
    const trackPosition = track?.initialPosition || track?.position || { x: 0, y: 0, z: 0 }
    const defaultParams: AnimationParameters = {}
    switch (type) {
      case 'linear':
        defaultParams.startPosition = { ...trackPosition }
        defaultParams.endPosition = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
        break
      case 'circular':
        defaultParams.center = { ...trackPosition }
        defaultParams.radius = 3
        defaultParams.startAngle = 0
        defaultParams.endAngle = 360
        defaultParams.plane = 'xy'
        break
      case 'elliptical':
        defaultParams.centerX = trackPosition.x
        defaultParams.centerY = trackPosition.y
        defaultParams.centerZ = trackPosition.z
        defaultParams.radiusX = 4
        defaultParams.radiusY = 2
        defaultParams.radiusZ = 0
        defaultParams.startAngle = 0
        defaultParams.endAngle = 360
        break
      case 'spiral':
        defaultParams.center = { ...trackPosition }
        defaultParams.startRadius = 1
        defaultParams.endRadius = 5
        defaultParams.rotations = 3
        defaultParams.direction = 'clockwise'
        defaultParams.plane = 'xy'
        break
      case 'random':
        defaultParams.center = { ...trackPosition }
        defaultParams.bounds = { x: 5, y: 5, z: 5 }
        defaultParams.speed = 1
        defaultParams.smoothness = 0.5
        defaultParams.updateFrequency = 10
        break
      case 'custom':
        defaultParams.interpolation = 'linear'
        break
      case 'pendulum':
        defaultParams.anchorPoint = { x: trackPosition.x, y: trackPosition.y + 5, z: trackPosition.z }
        defaultParams.pendulumLength = 3
        defaultParams.initialAngle = 45
        defaultParams.damping = 0.02
        defaultParams.gravity = 9.81
        defaultParams.plane = 'xz'
        break
      case 'bounce':
        defaultParams.center = { ...trackPosition }
        defaultParams.startHeight = 10
        defaultParams.groundLevel = 0
        defaultParams.bounciness = 0.8
        defaultParams.dampingPerBounce = 0.1
        defaultParams.gravity = 9.81
        break
      case 'spring':
        defaultParams.restPosition = { ...trackPosition }
        defaultParams.springStiffness = 10
        defaultParams.dampingCoefficient = 0.5
        defaultParams.initialDisplacement = { x: 5, y: 5, z: 0 }
        defaultParams.mass = 1
        break
      case 'wave':
        defaultParams.center = { ...trackPosition }
        defaultParams.amplitude = { x: 2, y: 2, z: 1 }
        defaultParams.frequency = 1
        defaultParams.phaseOffset = 0
        defaultParams.waveType = 'sine'
        break
      case 'lissajous':
        defaultParams.center = { ...trackPosition }
        defaultParams.frequencyRatioA = 3
        defaultParams.frequencyRatioB = 2
        defaultParams.phaseDifference = 0
        defaultParams.amplitudeX = 3
        defaultParams.amplitudeY = 3
        defaultParams.amplitudeZ = 1
        break
      case 'helix':
        defaultParams.axisStart = { x: trackPosition.x, y: trackPosition.y - 5, z: trackPosition.z }
        defaultParams.axisEnd = { x: trackPosition.x, y: trackPosition.y + 5, z: trackPosition.z }
        defaultParams.helixRadius = 2
        defaultParams.helixRotations = 5
        defaultParams.direction = 'clockwise'
        break
      case 'bezier':
        defaultParams.bezierStart = { ...trackPosition }
        defaultParams.bezierControl1 = { x: trackPosition.x - 2, y: trackPosition.y + 5, z: trackPosition.z + 2 }
        defaultParams.bezierControl2 = { x: trackPosition.x + 2, y: trackPosition.y + 5, z: trackPosition.z - 2 }
        defaultParams.bezierEnd = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
        defaultParams.easingFunction = 'linear'
        break
      case 'catmull-rom':
        defaultParams.controlPoints = [
          { ...trackPosition },
          { x: trackPosition.x + 2, y: trackPosition.y + 3, z: trackPosition.z },
          { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
        ]
        defaultParams.tension = 0.5
        defaultParams.closedLoop = false
        break
      case 'zigzag':
        defaultParams.zigzagStart = { ...trackPosition }
        defaultParams.zigzagEnd = { x: trackPosition.x + 5, y: trackPosition.y, z: trackPosition.z }
        defaultParams.zigzagCount = 5
        defaultParams.zigzagAmplitude = 2
        defaultParams.zigzagPlane = 'xy'
        break
      case 'perlin-noise':
        defaultParams.center = { ...trackPosition }
        defaultParams.bounds = { x: 5, y: 5, z: 5 }
        defaultParams.noiseFrequency = 1
        defaultParams.noiseOctaves = 3
        defaultParams.noisePersistence = 0.5
        defaultParams.noiseScale = 1
        defaultParams.noiseSeed = 12345
        break
      case 'rose-curve':
        defaultParams.center = { ...trackPosition }
        defaultParams.roseRadius = 3
        defaultParams.petalCount = 5
        defaultParams.roseRotation = 0
        defaultParams.plane = 'xy'
        break
      case 'epicycloid':
        defaultParams.center = { ...trackPosition }
        defaultParams.fixedCircleRadius = 3
        defaultParams.rollingCircleRadius = 1
        defaultParams.rollingSpeed = 1
        defaultParams.rollingType = 'epicycloid'
        defaultParams.plane = 'xy'
        break
      case 'orbit':
        defaultParams.center = { ...trackPosition }
        defaultParams.orbitalRadius = 4
        defaultParams.orbitalSpeed = 1
        defaultParams.orbitalPhase = 0
        defaultParams.inclination = 0
        break
      case 'formation':
        defaultParams.center = { ...trackPosition }
        defaultParams.formationShape = 'line'
        defaultParams.formationSpacing = 2
        defaultParams.followStiffness = 0.8
        break
      case 'attract-repel':
        defaultParams.center = { ...trackPosition }
        defaultParams.targetPosition = { x: 0, y: 0, z: 0 }
        defaultParams.attractionStrength = 5
        defaultParams.repulsionRadius = 1
        defaultParams.maxSpeed = 10
        break
      case 'doppler':
        defaultParams.pathStart = { x: -10, y: trackPosition.y, z: trackPosition.z }
        defaultParams.pathEnd = { x: 10, y: trackPosition.y, z: trackPosition.z }
        defaultParams.passBySpeed = 1
        break
      case 'circular-scan':
        defaultParams.center = { ...trackPosition }
        defaultParams.scanRadius = 5
        defaultParams.scanHeight = 0
        defaultParams.sweepCount = 1
        defaultParams.startAngleOffset = 0
        break
      case 'zoom':
        defaultParams.zoomCenter = { ...trackPosition }
        defaultParams.startDistance = 10
        defaultParams.endDistance = 1
        defaultParams.accelerationCurve = 'linear'
        break
    }
    return defaultParams
  }

  const handleUseTrackPosition = () => {
    // Preserve selection order for phase-offset mode
    const selectedTracksToUse = selectedTrackIds.length > 0 
      ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
      : []
      
    if (selectedTracksToUse.length === 0) return
    
    const type = animationForm.type
    const updatedParams = { ...animationForm.parameters }
    
    // Behavior depends on multi-track mode
    if (selectedTracksToUse.length === 1 || multiTrackMode === 'identical' || multiTrackMode === 'phase-offset') {
      // Single track OR Identical/Phase-Offset mode: use FIRST track's position
      // In Identical/Phase-Offset (not phase-offset-relative), all tracks follow the same path centered on first track
      const trackPosition = selectedTracksToUse[0].initialPosition || selectedTracksToUse[0].position
      
      console.log(`📍 Using ${selectedTracksToUse[0].name} position as center:`, trackPosition)
      
      // Update parameters based on animation type
      switch (type) {
        case 'linear':
        case 'bezier':
        case 'catmull-rom':
        case 'zigzag':
          updatedParams.startPosition = { ...trackPosition }
          break
          
        case 'circular':
        case 'spiral':
        case 'random':
        case 'wave':
        case 'lissajous':
        case 'orbit':
        case 'rose-curve':
        case 'epicycloid':
        case 'circular-scan':
          updatedParams.center = { ...trackPosition }
          break
          
        case 'elliptical':
          updatedParams.centerX = trackPosition.x
          updatedParams.centerY = trackPosition.y
          updatedParams.centerZ = trackPosition.z
          break
          
        case 'pendulum':
          updatedParams.anchorPoint = { ...trackPosition }
          break
          
        case 'spring':
          updatedParams.restPosition = { ...trackPosition }
          break
          
        case 'bounce':
          updatedParams.groundLevel = trackPosition.y
          break
          
        case 'attract-repel':
          updatedParams.targetPosition = { ...trackPosition }
          break
          
        case 'zoom':
          updatedParams.zoomCenter = { ...trackPosition }
          break
          
        case 'helix':
          updatedParams.axisStart = { ...trackPosition }
          break
      }
      
      setAnimationForm(prev => ({ ...prev, parameters: updatedParams }))
      console.log(`✅ Updated center/start to ${selectedTracksToUse[0].name}'s position`)
      
    } else if (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') {
      // Position-Relative modes: Animation will be centered on EACH track's own position
      // This is handled automatically in handleSaveAnimation, so just inform user
      console.log(`📍 Position-Relative mode: Each track will use its own position as center (applied on save)`)
      return
    }
  }

  const handleKeyframeAdd = (time: number, position: Position) => {
    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}`,
      time,
      position,
      interpolation: 'linear'
    }
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time))
  }

  const handleKeyframeRemove = (keyframeId: string) => {
    setKeyframes(prev => prev.filter(k => k.id !== keyframeId))
  }

  const handleKeyframeUpdate = (keyframeId: string, updates: Partial<Keyframe>) => {
    setKeyframes(prev => prev.map(k =>
      k.id === keyframeId ? { ...k, ...updates } : k
    ))
  }

  const previewPane = (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 bg-gray-100">
        <AnimationPreview3D
          tracks={selectedTrackObjects}
          animation={previewMode ? null : currentAnimation}
          animationType={animationForm.type}
          animationParameters={animationForm.parameters as AnimationParameters}
          currentTime={globalTime}
          keyframes={animationForm.type === 'custom' ? keyframes : []}
          onUpdateKeyframe={handleKeyframeUpdate}
          isKeyframePlacementMode={isKeyframePlacementMode && animationForm.type === 'custom'}
          selectedKeyframeId={selectedKeyframeId}
          onSelectKeyframe={setSelectedKeyframeId}
          isFormPanelOpen={isFormPanelOpen}
        />
      </div>

      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        {previewMode ? (
          <p className="text-sm text-blue-700">
            Preview mode active. Configure animation parameters to see real-time preview.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Tip: Toggle control points to adjust path waypoints visually.
          </p>
        )}
      </div>
    </div>
  )

  const controlPaneContent = supportsControlPoints ? (
    <ControlPointEditor
      animationType={animationForm.type || 'linear'}
      parameters={animationForm.parameters || {}}
      keyframes={keyframes}
      onParameterChange={handleParameterChange}
      onKeyframeUpdate={handleKeyframeUpdate}
      trackPosition={selectedTrack?.initialPosition || selectedTrack?.position}
      trackColors={trackColors}
      selectedTracks={selectedTrackIds}
      trackPositions={trackPositions}
      multiTrackMode={multiTrackMode}
    />
  ) : (
    <div className="h-full flex items-center justify-center text-sm text-gray-500 px-6">
      Control points are not available for the selected animation type.
    </div>
  )

  const handleSaveAnimation = () => {
    // Preserve selection order for phase-offset mode
    const selectedTracksToApply = selectedTrackIds.length > 0 
      ? selectedTrackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[]
      : []
    
    console.log('💾 Save Animation clicked', { 
      hasName: !!animationForm.name, 
      selectedCount: selectedTracksToApply.length,
      form: animationForm 
    })
    
    if (!animationForm.name || selectedTracksToApply.length === 0) {
      console.warn('⚠️ Cannot save: missing name or no tracks selected')
      alert('Please enter an animation name and select at least one track')
      return
    }

    // Prepare parameters based on animation type
    let parameters = animationForm.parameters || {}
    
    // For custom animations, store keyframes
    if (animationForm.type === 'custom' && keyframes.length > 0) {
      parameters = { ...parameters, keyframes }
    }
    
    // For random animations, generate and store waypoints once
    if (animationForm.type === 'random') {
      const center = parameters.center || { x: 0, y: 0, z: 0 }
      const bounds = parameters.bounds || { x: 5, y: 5, z: 5 }
      const updateFrequency = Number(parameters.updateFrequency) || 2
      const randomWaypoints = generateRandomWaypoints(center, bounds, animationForm.duration || 10, updateFrequency)
      parameters = { ...parameters, randomWaypoints }
      console.log(`🎲 Generated ${randomWaypoints.length} random waypoints`)
    }

    const animation: Animation = {
      id: currentAnimation?.id || `animation-${Date.now()}`,
      name: animationForm.name,
      type: animationForm.type || 'linear',
      duration: animationForm.duration || 10,
      loop: animationForm.loop || false,
      pingPong: animationForm.pingPong || false,
      parameters,
      keyframes: keyframes.length > 0 ? keyframes : undefined,
      coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' }
    }

    console.log('💾 Saving animation:', animation)

    if (currentAnimation) {
      updateAnimation(animation.id, animation)
      console.log('✏️ Updated existing animation')
    } else {
      addAnimation(animation)
      console.log('➕ Added new animation')
    }

    // Apply animation to ALL selected tracks based on multi-track mode
    selectedTracksToApply.forEach((track, index) => {
      let trackAnimation = { ...animation }
      let initialTime = 0

      // Apply different strategies based on multi-track mode
      if (selectedTracksToApply.length > 1) {
        switch (multiTrackMode) {
          case 'phase-offset':
            // Stagger start times by phase offset
            initialTime = index * phaseOffsetSeconds
            console.log(`🔄 Track ${track.name}: phase offset ${initialTime}s`)
            break

          case 'phase-offset-relative':
            // Combine both: phase offset timing + position-relative paths
            initialTime = index * phaseOffsetSeconds
            console.log(`🔄📍 Track ${track.name}: phase offset ${initialTime}s + relative position`)
            // Fall through to position-relative logic

          case 'position-relative':
            // Adjust animation center/start to EACH track's current position
            // BUT preserve user's control point modifications
            if (trackAnimation.parameters) {
              const trackPos = track.position
              const updatedParams = { ...trackAnimation.parameters }

              // Only update position parameters if they haven't been explicitly modified by user
              // Check if user has moved control points by comparing with default values
              const userModifiedParams = checkUserModifiedParameters(animation.type, updatedParams)

              // Update position parameters based on animation type, but only if not user-modified
              switch (animation.type) {
                case 'linear':
                case 'bezier':
                case 'catmull-rom':
                case 'zigzag':
                case 'doppler':
                  if (!userModifiedParams.startPosition) {
                    updatedParams.startPosition = { ...trackPos }
                  }
                  // For end position, check if it was modified relative to the original start position
                  if (!userModifiedParams.endPosition && updatedParams.startPosition) {
                    const originalStart = animation.parameters?.startPosition || trackPos
                    const originalEnd = animation.parameters?.endPosition
                    if (originalEnd) {
                      const offset = {
                        x: originalEnd.x - originalStart.x,
                        y: originalEnd.y - originalStart.y,
                        z: originalEnd.z - originalStart.z
                      }
                      updatedParams.endPosition = {
                        x: trackPos.x + offset.x,
                        y: trackPos.y + offset.y,
                        z: trackPos.z + offset.z
                      }
                    }
                  }
                  break

                case 'circular':
                case 'spiral':
                case 'wave':
                case 'lissajous':
                case 'orbit':
                case 'rose-curve':
                case 'epicycloid':
                case 'circular-scan':
                case 'perlin-noise':
                  if (!userModifiedParams.center) {
                    updatedParams.center = { ...trackPos }
                  }
                  break

                case 'elliptical':
                  if (!userModifiedParams.centerX && !userModifiedParams.centerY && !userModifiedParams.centerZ) {
                    updatedParams.centerX = trackPos.x
                    updatedParams.centerY = trackPos.y
                    updatedParams.centerZ = trackPos.z
                  }
                  break

                case 'pendulum':
                  if (!userModifiedParams.anchorPoint) {
                    updatedParams.anchorPoint = { ...trackPos }
                  }
                  break

                case 'spring':
                  if (!userModifiedParams.restPosition) {
                    updatedParams.restPosition = { ...trackPos }
                  }
                  break

                case 'bounce':
                  if (!userModifiedParams.groundLevel) {
                    updatedParams.groundLevel = trackPos.y
                  }
                  break

                case 'attract-repel':
                  if (!userModifiedParams.targetPosition) {
                    updatedParams.targetPosition = { ...trackPos }
                  }
                  break

                case 'zoom':
                  if (!userModifiedParams.zoomCenter) {
                    updatedParams.zoomCenter = { ...trackPos }
                  }
                  break

                case 'helix':
                  if (!userModifiedParams.axisStart) {
                    updatedParams.axisStart = { ...trackPos }
                    // Keep axisEnd offset from start
                    if (updatedParams.axisEnd) {
                      const originalStart = animation.parameters?.axisStart || { x: 0, y: 0, z: 0 }
                      const originalEnd = animation.parameters?.axisEnd || { x: 0, y: 10, z: 0 }
                      const offset = {
                        x: originalEnd.x - originalStart.x,
                        y: originalEnd.y - originalStart.y,
                        z: originalEnd.z - originalStart.z
                      }
                      updatedParams.axisEnd = {
                        x: trackPos.x + offset.x,
                        y: trackPos.y + offset.y,
                        z: trackPos.z + offset.z
                      }
                    }
                  }
                  break

                case 'random':
                  // For random animation, regenerate waypoints centered at each track's position
                  // But only if center hasn't been explicitly modified by user
                  if (!userModifiedParams.center) {
                    updatedParams.center = { ...trackPos }
                    const bounds = updatedParams.bounds || { x: 5, y: 5, z: 5 }
                    const updateFrequency = Number(updatedParams.updateFrequency) || 2
                    updatedParams.randomWaypoints = generateRandomWaypoints(trackPos, bounds, animation.duration, updateFrequency)
                    console.log(`🎲 Track ${track.name}: generated ${updatedParams.randomWaypoints.length} waypoints at (${trackPos.x.toFixed(1)}, ${trackPos.y.toFixed(1)}, ${trackPos.z.toFixed(1)})`)
                  }
                  break
              }

              trackAnimation = {
                ...trackAnimation,
                id: `${animation.id}-${track.id}`, // Unique ID per track
                parameters: updatedParams
              }
              console.log(`📍 Track ${track.name}: animation centered at (${trackPos.x.toFixed(2)}, ${trackPos.y.toFixed(2)}, ${trackPos.z.toFixed(2)})`)
            }
            break

          case 'identical':
          default:
            // All tracks get identical animation
            console.log(`🔁 Track ${track.name}: identical animation`)
            break
        }
      }

      updateTrack(track.id, {
        animationState: {
          animation: trackAnimation,
          isPlaying: false,
          currentTime: initialTime,
          playbackSpeed: 1,
          loop: animation.loop
        }
      })
      console.log(`✅ Animation applied to track: ${track.name} (${track.id})`)
    })
    
    console.log(`🎉 Animation "${animation.name}" applied to ${selectedTracksToApply.length} track(s)`)
  }

  const handlePlayPreview = () => {
    console.log(' Play button clicked', {
      isPlaying: isAnimationPlaying,
      hasAnimation: !!currentAnimation,
      hasTrack: !!selectedTrack,
      animationId: currentAnimation?.id,
      trackId: selectedTrack?.id
    })
    
    if (isAnimationPlaying) {
      console.log('⏸ Pausing animation')
      pauseAnimation()
    } else {
      if (!currentAnimation) {
        console.warn('⚠ No animation to play - save animation first')
        return
      }
      console.log('▶ Playing animation:', currentAnimation.id, 'for tracks:', selectedTrackIds)
      playAnimation(currentAnimation?.id || '', selectedTrackIds)
    }
  }

  const handleStopAnimation = () => {
    console.log(' Stop button clicked')
    stopAnimation()
  }

  const handleLoadPreset = (preset: any) => {
    console.log('📦 Loading preset:', preset.name)
    setAnimationForm({
      name: preset.animation.name,
      type: preset.animation.type,
      duration: preset.animation.duration,
      loop: preset.animation.loop || false,
      pingPong: preset.animation.pingPong || false,
      parameters: preset.animation.parameters,
      coordinateSystem: preset.animation.coordinateSystem
    })
    setShowPresetBrowser(false)
    console.log('✅ Preset loaded successfully')
  }

  const handleSaveAsPreset = () => {
    if (!animationForm.name || !animationForm.type) {
      alert('Please configure an animation before saving as preset')
      return
    }

    // Show dialog to get preset name and description from user
    setShowPresetNameDialog(true)
  }

  // Helper function to check if user has modified parameters from original values
  const checkUserModifiedParameters = (animationType: AnimationType, currentParams: AnimationParameters): Record<string, boolean> => {
    const modified: Record<string, boolean> = {}

    // Compare against original parameters if available, otherwise use defaults
    const originalParams = originalAnimationParams
    const defaults = originalParams || getDefaultParameters(animationType, selectedTrack?.initialPosition || selectedTrack?.position || { x: 0, y: 0, z: 0 })

    switch (animationType) {
      case 'linear':
      case 'bezier':
      case 'catmull-rom':
      case 'zigzag':
      case 'doppler':
        modified.startPosition = JSON.stringify(currentParams.startPosition) !== JSON.stringify(defaults.startPosition)
        break

      case 'circular':
      case 'spiral':
      case 'wave':
      case 'lissajous':
      case 'orbit':
      case 'rose-curve':
      case 'epicycloid':
      case 'circular-scan':
      case 'perlin-noise':
        modified.center = JSON.stringify(currentParams.center) !== JSON.stringify(defaults.center)
        break

      case 'elliptical':
        modified.centerX = currentParams.centerX !== defaults.centerX
        modified.centerY = currentParams.centerY !== defaults.centerY
        modified.centerZ = currentParams.centerZ !== defaults.centerZ
        break

      case 'pendulum':
        modified.anchorPoint = JSON.stringify(currentParams.anchorPoint) !== JSON.stringify(defaults.anchorPoint)
        break

      case 'spring':
        modified.restPosition = JSON.stringify(currentParams.restPosition) !== JSON.stringify(defaults.restPosition)
        break

      case 'bounce':
        modified.groundLevel = currentParams.groundLevel !== defaults.groundLevel
        break

      case 'attract-repel':
        modified.targetPosition = JSON.stringify(currentParams.targetPosition) !== JSON.stringify(defaults.targetPosition)
        break

      case 'zoom':
        modified.zoomCenter = JSON.stringify(currentParams.zoomCenter) !== JSON.stringify(defaults.zoomCenter)
        break

      case 'helix':
        modified.axisStart = JSON.stringify(currentParams.axisStart) !== JSON.stringify(defaults.axisStart)
        break

      case 'random':
        modified.center = JSON.stringify(currentParams.center) !== JSON.stringify(defaults.center)
        break
    }

    return modified
  }

  // Helper function to get default parameters for an animation type
  const getDefaultParameters = (animationType: AnimationType, trackPosition: Position): AnimationParameters => {
    const trackPos = trackPosition
    const defaults: AnimationParameters = {}

    switch (animationType) {
      case 'linear':
      case 'bezier':
      case 'catmull-rom':
      case 'zigzag':
      case 'doppler':
        defaults.startPosition = { ...trackPos }
        break

      case 'circular':
      case 'spiral':
      case 'wave':
      case 'lissajous':
      case 'orbit':
      case 'rose-curve':
      case 'epicycloid':
      case 'circular-scan':
      case 'perlin-noise':
        defaults.center = { ...trackPos }
        break

      case 'elliptical':
        defaults.centerX = trackPos.x
        defaults.centerY = trackPos.y
        defaults.centerZ = trackPos.z
        break

      case 'pendulum':
        defaults.anchorPoint = { ...trackPos }
        break

      case 'spring':
        defaults.restPosition = { ...trackPos }
        break

      case 'bounce':
        defaults.groundLevel = trackPos.y
        break

      case 'attract-repel':
        defaults.targetPosition = { ...trackPos }
        break

      case 'zoom':
        defaults.zoomCenter = { ...trackPos }
        break

      case 'helix':
        defaults.axisStart = { ...trackPos }
        break

      case 'random':
        defaults.center = { ...trackPos }
        break
    }

    return defaults
  }

  const handleConfirmPresetSave = (presetName: string, description: string) => {
    const preset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      description: description || `Saved from ${animationForm.type} animation`,
      category: 'user' as const,
      tags: [],
      author: 'User',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      animation: {
        name: animationForm.name || 'Untitled Animation',
        type: animationForm.type!,
        duration: animationForm.duration || 10,
        loop: animationForm.loop || false,
        pingPong: animationForm.pingPong || false,
        parameters: animationForm.parameters || {},
        coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' }
      }
    }

    addPreset(preset)
    setShowPresetNameDialog(false)
    alert(`Preset "${presetName}" saved successfully!`)
  }

  const renderAnimationParameters = () => {
    const type = animationForm.type || 'linear'

    switch (type) {
      case 'linear':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Position</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.startPosition?.x || 0}
                    onChange={(e) => handleParameterChange('startPosition', {
                      ...(animationForm.parameters as any)?.startPosition,
                      x: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.startPosition?.y || 0}
                    onChange={(e) => handleParameterChange('startPosition', {
                      ...(animationForm.parameters as any)?.startPosition,
                      y: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.startPosition?.z || 0}
                    onChange={(e) => handleParameterChange('startPosition', {
                      ...(animationForm.parameters as any)?.startPosition,
                      z: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Z"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Position</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.endPosition?.x || 0}
                    onChange={(e) => handleParameterChange('endPosition', {
                      ...(animationForm.parameters as any)?.endPosition,
                      x: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.endPosition?.y || 0}
                    onChange={(e) => handleParameterChange('endPosition', {
                      ...(animationForm.parameters as any)?.endPosition,
                      y: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.endPosition?.z || 0}
                    onChange={(e) => handleParameterChange('endPosition', {
                      ...(animationForm.parameters as any)?.endPosition,
                      z: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Z"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'circular':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.x || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      x: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.y || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      y: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.z || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      z: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Z"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.radius || 3}
                  onChange={(e) => handleParameterChange('radius', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Angle (°)</label>
                <input
                  type="number"
                  min="-360"
                  max="360"
                  value={(animationForm.parameters as any)?.startAngle || 0}
                  onChange={(e) => handleParameterChange('startAngle', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Angle (°)</label>
                <input
                  type="number"
                  min="-360"
                  max="360"
                  value={(animationForm.parameters as any)?.endAngle || 360}
                  onChange={(e) => handleParameterChange('endAngle', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
              <select
                value={(animationForm.parameters as any)?.plane || 'xy'}
                onChange={(e) => handleParameterChange('plane', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="xy">XY Plane</option>
                <option value="xz">XZ Plane</option>
                <option value="yz">YZ Plane</option>
              </select>
            </div>
          </div>
        )

      case 'random':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.x || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      x: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.y || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      y: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={(animationForm.parameters as any)?.center?.z || 0}
                    onChange={(e) => handleParameterChange('center', {
                      ...(animationForm.parameters as any)?.center,
                      z: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Z"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bounds (±)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={(animationForm.parameters as any)?.bounds?.x || 5}
                    onChange={(e) => handleParameterChange('bounds', {
                      ...(animationForm.parameters as any)?.bounds,
                      x: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={(animationForm.parameters as any)?.bounds?.y || 5}
                    onChange={(e) => handleParameterChange('bounds', {
                      ...(animationForm.parameters as any)?.bounds,
                      y: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Y"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={(animationForm.parameters as any)?.bounds?.z || 5}
                    onChange={(e) => handleParameterChange('bounds', {
                      ...(animationForm.parameters as any)?.bounds,
                      z: parseFloat(e.target.value)
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Z"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Speed</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={(animationForm.parameters as any)?.speed || 1}
                  onChange={(e) => handleParameterChange('speed', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Smoothness</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.smoothness || 0.5}
                  onChange={(e) => handleParameterChange('smoothness', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Frequency (Hz)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={(animationForm.parameters as any)?.updateFrequency || 10}
                onChange={(e) => handleParameterChange('updateFrequency', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )

      case 'spiral':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.center?.x || 0}
                  onChange={(e) => handleParameterChange('center', {
                    ...(animationForm.parameters as any)?.center,
                    x: parseFloat(e.target.value)
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="X"
                />
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.center?.y || 0}
                  onChange={(e) => handleParameterChange('center', {
                    ...(animationForm.parameters as any)?.center,
                    y: parseFloat(e.target.value)
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Y"
                />
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.center?.z || 0}
                  onChange={(e) => handleParameterChange('center', {
                    ...(animationForm.parameters as any)?.center,
                    z: parseFloat(e.target.value)
                  })}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Z"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Radius</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.startRadius || 1}
                  onChange={(e) => handleParameterChange('startRadius', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Radius</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.endRadius || 5}
                  onChange={(e) => handleParameterChange('endRadius', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rotations</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={(animationForm.parameters as any)?.rotations || 3}
                  onChange={(e) => handleParameterChange('rotations', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Direction</label>
                <select
                  value={(animationForm.parameters as any)?.direction || 'clockwise'}
                  onChange={(e) => handleParameterChange('direction', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="clockwise">Clockwise</option>
                  <option value="counterclockwise">Counterclockwise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Plane</label>
              <select
                value={(animationForm.parameters as any)?.plane || 'xy'}
                onChange={(e) => handleParameterChange('plane', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="xy">XY Plane</option>
                <option value="xz">XZ Plane</option>
                <option value="yz">YZ Plane</option>
              </select>
            </div>
          </div>
        )

      case 'elliptical':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.centerX || 0}
                  onChange={(e) => handleParameterChange('centerX', parseFloat(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="X"
                />
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.centerY || 0}
                  onChange={(e) => handleParameterChange('centerY', parseFloat(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Y"
                />
                <input
                  type="number"
                  step="0.1"
                  value={(animationForm.parameters as any)?.centerZ || 0}
                  onChange={(e) => handleParameterChange('centerZ', parseFloat(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Z"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Radius X</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.radiusX || 4}
                  onChange={(e) => handleParameterChange('radiusX', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Radius Y</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.radiusY || 2}
                  onChange={(e) => handleParameterChange('radiusY', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Radius Z</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={(animationForm.parameters as any)?.radiusZ || 0}
                  onChange={(e) => handleParameterChange('radiusZ', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Angle (°)</label>
                <input
                  type="number"
                  min="-360"
                  max="360"
                  value={(animationForm.parameters as any)?.startAngle || 0}
                  onChange={(e) => handleParameterChange('startAngle', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Angle (°)</label>
                <input
                  type="number"
                  min="-360"
                  max="360"
                  value={(animationForm.parameters as any)?.endAngle || 360}
                  onChange={(e) => handleParameterChange('endAngle', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        )

      case 'custom':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">ℹ️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-900">Custom Path Animation</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Custom animations use keyframes to define specific positions at specific times.
                    Use the Timeline view to add and edit keyframes for precise control.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interpolation Type</label>
              <select
                value={(animationForm.parameters as any)?.interpolation || 'linear'}
                onChange={(e) => handleParameterChange('interpolation', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="linear">Linear</option>
                <option value="bezier">Bezier (Smooth)</option>
                <option value="step">Step (No interpolation)</option>
              </select>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Keyframes:</strong> {keyframes.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Switch to Timeline view to manage keyframes
              </p>
            </div>
          </div>
        )

      case 'wave':
        return <WaveParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'lissajous':
        return <LissajousParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'helix':
        return <HelixParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'pendulum':
        return <PendulumParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'bounce':
        return <BounceParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'spring':
        return <SpringParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'bezier':
        return <BezierParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'catmull-rom':
        return <CatmullRomParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'zigzag':
        return <ZigzagParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'perlin-noise':
        return <PerlinNoiseParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'rose-curve':
        return <RoseCurveParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'epicycloid':
        return <EpicycloidParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'orbit':
        return <OrbitParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'formation':
        return <FormationParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'attract-repel':
        return <AttractRepelParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'doppler':
        return <DopplerParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'circular-scan':
        return <CircularScanParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      case 'zoom':
        return <ZoomParametersForm parameters={animationForm.parameters || {}} onParameterChange={handleParameterChange} />

      default:
        return (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-3xl">🎨</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {getAnimationInfo(type)?.label || type}
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    {getAnimationInfo(type)?.description}
                  </p>
                  <div className="bg-white/60 rounded-md p-3 mt-3">
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      ✅ This animation is fully implemented and ready to use!
                    </p>
                    <p className="text-xs text-gray-600">
                      Default parameters have been initialized with sensible values based on your track position.
                      Click <strong>"Save Animation"</strong> to apply, then <strong>"Play"</strong> to preview.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">📋 Current Parameters</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(animationForm.parameters || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-xs bg-white rounded px-3 py-2">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-900 font-mono">
                      {typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-800">
                <strong>💡 Pro Tip:</strong> Advanced parameter editing UI is coming soon. For now, you can:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Use the default parameters (already optimized)</li>
                  <li>Modify parameters programmatically via the animation store</li>
                  <li>Check the documentation in <code className="bg-amber-100 px-1 rounded">docs/NEW_ANIMATION_TYPES.md</code></li>
                </ul>
              </p>
            </div>
          </div>
        )
    }
  }

  if (!selectedTrack) {
    return (
      <div className="h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Animation Editor</h1>
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <Target className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tracks Selected</h3>
            <p className="text-gray-600 mb-2">Select one or more tracks from the track list to create animations</p>
            <p className="text-sm text-gray-500">💡 Tip: Use checkboxes or hold Ctrl while clicking to select multiple tracks</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Animation Editor</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md p-1 shadow-sm">
          <button
            onClick={() => setActiveWorkPane('preview')}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeWorkPane === 'preview'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            3D Preview
          </button>
          <button
            onClick={() => setActiveWorkPane('control')}
            disabled={!supportsControlPoints}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              activeWorkPane === 'control'
                ? 'bg-primary-50 text-primary-700 border border-primary-200'
                : supportsControlPoints
                  ? 'text-gray-600 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
            )}
          >
            Control Points
          </button>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            <AnimationControlButtons
              previewMode={previewMode}
              isAnimationPlaying={isAnimationPlaying}
              hasAnimation={!!currentAnimation}
              isCustomAnimation={animationForm.type === 'custom'}
              showKeyframeEditor={showKeyframeEditor}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              onPlay={handlePlayPreview}
              onStop={handleStopAnimation}
              onToggleKeyframeEditor={() => setShowKeyframeEditor(!showKeyframeEditor)}
              onLoadPreset={() => setShowPresetBrowser(true)}
              onSaveAsPreset={handleSaveAsPreset}
              canSavePreset={!!animationForm.name && !!animationForm.type}
            />

            <button
              onClick={handleSaveAnimation}
              disabled={!animationForm.name}
              className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Animation
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setIsFormPanelOpen(!isFormPanelOpen)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
            aria-expanded={isFormPanelOpen}
          >
            {isFormPanelOpen ? (
              <>
                <PanelRightClose className="w-4 h-4" />
                Hide Settings
              </>
            ) : (
              <>
                <PanelRightOpen className="w-4 h-4" />
                Show Settings
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-hidden">
        {isFormPanelOpen ? (
          <div className="flex flex-1 flex-col lg:flex-row gap-6 overflow-hidden">
            <div className="flex-1 min-w-0 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 rounded-t-lg">
                <p className="text-sm text-gray-600">
                  {activeWorkPane === 'preview' ? '3D preview of the current animation.' : 'Adjust control points to refine the path.'}
                </p>

                {animationForm.type === 'custom' && activeWorkPane === 'preview' && (
                  <button
                    onClick={() => setIsKeyframePlacementMode(!isKeyframePlacementMode)}
                    disabled={keyframes.length === 0}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      keyframes.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isKeyframePlacementMode
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                  >
                    {isKeyframePlacementMode ? '✓ Reposition Mode Active' : 'Reposition Keyframes'}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                {activeWorkPane === 'preview' ? previewPane : controlPaneContent}
              </div>
            </div>

            <div className="lg:w-4/12 bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Animation Settings</h2>
                <button
                  onClick={() => setIsFormPanelOpen(false)}
                  className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <PanelRightClose className="w-4 h-4" />
                  Close
                </button>
              </div>

              <div className="space-y-4">
                <SelectedTracksIndicator 
                  selectedTracks={selectedTrackObjects} 
                  onReorder={(reorderedIds: string[]) => {
                    console.log('🔄 Tracks reordered via drag-and-drop:', reorderedIds)
                    selectTracks(reorderedIds)
                  }}
                />

                {selectedTrackIds.length > 1 && (
                  <MultiTrackModeSelector
                    animationType={animationForm.type || 'linear'}
                    multiTrackMode={multiTrackMode}
                    phaseOffsetSeconds={phaseOffsetSeconds}
                    onModeChange={setMultiTrackMode}
                    onPhaseOffsetChange={setPhaseOffsetSeconds}
                    getCompatibleModes={getCompatibleModes}
                  />
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Animation Name</label>
                  <input
                    type="text"
                    value={animationForm.name || ''}
                    onChange={(e) => setAnimationForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter animation name"
                  />
                </div>

                <AnimationTypeSelector
                  selectedType={animationForm.type || 'linear'}
                  onTypeChange={handleAnimationTypeChange}
                  categories={animationCategories}
                  getAnimationInfo={getAnimationInfo}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="300"
                      step="0.1"
                      value={animationForm.duration || 10}
                      onChange={(e) => setAnimationForm(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Loop</label>
                      <p className="text-xs text-gray-500">Repeat animation when it ends</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationForm.loop || false}
                        onChange={(e) => setAnimationForm(prev => ({ ...prev, loop: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {animationForm.loop && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div>
                      <label className="text-sm font-medium text-blue-900">Ping-Pong Mode</label>
                      <p className="text-xs text-blue-700">Play forward then backward (bounce effect)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={animationForm.pingPong || false}
                        onChange={(e) => setAnimationForm(prev => ({ ...prev, pingPong: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-medium text-gray-900">Animation Parameters</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUseTrackPosition}
                        disabled={!selectedTrack}
                        className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Set center/start position to track's initial position"
                      >
                        Use Track Position
                      </button>
                      <button
                        onClick={handleResetToDefaults}
                        disabled={!animationForm.type}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Reset all parameters to default values"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {renderAnimationParameters()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">3D preview of the current animation.</p>
                {animationForm.type === 'custom' && (
                  <button
                    onClick={() => setIsKeyframePlacementMode(!isKeyframePlacementMode)}
                    disabled={keyframes.length === 0}
                    className={cn(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      keyframes.length === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isKeyframePlacementMode
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    )}
                  >
                    {isKeyframePlacementMode ? '✓ Reposition Mode Active' : 'Reposition Keyframes'}
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                {previewPane}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">Adjust control points to refine the path.</p>
              </div>
              <div className="flex-1 overflow-hidden">
                {controlPaneContent}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyframe Editor */}
      {showKeyframeEditor && animationForm.type === 'custom' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Keyframe Editor</h2>
            <button
              onClick={() => handleKeyframeAdd(animationForm.duration || 10, { x: 0, y: 0, z: 0 })}
              className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Keyframe
            </button>
          </div>

          <div className="space-y-3">
            {keyframes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No keyframes defined</p>
            ) : (
              keyframes.map((keyframe, index) => {
                const isSelected = keyframe.id === selectedKeyframeId
                return (
                <div 
                  key={keyframe.id} 
                  onClick={() => setSelectedKeyframeId(isSelected ? null : keyframe.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-green-50 border-green-500 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-medium ${
                        isSelected ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {isSelected ? '✓ ' : ''}Keyframe {index + 1}
                      </div>
                      {isSelected && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleKeyframeRemove(keyframe.id)
                      }}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete keyframe"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time (s)</label>
                      <input
                        type="number"
                        min="0"
                        max={animationForm.duration || 10}
                        step="0.1"
                        value={keyframe.time}
                        onChange={(e) => handleKeyframeUpdate(keyframe.id, { time: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={keyframe.position.x}
                        onChange={(e) => handleKeyframeUpdate(keyframe.id, {
                          position: { ...keyframe.position, x: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={keyframe.position.y}
                        onChange={(e) => handleKeyframeUpdate(keyframe.id, {
                          position: { ...keyframe.position, y: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Z</label>
                      <input
                        type="number"
                        step="0.1"
                        value={keyframe.position.z}
                        onChange={(e) => handleKeyframeUpdate(keyframe.id, {
                          position: { ...keyframe.position, z: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>
      )}

      {/* Preset Browser Modal */}
      {showPresetBrowser && (
        <PresetBrowser
          onSelectPreset={handleLoadPreset}
          onClose={() => setShowPresetBrowser(false)}
        />
      )}

      {/* Preset Name Dialog */}
      <PresetNameDialog
        isOpen={showPresetNameDialog}
        defaultName={animationForm.name || 'My Preset'}
        onConfirm={handleConfirmPresetSave}
        onCancel={() => setShowPresetNameDialog(false)}
      />
    </div>
  )
}

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Position, AnimationType, AnimationParameters, ControlPoint } from '@/types'
import { PlaneEditor } from './PlaneEditor'
import { Maximize2, Minimize2, Grid3X3, Move, RotateCcw } from 'lucide-react'
import { themeColors } from '@/theme'
import { calculateBarycenter } from '../../utils/barycentricCalculations'

export type ViewPlane = 'xy' | 'xz' | 'yz'

interface ControlPointEditorProps {
  animationType: AnimationType
  parameters: AnimationParameters
  keyframes: any[] // Keyframe array for custom animations
  onParameterChange: (key: string, value: any) => void
  onKeyframeUpdate: (keyframeId: string, updates: any) => void
  className?: string
  // Add track position as a prop so we can display it as reference
  trackPosition?: Position
  // Support for dynamic point management
  onRemoveControlPoints?: (pointIds: string[]) => void
  // Multitrack mode support
  multiTrackMode?: 'identical' | 'position-relative' | 'phase-offset' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  selectedTracks?: string[]
  trackPositions?: Record<string, Position>
  trackColors?: Record<string, { r: number; g: number; b: number; a: number }>
  trackNames?: Record<string, string>
  activeEditingTrackIds?: string[]
  allActiveTrackParameters?: Record<string, AnimationParameters>
}

export const ControlPointEditor: React.FC<ControlPointEditorProps> = ({
  animationType,
  parameters,
  keyframes,
  onParameterChange,
  onKeyframeUpdate,
  className = '',
  trackPosition,
  onRemoveControlPoints,
  multiTrackMode = 'identical',
  selectedTracks = [],
  trackPositions = {},
  trackColors = {},
  trackNames = {},
  activeEditingTrackIds = [],
  allActiveTrackParameters = {}
}) => {
  const [activePlane, setActivePlane] = useState<ViewPlane>('xy')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [draggedPoint, setDraggedPoint] = useState<string | null>(null)
  const [selectedPointIds, setSelectedPointIds] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)

  // Helper function to add control points for a specific track
  const addControlPointsForTrack = (points: ControlPoint[], animType: AnimationType, trackParams: any, prefix: string, trackId: string) => {
    switch (animType) {
      case 'linear':
        if (trackParams.startPosition) {
          points.push({ id: `${prefix}-linear-start`, position: trackParams.startPosition, type: 'start', animationType: animType, trackId })
        }
        if (trackParams.endPosition) {
          points.push({ id: `${prefix}-linear-end`, position: trackParams.endPosition, type: 'end', animationType: animType, trackId })
        }
        break

      case 'bezier':
        if (trackParams.bezierStart) {
          points.push({ id: `${prefix}-bezier-start`, position: trackParams.bezierStart, type: 'start', animationType: animType, trackId })
        }
        if (trackParams.bezierControl1) {
          points.push({ id: `${prefix}-bezier-control1`, position: trackParams.bezierControl1, type: 'control', animationType: animType, index: 0, trackId })
        }
        if (trackParams.bezierControl2) {
          points.push({ id: `${prefix}-bezier-control2`, position: trackParams.bezierControl2, type: 'control', animationType: animType, index: 1, trackId })
        }
        if (trackParams.bezierEnd) {
          points.push({ id: `${prefix}-bezier-end`, position: trackParams.bezierEnd, type: 'end', animationType: animType, trackId })
        }
        break

      case 'catmull-rom':
        if (trackParams.controlPoints && Array.isArray(trackParams.controlPoints)) {
          trackParams.controlPoints.forEach((point: Position, index: number) => {
            points.push({
              id: `${prefix}-catmull-point-${index}`,
              position: point,
              type: index === 0 ? 'start' : index === trackParams.controlPoints!.length - 1 ? 'end' : 'control',
              animationType: animType,
              index,
              trackId
            })
          })
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
        if (trackParams.center) {
          points.push({ id: `${prefix}-center`, position: trackParams.center, type: 'control', animationType: animType, index: 0, trackId })
        }
        break

      case 'zigzag':
        if (trackParams.zigzagStart) {
          points.push({ id: `${prefix}-zigzag-start`, position: trackParams.zigzagStart, type: 'start', animationType: animType, trackId })
        }
        if (trackParams.zigzagEnd) {
          points.push({ id: `${prefix}-zigzag-end`, position: trackParams.zigzagEnd, type: 'end', animationType: animType, trackId })
        }
        break

      case 'helix':
        if (trackParams.axisStart) {
          points.push({ id: `${prefix}-helix-axis-start`, position: trackParams.axisStart, type: 'start', animationType: animType, trackId })
        }
        if (trackParams.axisEnd) {
          points.push({ id: `${prefix}-helix-axis-end`, position: trackParams.axisEnd, type: 'end', animationType: animType, trackId })
        }
        break

      case 'pendulum':
        if (trackParams.anchorPoint) {
          points.push({ id: `${prefix}-pendulum-anchor`, position: trackParams.anchorPoint, type: 'control', animationType: animType, trackId })
        }
        break

      case 'spring':
        if (trackParams.restPosition) {
          points.push({ id: `${prefix}-spring-rest`, position: trackParams.restPosition, type: 'control', animationType: animType, trackId })
        }
        break

      case 'attract-repel':
        if (trackParams.targetPosition) {
          points.push({ id: `${prefix}-attract-target`, position: trackParams.targetPosition, type: 'control', animationType: animType, trackId })
        }
        break

      case 'zoom':
        if (trackParams.zoomCenter) {
          points.push({ id: `${prefix}-zoom-center`, position: trackParams.zoomCenter, type: 'control', animationType: animType, trackId })
        }
        break
    }
  }

  // Convert animation parameters to control points based on animation type
  const getControlPoints = useCallback((): ControlPoint[] => {
    const points: ControlPoint[] = []

    // Handle multitrack modes - show individual track positions for position-relative modes
    // BUT: Only if there are actually MULTIPLE tracks (2+)
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && selectedTracks.length > 1) {
      selectedTracks.forEach((trackId, index) => {
        const trackPos = trackPositions[trackId]
        if (trackPos) {
          points.push({
            id: `track-${trackId}`,
            position: trackPos,
            type: 'control',
            animationType: 'position-relative' as AnimationType,
            index: index
          })
        }
      })

      // Also show the animation center/control points for the ACTIVE track
      // This allows editing the active track's animation parameters
      console.log('🎯 Position-relative mode: showing track positions + active track animation points')
      // Continue to add animation-specific control points below
    }

    // Handle isobarycenter mode - show barycenter + track positions
    // Only relevant when there are multiple tracks
    if (multiTrackMode === 'isobarycenter' && selectedTracks.length > 1) {
      // Calculate barycenter from all selected tracks
      const tracks = selectedTracks.map(id => {
        const pos = trackPositions[id]
        return pos ? { id, position: pos } : null
      }).filter(Boolean) as Array<{ id: string; position: Position }>
      
      if (tracks.length > 0) {
        const barycenter = calculateBarycenter(tracks)
        
        // Add barycenter as a special control point (this will receive animation)
        points.push({
          id: 'isobarycenter',
          position: barycenter,
          type: 'control',
          animationType: 'isobarycenter' as AnimationType,
          index: -2 // Special index for barycenter
        })
        
        // Also show individual track positions as reference
        selectedTracks.forEach((trackId, index) => {
          const trackPos = trackPositions[trackId]
          if (trackPos) {
            points.push({
              id: `track-${trackId}`,
              position: trackPos,
              type: 'control',
              animationType: 'position-relative' as AnimationType,
              index: index
            })
          }
        })
        
        console.log('🎯 Isobarycenter mode: showing barycenter + track positions')
      }
      
      // Continue to add animation-specific control points below
    }

    // Always include track position as a reference point for other modes
    // BUT: Skip if track is at origin (0,0,0) to avoid confusion with origin marker
    if (trackPosition) {
      const isAtOrigin = trackPosition.x === 0 && trackPosition.y === 0 && trackPosition.z === 0
      
      if (!isAtOrigin) {
        points.push({
          id: 'track-position',
          position: trackPosition,
          type: 'start', // Use 'start' type but with special styling
          animationType: 'reference' as AnimationType,
          index: -1 // Special index for reference point
        })
      }
    }

    console.log('🎯 ControlPointEditor - Animation type:', animationType)
    console.log('🎯 ControlPointEditor - Parameters keys:', Object.keys(parameters || {}))
    console.log('🎯 ControlPointEditor - Track position:', trackPosition)
    console.log('🎯 ControlPointEditor - Active editing tracks:', activeEditingTrackIds)

    // If tracks are actively being edited in position-relative mode, show control points for ALL of them
    if ((multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0 && Object.keys(allActiveTrackParameters).length > 0) {
      console.log('🎯 Showing control points for', activeEditingTrackIds.length, 'active editing tracks')
      console.log('🎯 allActiveTrackParameters keys:', Object.keys(allActiveTrackParameters))
      
      activeEditingTrackIds.forEach((trackId, trackIndex) => {
        const trackParams = allActiveTrackParameters[trackId]
        if (!trackParams) {
          console.warn('⚠️ No parameters found for track:', trackId)
          return
        }
        console.log('🎯 Adding control points for track:', trackId, 'with params:', Object.keys(trackParams))
        const trackPrefix = `track${trackIndex}`
        
        // Add control points for this specific track based on animation type
        addControlPointsForTrack(points, animationType, trackParams, trackPrefix, trackId)
      })
      
      console.log('🎯 Total control points generated:', points.length)
      // Return early - we've added all points for all active tracks
      return points
    }

    switch (animationType) {
      case 'bezier':
        console.log('🎯 Bézier parameters:', {
          bezierStart: parameters.bezierStart,
          bezierControl1: parameters.bezierControl1,
          bezierControl2: parameters.bezierControl2,
          bezierEnd: parameters.bezierEnd
        })

        if (parameters.bezierStart) {
          points.push({
            id: 'bezier-start',
            position: parameters.bezierStart,
            type: 'start',
            animationType
          })
        }
        if (parameters.bezierControl1) {
          points.push({
            id: 'bezier-control1',
            position: parameters.bezierControl1,
            type: 'control',
            animationType,
            index: 0
          })
        }
        if (parameters.bezierControl2) {
          points.push({
            id: 'bezier-control2',
            position: parameters.bezierControl2,
            type: 'control',
            animationType,
            index: 1
          })
        }
        if (parameters.bezierEnd) {
          points.push({
            id: 'bezier-end',
            position: parameters.bezierEnd,
            type: 'end',
            animationType
          })
        }
        break

      case 'catmull-rom':
        console.log('🎯 Catmull-Rom parameters:', {
          controlPoints: parameters.controlPoints
        })

        if (parameters.controlPoints && Array.isArray(parameters.controlPoints)) {
          parameters.controlPoints.forEach((point, index) => {
            points.push({
              id: `catmull-point-${index}`,
              position: point,
              type: index === 0 ? 'start' : index === parameters.controlPoints!.length - 1 ? 'end' : 'control',
              animationType,
              index
            })
          })
        }
        break

      case 'zigzag':
        console.log('🎯 Zigzag parameters:', {
          zigzagStart: parameters.zigzagStart,
          zigzagEnd: parameters.zigzagEnd
        })

        if (parameters.zigzagStart) {
          points.push({
            id: 'zigzag-start',
            position: parameters.zigzagStart,
            type: 'start',
            animationType
          })
        }
        if (parameters.zigzagEnd) {
          points.push({
            id: 'zigzag-end',
            position: parameters.zigzagEnd,
            type: 'end',
            animationType
          })
        }
        break

      case 'doppler':
        console.log('🎯 Doppler parameters:', {
          pathStart: parameters.pathStart,
          pathEnd: parameters.pathEnd
        })

        if (parameters.pathStart) {
          points.push({
            id: 'doppler-start',
            position: parameters.pathStart,
            type: 'start',
            animationType
          })
        }
        if (parameters.pathEnd) {
          points.push({
            id: 'doppler-end',
            position: parameters.pathEnd,
            type: 'end',
            animationType
          })
        }
        break

      case 'pendulum':
        console.log('🎯 Pendulum parameters:', {
          anchorPoint: parameters.anchorPoint,
          length: parameters.pendulumLength
        })

        if (parameters.anchorPoint) {
          points.push({
            id: 'pendulum-anchor',
            position: parameters.anchorPoint,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'spring':
        console.log('🎯 Spring parameters:', {
          restPosition: parameters.restPosition,
          stiffness: parameters.springStiffness
        })

        if (parameters.restPosition) {
          points.push({
            id: 'spring-rest',
            position: parameters.restPosition,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'attract-repel':
        console.log('🎯 Attract/Repel parameters:', {
          targetPosition: parameters.targetPosition,
          strength: parameters.attractionStrength
        })

        if (parameters.targetPosition) {
          points.push({
            id: 'attract-target',
            position: parameters.targetPosition,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'orbit':
        console.log('🎯 Orbit parameters:', {
          center: parameters.center,
          radius: parameters.radius
        })

        if (parameters.center) {
          points.push({
            id: 'orbit-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'circular-scan':
        console.log('🎯 Circular Scan parameters:', {
          center: parameters.center,
          radius: parameters.radius
        })

        if (parameters.center) {
          points.push({
            id: 'scan-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'linear':
        console.log('🎯 Linear parameters:', {
          startPosition: parameters.startPosition,
          endPosition: parameters.endPosition
        })

        if (parameters.startPosition) {
          points.push({
            id: 'linear-start',
            position: parameters.startPosition,
            type: 'start',
            animationType
          })
        }
        if (parameters.endPosition) {
          points.push({
            id: 'linear-end',
            position: parameters.endPosition,
            type: 'end',
            animationType
          })
        }
        break

      case 'circular':
        console.log('🎯 Circular parameters:', {
          center: parameters.center,
          radius: parameters.radius
        })

        if (parameters.center) {
          points.push({
            id: 'circular-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'elliptical':
        console.log('🎯 Elliptical parameters:', {
          center: parameters.center,
          radiusX: parameters.radiusX,
          radiusY: parameters.radiusY,
          radiusZ: parameters.radiusZ
        })

        if (parameters.center) {
          points.push({
            id: 'elliptical-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'spiral':
        console.log('🎯 Spiral parameters:', {
          center: parameters.center,
          startRadius: parameters.startRadius,
          endRadius: parameters.endRadius
        })

        if (parameters.center) {
          points.push({
            id: 'spiral-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'random':
        console.log('🎯 Random parameters:', {
          bounds: parameters.bounds,
          center: parameters.center
        })

        // Show center point if available, or calculate from bounds
        let randomCenter: Position | undefined
        if (parameters.center) {
          randomCenter = parameters.center
        } else if (parameters.bounds) {
          randomCenter = {
            x: parameters.bounds.x / 2,
            y: parameters.bounds.y / 2,
            z: parameters.bounds.z / 2
          }
        }

        if (randomCenter) {
          points.push({
            id: 'random-center',
            position: randomCenter,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'wave':
        console.log('🎯 Wave parameters:', {
          amplitude: parameters.amplitude,
          center: parameters.center
        })

        if (parameters.center) {
          points.push({
            id: 'wave-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }

        // Show amplitude vectors if amplitude is defined
        if (parameters.amplitude && parameters.center) {
          const center = parameters.center
          const amp = parameters.amplitude

          // Show amplitude in X direction
          if (amp.x !== 0) {
            points.push({
              id: 'wave-amp-x',
              position: { x: center.x + amp.x, y: center.y, z: center.z },
              type: 'control',
              animationType,
              index: 1
            })
          }

          // Show amplitude in Y direction
          if (amp.y !== 0) {
            points.push({
              id: 'wave-amp-y',
              position: { x: center.x, y: center.y + amp.y, z: center.z },
              type: 'control',
              animationType,
              index: 2
            })
          }

          // Show amplitude in Z direction
          if (amp.z !== 0) {
            points.push({
              id: 'wave-amp-z',
              position: { x: center.x, y: center.y, z: center.z + amp.z },
              type: 'control',
              animationType,
              index: 3
            })
          }
        }
        break

      case 'lissajous':
        console.log('🎯 Lissajous parameters:', {
          center: parameters.center,
          amplitudeX: parameters.amplitudeX,
          amplitudeY: parameters.amplitudeY,
          amplitudeZ: parameters.amplitudeZ
        })

        if (parameters.center) {
          points.push({
            id: 'lissajous-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }

        // Show amplitude vectors if defined
        if (parameters.center) {
          const center = parameters.center

          if (parameters.amplitudeX !== undefined && parameters.amplitudeX !== 0) {
            points.push({
              id: 'lissajous-amp-x',
              position: { x: center.x + parameters.amplitudeX, y: center.y, z: center.z },
              type: 'control',
              animationType,
              index: 1
            })
          }

          if (parameters.amplitudeY !== undefined && parameters.amplitudeY !== 0) {
            points.push({
              id: 'lissajous-amp-y',
              position: { x: center.x, y: center.y + parameters.amplitudeY, z: center.z },
              type: 'control',
              animationType,
              index: 2
            })
          }

          if (parameters.amplitudeZ !== undefined && parameters.amplitudeZ !== 0) {
            points.push({
              id: 'lissajous-amp-z',
              position: { x: center.x, y: center.y, z: center.z + parameters.amplitudeZ },
              type: 'control',
              animationType,
              index: 3
            })
          }
        }
        break

      case 'helix':
        console.log('🎯 Helix parameters:', {
          axisStart: parameters.axisStart,
          axisEnd: parameters.axisEnd,
          center: parameters.center
        })

        // Show axis start and end points for helix axis
        if (parameters.axisStart) {
          points.push({
            id: 'helix-axis-start',
            position: parameters.axisStart,
            type: 'start',
            animationType
          })
        }

        if (parameters.axisEnd) {
          points.push({
            id: 'helix-axis-end',
            position: parameters.axisEnd,
            type: 'end',
            animationType
          })
        }

        // Show center point if defined
        if (parameters.center) {
          points.push({
            id: 'helix-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'perlin-noise':
        console.log('🎯 Perlin Noise parameters:', {
          center: parameters.center,
          bounds: parameters.bounds
        })

        // Show center point if available, or calculate from bounds
        let noiseCenter: Position | undefined
        if (parameters.center) {
          noiseCenter = parameters.center
        } else if (parameters.bounds) {
          noiseCenter = {
            x: parameters.bounds.x / 2,
            y: parameters.bounds.y / 2,
            z: parameters.bounds.z / 2
          }
        }

        if (noiseCenter) {
          points.push({
            id: 'perlin-center',
            position: noiseCenter,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'rose-curve':
        console.log('🎯 Rose Curve parameters:', {
          center: parameters.center,
          radius: parameters.roseRadius
        })

        if (parameters.center) {
          points.push({
            id: 'rose-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'epicycloid':
        console.log('🎯 Epicycloid parameters:', {
          fixedCircleRadius: parameters.fixedCircleRadius,
          rollingCircleRadius: parameters.rollingCircleRadius,
          center: parameters.center
        })

        // Show center point of the fixed circle
        if (parameters.center) {
          points.push({
            id: 'epicycloid-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      case 'formation':
        console.log('🎯 Formation parameters:', {
          center: parameters.center,
          leaderTrackId: parameters.leaderTrackId
        })

        if (parameters.center) {
          points.push({
            id: 'formation-center',
            position: parameters.center,
            type: 'control',
            animationType,
            index: 0
          })
        }
        break

      default:
        console.log('🎯 No control points for animation type:', animationType)
        // For animation types without specific control points, show track position as reference
        break
    }

    console.log('🎯 Final control points:', points)
    console.log('🎯 Selectable points (excluding index=-1):', points.filter(p => p.index !== -1 && p.id !== 'track-position'))
    console.log('🎯 Point details:', points.map(p => ({ id: p.id, type: p.type, index: p.index, pos: p.position })))
    return points
  }, [animationType, parameters, keyframes, trackPosition, multiTrackMode, activeEditingTrackIds, allActiveTrackParameters, selectedTracks, trackPositions])

  const controlPoints = getControlPoints()

  // Debug: Log what we're actually getting
  console.log('🎯 ControlPointEditor - Final controlPoints array:', controlPoints)
  console.log('🎯 ControlPointEditor - controlPoints.length:', controlPoints.length)
  console.log('🎯 ControlPointEditor - hasControlPoints:', controlPoints.length > 0)

  const hasControlPoints = controlPoints.length > 0

  console.log('🎯 ControlPointEditor - About to render XYEditor with controlPoints:', controlPoints.length)

  if (!hasControlPoints) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${themeColors.background.primary} border ${themeColors.border.primary} rounded-lg p-8 ${className}`}>
        <Grid3X3 className={`w-12 h-12 ${themeColors.text.disabled} mb-4`} />
        <p className={themeColors.text.muted}>
          {animationType === 'custom'
            ? 'Add keyframes to enable visual editing'
            : 'This animation type does not use control points'
          }
        </p>
      </div>
    )
  }

  // Filter out reference point for status display
  const animationPoints = controlPoints.filter(p => p.index !== -1)
  const hasAnimationPoints = animationPoints.length > 0

  // Handle control point updates
  const handleControlPointUpdate = useCallback((pointId: string, newPosition: Position) => {
    const point = controlPoints.find(p => p.id === pointId)
    if (!point) return

    // Handle multi-track control point updates (points with trackId)
    if (point.trackId) {
      console.log('🎯 Multi-track point update:', pointId, 'for track:', point.trackId, newPosition)
      // The point has a trackId, which means it's part of multi-track editing
      // Extract the parameter key from the point ID (remove the track prefix)
      let paramKey = ''
      
      // Determine which parameter to update based on point ID pattern
      if (pointId.includes('-linear-start')) paramKey = 'startPosition'
      else if (pointId.includes('-linear-end')) paramKey = 'endPosition'
      else if (pointId.includes('-bezier-start')) paramKey = 'bezierStart'
      else if (pointId.includes('-bezier-control1')) paramKey = 'bezierControl1'
      else if (pointId.includes('-bezier-control2')) paramKey = 'bezierControl2'
      else if (pointId.includes('-bezier-end')) paramKey = 'bezierEnd'
      else if (pointId.includes('-center')) paramKey = 'center'
      else if (pointId.includes('-zigzag-start')) paramKey = 'zigzagStart'
      else if (pointId.includes('-zigzag-end')) paramKey = 'zigzagEnd'
      else if (pointId.includes('-helix-axis-start')) paramKey = 'axisStart'
      else if (pointId.includes('-helix-axis-end')) paramKey = 'axisEnd'
      else if (pointId.includes('-pendulum-anchor')) paramKey = 'anchorPoint'
      else if (pointId.includes('-spring-rest')) paramKey = 'restPosition'
      else if (pointId.includes('-attract-target')) paramKey = 'targetPosition'
      else if (pointId.includes('-zoom-center')) paramKey = 'zoomCenter'
      else if (pointId.includes('-catmull-point-')) {
        // Special handling for catmull-rom control points
        paramKey = 'controlPoints'
      }
      
      if (paramKey) {
        console.log('🎯 Updating parameter:', paramKey, 'for multi-track editing')
        onParameterChange(paramKey, newPosition)
      }
      return
    }

    // Handle isobarycenter mode - dragging barycenter updates animation center
    if (pointId === 'isobarycenter' && multiTrackMode === 'isobarycenter') {
      console.log('🎯 Updating isobarycenter position:', newPosition)
      // Update the animation center/startPosition that will be applied to barycenter
      if (parameters.center !== undefined) {
        onParameterChange('center', newPosition)
      } else if (parameters.startPosition !== undefined) {
        onParameterChange('startPosition', newPosition)
      }
      return
    }

    // Handle multitrack position-relative modes
    if (pointId.startsWith('track-') && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative')) {
      const trackId = pointId.replace('track-', '')
      // For position-relative modes, dragging a track position means updating its center/start
      // Only update if this track is in the active editing tracks
      if (activeEditingTrackIds.includes(trackId)) {
        console.log('🎯 Updating active track center:', trackId, newPosition)
        // Update the center/startPosition parameter for this track
        if (parameters.center !== undefined) {
          onParameterChange('center', newPosition)
        } else if (parameters.startPosition !== undefined) {
          onParameterChange('startPosition', newPosition)
        }
      } else {
        console.log('🎯 Track not active for editing:', trackId)
      }
      return
    }

    switch (animationType) {
      case 'bezier':
        if (pointId === 'bezier-start' && parameters.bezierStart) {
          onParameterChange('bezierStart', newPosition)
        } else if (pointId === 'bezier-control1' && parameters.bezierControl1) {
          onParameterChange('bezierControl1', newPosition)
        } else if (pointId === 'bezier-control2' && parameters.bezierControl2) {
          onParameterChange('bezierControl2', newPosition)
        } else if (pointId === 'bezier-end' && parameters.bezierEnd) {
          onParameterChange('bezierEnd', newPosition)
        }
        break

      case 'catmull-rom':
        if (parameters.controlPoints && point.index !== undefined) {
          const updatedPoints = [...parameters.controlPoints]
          updatedPoints[point.index] = newPosition
          onParameterChange('controlPoints', updatedPoints)
        }
        break

      case 'zigzag':
        if (pointId === 'zigzag-start' && parameters.zigzagStart) {
          onParameterChange('zigzagStart', newPosition)
        } else if (pointId === 'zigzag-end' && parameters.zigzagEnd) {
          onParameterChange('zigzagEnd', newPosition)
        }
        break

      case 'pendulum':
        if (pointId === 'pendulum-anchor' && parameters.anchorPoint) {
          onParameterChange('anchorPoint', newPosition)
        }
        break

      case 'spring':
        if (pointId === 'spring-rest' && parameters.restPosition) {
          onParameterChange('restPosition', newPosition)
        }
        break

      case 'attract-repel':
        if (pointId === 'attract-target' && parameters.targetPosition) {
          onParameterChange('targetPosition', newPosition)
        }
        break

      case 'orbit':
        if (pointId === 'orbit-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'circular-scan':
        if (pointId === 'scan-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'linear':
        if (pointId === 'linear-start' && parameters.startPosition) {
          onParameterChange('startPosition', newPosition)
        } else if (pointId === 'linear-end' && parameters.endPosition) {
          onParameterChange('endPosition', newPosition)
        }
        break

      case 'circular':
        if (pointId === 'circular-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'elliptical':
        if (pointId === 'elliptical-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'spiral':
        if (pointId === 'spiral-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'random':
        if (pointId === 'random-center') {
          // Update center if it exists, otherwise update bounds to reflect new center
          if (parameters.center) {
            onParameterChange('center', newPosition)
          } else if (parameters.bounds) {
            // Calculate new bounds based on new center
            const oldCenter = {
              x: parameters.bounds.x / 2,
              y: parameters.bounds.y / 2,
              z: parameters.bounds.z / 2
            }
            const offset = {
              x: newPosition.x - oldCenter.x,
              y: newPosition.y - oldCenter.y,
              z: newPosition.z - oldCenter.z
            }
            onParameterChange('bounds', {
              x: parameters.bounds.x + offset.x * 2,
              y: parameters.bounds.y + offset.y * 2,
              z: parameters.bounds.z + offset.z * 2
            })
          }
        }
        break

      case 'wave':
        if (pointId === 'wave-center' && parameters.center) {
          onParameterChange('center', newPosition)
        } else if (pointId === 'wave-amp-x' && parameters.amplitude && parameters.center) {
          // Update amplitude X component
          onParameterChange('amplitude', {
            ...parameters.amplitude,
            x: newPosition.x - parameters.center.x
          })
        } else if (pointId === 'wave-amp-y' && parameters.amplitude && parameters.center) {
          // Update amplitude Y component
          onParameterChange('amplitude', {
            ...parameters.amplitude,
            y: newPosition.y - parameters.center.y
          })
        } else if (pointId === 'wave-amp-z' && parameters.amplitude && parameters.center) {
          // Update amplitude Z component
          onParameterChange('amplitude', {
            ...parameters.amplitude,
            z: newPosition.z - parameters.center.z
          })
        }
        break

      case 'bounce':
        if (pointId === 'bounce-start' && parameters.startPosition) {
          onParameterChange('startPosition', newPosition)
        } else if (pointId === 'bounce-ground' && parameters.groundLevel !== undefined && parameters.startPosition) {
          // Update ground level based on Y position difference
          const heightDiff = newPosition.y - parameters.startPosition.y
          onParameterChange('groundLevel', parameters.groundLevel + heightDiff)
        }
        break

      case 'lissajous':
        if (pointId === 'lissajous-center' && parameters.center) {
          onParameterChange('center', newPosition)
        } else if (pointId === 'lissajous-amp-x' && parameters.amplitudeX !== undefined && parameters.center) {
          onParameterChange('amplitudeX', newPosition.x - parameters.center.x)
        } else if (pointId === 'lissajous-amp-y' && parameters.amplitudeY !== undefined && parameters.center) {
          onParameterChange('amplitudeY', newPosition.y - parameters.center.y)
        } else if (pointId === 'lissajous-amp-z' && parameters.amplitudeZ !== undefined && parameters.center) {
          onParameterChange('amplitudeZ', newPosition.z - parameters.center.z)
        }
        break

      case 'helix':
        if (pointId === 'helix-axis-start' && parameters.axisStart) {
          onParameterChange('axisStart', newPosition)
        } else if (pointId === 'helix-axis-end' && parameters.axisEnd) {
          onParameterChange('axisEnd', newPosition)
        } else if (pointId === 'helix-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'perlin-noise':
        if (pointId === 'perlin-center') {
          if (parameters.center) {
            onParameterChange('center', newPosition)
          } else if (parameters.bounds) {
            // Update bounds to reflect new center
            const oldCenter = {
              x: parameters.bounds.x / 2,
              y: parameters.bounds.y / 2,
              z: parameters.bounds.z / 2
            }
            const offset = {
              x: newPosition.x - oldCenter.x,
              y: newPosition.y - oldCenter.y,
              z: newPosition.z - oldCenter.z
            }
            onParameterChange('bounds', {
              x: parameters.bounds.x + offset.x * 2,
              y: parameters.bounds.y + offset.y * 2,
              z: parameters.bounds.z + offset.z * 2
            })
          }
        }
        break

      case 'rose-curve':
        if (pointId === 'rose-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'epicycloid':
        if (pointId === 'epicycloid-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break

      case 'formation':
        if (pointId === 'formation-center' && parameters.center) {
          onParameterChange('center', newPosition)
        }
        break
    }
  }, [animationType, parameters, controlPoints, onParameterChange, onKeyframeUpdate])

  // Handle control point addition (for Catmull-Rom)
  const handleAddControlPoint = useCallback((position: Position) => {
    if (animationType === 'catmull-rom' && parameters.controlPoints) {
      const updatedPoints = [...parameters.controlPoints, position]
      onParameterChange('controlPoints', updatedPoints)
    }
  }, [animationType, parameters.controlPoints, onParameterChange])

  // Handle control point removal (for Catmull-Rom and Custom)
  const handleRemoveControlPoint = useCallback((pointId: string) => {
    const point = controlPoints.find(p => p.id === pointId)
    if (!point) return

    if (animationType === 'catmull-rom' && parameters.controlPoints && point.index !== undefined) {
      const updatedPoints = parameters.controlPoints.filter((_, index) => index !== point.index)
      onParameterChange('controlPoints', updatedPoints)
    } else if (animationType === 'custom' && point.id) {
      // Remove keyframe - this would need to be handled by the parent component
      console.log('Remove keyframe:', pointId)
    }
  }, [animationType, parameters.controlPoints, controlPoints, onParameterChange])

  // Handle removal of multiple selected points
  const handleRemoveControlPoints = useCallback((pointIds: string[]) => {
    if (!pointIds.length) return

    // For now, just remove the first point (can be enhanced to remove multiple)
    // This is a simplified implementation - in a full implementation, you'd need to
    // handle removing multiple points from arrays while maintaining proper indexing
    const pointId = pointIds[0]
    handleRemoveControlPoint(pointId)

    // Clear selection after removal
    setSelectedPointIds([])
  }, [handleRemoveControlPoint])

  // Render the appropriate plane editor
  const renderPlaneEditor = () => {
    const commonProps = {
      plane: activePlane,
      controlPoints,
      zoom,
      panOffset,
      showGrid,
      isDragging,
      draggedPoint,
      onControlPointUpdate: handleControlPointUpdate,
      onAddControlPoint: handleAddControlPoint,
      onRemoveControlPoints: onRemoveControlPoints,
      onDragStart: (pointId: string) => setDraggedPoint(pointId),
      onDragEnd: () => setDraggedPoint(null),
      onZoomChange: setZoom,
      onPanChange: setPanOffset,
      onResetView: () => {
        setZoom(1)
        setPanOffset({ x: 0, y: 0 })
      },
      onSelectionChange: setSelectedPointIds,
      selectedPointIds,
      trackPosition,
      animationType,
      animationParameters: parameters,
      trackColors,
      trackNames,
      // Multi-track path rendering
      activeEditingTrackIds,
      allActiveTrackParameters,
      multiTrackMode
    }

    return <PlaneEditor {...commonProps} />
  }

  return (
    <div className={`flex flex-col overflow-hidden ${themeColors.background.elevated} border ${themeColors.border.primary} rounded-lg ${className}`}>
      {/* Header Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${themeColors.border.primary}`}>
        <div className="flex items-center gap-4">
          <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>Control Points</h3>
          
          {/* Active Track Indicator for Position-Relative Mode */}
          {(multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') && activeEditingTrackIds.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-400 dark:border-green-600 rounded-md text-xs font-medium">
              <span className="font-bold">✏️</span>
              <span>
                {activeEditingTrackIds.length === 1 
                  ? `Editing track ${selectedTracks.indexOf(activeEditingTrackIds[0]) + 1} of ${selectedTracks.length}`
                  : `Editing ${activeEditingTrackIds.length} tracks simultaneously`
                }
              </span>
            </div>
          )}

          {/* Plane Selector */}
          <div className={`flex ${themeColors.background.tertiary} rounded-lg p-1`}>
            {(['xy', 'xz', 'yz'] as ViewPlane[]).map((plane) => (
              <button
                key={plane}
                onClick={() => setActivePlane(plane)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activePlane === plane
                    ? `${themeColors.background.elevated} ${themeColors.text.primary} shadow-sm`
                    : `${themeColors.text.secondary} hover:${themeColors.text.primary}`
                }`}
              >
                {plane.toUpperCase()}
              </button>
            ))}
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`${themeColors.background.tertiary} ${themeColors.text.secondary} ${themeColors.interactive.hover} rounded-md transition-colors`}
              title="Toggle Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setZoom(1)
                setPanOffset({ x: 0, y: 0 })
              }}
              className={`${themeColors.background.tertiary} ${themeColors.text.secondary} ${themeColors.interactive.hover} rounded-md transition-colors`}
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm ${themeColors.text.secondary}`}>Zoom: {Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`${themeColors.background.tertiary} ${themeColors.text.secondary} ${themeColors.interactive.hover} rounded-md transition-colors`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2D Editor */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden ${themeColors.background.primary} ${isFullscreen ? 'h-[420px]' : 'flex-1 min-h-[200px]'}`}
        style={{
          backgroundImage: showGrid ? `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          ` : 'none',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
        }}
      >
        {renderPlaneEditor()}

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
            className={`w-8 h-8 ${themeColors.background.elevated} border ${themeColors.border.secondary} rounded shadow-sm ${themeColors.interactive.hover} flex items-center justify-center`}
            title="Zoom In"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom / 1.2, 0.3))}
            className={`w-8 h-8 ${themeColors.background.elevated} border ${themeColors.border.secondary} rounded shadow-sm ${themeColors.interactive.hover} flex items-center justify-center`}
            title="Zoom Out"
          >
            <span className="text-lg font-bold">−</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`px-4 py-2 ${themeColors.background.primary} border-t ${themeColors.border.primary} text-sm ${themeColors.text.secondary}`}>
        {animationPoints.length} animation point{animationPoints.length !== 1 ? 's' : ''} + 1 reference •
        Plane: {activePlane.toUpperCase()} •
        Mode: {multiTrackMode?.replace('-', ' ')} •
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

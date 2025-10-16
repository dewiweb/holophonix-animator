import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Position, AnimationType, AnimationParameters, ControlPoint } from '@/types'
import { PlaneEditor } from './PlaneEditor'
import { Maximize2, Minimize2, Grid3X3, Move, RotateCcw } from 'lucide-react'
import { themeColors } from '@/theme'

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
  multiTrackMode?: 'identical' | 'position-relative' | 'phase-offset' | 'phase-offset-relative'
  selectedTracks?: string[]
  trackPositions?: Record<string, Position>
  trackColors?: Record<string, { r: number; g: number; b: number; a: number }>
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
  trackColors = {}
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

  // Convert animation parameters to control points based on animation type
  const getControlPoints = useCallback((): ControlPoint[] => {
    const points: ControlPoint[] = []

    // Handle multitrack modes - show individual track positions for position-relative modes
    if (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative') {
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

      // For position-relative modes, we don't show the animation parameters as control points
      // since each track uses its own position as the center/base
      console.log('🎯 Position-relative mode: showing track positions as control points')
      return points
    }

    // Always include track position as a reference point for other modes
    if (trackPosition) {
      points.push({
        id: 'track-position',
        position: trackPosition,
        type: 'start', // Use 'start' type but with special styling
        animationType: 'reference' as AnimationType,
        index: -1 // Special index for reference point
      })
    }

    console.log('🎯 ControlPointEditor - Animation type:', animationType)
    console.log('🎯 ControlPointEditor - Parameters keys:', Object.keys(parameters || {}))
    console.log('🎯 ControlPointEditor - Track position:', trackPosition)

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
    return points
  }, [animationType, parameters, keyframes, trackPosition])

  const controlPoints = getControlPoints()

  // Debug: Log what we're actually getting
  console.log('🎯 ControlPointEditor - Final controlPoints array:', controlPoints)
  console.log('🎯 ControlPointEditor - controlPoints.length:', controlPoints.length)
  console.log('🎯 ControlPointEditor - hasControlPoints:', controlPoints.length > 0)

  const hasControlPoints = controlPoints.length > 0

  console.log('🎯 ControlPointEditor - About to render XYEditor with controlPoints:', controlPoints.length)

  if (!hasControlPoints) {
    return (
      <div className={`${themeColors.background.primary} border ${themeColors.border.primary} rounded-lg p-8 text-center ${className}`}>
        <Grid3X3 className={`w-12 h-12 ${themeColors.text.disabled} mx-auto mb-4`} />
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

    // Handle multitrack position-relative modes
    if (pointId.startsWith('track-') && (multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative')) {
      const trackId = pointId.replace('track-', '')
      // For position-relative modes, we're editing individual track positions
      // This would need to be handled by the parent component
      console.log('🎯 Updating track position:', trackId, newPosition)
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
      trackColors
    }

    return <PlaneEditor {...commonProps} />
  }

  return (
    <div className={`${themeColors.background.elevated} border ${themeColors.border.primary} rounded-lg ${className}`}>
      {/* Header Controls */}
      <div className={`flex items-center justify-between p-4 border-b ${themeColors.border.primary}`}>
        <div className="flex items-center gap-4">
          <h3 className={`text-lg font-semibold ${themeColors.text.primary}`}>Control Points</h3>

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
        className={`relative overflow-hidden ${themeColors.background.primary} ${isFullscreen ? 'h-96' : 'h-64'}`}
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
        {isDragging ? ' Dragging' : ' Click and drag to move points'}
      </div>
    </div>
  )
}

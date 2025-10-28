import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { ControlPoint, Position, AnimationType, AnimationParameters } from '@/types'
import { themeColors } from '@/theme'

interface YZEditorProps {
  controlPoints: ControlPoint[]
  zoom: number
  panOffset: { x: number; y: number }
  showGrid: boolean
  isDragging: boolean
  draggedPoint: string | null
  onControlPointUpdate: (pointId: string, newPosition: Position) => void
  onAddControlPoint: (position: Position) => void
  onRemoveControlPoint?: (pointId: string) => void
  onRemoveControlPoints?: (pointIds: string[]) => void
  onDragStart: (pointId: string) => void
  onDragEnd: () => void
  onZoomChange?: (newZoom: number) => void
  onPanChange?: (newPanOffset: { x: number; y: number }) => void
  onResetView?: () => void
  onSelectionChange?: (selectedPointIds: string[]) => void
  selectedPointIds?: string[]
  trackPosition?: Position  // Add track position for display
  animationType?: AnimationType  // Add animation type for path generation
  animationParameters?: AnimationParameters  // Add animation parameters for path generation
  trackColors?: Record<string, { r: number; g: number; b: number; a: number }>
}

export const YZEditor: React.FC<YZEditorProps> = ({
  controlPoints,
  zoom,
  panOffset,
  showGrid,
  isDragging,
  draggedPoint,
  onControlPointUpdate,
  onAddControlPoint,
  onRemoveControlPoint,
  onRemoveControlPoints,
  onDragStart,
  onDragEnd,
  onZoomChange,
  onPanChange,
  onResetView,
  onSelectionChange,
  selectedPointIds = [],
  trackPosition,
  animationType,
  animationParameters,
  trackColors = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerRect, setContainerRect] = useState({ width: 0, height: 0 })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 })

  // Update container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setContainerRect({ width: rect.width, height: rect.height })
        if (!isInitialized) {
          setIsInitialized(true)
        }
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [isInitialized])

  // Convert 3D position to 2D screen coordinates for YZ plane (Y horizontal, Z vertical)
  const positionToScreen = useCallback((position: Position, containerWidth: number, containerHeight: number) => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    const scale = 20 * zoom

    return {
      x: centerX + (position.y * scale) + panOffset.x, // Use Y for horizontal axis
      y: centerY - (position.z * scale) + panOffset.y // Use Z for vertical axis, inverted
    }
  }, [zoom, panOffset])

  // Convert screen coordinates back to 3D position
  const screenToPosition = useCallback((screenX: number, screenY: number, containerWidth: number, containerHeight: number, originalPosition?: Position): Position => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    const scale = 20 * zoom

    // If original position provided, preserve coordinates not being edited
    if (originalPosition) {
      return {
        x: originalPosition.x, // Preserve original X coordinate
        y: (screenX - centerX - panOffset.x) / scale,
        z: -(screenY - centerY - panOffset.y) / scale
      }
    }

    return {
      x: 0, // X is not relevant for YZ plane
      y: (screenX - centerX - panOffset.x) / scale,
      z: -(screenY - centerY - panOffset.y) / scale
    }
  }, [zoom, panOffset])

  // Generate animation path points for visualization
  const generateAnimationPath = useCallback((animationType: AnimationType, parameters: AnimationParameters, numPoints: number = 100): Position[] => {
    const points: Position[] = []

    if (!parameters) return points

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints

      try {
        switch (animationType) {
          case 'linear': {
            if (parameters.startPosition && parameters.endPosition) {
              const start = parameters.startPosition
              const end = parameters.endPosition
              points.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t,
                z: start.z + (end.z - start.z) * t
              })
            }
            break
          }

          case 'circular': {
            const center = parameters.center || { x: 0, y: 0, z: 0 }
            const radius = parameters.radius || 1
            const plane = parameters.plane

            // Check if this plane matches the current editor's plane
            if (plane === 'yz') {
              // Show full circle on YZ plane
              const angle = t * Math.PI * 2
              points.push({
                x: center.x,
                y: center.y + Math.cos(angle) * radius,
                z: center.z + Math.sin(angle) * radius
              })
            } else {
              // Show only diameter line segment on other planes
              // For YZ plane, vary Y (horizontal) while keeping Z constant
              const startY = center.y - radius
              const endY = center.y + radius
              points.push({
                x: center.x, // Keep X constant (not editable in YZ plane)
                y: startY + (endY - startY) * t, // Vary Y for horizontal axis
                z: center.z  // Keep Z constant
              })
            }
            break
          }

          case 'bezier': {
            if (parameters.bezierStart && parameters.bezierControl1 && parameters.bezierControl2 && parameters.bezierEnd) {
              const start = parameters.bezierStart
              const control1 = parameters.bezierControl1
              const control2 = parameters.bezierControl2
              const end = parameters.bezierEnd

              // Cubic Bezier curve calculation
              const u = 1 - t
              const tt = t * t
              const uu = u * u
              const uuu = uu * u
              const ttt = tt * t

              points.push({
                x: uuu * start.x + 3 * uu * t * control1.x + 3 * u * tt * control2.x + ttt * end.x,
                y: uuu * start.y + 3 * uu * t * control1.y + 3 * u * tt * control2.y + ttt * end.y,
                z: uuu * start.z + 3 * uu * t * control1.z + 3 * u * tt * control2.z + ttt * end.z
              })
            }
            break
          }

          default:
            // For other animation types, generate a visible path based on animation type
            try {
              switch (animationType) {
                case 'elliptical':
                  if (parameters.center && parameters.radiusY && parameters.radiusZ) {
                    const center = parameters.center
                    const ry = parameters.radiusY || 1
                    const rz = parameters.radiusZ || 1
                    points.push({
                      x: center.x,
                      y: center.y + Math.cos(t * Math.PI * 2) * ry,
                      z: center.z + Math.sin(t * Math.PI * 2) * rz
                    })
                  } else {
                    points.push({ x: 0, y: t * 2 - 1, z: Math.sin(t * Math.PI * 4) })
                  }
                  break

                case 'spiral':
                  if (parameters.center) {
                    const center = parameters.center
                    const startRadius = parameters.startRadius || 0
                    const endRadius = parameters.endRadius || 1
                    const rotations = parameters.rotations || 1
                    const radius = startRadius + (endRadius - startRadius) * t
                    const angle = t * Math.PI * 2 * rotations
                    points.push({
                      x: center.x,
                      y: center.y + Math.cos(angle) * radius,
                      z: center.z + Math.sin(angle) * radius + (t * 2 - 1) * (parameters.pitch || 0)
                    })
                  } else {
                    points.push({ x: 0, y: t * 2 - 1, z: t * 2 - 1 })
                  }
                  break

                case 'wave':
                  if (parameters.amplitude) {
                    const amp = parameters.amplitude
                    points.push({
                      x: amp.x * Math.cos(t * Math.PI * 4 + (parameters.phaseOffset || 0)),
                      y: t * 2 - 1,
                      z: amp.z * Math.sin(t * Math.PI * 4 + (parameters.phaseOffset || 0))
                    })
                  } else {
                    points.push({ x: Math.cos(t * Math.PI * 4), y: t * 2 - 1, z: Math.sin(t * Math.PI * 4) })
                  }
                  break

                case 'pendulum':
                  if (parameters.anchorPoint && parameters.pendulumLength) {
                    const anchor = parameters.anchorPoint
                    const length = parameters.pendulumLength
                    const angle = Math.sin(t * Math.PI * 2) * (parameters.initialAngle || Math.PI/4)
                    points.push({
                      x: anchor.x,
                      y: anchor.y + Math.sin(angle) * length,
                      z: anchor.z - Math.cos(angle) * length
                    })
                  } else {
                    points.push({ x: 0, y: Math.sin(t * Math.PI * 2), z: -Math.cos(t * Math.PI * 2) })
                  }
                  break

                case 'spring':
                  if (parameters.restPosition) {
                    const rest = parameters.restPosition
                    const displacement = parameters.initialDisplacement || { x: 0, y: 0, z: 0 }
                    const stiffness = parameters.springStiffness || 1
                    const damping = parameters.dampingCoefficient || 0.1
                    const mass = parameters.mass || 1

                    // Simplified spring motion
                    const omega = Math.sqrt(stiffness / mass) * (1 - damping)
                    points.push({
                      x: rest.x,
                      y: rest.y + displacement.y * Math.sin(omega * t * 10),
                      z: rest.z + displacement.z * Math.cos(omega * t * 10)
                    })
                  } else {
                    points.push({ x: 0, y: Math.sin(t * Math.PI * 6), z: Math.cos(t * Math.PI * 4) })
                  }
                  break

                case 'lissajous':
                  if (parameters.amplitudeY && parameters.amplitudeZ && parameters.frequencyRatioA && parameters.frequencyRatioB) {
                    const ay = parameters.amplitudeY
                    const az = parameters.amplitudeZ
                    const fa = parameters.frequencyRatioA || 1
                    const fb = parameters.frequencyRatioB || 2
                    points.push({
                      x: 0,
                      y: ay * Math.sin(fa * t * Math.PI * 2 + (parameters.phaseDifference || 0)),
                      z: az * Math.sin(fb * t * Math.PI * 2)
                    })
                  } else {
                    points.push({ x: 0, y: Math.sin(t * Math.PI * 2), z: Math.sin(t * Math.PI * 4) })
                  }
                  break

                case 'random':
                  if (parameters.bounds) {
                    const bounds = parameters.bounds
                    points.push({
                      x: (Math.random() - 0.5) * bounds.x * 2,
                      y: (Math.random() - 0.5) * bounds.y * 2,
                      z: (Math.random() - 0.5) * bounds.z * 2
                    })
                  } else {
                    points.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 })
                  }
                  break

                default:
                  // Generate a visible oscillating pattern for unhandled types
                  points.push({
                    x: 0,
                    y: Math.sin(t * Math.PI * 4),
                    z: t * 2 - 1
                  })
                  break
              }
            } catch (error) {
              console.warn(`Error generating path for ${animationType}:`, error)
              points.push({ x: 0, y: Math.sin(t * Math.PI * 4), z: t * 2 - 1 })
            }
            break
        }
      } catch (error) {
        console.warn('Error generating path point:', error)
        points.push({ x: 0, y: t * 2 - 1, z: 0 })
      }
    }

    return points
  }, [])

  // Generate animation path for current animation
  const animationPath = useMemo(() => {
    if (!animationType || !animationParameters) return []
    return generateAnimationPath(animationType, animationParameters, 100)
  }, [animationType, animationParameters, generateAnimationPath])

  // Get point size based on type
  const getPointSize = useCallback((type: string, animationType: AnimationType, isReference?: boolean): number => {
    if (isReference) return 12 * zoom

    const baseSize = {
      'start': 8,
      'end': 8,
      'control': 6,
      'keyframe': 7
    }[type] || 6

    return baseSize * zoom
  }, [zoom])

  // Get point color based on type and track colors
  const getPointColor = (type: string, animationType: AnimationType, isReference?: boolean, pointId?: string): string => {
    if (isReference) return '#8b5cf6'

    // Check if this point represents a track and use track color if available
    if (pointId && pointId.startsWith('track-')) {
      const trackId = pointId.replace('track-', '')
      const trackColor = trackColors[trackId]
      if (trackColor) {
        // Convert RGBA to CSS color string
        return `rgba(${Math.round(trackColor.r * 255)}, ${Math.round(trackColor.g * 255)}, ${Math.round(trackColor.b * 255)}, ${trackColor.a})`
      }
    }

    switch (type) {
      case 'start':
        return animationType === 'bezier' ? '#10b981' : '#3b82f6'
      case 'control':
        return animationType === 'bezier' ? '#f59e0b' : '#8b5cf6'
      case 'end':
        return animationType === 'bezier' ? '#ef4444' : '#3b82f6'
      case 'keyframe':
        return '#6366f1'
      default:
        return '#6b7280'
    }
  }

  // Get point label based on animation type and point properties
  const getPointLabel = (point: ControlPoint): string => {
    switch (point.animationType) {
      case 'bezier':
        if (point.id === 'bezier-start') return 'Bezier Start'
        if (point.id === 'bezier-control1') return 'Control 1'
        if (point.id === 'bezier-control2') return 'Control 2'
        if (point.id === 'bezier-end') return 'Bezier End'
        break

      case 'catmull-rom':
        if (point.type === 'start') return 'Start Point'
        if (point.type === 'end') return 'End Point'
        if (point.type === 'control') return `Control ${point.index! + 1}`
        break

      case 'zigzag':
        if (point.id === 'zigzag-start') return 'Zigzag Start'
        if (point.id === 'zigzag-end') return 'Zigzag End'
        break

      case 'doppler':
        if (point.id === 'doppler-start') return 'Path Start'
        if (point.id === 'doppler-end') return 'Path End'
        break

      case 'pendulum':
        if (point.id === 'pendulum-anchor') return 'Anchor Point'
        break

      case 'spring':
        if (point.id === 'spring-rest') return 'Rest Position'
        break

      case 'attract-repel':
        if (point.id === 'attract-target') return 'Target Position'
        break

      case 'orbit':
        if (point.id === 'orbit-center') return 'Orbit Center'
        break

      case 'circular-scan':
        if (point.id === 'scan-center') return 'Scan Center'
        break

      case 'zoom':
        if (point.id === 'zoom-center') return 'Zoom Center'
        break

      case 'custom':
        if (point.time) return `Keyframe ${point.time.toFixed(1)}s`
        break
    }

    // Fallback to generic labels
    switch (point.type) {
      case 'start': return 'Start'
      case 'end': return 'End'
      case 'control': return `Control ${point.index! + 1}`
      case 'keyframe': return `Keyframe ${point.time?.toFixed(1) || point.index || ''}`
      default: return point.type
    }
  }

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || containerRect.width === 0 || containerRect.height === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = containerRect.width
    canvas.height = containerRect.height

    // Clear canvas
    ctx.clearRect(0, 0, containerRect.width, containerRect.height)

    // Set up coordinate system
    ctx.save()
    ctx.translate(0, 0) // Canvas coordinates start at top-left

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = themeColors.planes.yz.grid.secondary
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.8

      // Meter-based grid system
      const metersPerUnit = 1 // 1 coordinate unit = 1 meter
      const pixelsPerMeter = 20 * zoom // How many pixels represent 1 meter

      // Major grid lines every 1 meter
      const majorGridThreshold = 10 // Show major lines when > 10 pixels per meter
      const showMajorGrid = pixelsPerMeter > majorGridThreshold

      if (showMajorGrid) {
        // Major grid lines (darker, thicker) every 1 meter
        ctx.strokeStyle = themeColors.planes.yz.grid.primary
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.9

        for (let meter = Math.floor(-10 / metersPerUnit) * metersPerUnit;
             meter <= Math.ceil(10 / metersPerUnit) * metersPerUnit;
             meter += metersPerUnit) {
          const x = containerRect.width / 2 + (meter * pixelsPerMeter) + panOffset.x
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, containerRect.height)
          ctx.stroke()
        }

        for (let meter = Math.floor(-10 / metersPerUnit) * metersPerUnit;
             meter <= Math.ceil(10 / metersPerUnit) * metersPerUnit;
             meter += metersPerUnit) {
          const y = containerRect.height / 2 - (meter * pixelsPerMeter) + panOffset.y
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(containerRect.width, y)
          ctx.stroke()
        }
      }

      // Minor grid lines (lighter, thinner) every 0.5 meters
      ctx.strokeStyle = themeColors.planes.yz.grid.secondary
      ctx.lineWidth = 0.8
      ctx.globalAlpha = 0.6

      const minorMeterInterval = 0.5

      for (let meter = Math.floor(-20 / minorMeterInterval) * minorMeterInterval;
           meter <= Math.ceil(20 / minorMeterInterval) * minorMeterInterval;
           meter += minorMeterInterval) {
        const x = containerRect.width / 2 + (meter * pixelsPerMeter) + panOffset.x
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, containerRect.height)
        ctx.stroke()
      }

      for (let meter = Math.floor(-20 / minorMeterInterval) * minorMeterInterval;
           meter <= Math.ceil(20 / minorMeterInterval) * minorMeterInterval;
           meter += minorMeterInterval) {
        const y = containerRect.height / 2 - (meter * pixelsPerMeter) + panOffset.y
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(containerRect.width, y)
        ctx.stroke()
      }

      ctx.globalAlpha = 1
    }

    // Draw axes
    const centerX = containerRect.width / 2 + panOffset.x
    const centerY = containerRect.height / 2 + panOffset.y

    // Calculate axis length to span full canvas
    const maxDimension = Math.max(containerRect.width, containerRect.height)
    const axisLength = maxDimension * 0.5  // Always 50% of larger dimension

    // Y-axis (horizontal through center)
    ctx.strokeStyle = themeColors.planes.yz.axes.y
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX - axisLength, centerY)
    ctx.lineTo(centerX + axisLength, centerY)
    ctx.stroke()

    // Z-axis (vertical through center, inverted)
    ctx.strokeStyle = themeColors.planes.yz.axes.z
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - axisLength)
    ctx.lineTo(centerX, centerY + axisLength)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = themeColors.text.primary
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'end'
    ctx.fillText('Y', centerX + axisLength - 10, centerY + 20)

    ctx.textAlign = 'start'
    ctx.fillText('Z', centerX - 20, centerY - axisLength + 10)

    // Draw origin point (scales with zoom) - X axis color (orange)
    const originSize = 8 * zoom
    ctx.fillStyle = themeColors.planes.yz.axes.x // Orange for X axis
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, originSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Draw animation path if available
    if (animationPath.length > 0) {
      ctx.strokeStyle = themeColors.planes.yz.trajectory
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.7
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      const firstPoint = positionToScreen(animationPath[0], containerRect.width, containerRect.height)
      ctx.moveTo(firstPoint.x, firstPoint.y)

      for (let i = 1; i < animationPath.length; i++) {
        const point = positionToScreen(animationPath[i], containerRect.width, containerRect.height)
        ctx.lineTo(point.x, point.y)
      }

      ctx.stroke()
      ctx.setLineDash([]) // Reset line dash
      ctx.globalAlpha = 1
    }

    // Draw track position if available
    if (trackPosition) {
      const trackScreenPos = positionToScreen(trackPosition, containerRect.width, containerRect.height)

      // Draw track position as a purple diamond
      ctx.fillStyle = themeColors.planes.yz.trajectory
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2

      const trackSize = 12 * zoom
      ctx.beginPath()
      ctx.moveTo(trackScreenPos.x, trackScreenPos.y - trackSize)
      ctx.lineTo(trackScreenPos.x + trackSize, trackScreenPos.y)
      ctx.lineTo(trackScreenPos.x, trackScreenPos.y + trackSize)
      ctx.lineTo(trackScreenPos.x - trackSize, trackScreenPos.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Draw "TRACK" label
      ctx.fillStyle = themeColors.planes.yz.trajectory
      ctx.font = 'bold 11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('TRACK', trackScreenPos.x, trackScreenPos.y - trackSize - 8)
    }

    // Draw selection rectangle if selecting
    if (isSelecting && (selectionStart.x !== selectionEnd.x || selectionStart.y !== selectionEnd.y)) {
      const minX = Math.min(selectionStart.x, selectionEnd.x)
      const maxX = Math.max(selectionStart.x, selectionEnd.x)
      const minY = Math.min(selectionStart.y, selectionEnd.y)
      const maxY = Math.max(selectionStart.y, selectionEnd.y)

      // Draw selection rectangle
      ctx.strokeStyle = themeColors.planes.yz.selection
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      ctx.setLineDash([]) // Reset line dash

      // Fill with semi-transparent selection color
      ctx.fillStyle = `${themeColors.planes.yz.selection}1A` // 10% opacity
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY)
    }

    // Draw control points
    controlPoints.forEach((point) => {
      const screenPos = positionToScreen(point.position, containerRect.width, containerRect.height)
      const isReference = point.index === -1
      const color = getPointColor(point.type, point.animationType, isReference, point.id)
      const size = getPointSize(point.type, point.animationType, isReference)
      const isDragged = draggedPoint === point.id
      const isSelected = selectedPointIds.includes(point.id)

      // Draw selection indicator for selected points
      if (isSelected) {
        ctx.strokeStyle = themeColors.planes.yz.selection
        ctx.lineWidth = 3
        ctx.setLineDash([3, 3])
        ctx.strokeRect(screenPos.x - size - 4, screenPos.y - size - 4, (size + 4) * 2, (size + 4) * 2)
        ctx.setLineDash([]) // Reset line dash
      }

      // Draw point
      ctx.fillStyle = color
      ctx.strokeStyle = isDragged ? themeColors.background.elevated : '#ffffff'
      ctx.lineWidth = isDragged ? 2 : 1.5

      // Scale point size with zoom
      const scaledSize = size
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, scaledSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw label
      if (point.type === 'keyframe' && point.time) {
        ctx.fillStyle = themeColors.text.secondary
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`T${point.time.toFixed(1)}s`, screenPos.x + scaledSize + 6, screenPos.y + 3)
      } else if (point.index === -1) {
        // Reference point - don't draw label here since it's drawn separately
      } else {
        ctx.fillStyle = themeColors.text.secondary
        ctx.font = '11px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(getPointLabel(point), screenPos.x + scaledSize + 6, screenPos.y + 3)
      }
    })

    ctx.restore()
  }, [controlPoints, containerRect, zoom, panOffset, showGrid, positionToScreen, draggedPoint, isSelecting, selectionStart, selectionEnd, selectedPointIds, animationPath, trackPosition, getPointLabel, getPointSize])

  // Re-render when dependencies change
  useEffect(() => {
    render()
  }, [render])

  // Enhanced mouse event handlers with selection box functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Right-click starts panning (button 2 = right click)
    if (e.button === 2) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x, y })
      return
    }

    // Left-click: Check if clicking on a control point
    for (const point of controlPoints) {
      // Skip reference points (track position) - they should not be draggable
      if (point.index === -1) {
        continue
      }

      const screenPos = positionToScreen(point.position, rect.width, rect.height)
      const size = getPointSize(point.type, point.animationType, point.index === -1)
      const distance = Math.sqrt((x - screenPos.x) ** 2 + (y - screenPos.y) ** 2)

      if (distance <= size) {
        onDragStart(point.id)
        return
      }
    }

    // Left-click on empty space: Start selection box
    setIsSelecting(true)
    setSelectionStart({ x, y })
    setSelectionEnd({ x, y })
  }, [controlPoints, positionToScreen, onDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    if (draggedPoint) {
      // Dragging control point - convert screen coordinates to world position
      const originalPosition = controlPoints.find(p => p.id === draggedPoint)?.position
      const worldPos = screenToPosition(
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height,
        originalPosition
      )

      // Update the control point position
      onControlPointUpdate(draggedPoint, worldPos)
    } else if (isPanning) {
      // Panning the view with right-click drag
      const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const deltaX = (currentPoint.x - lastPanPoint.x) / zoom
      const deltaY = (currentPoint.y - lastPanPoint.y) / zoom

      // Update pan offset (intuitive direction: drag right = canvas moves right)
      const newPanOffset = {
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      }

      if (onPanChange) {
        onPanChange(newPanOffset)
      }

      setLastPanPoint(currentPoint)
    } else if (isSelecting) {
      // Update selection box end position
      setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }, [draggedPoint, screenToPosition, onControlPointUpdate, isPanning, lastPanPoint, zoom, panOffset, onPanChange, isSelecting])

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      // Complete selection box
      const selectedPoints: string[] = []

      // Hit testing: check which control points are inside the selection box
      controlPoints.forEach((point) => {
        const screenPos = positionToScreen(point.position, containerRect.width, containerRect.height)

        // Check if point is inside selection rectangle
        const minX = Math.min(selectionStart.x, selectionEnd.x)
        const maxX = Math.max(selectionStart.x, selectionEnd.x)
        const minY = Math.min(selectionStart.y, selectionEnd.y)
        const maxY = Math.max(selectionStart.y, selectionEnd.y)

        if (screenPos.x >= minX && screenPos.x <= maxX &&
            screenPos.y >= minY && screenPos.y <= maxY) {
          selectedPoints.push(point.id)
        }
      })

      // Notify parent of selection change
      if (onSelectionChange) {
        onSelectionChange(selectedPoints)
      }

      // Reset selection state
      setIsSelecting(false)
      setSelectionStart({ x: 0, y: 0 })
      setSelectionEnd({ x: 0, y: 0 })
    } else {
      setIsPanning(false)
      if (draggedPoint) {
        onDragEnd()
      }
    }
  }, [isSelecting, selectionStart, selectionEnd, controlPoints, positionToScreen, containerRect, onSelectionChange, draggedPoint, onDragEnd])

  // Set up wheel event listener with non-passive option
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault() // Now safe to call preventDefault on non-passive listener

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))

      // Zoom towards mouse cursor
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // Calculate zoom center in world coordinates
      const worldPos = screenToPosition(mouseX, mouseY, rect.width, rect.height)

      // Adjust pan offset to zoom towards mouse
      const zoomCenterX = containerRect.width / 2
      const zoomCenterY = containerRect.height / 2

      const newPanOffset = {
        x: panOffset.x + (worldPos.y * (newZoom - zoom)), // Use Y coordinate for YZ plane horizontal
        y: panOffset.y + (worldPos.z * (newZoom - zoom)) // Use Z coordinate for vertical
      }

      if (onZoomChange && onPanChange) {
        onZoomChange(newZoom)
        onPanChange(newPanOffset)
      }
    }

    // Add non-passive wheel event listener
    canvas.addEventListener('wheel', handleWheelEvent, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheelEvent)
    }
  }, [zoom, panOffset, screenToPosition, containerRect, onZoomChange, onPanChange])

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={(e) => {
          if (!canvasRef.current) return

          const canvas = canvasRef.current
          const rect = canvas.getBoundingClientRect()
          const newPosition = screenToPosition(
            e.clientX - rect.left,
            e.clientY - rect.top,
            rect.width,
            rect.height
          )

          onAddControlPoint(newPosition)
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{ backgroundColor: themeColors.planes.yz.background.replace('bg-', '#').replace(' dark:bg-', ''), touchAction: 'none' }}
      />

      {/* Navigation Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <div className={`${themeColors.background.elevated}/90 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs ${themeColors.text.secondary}`}>
          <div className={`font-medium mb-2 ${themeColors.text.primary}`}>Navigation:</div>
          <div className="space-y-1">
            <div>🖱️ Left Drag: Select points</div>
            <div>🖱️ Right Drag: Pan view</div>
            <div>🔍 Scroll: Zoom</div>
            <div>⌨️ WASD: Pan</div>
            <div>⌨️ +/-: Zoom</div>
            <div>⌨️ R: Reset view</div>
          </div>
        </div>
      </div>

      
    </div>
  )
}

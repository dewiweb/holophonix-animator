import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { generateAnimationPath, calculatePathBounds, PathPoint } from '@/utils/pathGeneration'
import { Animation, ControlPoint, Position, AnimationType, AnimationParameters } from '@/types'
import { themeColors } from '@/theme'

interface PlaneEditorProps {
  plane: 'xy' | 'xz' | 'yz'
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
  trackPosition?: Position
  animationType?: AnimationType
  animationParameters?: AnimationParameters
  trackColors?: Record<string, { r: number; g: number; b: number; a: number }>
}

// Plane-specific configuration
const PLANE_CONFIG = {
  xy: {
    name: 'XY',
    axes: {
      horizontal: { coord: 'x' as keyof Position, label: 'X', color: '#f59e0b' },
      vertical: { coord: 'y' as keyof Position, label: 'Y', color: '#3b82f6' },
      origin: { coord: 'z' as keyof Position, label: 'Z', color: '#10b981' }
    },
    positionToScreen: (position: Position, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }) => ({
      x: centerX + (position.x * scale) + panOffset.x,
      y: centerY - (position.y * scale) + panOffset.y // Flip Y for consistency with 3D preview
    }),
    screenToPosition: (screenX: number, screenY: number, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }, originalPosition?: Position) => {
      if (originalPosition) {
        return {
          x: (screenX - centerX - panOffset.x) / scale,
          y: -(screenY - centerY - panOffset.y) / scale, // Flip back Y coordinate
          z: originalPosition.z
        }
      }
      return {
        x: (screenX - centerX - panOffset.x) / scale,
        y: -(screenY - centerY - panOffset.y) / scale,
        z: 0
      }
    }
  },
  xz: {
    name: 'XZ',
    axes: {
      horizontal: { coord: 'x' as keyof Position, label: 'X', color: '#f59e0b' },
      vertical: { coord: 'z' as keyof Position, label: 'Z', color: '#10b981' },
      origin: { coord: 'y' as keyof Position, label: 'Y', color: '#3b82f6' }
    },
    positionToScreen: (position: Position, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }) => ({
      x: centerX + (position.x * scale) + panOffset.x,
      y: centerY - (position.z * scale) + panOffset.y
    }),
    screenToPosition: (screenX: number, screenY: number, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }, originalPosition?: Position) => {
      if (originalPosition) {
        return {
          x: (screenX - centerX - panOffset.x) / scale,
          y: originalPosition.y,
          z: -(screenY - centerY - panOffset.y) / scale
        }
      }
      return {
        x: (screenX - centerX - panOffset.x) / scale,
        y: 0,
        z: -(screenY - centerY - panOffset.y) / scale
      }
    }
  },
  yz: {
    name: 'YZ',
    axes: {
      horizontal: { coord: 'y' as keyof Position, label: 'Y', color: '#3b82f6' },
      vertical: { coord: 'z' as keyof Position, label: 'Z', color: '#10b981' },
      origin: { coord: 'x' as keyof Position, label: 'X', color: '#f59e0b' }
    },
    positionToScreen: (position: Position, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }) => ({
      x: centerX + (position.y * scale) + panOffset.x,
      y: centerY - (position.z * scale) + panOffset.y
    }),
    screenToPosition: (screenX: number, screenY: number, centerX: number, centerY: number, scale: number, panOffset: { x: number; y: number }, originalPosition?: Position) => {
      if (originalPosition) {
        return {
          x: originalPosition.x,
          y: (screenX - centerX - panOffset.x) / scale,
          z: -(screenY - centerY - panOffset.y) / scale
        }
      }
      return {
        x: 0,
        y: (screenX - centerX - panOffset.x) / scale,
        z: -(screenY - centerY - panOffset.y) / scale
      }
    }
  }
}

export const PlaneEditor: React.FC<PlaneEditorProps> = ({
  plane,
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

  const config = PLANE_CONFIG[plane]

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

  // Convert 3D position to 2D screen coordinates
  const positionToScreen = useCallback((position: Position, containerWidth: number, containerHeight: number) => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const scale = 20 * zoom

    return config.positionToScreen(position, centerX, centerY, scale, panOffset)
  }, [zoom, panOffset, config])

  // Convert screen coordinates back to 3D position
  const screenToPosition = useCallback((screenX: number, screenY: number, containerWidth: number, containerHeight: number, originalPosition?: Position): Position => {
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const scale = 20 * zoom

    return config.screenToPosition(screenX, screenY, centerX, centerY, scale, panOffset, originalPosition)
  }, [zoom, panOffset, config])

  // Generate animation path for current animation using shared utilities
  const animationPath = useMemo(() => {
    if (!animationType || !animationParameters) return []

    // Create a minimal Animation object for the path generation utility
    const animation: Animation = {
      id: 'plane-editor-preview',
      name: 'Plane Editor Preview',
      type: animationType,
      duration: 10, // Preview duration
      loop: true,
      parameters: animationParameters,
      coordinateSystem: { type: 'xyz' }
    }

    const pathPoints = generateAnimationPath(animation, 100)
    return pathPoints.map(point => point.position)
  }, [animationType, animationParameters])

  // Get point size based on type
  const getPointSize = useCallback((type: string, animationType: AnimationType, isReference?: boolean): number => {
    if (isReference) return 10 * zoom

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
    ctx.translate(0, 0)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = themeColors.border.secondary
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.8

      // Meter-based grid system
      const metersPerUnit = 1
      const pixelsPerMeter = 20 * zoom

      const majorGridThreshold = 10
      const showMajorGrid = pixelsPerMeter > majorGridThreshold

      if (showMajorGrid) {
        ctx.strokeStyle = themeColors.border.primary
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

      ctx.strokeStyle = themeColors.border.secondary
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

    const maxDimension = Math.max(containerRect.width, containerRect.height)
    const axisLength = maxDimension * 0.5

    // Horizontal axis
    ctx.strokeStyle = config.axes.horizontal.color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX - axisLength, centerY)
    ctx.lineTo(centerX + axisLength, centerY)
    ctx.stroke()

    // Vertical axis
    ctx.strokeStyle = config.axes.vertical.color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - axisLength)
    ctx.lineTo(centerX, centerY + axisLength)
    ctx.stroke()

    // Axis labels
    ctx.fillStyle = themeColors.text.primary
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'end'
    ctx.fillText(config.axes.horizontal.label, centerX + axisLength - 10, centerY + 20)

    ctx.textAlign = 'start'
    ctx.fillText(config.axes.vertical.label, centerX - 20, centerY - axisLength + 10)

    // Draw origin point
    const originSize = 8 * zoom
    ctx.fillStyle = config.axes.origin.color
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, originSize, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Draw animation path if available
    if (animationPath.length > 0) {
      ctx.strokeStyle = themeColors.accent.primary
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
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // Draw track position if available
    if (trackPosition) {
      const trackScreenPos = positionToScreen(trackPosition, containerRect.width, containerRect.height)

      ctx.fillStyle = themeColors.accent.primary
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

      ctx.fillStyle = themeColors.accent.primary
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

      ctx.strokeStyle = themeColors.accent.primary
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY)
      ctx.setLineDash([])
      ctx.fillStyle = `${themeColors.accent.primary}1A` // 10% opacity
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

      if (isSelected) {
        ctx.strokeStyle = themeColors.accent.primary
        ctx.lineWidth = 3
        ctx.setLineDash([3, 3])
        ctx.strokeRect(screenPos.x - size - 4, screenPos.y - size - 4, (size + 4) * 2, (size + 4) * 2)
        ctx.setLineDash([])
      }

      ctx.fillStyle = color
      ctx.strokeStyle = isDragged ? themeColors.background.elevated : '#ffffff'
      ctx.lineWidth = isDragged ? 2 : 1.5

      const scaledSize = size
      ctx.beginPath()
      ctx.arc(screenPos.x, screenPos.y, scaledSize, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

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
  }, [controlPoints, containerRect, zoom, panOffset, showGrid, positionToScreen, draggedPoint, isSelecting, selectionStart, selectionEnd, selectedPointIds, animationPath, trackPosition, getPointLabel, getPointSize, config])

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

    if (e.button === 2) {
      e.preventDefault()
      setIsPanning(true)
      setLastPanPoint({ x, y })
      return
    }

    for (const point of controlPoints) {
      if (point.index === -1) continue

      const screenPos = positionToScreen(point.position, rect.width, rect.height)
      const size = getPointSize(point.type, point.animationType, point.index === -1)
      const distance = Math.sqrt((x - screenPos.x) ** 2 + (y - screenPos.y) ** 2)

      if (distance <= size) {
        onDragStart(point.id)
        return
      }
    }

    setIsSelecting(true)
    setSelectionStart({ x, y })
    setSelectionEnd({ x, y })
  }, [controlPoints, positionToScreen, onDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    if (draggedPoint) {
      const originalPosition = controlPoints.find(p => p.id === draggedPoint)?.position
      const worldPos = screenToPosition(
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect.width,
        rect.height,
        originalPosition
      )

      onControlPointUpdate(draggedPoint, worldPos)
    } else if (isPanning) {
      const currentPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      const deltaX = (currentPoint.x - lastPanPoint.x) / zoom
      const deltaY = (currentPoint.y - lastPanPoint.y) / zoom

      const newPanOffset = {
        x: panOffset.x + deltaX,
        y: panOffset.y + deltaY
      }

      if (onPanChange) {
        onPanChange(newPanOffset)
      }

      setLastPanPoint(currentPoint)
    } else if (isSelecting) {
      setSelectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }, [draggedPoint, screenToPosition, onControlPointUpdate, isPanning, lastPanPoint, zoom, panOffset, onPanChange, isSelecting, controlPoints])

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      const selectedPoints: string[] = []

      controlPoints.forEach((point) => {
        const screenPos = positionToScreen(point.position, containerRect.width, containerRect.height)

        const minX = Math.min(selectionStart.x, selectionEnd.x)
        const maxX = Math.max(selectionStart.x, selectionEnd.x)
        const minY = Math.min(selectionStart.y, selectionEnd.y)
        const maxY = Math.max(selectionStart.y, selectionEnd.y)

        if (screenPos.x >= minX && screenPos.x <= maxX &&
            screenPos.y >= minY && screenPos.y <= maxY) {
          selectedPoints.push(point.id)
        }
      })

      if (onSelectionChange) {
        onSelectionChange(selectedPoints)
      }

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
      e.preventDefault()

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor))

      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const worldPos = screenToPosition(mouseX, mouseY, rect.width, rect.height)

      const zoomCenterX = containerRect.width / 2
      const zoomCenterY = containerRect.height / 2

      const newPanOffset = {
        x: panOffset.x + (worldPos.x * (newZoom - zoom)),
        y: panOffset.y + (worldPos.y * (newZoom - zoom))
      }

      if (onZoomChange && onPanChange) {
        onZoomChange(newZoom)
        onPanChange(newPanOffset)
      }
    }

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
        style={{ backgroundColor: themeColors.background.primary.replace('bg-', '#').replace(' dark:bg-', ''), touchAction: 'none' }}
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

      {/* Zoom Indicator */}
      <div className={`absolute top-4 right-4 ${themeColors.background.elevated}/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm font-medium ${themeColors.text.primary}`}>
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  )
}

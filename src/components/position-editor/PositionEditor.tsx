/**
 * Position Editor
 * 
 * Dedicated workspace for visual track positioning with 3D view.
 * Allows users to arrange tracks spatially and capture as presets.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { Button } from '@/components/common/Button'
import { CapturePresetDialog } from '@/components/presets'
import {
  Camera,
  Grid3x3,
  Move,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Box,
  Eye,
  EyeOff
} from 'lucide-react'
import type { Position } from '@/types'

type ViewMode = 'top' | 'side' | 'front' | 'perspective'

export const PositionEditor: React.FC = () => {
  const { tracks, updateTrack } = useProjectStore()
  const { presets } = usePositionPresetStore()

  const [viewMode, setViewMode] = useState<ViewMode>('top')
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [showCapture, setShowCapture] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(0.5)
  const [zoom, setZoom] = useState(1.0)
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas dimensions
  const canvasWidth = 800
  const canvasHeight = 600
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const scale = 40 * zoom // pixels per meter

  useEffect(() => {
    drawCanvas()
  }, [tracks, viewMode, showGrid, zoom, selectedTrackIds, draggedTrackId])

  const worldToScreen = (pos: Position): { x: number; y: number } => {
    switch (viewMode) {
      case 'top':
        return {
          x: centerX + pos.x * scale,
          y: centerY - pos.y * scale
        }
      case 'side':
        return {
          x: centerX + pos.x * scale,
          y: centerY - pos.z * scale
        }
      case 'front':
        return {
          x: centerX + pos.y * scale,
          y: centerY - pos.z * scale
        }
      default:
        return { x: centerX, y: centerY }
    }
  }

  const screenToWorld = (screenX: number, screenY: number): Partial<Position> => {
    const x = (screenX - centerX) / scale
    const y = -(screenY - centerY) / scale
    const z = -(screenY - centerY) / scale

    if (snapToGrid) {
      const snappedX = Math.round(x / gridSize) * gridSize
      const snappedY = Math.round(y / gridSize) * gridSize
      const snappedZ = Math.round(z / gridSize) * gridSize

      switch (viewMode) {
        case 'top':
          return { x: snappedX, y: snappedY }
        case 'side':
          return { x: snappedX, z: snappedZ }
        case 'front':
          return { y: snappedY, z: snappedZ }
      }
    }

    switch (viewMode) {
      case 'top':
        return { x, y }
      case 'side':
        return { x, z }
      case 'front':
        return { y, z }
    }

    return {}
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 1

      for (let i = -10; i <= 10; i++) {
        const offset = i * gridSize * scale
        
        // Vertical lines
        ctx.beginPath()
        ctx.moveTo(centerX + offset, 0)
        ctx.lineTo(centerX + offset, canvasHeight)
        ctx.stroke()

        // Horizontal lines
        ctx.beginPath()
        ctx.moveTo(0, centerY + offset)
        ctx.lineTo(canvasWidth, centerY + offset)
        ctx.stroke()
      }

      // Draw axes
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 2

      // X axis
      ctx.beginPath()
      ctx.moveTo(0, centerY)
      ctx.lineTo(canvasWidth, centerY)
      ctx.stroke()

      // Y axis
      ctx.beginPath()
      ctx.moveTo(centerX, 0)
      ctx.lineTo(centerX, canvasHeight)
      ctx.stroke()
    }

    // Draw axis labels
    ctx.fillStyle = '#999'
    ctx.font = '12px sans-serif'
    ctx.fillText(getAxisLabel('horizontal'), canvasWidth - 40, centerY - 10)
    ctx.fillText(getAxisLabel('vertical'), centerX + 10, 20)

    // Draw tracks
    tracks.forEach(track => {
      const pos = worldToScreen(track.position)
      const isSelected = selectedTrackIds.includes(track.id)
      const isDragged = draggedTrackId === track.id

      // Track circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, isDragged ? 12 : 10, 0, 2 * Math.PI)
      ctx.fillStyle = isSelected ? '#3B82F6' : (track.color ? String(track.color) : '#10B981')
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#60A5FA'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Track name
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(track.name, pos.x, pos.y + 25)

      // Position coordinates
      ctx.fillStyle = '#999'
      ctx.font = '9px sans-serif'
      const coordText = `(${track.position.x.toFixed(1)}, ${track.position.y.toFixed(1)}, ${track.position.z.toFixed(1)})`
      ctx.fillText(coordText, pos.x, pos.y + 38)
    })

    // Draw selection rectangle (if dragging)
    if (draggedTrackId) {
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      // Could add selection rectangle here
      ctx.setLineDash([])
    }
  }

  const getAxisLabel = (axis: 'horizontal' | 'vertical'): string => {
    switch (viewMode) {
      case 'top':
        return axis === 'horizontal' ? 'X' : 'Y'
      case 'side':
        return axis === 'horizontal' ? 'X' : 'Z'
      case 'front':
        return axis === 'horizontal' ? 'Y' : 'Z'
      default:
        return ''
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check if clicking on a track
    const clickedTrack = tracks.find(track => {
      const pos = worldToScreen(track.position)
      const dist = Math.sqrt(Math.pow(mouseX - pos.x, 2) + Math.pow(mouseY - pos.y, 2))
      return dist < 10
    })

    if (clickedTrack) {
      setDraggedTrackId(clickedTrack.id)
      if (e.shiftKey) {
        // Add to selection
        setSelectedTrackIds(prev => [...prev, clickedTrack.id])
      } else {
        // Single selection
        setSelectedTrackIds([clickedTrack.id])
      }
    } else {
      // Clear selection
      setSelectedTrackIds([])
      setDraggedTrackId(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedTrackId) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const worldPos = screenToWorld(mouseX, mouseY)
    const track = tracks.find(t => t.id === draggedTrackId)
    
    if (track) {
      const newPosition = { ...track.position, ...worldPos }
      updateTrack(draggedTrackId, { position: newPosition })
    }
  }

  const handleCanvasMouseUp = () => {
    setDraggedTrackId(null)
  }

  const handleQuickFormation = (type: 'circle' | 'line' | 'grid') => {
    const selected = tracks.filter(t => selectedTrackIds.includes(t.id))
    if (selected.length === 0) return

    const radius = 3.0
    const spacing = 1.0
    const height = 1.5

    selected.forEach((track, index) => {
      let position: Position

      switch (type) {
        case 'circle':
          const angle = (index / selected.length) * 2 * Math.PI
          position = {
            x: radius * Math.cos(angle),
            y: radius * Math.sin(angle),
            z: height
          }
          break

        case 'line':
          const offset = -(selected.length - 1) * spacing / 2
          position = {
            x: offset + index * spacing,
            y: 0,
            z: height
          }
          break

        case 'grid':
          const cols = Math.ceil(Math.sqrt(selected.length))
          const row = Math.floor(index / cols)
          const col = index % cols
          position = {
            x: (col - cols / 2) * spacing,
            y: (row - Math.ceil(selected.length / cols) / 2) * spacing,
            z: height
          }
          break
      }

      updateTrack(track.id, { position })
    })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          {/* View Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
              View:
            </span>
            {(['top', 'side', 'front', 'perspective'] as ViewMode[]).map(mode => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? 'primary' : 'secondary'}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={showGrid ? Eye : EyeOff}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle grid"
            />
            <Button
              size="sm"
              variant="secondary"
              icon={Grid3x3}
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={snapToGrid ? 'bg-blue-100 dark:bg-blue-900' : ''}
              title="Snap to grid"
            />
            <Button
              size="sm"
              variant="secondary"
              icon={ZoomOut}
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="sm"
              variant="secondary"
              icon={ZoomIn}
              onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
            />
            <Button
              size="sm"
              variant="primary"
              icon={Camera}
              onClick={() => setShowCapture(true)}
              disabled={tracks.length === 0}
            >
              Capture Preset
            </Button>
          </div>
        </div>

        {/* Quick Formation Toolbar (shows when tracks selected) */}
        {selectedTrackIds.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {selectedTrackIds.length} track{selectedTrackIds.length !== 1 ? 's' : ''} selected:
              </span>
              <Button size="sm" onClick={() => handleQuickFormation('circle')}>
                Circle
              </Button>
              <Button size="sm" onClick={() => handleQuickFormation('line')}>
                Line
              </Button>
              <Button size="sm" onClick={() => handleQuickFormation('grid')}>
                Grid
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Canvas */}
        <div className="flex-1 flex items-center justify-center p-4">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="border border-gray-300 dark:border-gray-600 rounded-lg cursor-crosshair"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Tracks List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Tracks ({tracks.length})
              </h3>
              <div className="space-y-1">
                {tracks.map(track => {
                  const isSelected = selectedTrackIds.includes(track.id)
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelectedTrackIds([track.id])}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {track.name}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: track.color ? String(track.color) : '#10B981' }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        ({track.position.x.toFixed(1)}, {track.position.y.toFixed(1)}, {track.position.z.toFixed(1)})
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-900 dark:text-blue-200">
              <p className="font-semibold mb-1">Quick Guide:</p>
              <ul className="space-y-1">
                <li>• Click to select track</li>
                <li>• Drag to move</li>
                <li>• Shift+click for multi-select</li>
                <li>• Use quick formations for groups</li>
                <li>• Capture when done</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Capture Dialog */}
      {showCapture && (
        <CapturePresetDialog
          onClose={() => setShowCapture(false)}
          preSelectedTrackIds={selectedTrackIds.length > 0 ? selectedTrackIds : tracks.map(t => t.id)}
        />
      )}
    </div>
  )
}

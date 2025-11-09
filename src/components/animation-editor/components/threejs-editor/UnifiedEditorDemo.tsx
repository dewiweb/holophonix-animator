import React, { useState } from 'react'
import * as THREE from 'three'
import { UnifiedThreeJsEditor } from './UnifiedThreeJsEditor'
import type { Animation, Track } from '@/types'

/**
 * Demo component for testing the Unified Three.js Editor
 * Single-view editor with view/mode switching
 */
export const UnifiedEditorDemo: React.FC = () => {
  // Sample animation data with control points
  const [animation] = useState<Animation>({
    id: 'demo-animation',
    name: 'Demo Animation',
    type: 'bezier',
    duration: 10,
    loop: false,
    pingPong: false,
    parameters: {
      controlPoints: [
        new THREE.Vector3(-4, 0, -3),
        new THREE.Vector3(-1, 2, -1),
        new THREE.Vector3(1, 2, 1),
        new THREE.Vector3(4, 0, 3),
      ],
    },
    coordinateSystem: {
      type: 'xyz',
    },
  })

  // Sample tracks for testing (to visualize in preview mode)
  const [sampleTracks] = useState<Track[]>([
    {
      id: 'track-1',
      name: 'Track 1',
      type: 'sound-source',
      holophonixIndex: 1,
      color: { r: 0.2, g: 0.8, b: 0.3, a: 1 },
      position: { x: -2, y: 1, z: 0 },
      animationState: null,
      isMuted: false,
      isSolo: false,
      isSelected: false,
      volume: 0.8,
    },
    {
      id: 'track-2',
      name: 'Track 2',
      type: 'sound-source',
      holophonixIndex: 2,
      color: { r: 0.8, g: 0.3, b: 0.2, a: 1 },
      position: { x: 2, y: 1, z: 0 },
      animationState: null,
      isMuted: false,
      isSolo: false,
      isSelected: false,
      volume: 0.8,
    },
    {
      id: 'track-3',
      name: 'Track 3',
      type: 'sound-source',
      holophonixIndex: 3,
      color: { r: 0.3, g: 0.3, b: 0.8, a: 1 },
      position: { x: 0, y: 1, z: 2 },
      animationState: null,
      isMuted: false,
      isSolo: false,
      isSelected: false,
      volume: 0.8,
    },
  ])

  const handleControlPointsChange = (points: THREE.Vector3[]) => {
    console.log('Control points updated:', points)
  }

  const handleSelectionChange = (indices: number[]) => {
    console.log('Selection changed:', indices)
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 bg-gray-950 p-4">
      <div className="flex-1 rounded-lg overflow-hidden shadow-2xl">
        <UnifiedThreeJsEditor
          animation={animation}
          selectedTracks={sampleTracks}
          multiTrackMode="identical"
          onControlPointsChange={handleControlPointsChange}
          onSelectionChange={handleSelectionChange}
          initialSettings={{
            viewMode: 'perspective',
            editMode: 'edit',
            showGrid: true,
            snapSize: 0.5,
            showCurve: true,
            curveResolution: 200,
            showDirectionIndicators: true,
          }}
          readOnly={false}
        />
      </div>

      {/* Quick Reference */}
      <div className="p-3 bg-gray-800 rounded text-gray-300 text-xs">
        <div className="grid grid-cols-5 gap-4">
          <div>
            <h4 className="font-semibold mb-1 text-blue-400 text-xs">🎨 Modes</h4>
            <div className="text-[10px] space-y-0.5">
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">Tab</kbd> = Toggle Preview/Edit</div>
              <div>Green = Preview | Orange = Edit</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-purple-400 text-xs">📹 Views</h4>
            <div className="text-[10px] space-y-0.5">
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">Q</kbd>=Perspective | <kbd className="px-1 bg-gray-700 rounded text-[9px]">W</kbd>=Top</div>
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">E</kbd>=Front | <kbd className="px-1 bg-gray-700 rounded text-[9px]">R</kbd>=Side</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-green-400 text-xs">✏️ Edit Mode</h4>
            <div className="text-[10px] space-y-0.5">
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">Shift+A</kbd>=Add Point</div>
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">Del</kbd>=Delete | <kbd className="px-1 bg-gray-700 rounded text-[9px]">Ctrl+D</kbd>=Duplicate</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-yellow-400 text-xs">🎯 Selection</h4>
            <div className="text-[10px] space-y-0.5">
              <div>Left-click = Select point</div>
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">ESC</kbd> = Deselect</div>
              <div>Drag gizmo arrows to move</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-1 text-orange-400 text-xs">👁️ Camera</h4>
            <div className="text-[10px] space-y-0.5">
              <div><kbd className="px-1 bg-gray-700 rounded text-[9px]">Home</kbd>=Reset View</div>
              <div>Persp: Right-click rotate</div>
              <div>Planes: Right-click pan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

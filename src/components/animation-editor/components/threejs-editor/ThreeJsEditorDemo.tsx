import React, { useState } from 'react'
import * as THREE from 'three'
import { ThreeJsControlPointEditor } from './ThreeJsControlPointEditor'

/**
 * Demo component for testing the Three.js Control Point Editor
 * This shows how to use the editor with sample data
 */
export const ThreeJsEditorDemo: React.FC = () => {
  // Sample animation data with some control points
  const [animation] = useState({
    id: 'demo-animation',
    name: 'Demo Animation',
    duration: 10,
    loop: false,
    pingPong: false,
    controlPoints: [
      new THREE.Vector3(-3, 0, -3),
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(3, 0, 3),
      new THREE.Vector3(0, -2, 0),
    ],
  })

  const handleControlPointsChange = (points: THREE.Vector3[]) => {
    // Control points updated
  }

  const handleSelectionChange = (indices: number[]) => {
    // Selection changed
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 bg-gray-950 p-4">
      <div className="flex-1 rounded-lg overflow-hidden shadow-2xl">
        <ThreeJsControlPointEditor
          animation={animation}
          onControlPointsChange={handleControlPointsChange}
          onSelectionChange={handleSelectionChange}
          initialSettings={{
            transformMode: 'translate',
            showGrid: true,
            snapSize: 0.5,
            showCurve: true,
            curveResolution: 200,
            showDirectionIndicators: true,
          }}
          readOnly={false}
        />
      </div>
      
      {/* Instructions - Compact */}
      <div className="p-2 bg-gray-800 rounded text-gray-300 text-xs">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <h4 className="font-semibold mb-0.5 text-blue-400 text-xs">📹 Camera</h4>
            <div className="text-[10px] space-y-0">
              <div>Persp: <kbd className="px-0.5 bg-gray-700 rounded text-[9px]">Alt</kbd>=Rotate <kbd className="px-0.5 bg-gray-700 rounded text-[9px]">Ctrl</kbd>=Pan | Planes: Right-click=Pan</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-0.5 text-green-400 text-xs">✏️ Points</h4>
            <div className="text-[10px] space-y-0">
              <div><kbd className="px-0.5 bg-gray-700 rounded text-[9px]">Shift+A</kbd>=Add | <kbd className="px-0.5 bg-gray-700 rounded text-[9px]">Del</kbd>=Delete</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-0.5 text-purple-400 text-xs">🎯 Modes</h4>
            <div className="text-[10px] space-y-0">
              <div><kbd className="px-0.5 bg-gray-700 rounded text-[9px]">G</kbd>=Translate | <kbd className="px-0.5 bg-gray-700 rounded text-[9px]">R</kbd>=Rotate</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-0.5 text-yellow-400 text-xs">👁️ View</h4>
            <div className="text-[10px] space-y-0">
              <div><kbd className="px-0.5 bg-gray-700 rounded text-[9px]">F</kbd>=Frame | 🔄=Reset view</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    console.log('Control points updated:', points)
  }

  const handleSelectionChange = (indices: number[]) => {
    console.log('Selection changed:', indices)
  }

  return (
    <div className="w-full h-screen p-4 bg-gray-950">
      <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl">
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
      
      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-800 rounded-lg text-gray-300 text-sm">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="space-y-1">
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">G</kbd> - Switch to Translate mode</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">R</kbd> - Switch to Rotate mode</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">F</kbd> - Frame selected / Frame all</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">Home</kbd> - Frame all points</li>
          <li><kbd className="px-2 py-1 bg-gray-700 rounded">Delete</kbd> - Delete selected point</li>
          <li>Click to select control point</li>
        </ul>
      </div>
    </div>
  )
}

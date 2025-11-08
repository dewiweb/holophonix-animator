import React from 'react'
import { ThreeJsEditorDemo } from '../components/animation-editor/components/threejs-editor/ThreeJsEditorDemo'

/**
 * Test page for the new Three.js Control Point Editor
 * Navigate to /editor-test to see it
 * 
 * This page takes the full screen (outside Layout) for testing
 */
export const EditorTestPage: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-950 overflow-hidden">
      <ThreeJsEditorDemo />
    </div>
  )
}

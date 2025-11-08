import React from 'react'
import { ThreeJsEditorDemo } from '../components/animation-editor/components/threejs-editor/ThreeJsEditorDemo'

/**
 * Test page for the new Three.js Control Point Editor
 * Navigate to /editor-test to see it
 * 
 * Now integrated as a tab in the main application
 */
export const EditorTestPage: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-950 overflow-hidden rounded-lg">
      <ThreeJsEditorDemo />
    </div>
  )
}

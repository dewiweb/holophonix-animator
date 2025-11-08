import React from 'react'
import { ThreeJsEditorDemo } from '../components/animation-editor/components/threejs-editor/ThreeJsEditorDemo'

/**
 * Test page for the new Three.js Control Point Editor
 * Navigate to /editor-test to see it
 */
export const EditorTestPage: React.FC = () => {
  return (
    <div className="w-screen h-screen">
      <ThreeJsEditorDemo />
    </div>
  )
}

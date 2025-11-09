import React from 'react'
import { UnifiedEditorDemo } from '../components/animation-editor/components/threejs-editor/UnifiedEditorDemo'

/**
 * Test page for the Unified Three.js Editor
 * Navigate to /editor-test to see it
 * 
 * Single-view editor with view/mode switching (replaces quad-view)
 */
export const EditorTestPage: React.FC = () => {
  return (
    <div className="w-full h-full bg-gray-950 overflow-hidden rounded-lg">
      <UnifiedEditorDemo />
    </div>
  )
}

/**
 * Position Presets - Integration Examples
 * 
 * Copy-paste examples for adding preset functionality to your app
 */

import React, { useState, useEffect } from 'react'
import { 
  PresetQuickActions, 
  PresetFloatingPanel,
  CapturePresetDialog,
  PresetManager 
} from '@/components/presets'

// ============================================
// OPTION 1: Floating Panel (Easiest!)
// ============================================

export function AppWithFloatingPanel() {
  return (
    <>
      {/* Your existing app */}
      <YourExistingLayout />
      
      {/* Add this single component - that's it! */}
      <PresetFloatingPanel />
    </>
  )
}

// Result: Floating button (🏠) in bottom-right corner
// Click to expand → Shows Capture/Apply/Manage buttons
// No other changes needed!


// ============================================
// OPTION 2: Toolbar Integration
// ============================================

export function ToolbarWithPresets() {
  return (
    <div className="toolbar flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800">
      {/* Your existing toolbar buttons */}
      <button>Animations</button>
      <button>Tracks</button>
      <button>Cues</button>
      
      {/* Add preset actions */}
      <div className="ml-auto">
        <PresetQuickActions layout="horizontal" showLabels={true} />
      </div>
    </div>
  )
}

// Result: [Capture] [Apply] [Manage] buttons in toolbar
// All dialogs handled automatically!


// ============================================
// OPTION 3: Keyboard Shortcuts
// ============================================

export function AppWithKeyboardShortcuts() {
  const [showCapture, setShowCapture] = useState(false)
  const [showManager, setShowManager] = useState(false)
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl+Shift+P = Capture preset
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowCapture(true)
      }
      
      // Ctrl+Shift+R = Preset manager
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        setShowManager(true)
      }
      
      // Ctrl+Shift+Home = Return to initial
      if (e.ctrlKey && e.shiftKey && e.key === 'Home') {
        e.preventDefault()
        returnToInitialPositions()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  return (
    <>
      {/* Your app */}
      <YourLayout />
      
      {/* Dialogs */}
      {showCapture && (
        <CapturePresetDialog onClose={() => setShowCapture(false)} />
      )}
      
      {showManager && (
        <PresetManager onClose={() => setShowManager(false)} />
      )}
    </>
  )
}

// Helper function
async function returnToInitialPositions() {
  const { presetHelpers } = await import('@/utils/presetHelpers')
  await presetHelpers.returnToInitialPositions(2.0)
}


// ============================================
// OPTION 4: Custom Button in Sidebar
// ============================================

export function SidebarWithPresets() {
  const [showCapture, setShowCapture] = useState(false)
  
  return (
    <>
      <div className="sidebar">
        {/* Your existing sidebar items */}
        <SidebarItem icon="🎬" label="Animations" />
        <SidebarItem icon="📊" label="Tracks" />
        <SidebarItem icon="🎯" label="Cues" />
        
        {/* Add preset button */}
        <button 
          onClick={() => setShowCapture(true)}
          className="sidebar-item"
        >
          <span>📸</span>
          <span>Capture Preset</span>
        </button>
      </div>
      
      {/* Dialog */}
      {showCapture && (
        <CapturePresetDialog onClose={() => setShowCapture(false)} />
      )}
    </>
  )
}


// ============================================
// OPTION 5: Context Menu Integration
// ============================================

export function TrackListWithContextMenu() {
  const [showCapture, setShowCapture] = useState(false)
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null)
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }
  
  return (
    <>
      {/* Your track list */}
      <div onContextMenu={handleContextMenu}>
        <TrackItem />
        <TrackItem />
      </div>
      
      {/* Context menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button onClick={() => {
            setContextMenu(null)
            setShowCapture(true)
          }}>
            📸 Capture Current Positions
          </button>
          {/* Other menu items */}
        </div>
      )}
      
      {/* Dialog */}
      {showCapture && (
        <CapturePresetDialog onClose={() => setShowCapture(false)} />
      )}
    </>
  )
}


// ============================================
// COMPLETE EXAMPLE: Main App Integration
// ============================================

export function CompleteAppExample() {
  // State for dialogs
  const [showCapture, setShowCapture] = useState(false)
  const [showManager, setShowManager] = useState(false)
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowCapture(true)
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        setShowManager(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])
  
  return (
    <div className="app">
      {/* Header with toolbar */}
      <header className="toolbar">
        <div className="left-section">
          <h1>Holophonix Animator</h1>
        </div>
        
        <div className="right-section">
          {/* Preset quick actions in toolbar */}
          <PresetQuickActions layout="horizontal" showLabels={true} />
        </div>
      </header>
      
      {/* Main content */}
      <main>
        {/* Your existing app content */}
        <YourTrackView />
        <YourCueGrid />
        <YourTimeline />
      </main>
      
      {/* Dialogs (managed by PresetQuickActions but can also be triggered manually) */}
      {showCapture && (
        <CapturePresetDialog onClose={() => setShowCapture(false)} />
      )}
      
      {showManager && (
        <PresetManager 
          onClose={() => setShowManager(false)}
          onCapture={() => {
            setShowManager(false)
            setShowCapture(true)
          }}
        />
      )}
      
      {/* Optional: Floating panel as backup access */}
      {/* <PresetFloatingPanel /> */}
    </div>
  )
}


// ============================================
// MINIMAL EXAMPLE (Copy This!)
// ============================================

export function MinimalExample() {
  return (
    <>
      <YourApp />
      <PresetFloatingPanel />  {/* ← One line! */}
    </>
  )
}

// That's literally all you need!
// The floating panel handles everything:
// - Capture button → Opens save dialog
// - Apply button → Opens apply dialog
// - Manage button → Opens preset manager
// All dialogs and state management included!


// ============================================
// PROGRAMMATIC USAGE
// ============================================

// You can also trigger operations programmatically:

import { usePositionPresetStore } from '@/stores/positionPresetStore'
import { presetHelpers } from '@/utils/presetHelpers'

export function ProgrammaticExample() {
  const handleQuickCapture = async () => {
    // Save preset instantly (no dialog)
    const id = presetHelpers.captureCurrentSnapshot('Quick Snapshot')
    console.log('Saved preset:', id)
  }
  
  const handleReturnToInitial = async () => {
    // Apply "Initial Positions" preset
    await presetHelpers.returnToInitialPositions(2.0)
    console.log('Returned to initial')
  }
  
  const handleCreateCircle = async () => {
    // Generate and apply circle formation
    const id = presetHelpers.createCircleFormation(4.0, 1.5, 'Surround')
    const presetStore = usePositionPresetStore.getState()
    await presetStore.applyPreset(id, {
      transition: { duration: 3.0, easing: 'ease-out', mode: 'spherical' }
    })
  }
  
  return (
    <div>
      <button onClick={handleQuickCapture}>Quick Capture</button>
      <button onClick={handleReturnToInitial}>Return to Initial</button>
      <button onClick={handleCreateCircle}>Circle Formation</button>
    </div>
  )
}


// ============================================
// RECOMMENDATIONS
// ============================================

/*

EASIEST START:
  Just add <PresetFloatingPanel /> to your app.
  That's it. Everything works.

FOR PRODUCTION:
  1. Add <PresetQuickActions /> to your toolbar
  2. Add keyboard shortcuts (Ctrl+Shift+P, Ctrl+Shift+R)
  3. Optional: Add context menu items

ADVANCED:
  Use programmatic helpers for custom workflows
  Integrate with your existing UI patterns

*/


// ============================================
// COPY-PASTE TEMPLATE
// ============================================

/*

// 1. In your App.tsx or Layout.tsx:

import { PresetFloatingPanel } from '@/components/presets'

export function YourApp() {
  return (
    <>
      <YourExistingLayout />
      <PresetFloatingPanel />  // ← Add this
    </>
  )
}

// 2. That's it! Now users can:
//    - Click floating 🏠 button
//    - Click "Capture"
//    - Fill form
//    - Click "Save Preset"
//    - Done! Preset saved and available

// 3. Presets are automatically available in:
//    - CueEditorV2 dropdown
//    - Apply dialog
//    - Preset manager
//    - Console (presetStore.presets)

*/

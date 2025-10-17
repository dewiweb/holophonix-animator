import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TrackList } from '@/components/TrackList'
import { AnimationEditor } from '@/components/animation-editor/AnimationEditor'
import { Timeline } from '@/components/Timeline'
import { OSCManager } from '@/components/OSCManager'
import { Settings } from '@/components/Settings'
import { useProjectStore } from '@/stores/projectStore'
import { useOSCStore } from '@/stores/oscStore'
import { logger } from '@/utils/logger'
import { testAllAnimations } from '@/utils/testAnimations'

function App() {
  logger.debug('App component rendering', undefined, 'App')
  const { currentProject, createProject, saveProject, openProject } = useProjectStore()

  // Expose test function to window for browser console testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testAnimations = testAllAnimations
      console.log('✅ Test utility loaded. Run window.testAnimations() to test all animations.')
    }
  }, [])

  // Set up global OSC message listener (runs once on app mount)
  useEffect(() => {
    logger.debug('App useEffect running', undefined, 'App')
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    logger.debug('electronAPI check', {
      hasElectronAPI: !!hasElectronAPI,
      windowType: typeof window,
      electronAPIType: typeof (window as any).electronAPI
    }, 'App')
    
    if (hasElectronAPI) {
      logger.info('Setting up global OSC message listener', undefined, 'App')
      
      let messageCount = 0
      
      const cleanup = (window as any).electronAPI.onOSCMessageReceived((message: any) => {
        messageCount++
        logger.debug(`Received OSC message #${messageCount}`, { address: message.address, args: message.args }, 'App')
        useOSCStore.getState().processIncomingMessage(message)
      })

      logger.info('OSC listener registered successfully', undefined, 'App')
      return cleanup
    } else {
      logger.warn('electronAPI not available', undefined, 'App')
    }
  }, [])

  // Set up menu action listener for File menu commands
  useEffect(() => {
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    
    if (hasElectronAPI && (window as any).electronAPI.onMenuAction) {
      logger.info('Setting up menu action listener', undefined, 'App')
      
      const cleanup = (window as any).electronAPI.onMenuAction((action: string, ...args: any[]) => {
        logger.debug('Menu action received:', { action, args }, 'App')
        
        switch (action) {
          case 'new-project':
            handleCreateProject()
            break
          case 'save-project':
            saveProject()
            break
          case 'open-project':
            if (args[0]) {
              // File path provided from Open dialog in menu
              logger.info('Opening project from menu:', args[0], 'App')
            }
            openProject()
            break
          default:
            logger.warn('Unknown menu action:', action, 'App')
        }
      })
      
      return cleanup
    }
  }, [saveProject, openProject])

  const handleCreateProject = () => {
    createProject('My First Project', {
      type: 'xyz',
      bounds: {
        x: { min: -10, max: 10 },
        y: { min: -10, max: 10 },
        z: { min: -10, max: 10 }
      }
    })
  }

  if (!currentProject) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Holophonix Animator v2
            </h2>
            <p className="text-gray-600 mb-6">
              Create a new project to get started with 3D sound animation
            </p>
            <button
              onClick={handleCreateProject}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create New Project
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Routes>
          <Route path="/" element={<TrackList />} />
          <Route path="/animations" element={<AnimationEditor />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/osc" element={<OSCManager />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ErrorBoundary>
  )
}

export default App

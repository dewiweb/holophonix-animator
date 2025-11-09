import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils'
import { useOSCStore } from '@/stores/oscStore'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  Home,
  Play,
  Clock,
  Radio,
  Settings,
  Menu,
  X,
  Plus,
  Save,
  FolderOpen,
  Grid3x3,
  Box
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const { connections } = useOSCStore()
  const { isEngineRunning } = useAnimationStore()
  const { createProject, saveProject, openProject } = useProjectStore()
  
  const hasActiveConnection = connections.some(conn => conn.isConnected)

  const handleNewProject = () => {
    // Create new project with default name
    // TODO: Add a proper modal dialog for project name input
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    const projectName = `New Project ${timestamp}`
    
    createProject(projectName, {
      type: 'xyz',
      bounds: {
        x: { min: -10, max: 10 },
        y: { min: -10, max: 10 },
        z: { min: -10, max: 10 }
      }
    })
  }

  const handleSaveProject = () => {
    saveProject()
  }

  const handleOpenProject = () => {
    openProject()
  }

  const navigation = [
    { name: 'Tracks', href: '/', icon: Home },
    { name: 'Animations', href: '/animations', icon: Play },
    { name: '3D Editor', href: '/editor-test', icon: Box },
    { name: 'Timeline', href: '/timeline', icon: Clock },
    { name: 'Cue Grid', href: '/cues', icon: Grid3x3 },
    { name: 'OSC Manager', href: '/osc', icon: Radio },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 flex flex-col h-full",
        sidebarOpen ? "w-56 lg:w-64" : "w-14 lg:w-16"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-1.5 lg:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {sidebarOpen && (
            <h1 className="text-sm lg:text-xl font-bold text-gray-800 dark:text-gray-200 truncate">
              Holophonix Animator
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-1.5 lg:p-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-0.5 lg:space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-1.5 lg:px-4 py-1.5 lg:py-3 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-blue-600 dark:bg-blue-700 text-white shadow-md"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    <item.icon size={18} className={cn("flex-shrink-0 lg:w-5 lg:h-5", isActive && "text-white")} />
                    {sidebarOpen && (
                      <span className="ml-2 lg:ml-3 font-medium text-sm lg:text-base truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Toolbar */}
        <div className="p-1.5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className={cn(
            "grid gap-2",
            sidebarOpen ? "grid-cols-2" : "grid-cols-1"
          )}>
            <button
              onClick={handleNewProject}
              className={cn(
                "flex items-center justify-center p-1.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors",
                !sidebarOpen && "p-2"
              )}
              title="Create a new project"
            >
              <Plus size={14} />
              {sidebarOpen && <span className="ml-2 text-sm">New</span>}
            </button>
            <button
              onClick={handleSaveProject}
              className={cn(
                "flex items-center justify-center p-1.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors",
                !sidebarOpen && "p-2"
              )}
              title="Save current project"
            >
              <Save size={14} />
              {sidebarOpen && <span className="ml-2 text-sm">Save</span>}
            </button>
            <button
              onClick={handleOpenProject}
              className={cn(
                "flex items-center justify-center p-1.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors",
                !sidebarOpen && "p-2"
              )}
              title="Open existing project"
            >
              <FolderOpen size={14} />
              {sidebarOpen && <span className="ml-2 text-sm">Open</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-2 lg:px-6 py-1.5 lg:py-3">
          <div className="flex items-center justify-between gap-2 lg:gap-4">
            <div className="flex items-center min-w-0">
              <h2 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                {navigation.find(item => item.href === location.pathname)?.name || 'Holophonix Animator'}
              </h2>
            </div>
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              {/* Status indicators */}
              <div className="flex items-center gap-1 lg:gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  hasActiveConnection ? "bg-green-500 dark:bg-green-400 animate-pulse" : "bg-gray-400 dark:bg-gray-500"
                )}></div>
                <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  OSC {hasActiveConnection ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isEngineRunning ? "bg-blue-500 dark:bg-blue-400 animate-pulse" : "bg-gray-400 dark:bg-gray-500"
                )}></div>
                <span className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Engine {isEngineRunning ? 'Running' : 'Idle'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-2 lg:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  )
}

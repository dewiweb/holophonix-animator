import React, { useState, useEffect } from 'react'
import { useSettingsStore, Theme, Language, CoordinateSystem, InterpolationMethod } from '@/stores/settingsStore'
import { cn } from '@/utils'
import {
  Settings as SettingsIcon,
  Monitor,
  Radio,
  Play,
  Palette,
  Download,
  Upload,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

type SettingsTab = 'application' | 'osc' | 'animation' | 'ui'

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('application')
  const [importExportStatus, setImportExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const {
    application,
    osc,
    animation,
    ui,
    updateApplicationSettings,
    updateOSCSettings,
    updateAnimationSettings,
    updateUISettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useSettingsStore()

  const handleOSCSettingsChange = (settings: Partial<typeof osc>) => {
    // Update frontend state
    updateOSCSettings(settings)

    // Notify backend about OSC settings changes for server restart
    if (typeof window !== 'undefined' && (window as any).electronAPI?.oscUpdateSettings) {
      (window as any).electronAPI.oscUpdateSettings(settings)
    }
  }

  // Listen for OSC settings requests from backend
  useEffect(() => {
    const hasElectronAPI = typeof window !== 'undefined' && (window as any).electronAPI
    if (hasElectronAPI && (window as any).electronAPI.onOSCSettingsRequest) {
      const cleanup = (window as any).electronAPI.onOSCSettingsRequest(() => {
        console.log('🔗 Frontend received OSC settings request from backend')
        // Send current OSC settings to backend
        if ((window as any).electronAPI.oscSettingsResponse) {
          (window as any).electronAPI.oscSettingsResponse({
            application,
            osc,
            animation,
            ui
          })
        }
      })

      return cleanup
    }
  }, [application, osc, animation, ui])

  const handleExportSettings = () => {
    try {
      const settingsJson = exportSettings()
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'holophonix-animator-settings.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setImportExportStatus('success')
      setStatusMessage('Settings exported successfully')
      setTimeout(() => setImportExportStatus('idle'), 3000)
    } catch (error) {
      setImportExportStatus('error')
      setStatusMessage('Failed to export settings')
      setTimeout(() => setImportExportStatus('idle'), 3000)
    }
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const success = importSettings(content)

        if (success) {
          setImportExportStatus('success')
          setStatusMessage('Settings imported successfully')
        } else {
          setImportExportStatus('error')
          setStatusMessage('Failed to import settings - invalid format')
        }
      } catch (error) {
        setImportExportStatus('error')
        setStatusMessage('Failed to import settings')
      }

      setTimeout(() => setImportExportStatus('idle'), 3000)
    }
    reader.readAsText(file)
  }

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults()
      setStatusMessage('Settings reset to defaults')
      setTimeout(() => setStatusMessage(''), 3000)
    }
  }

  const tabs = [
    { id: 'application' as SettingsTab, label: 'Application', icon: SettingsIcon },
    { id: 'osc' as SettingsTab, label: 'OSC', icon: Radio },
    { id: 'animation' as SettingsTab, label: 'Animation', icon: Play },
    { id: 'ui' as SettingsTab, label: 'Interface', icon: Palette },
  ]

  const renderApplicationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Application Preferences</h3>
        <div className="space-y-4">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</label>
            <select
              value={application.theme}
              onChange={(e) => updateApplicationSettings({ theme: e.target.value as Theme })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Language</label>
            <select
              value={application.language}
              onChange={(e) => updateApplicationSettings({ language: e.target.value as Language })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </div>

          {/* Auto-save */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-save</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatically save project changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={application.autoSave}
                onChange={(e) => updateApplicationSettings({ autoSave: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Auto-save interval */}
          {application.autoSave && (
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Auto-save Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={application.autoSaveInterval}
                onChange={(e) => updateApplicationSettings({ autoSaveInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {/* Default coordinate system */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Coordinate System</label>
            <select
              value={application.defaultCoordinateSystem}
              onChange={(e) => updateApplicationSettings({ defaultCoordinateSystem: e.target.value as CoordinateSystem })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="xyz">XYZ (Cartesian)</option>
              <option value="aed">AED (Azimuth-Elevation-Distance)</option>
            </select>
          </div>

          {/* Confirm on delete */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Confirm on Delete</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show confirmation dialog when deleting items</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={application.confirmOnDelete}
                onChange={(e) => updateApplicationSettings({ confirmOnDelete: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderOSCSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">OSC Communication Settings</h3>
        <div className="space-y-4">
          {/* Default incoming port */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Incoming Port</label>
            <input
              type="number"
              min="1024"
              max="65535"
              value={osc.defaultIncomingPort || 8000}
              onChange={(e) => handleOSCSettingsChange({ defaultIncomingPort: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Port for receiving OSC messages from Holophonix devices</p>
          </div>

          {/* Connection timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Connection Timeout (ms)</label>
            <input
              type="number"
              min="1000"
              max="30000"
              value={osc.connectionTimeout || 5000}
              onChange={(e) => handleOSCSettingsChange({ connectionTimeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Retry attempts */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Retry Attempts</label>
            <input
              type="number"
              min="1"
              max="10"
              value={osc.retryAttempts || 3}
              onChange={(e) => handleOSCSettingsChange({ retryAttempts: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Message buffer size */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Message Buffer Size</label>
            <input
              type="number"
              min="256"
              max="8192"
              value={osc.messageBufferSize || 1024}
              onChange={(e) => handleOSCSettingsChange({ messageBufferSize: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Message throttle rate */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Message Throttle Rate</label>
            <input
              type="number"
              min="1"
              max="10"
              value={osc.messageThrottleRate || 3}
              onChange={(e) => handleOSCSettingsChange({ messageThrottleRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Send every Nth frame (1 = every frame, 3 = every 3rd frame). Higher values reduce network load with many tracks.
              <br />
              <span className="font-medium">Current: ~{Math.round(60 / (osc.messageThrottleRate || 3))} FPS</span> (at 60 FPS engine)
            </p>
          </div>

          {/* Auto reconnect */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto Reconnect</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Automatically reconnect to OSC devices</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={osc.autoReconnect}
                onChange={(e) => handleOSCSettingsChange({ autoReconnect: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Message logging */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Message Logging</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Log OSC messages for debugging</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={osc.enableMessageLogging}
                onChange={(e) => handleOSCSettingsChange({ enableMessageLogging: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Save OSC Settings */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={() => {
              // Settings are automatically persisted via zustand middleware
              // This provides visual feedback
              setStatusMessage('OSC settings saved')
              setTimeout(() => setStatusMessage(''), 2000)
            }}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md text-sm hover:bg-green-700 dark:hover:bg-green-800 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save OSC Settings
          </button>
        </div>
      </div>
    </div>
  )

  const renderAnimationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Animation Settings</h3>
        <div className="space-y-4">
          {/* Default frame rate */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Frame Rate (FPS)</label>
            <input
              type="number"
              min="24"
              max="120"
              value={animation.defaultFrameRate || 60}
              onChange={(e) => updateAnimationSettings({ defaultFrameRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Default interpolation */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Interpolation</label>
            <select
              value={animation.defaultInterpolation}
              onChange={(e) => updateAnimationSettings({ defaultInterpolation: e.target.value as InterpolationMethod })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="linear">Linear</option>
              <option value="cubic">Cubic</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In-Out</option>
            </select>
          </div>

          {/* Preview frame rate */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Preview Frame Rate (FPS)</label>
            <input
              type="number"
              min="15"
              max="60"
              value={animation.previewFrameRate || 30}
              onChange={(e) => updateAnimationSettings({ previewFrameRate: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Default animation duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Default Animation Duration (seconds)</label>
            <input
              type="number"
              min="1"
              max="300"
              value={animation.defaultAnimationDuration || 10}
              onChange={(e) => updateAnimationSettings({ defaultAnimationDuration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Realtime preview */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable Real-time Preview</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Show animations in real-time during editing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={animation.enableRealtimePreview}
                onChange={(e) => updateAnimationSettings({ enableRealtimePreview: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Snap to grid */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Snap to Grid</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Snap animation keyframes to grid</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={animation.snapToGrid}
                onChange={(e) => updateAnimationSettings({ snapToGrid: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Grid size */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Grid Size</label>
            <input
              type="number"
              min="0.1"
              max="5"
              step="0.1"
              value={animation.gridSize || 1}
              onChange={(e) => updateAnimationSettings({ gridSize: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderUISettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Interface Settings</h3>
        <div className="space-y-4">
          {/* Show grid */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Grid</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display coordinate grid in 3D view</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ui.showGrid}
                onChange={(e) => updateUISettings({ showGrid: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Show axes */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Axes</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display coordinate axes in 3D view</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ui.showAxes}
                onChange={(e) => updateUISettings({ showAxes: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Show coordinate labels */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Show Coordinate Labels</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Display coordinate values in 3D view</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ui.showCoordinateLabels}
                onChange={(e) => updateUISettings({ showCoordinateLabels: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Animation speed */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Animation Speed ({ui.animationSpeed}x)
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={ui.animationSpeed || 1}
              onChange={(e) => updateUISettings({ animationSpeed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Timeline zoom */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Timeline Zoom ({ui.timelineZoom}x)
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={ui.timelineZoom || 1}
              onChange={(e) => updateUISettings({ timelineZoom: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Compact mode */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Compact Mode</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use compact interface layout</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ui.compactMode}
                onChange={(e) => updateUISettings({ compactMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>

          {/* Enable animations */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Enable UI Animations</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">Animate interface transitions and effects</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ui.enableAnimations}
                onChange={(e) => updateUISettings({ enableAnimations: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStatusMessage = () => {
    if (!statusMessage) return null

    return (
      <div className={cn(
        "flex items-center p-3 rounded-md mb-4",
        importExportStatus === 'success' && "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800",
        importExportStatus === 'error' && "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
      )}>
        {importExportStatus === 'success' ? (
          <CheckCircle className="w-5 h-5 mr-2" />
        ) : (
          <AlertCircle className="w-5 h-5 mr-2" />
        )}
        {statusMessage}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 lg:mb-4 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

        {/* Import/Export/Reset buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportSettings}
            className="px-3 py-2 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>

          <label className="px-3 py-2 text-sm bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-sm bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Status message */}
      {renderStatusMessage()}

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-0">
        <div className="flex border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'application' && renderApplicationSettings()}
          {activeTab === 'osc' && renderOSCSettings()}
          {activeTab === 'animation' && renderAnimationSettings()}
          {activeTab === 'ui' && renderUISettings()}
        </div>
      </div>
    </div>
  )
}

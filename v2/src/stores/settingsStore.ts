import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'en' | 'fr' | 'de' | 'es'
export type CoordinateSystem = 'xyz' | 'aed'
export type InterpolationMethod = 'linear' | 'cubic' | 'ease-in' | 'ease-out' | 'ease-in-out'

interface ApplicationSettings {
  theme: Theme
  language: Language
  autoSave: boolean
  autoSaveInterval: number // in seconds
  defaultCoordinateSystem: CoordinateSystem
  confirmOnDelete: boolean
  showWelcomeScreen: boolean
}

interface OSCSettings {
  defaultIncomingPort: number  // Port for receiving OSC messages from Holophonix
  connectionTimeout: number // in milliseconds
  retryAttempts: number
  messageBufferSize: number
  enableMessageLogging: boolean
  autoReconnect: boolean
  messageThrottleRate: number // Time between OSC sends in milliseconds (50ms = 20 Hz)
  useBatching: boolean // Bundle multiple track updates into single OSC message
  maxBatchSize: number // Maximum number of messages per batch
  sendBufferSize: number // UDP send buffer size in bytes
  // Note: OSC message optimization (incremental updates, pattern matching, coordinate system selection)
  // is now automatic and handled internally by the optimizer - no user configuration needed
}

interface AnimationSettings {
  defaultFrameRate: number
  defaultInterpolation: InterpolationMethod
  previewFrameRate: number
  enableRealtimePreview: boolean
  defaultAnimationDuration: number // in seconds
  snapToGrid: boolean
  gridSize: number
}

interface UISettings {
  showGrid: boolean
  showAxes: boolean
  showCoordinateLabels: boolean
  animationSpeed: number // multiplier
  timelineZoom: number
  compactMode: boolean
  enableAnimations: boolean
}

interface SettingsState {
  // Settings categories
  application: ApplicationSettings
  osc: OSCSettings
  animation: AnimationSettings
  ui: UISettings

  // Actions
  updateApplicationSettings: (settings: Partial<ApplicationSettings>) => void
  updateOSCSettings: (settings: Partial<OSCSettings>) => void
  updateAnimationSettings: (settings: Partial<AnimationSettings>) => void
  updateUISettings: (settings: Partial<UISettings>) => void

  // Utility functions
  resetToDefaults: () => void
  exportSettings: () => string
  importSettings: (settingsJson: string) => boolean
}

const defaultApplicationSettings: ApplicationSettings = {
  theme: 'system',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 60,
  defaultCoordinateSystem: 'xyz',
  confirmOnDelete: true,
  showWelcomeScreen: true,
}

const defaultOSCSettings: OSCSettings = {
  defaultIncomingPort: 8000,  // Port for receiving OSC messages from Holophonix
  connectionTimeout: 5000,
  retryAttempts: 3,
  messageBufferSize: 1024,
  enableMessageLogging: false,
  autoReconnect: true,
  messageThrottleRate: 50, // Time-based: 50ms = 20 Hz (changed from frame-based)
  useBatching: true, // Enable message batching for multi-track performance
  maxBatchSize: 100, // Maximum tracks per batch
  sendBufferSize: 262144, // 256 KB UDP send buffer
}

const defaultAnimationSettings: AnimationSettings = {
  defaultFrameRate: 60,
  defaultInterpolation: 'cubic',
  previewFrameRate: 30,
  enableRealtimePreview: true,
  defaultAnimationDuration: 10,
  snapToGrid: true,
  gridSize: 1,
}

const defaultUISettings: UISettings = {
  showGrid: true,
  showAxes: true,
  showCoordinateLabels: false,
  animationSpeed: 1,
  timelineZoom: 1,
  compactMode: false,
  enableAnimations: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      application: defaultApplicationSettings,
      osc: defaultOSCSettings,
      animation: defaultAnimationSettings,
      ui: defaultUISettings,

      // Application settings
      updateApplicationSettings: (settings) => {
        set((state) => ({
          application: { ...state.application, ...settings },
        }))

        // Apply theme changes immediately
        if (settings.theme) {
          applyTheme(settings.theme)
        }
      },

      // OSC settings
      updateOSCSettings: (settings) => {
        set((state) => ({
          osc: { ...state.osc, ...settings },
        }))
      },

      // Animation settings
      updateAnimationSettings: (settings) => {
        set((state) => ({
          animation: { ...state.animation, ...settings },
        }))
      },

      // UI settings
      updateUISettings: (settings) => {
        set((state) => ({
          ui: { ...state.ui, ...settings },
        }))
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          application: defaultApplicationSettings,
          osc: defaultOSCSettings,
          animation: defaultAnimationSettings,
          ui: defaultUISettings,
        })

        // Apply default theme
        applyTheme(defaultApplicationSettings.theme)
      },

      // Export settings as JSON
      exportSettings: () => {
        const state = get()
        return JSON.stringify({
          application: state.application,
          osc: state.osc,
          animation: state.animation,
          ui: state.ui,
        }, null, 2)
      },

      // Import settings from JSON
      importSettings: (settingsJson) => {
        try {
          const settings = JSON.parse(settingsJson)

          if (settings.application) {
            set({ application: { ...defaultApplicationSettings, ...settings.application } })
          }
          if (settings.osc) {
            set({ osc: { ...defaultOSCSettings, ...settings.osc } })
          }
          if (settings.animation) {
            set({ animation: { ...defaultAnimationSettings, ...settings.animation } })
          }
          if (settings.ui) {
            set({ ui: { ...defaultUISettings, ...settings.ui } })
          }

          return true
        } catch (error) {
          console.error('Failed to import settings:', error)
          return false
        }
      },
    }),
    {
      name: 'holophonix-animator-settings',
      // Only persist specific settings that should survive app restarts
      partialize: (state) => ({
        application: state.application,
        osc: state.osc,
        animation: state.animation,
        ui: state.ui,
      }),
    }
  )
)

// Theme application utility
function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    // Use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const { application } = useSettingsStore.getState()
  applyTheme(application.theme)

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (application.theme === 'system') {
      applyTheme('system')
    }
  })
}

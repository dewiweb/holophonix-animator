/**
 * Centralized Theme Configuration
 * Prevents color inconsistencies across the application
 */

// Theme color palette using CSS variables for runtime theming
export const themeColors = {
  // Background colors - overridden by CSS variables
  background: {
    primary: 'bg-gray-50 dark:bg-gray-800',
    secondary: 'bg-white dark:bg-gray-700',
    tertiary: 'bg-gray-100 dark:bg-gray-600',
    surface: 'bg-gray-50 dark:bg-gray-800',
    elevated: 'bg-white dark:bg-gray-800',
  },

  // Text colors - overridden by CSS variables
  text: {
    primary: 'text-gray-900 dark:text-gray-50',
    secondary: 'text-gray-600 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-400',
    disabled: 'text-gray-400 dark:text-gray-500',
  },

  // Border colors - overridden by CSS variables
  border: {
    primary: 'border-gray-200 dark:border-gray-600',
    secondary: 'border-gray-300 dark:border-gray-500',
    accent: 'border-blue-200 dark:border-blue-700',
  },

  // Interactive states
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
    active: 'active:bg-gray-100 dark:active:bg-gray-600',
  },

  // Accent colors (consistent blue theme)
  accent: {
    primary: 'blue-500 dark:blue-400',
    secondary: 'blue-600 dark:blue-500',
    tertiary: 'blue-700 dark:blue-600',
    background: {
      light: 'blue-50/80 dark:blue-900/30',
      medium: 'blue-100/60 dark:blue-800/40',
      border: 'blue-200/80 dark:blue-700/60',
    }
  },

  // Status colors
  status: {
    success: 'green-500 dark:green-400',
    warning: 'yellow-500 dark:yellow-400',
    error: 'red-500 dark:red-400',
    info: 'blue-500 dark:blue-400',
  },

  // Plane-specific colors for visual differentiation
  planes: {
    xy: {
      background: 'bg-slate-50 dark:bg-slate-900/20',
      grid: {
        primary: 'slate-400 dark:slate-600',
        secondary: 'slate-300 dark:slate-700'
      },
      axes: {
        x: 'amber-500 dark:amber-400',
        y: 'blue-500 dark:blue-400',
        z: 'emerald-500 dark:emerald-400'
      },
      trajectory: 'violet-500 dark:violet-400',
      selection: 'blue-500 dark:blue-400'
    },
    xz: {
      background: 'bg-stone-50 dark:bg-stone-900/20',
      grid: {
        primary: 'stone-400 dark:stone-600',
        secondary: 'stone-300 dark:stone-700'
      },
      axes: {
        x: 'amber-500 dark:amber-400',
        y: 'emerald-500 dark:emerald-400',
        z: 'blue-500 dark:blue-400'
      },
      trajectory: 'rose-500 dark:rose-400',
      selection: 'emerald-500 dark:emerald-400'
    },
    yz: {
      background: 'bg-zinc-50 dark:bg-zinc-900/20',
      grid: {
        primary: 'zinc-400 dark:zinc-600',
        secondary: 'zinc-300 dark:zinc-700'
      },
      axes: {
        x: 'amber-500 dark:amber-400',
        y: 'blue-500 dark:blue-400',
        z: 'emerald-500 dark:emerald-400'
      },
      trajectory: 'indigo-500 dark:indigo-400',
      selection: 'purple-500 dark:purple-400'
    }
  },

  // Component-specific colors
  multiTrackMode: {
    background: 'bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/20 dark:to-gray-700/20',
    border: 'border-blue-200 dark:border-gray-600',
    active: 'border-blue-500 bg-blue-100/60 dark:bg-blue-800/40',
  }
} as const

// Type-safe theme color access
export type ThemeColors = typeof themeColors

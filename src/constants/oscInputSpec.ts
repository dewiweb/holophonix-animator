// OSC Input Specification for External Control
// This file defines all OSC paths that can be used to control animations from external devices

export const OSC_INPUT_SPEC = {
  // Animation Control Paths
  ANIMATION: {
    // Play animation for specific track(s)
    PLAY: '/anim/play',
    // Pause current animation
    PAUSE: '/anim/pause', 
    // Stop animation and reset to beginning
    STOP: '/anim/stop',
    // Go to start position with optional easing duration (ms)
    GOTO_START: '/anim/gotoStart',
    // Set animation speed (0.0 to 2.0, 1.0 = normal speed)
    SET_SPEED: '/anim/speed',
    // Set global animation time (0 to duration)
    SET_TIME: '/anim/time',
    // Loop control
    SET_LOOP: '/anim/loop',
    // Ping-pong mode
    SET_PING_PONG: '/anim/pingPong'
  },

  // Track Selection Paths
  TRACKS: {
    // Select single track by ID
    SELECT: '/track/select',
    // Select multiple tracks by IDs (space-separated)
    SELECT_MULTI: '/track/selectMulti', 
    // Clear all track selection
    CLEAR_SELECTION: '/track/clearSelection',
    // Select all tracks
    SELECT_ALL: '/track/selectAll'
  },

  // Animation Parameter Paths
  PARAMETERS: {
    // Set animation type
    SET_TYPE: '/params/type',
    // Set duration in seconds
    SET_DURATION: '/params/duration',
    // Set specific parameter (dynamic based on animation type)
    // Usage: /params/set <parameterName> <value>
    SET_PARAMETER: '/params/set',
    // Reset all parameters to defaults
    RESET_TO_DEFAULTS: '/params/reset'
  },

  // Multi-track Mode Paths
  MODES: {
    // Set multi-track animation mode
    SET_MODE: '/mode/set',
    // Set phase offset in seconds
    SET_PHASE_OFFSET: '/mode/phaseOffset',
    // Set center point for centered mode (x y z)
    SET_CENTER_POINT: '/mode/centerPoint'
  },

  // Preset Management Paths
  PRESETS: {
    // Load preset by name
    LOAD: '/preset/load',
    // Save current animation as preset
    SAVE: '/preset/save',
    // List all available presets
    LIST: '/preset/list'
  },

  // UI Control Paths
  UI: {
    // Toggle preview mode
    TOGGLE_PREVIEW: '/ui/preview',
    // Toggle control points visibility
    TOGGLE_CONTROL_POINTS: '/ui/controlPoints',
    // Set active work plane (xy, xz, yz)
    SET_PLANE: '/ui/plane'
  }
}

// Helper function to format OSC path with arguments
export const formatOSCPath = (path: string, ...args: any[]) => {
  if (args.length === 0) return path
  return `${path} ${args.map(arg => 
    typeof arg === 'string' ? `"${arg}"` : String(arg)
  ).join(' ')}`
}

// Example usage documentation
export const OSC_USAGE_EXAMPLES = [
  'Play animation: /anim/play "track-1"',
  'Play multiple tracks: /anim/play "track-1" "track-2" "track-3"',
  'Pause all: /anim/pause',
  'Stop and reset: /anim/stop',
  'Go to start: /anim/gotoStart 1000',
  'Set animation type: /params/type "circular"',
  'Set duration: /params/duration 10.5',
  'Set center point: /params/set "center" "0 0 0"',
  'Set multi-track mode: /mode/set "position-relative"',
  'Load preset: /preset/load "circular-scan-default"'
]

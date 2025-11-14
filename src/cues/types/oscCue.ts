import { BaseCue, OSCMessage } from './baseCue'

/**
 * OSC Cue Type
 * 
 * Sends direct OSC messages to devices.
 * Supports multiple messages with delays and targeting specific devices.
 */
export interface OSCCue extends BaseCue {
  type: 'osc'
  data: OSCCueData
}

/**
 * OSC Cue Data
 */
export interface OSCCueData {
  // OSC messages to send
  messages: OSCCueMessage[]
  
  // Target device (optional)
  targetDevice?: string      // Connection ID or device name
  
  // Behavior
  sendMode: 'sequential' | 'parallel'  // Send one-by-one or all at once
  repeatCount?: number       // Number of times to repeat sequence
  repeatDelay?: number       // Delay between repeats (ms)
}

/**
 * OSC Cue Message
 * Extended OSC message with timing and metadata
 */
export interface OSCCueMessage extends OSCMessage {
  id: string
  delay?: number             // Delay before sending (ms)
  enabled: boolean           // Can disable individual messages
  description?: string       // Human-readable description
  
  // Validation
  validateArgs?: boolean     // Validate argument types before sending
  expectedResponse?: string  // Expected response address (optional)
}

/**
 * OSC Message Template
 * Pre-configured message patterns for common operations
 */
export interface OSCMessageTemplate {
  id: string
  name: string
  category: OSCMessageCategory
  description: string
  
  // Template
  address: string
  args: OSCMessageArg[]
  
  // Metadata
  tags?: string[]
  examples?: string[]
}

export type OSCMessageCategory = 
  | 'track'
  | 'system'
  | 'audio'
  | 'snapshot'
  | 'custom'

/**
 * OSC Message Argument Definition
 */
export interface OSCMessageArg {
  name: string
  type: 'int' | 'float' | 'string' | 'boolean' | 'blob'
  defaultValue?: any
  required: boolean
  description?: string
  
  // Validation
  min?: number
  max?: number
  options?: any[]          // For enum-like values
}

/**
 * OSC Cue Display Info
 */
export interface OSCCueDisplayInfo {
  messageCount: number
  targetDevice?: string
  primaryAddress?: string    // First message address for display
  hasMultipleTargets: boolean
}

/**
 * Helper functions
 */

/**
 * Validate OSC message arguments
 */
export function validateOSCMessage(message: OSCCueMessage): boolean {
  // Check address format
  if (!message.address.startsWith('/')) {
    return false
  }
  
  // Check args exist
  if (!Array.isArray(message.args)) {
    return false
  }
  
  return true
}

/**
 * Get display info for an OSC cue
 */
export function getOSCCueDisplayInfo(cue: OSCCue): OSCCueDisplayInfo {
  const enabledMessages = cue.data.messages.filter(m => m.enabled)
  const uniqueAddresses = new Set(enabledMessages.map(m => m.address))
  
  return {
    messageCount: enabledMessages.length,
    targetDevice: cue.data.targetDevice,
    primaryAddress: enabledMessages[0]?.address,
    hasMultipleTargets: uniqueAddresses.size > 1
  }
}

/**
 * Create OSC message with defaults
 */
export function createOSCMessage(
  address: string,
  args: any[] = [],
  options?: Partial<OSCCueMessage>
): OSCCueMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    address,
    args,
    enabled: true,
    ...options
  }
}

/**
 * Common OSC message templates for Holophonix
 */
export const HOLOPHONIX_OSC_TEMPLATES: OSCMessageTemplate[] = [
  {
    id: 'track-xyz',
    name: 'Set Track XYZ Position',
    category: 'track',
    description: 'Set track position in XYZ coordinates',
    address: '/track/{id}/xyz',
    args: [
      { name: 'x', type: 'float', required: true, description: 'X position' },
      { name: 'y', type: 'float', required: true, description: 'Y position' },
      { name: 'z', type: 'float', required: true, description: 'Z position' }
    ]
  },
  {
    id: 'track-aed',
    name: 'Set Track AED Position',
    category: 'track',
    description: 'Set track position in AED coordinates',
    address: '/track/{id}/aed',
    args: [
      { name: 'azimuth', type: 'float', required: true, description: 'Azimuth (degrees)' },
      { name: 'elevation', type: 'float', required: true, description: 'Elevation (degrees)' },
      { name: 'distance', type: 'float', required: true, description: 'Distance (meters)' }
    ]
  },
  {
    id: 'track-gain',
    name: 'Set Track Gain',
    category: 'track',
    description: 'Set track gain level',
    address: '/track/{id}/gain',
    args: [
      { name: 'gain', type: 'float', required: true, description: 'Gain in dB', min: -96, max: 12 }
    ]
  },
  {
    id: 'snapshot-recall',
    name: 'Recall Snapshot',
    category: 'snapshot',
    description: 'Recall a saved snapshot',
    address: '/snapshot/recall',
    args: [
      { name: 'id', type: 'int', required: true, description: 'Snapshot ID', min: 1 }
    ]
  },
  {
    id: 'system-mute',
    name: 'System Mute',
    category: 'system',
    description: 'Mute/unmute the system',
    address: '/system/mute',
    args: [
      { name: 'mute', type: 'boolean', required: true, description: 'Mute state' }
    ]
  }
]

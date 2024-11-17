// OSC Message Types
export type OSCAddressType = 
  | 'azim'  // Azimuth angle
  | 'elev'  // Elevation angle
  | 'dist'  // Distance from origin
  | 'x'     // X coordinate
  | 'y'     // Y coordinate
  | 'z'     // Z coordinate
  | 'gain/value' // Gain value in dB
  | 'mute'  // Mute state
  | 'color'; // Track color (RGBA)

export interface TrackControlMessage {
  trackId: string;
  type: OSCAddressType;
  value: number;
  raw?: number;
  timestamp?: number;
}

// Value ranges and constraints
export const OSC_CONSTRAINTS = {
  azimuth: {
    min: -180,
    max: 180,
    unit: 'degrees',
    wrap: true
  },
  elevation: {
    min: -90,
    max: 90,
    unit: 'degrees',
    wrap: false
  },
  distance: {
    min: 0,
    max: 100, // Default max, can be configured
    unit: 'meters',
    wrap: false
  },
  xyz: {
    min: -100, // Default min, can be configured
    max: 100,  // Default max, can be configured
    unit: 'meters',
    wrap: false
  },
  gain: {
    min: -60,
    max: 12,
    unit: 'dB',
    wrap: false
  }
} as const;

// Utility functions for OSC message handling
export class OSCUtils {
  static createTrackAddress(trackId: number | string, type: OSCAddressType): string {
    return `/track/${trackId}/${type}`;
  }

  static parseTrackAddress(address: string): { trackId: string; type: OSCAddressType } | null {
    const match = address.match(/^\/track\/([^/]+)\/([^/]+)$/);
    if (!match) return null;

    const [, trackId, type] = match;
    if (!this.isValidAddressType(type)) return null;

    return { trackId, type };
  }

  static isValidAddressType(type: string): type is OSCAddressType {
    return ['azim', 'elev', 'dist', 'x', 'y', 'z', 'gain/value', 'mute', 'color'].includes(type);
  }

  static constrainValue(value: number, type: OSCAddressType): number {
    let constraints;
    
    switch (type) {
      case 'azim':
        constraints = OSC_CONSTRAINTS.azimuth;
        break;
      case 'elev':
        constraints = OSC_CONSTRAINTS.elevation;
        break;
      case 'dist':
        constraints = OSC_CONSTRAINTS.distance;
        break;
      case 'gain/value':
        constraints = OSC_CONSTRAINTS.gain;
        break;
      default:
        constraints = OSC_CONSTRAINTS.xyz;
    }

    if (constraints.wrap) {
      // Handle wrapping for angles
      const range = constraints.max - constraints.min;
      while (value < constraints.min) value += range;
      while (value > constraints.max) value -= range;
      return value;
    } else {
      // Clamp values for non-wrapping parameters
      return Math.max(constraints.min, Math.min(constraints.max, value));
    }
  }

  // Convert between radians and degrees
  static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

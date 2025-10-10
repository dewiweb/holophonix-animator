/**
 * Input validation utilities
 */

import { Position } from '@/types'

export const validation = {
  /**
   * Validates an IP address or hostname
   */
  isValidHost(host: string): boolean {
    if (!host || host.trim().length === 0) return false
    
    // Check for valid hostname or IP
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    
    if (hostnameRegex.test(host) || ipv4Regex.test(host) || host === 'localhost') {
      return true
    }
    
    return false
  },

  /**
   * Validates a port number
   */
  isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535
  },

  /**
   * Validates a Position object
   */
  isValidPosition(position: any): position is Position {
    if (!position || typeof position !== 'object') return false
    
    const { x, y, z } = position
    
    return (
      typeof x === 'number' &&
      typeof y === 'number' &&
      typeof z === 'number' &&
      isFinite(x) &&
      isFinite(y) &&
      isFinite(z)
    )
  },

  /**
   * Validates a coordinate value is within bounds
   */
  isWithinBounds(
    value: number,
    min: number = -Infinity,
    max: number = Infinity
  ): boolean {
    return isFinite(value) && value >= min && value <= max
  },

  /**
   * Validates a track name
   */
  isValidTrackName(name: string): boolean {
    if (!name || typeof name !== 'string') return false
    const trimmed = name.trim()
    return trimmed.length > 0 && trimmed.length <= 64
  },

  /**
   * Validates an animation duration
   */
  isValidDuration(duration: number): boolean {
    return (
      typeof duration === 'number' &&
      isFinite(duration) &&
      duration > 0 &&
      duration <= 3600 // Max 1 hour
    )
  },

  /**
   * Validates an OSC address
   */
  isValidOSCAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false
    
    // OSC addresses must start with /
    if (!address.startsWith('/')) return false
    
    // Check for valid OSC address pattern
    const oscAddressRegex = /^\/[a-zA-Z0-9_\-/]*$/
    return oscAddressRegex.test(address)
  },

  /**
   * Sanitizes a string by removing potentially harmful characters
   */
  sanitizeString(input: string, maxLength: number = 256): string {
    if (!input || typeof input !== 'string') return ''
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .slice(0, maxLength)
  },

  /**
   * Validates and clamps a number within a range
   */
  clamp(value: number, min: number, max: number): number {
    if (!isFinite(value)) return min
    return Math.max(min, Math.min(max, value))
  },

  /**
   * Validates Holophonix track index
   */
  isValidTrackIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 1 && index <= 64
  },

  /**
   * Validates a color array [r, g, b, a]
   */
  isValidColor(color: any): boolean {
    if (!Array.isArray(color) || color.length !== 4) return false
    
    return color.every(c => 
      typeof c === 'number' && isFinite(c) && c >= 0 && c <= 1
    )
  },
}

/**
 * Type guard for checking if a value is a non-null object
 */
export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

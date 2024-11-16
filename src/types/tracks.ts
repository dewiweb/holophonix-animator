import type { Position, AEDPosition, Behavior } from './behaviors';

export interface Track {
  id: string;
  name: string;
  position: Position;
  aedPosition: AEDPosition;
  behaviors: Behavior[];
  active: boolean;
}

export interface TrackGroup {
  id: string;
  pattern: string;     // e.g., "[1-4]" or "{1,3,5}"
  tracks: number[];    // resolved track IDs
  expanded: boolean;   // UI state for collapsible groups
  active: boolean;     // group-wide activation state
  behaviors: Behavior[]; // behaviors applied to all tracks in group
}

export type TrackOrGroup = Track | TrackGroup;

export interface TrackPattern {
  type: 'range' | 'enumeration';
  values: number[];
}

// Pattern parsing utilities
export function parsePattern(pattern: string): TrackPattern | null {
  // Single track number
  const singleMatch = pattern.match(/^(\d+)$/);
  if (singleMatch) {
    const value = parseInt(singleMatch[1]);
    return { type: 'enumeration', values: [value] };
  }

  // Range pattern: [start-end]
  const rangeMatch = pattern.match(/^\[(\d+)-(\d+)\]$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    const values = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return { type: 'range', values };
  }

  // Enumeration pattern: {n,m,p}
  const enumMatch = pattern.match(/^\{(\d+(?:,\d+)*)\}$/);
  if (enumMatch) {
    const values = enumMatch[1].split(',').map(n => parseInt(n));
    return { type: 'enumeration', values };
  }

  return null;
}

export function isTrackGroup(item: TrackOrGroup): item is TrackGroup {
  return 'pattern' in item;
}

export function isValidPattern(pattern: string): boolean {
  // Single track number
  if (pattern.match(/^\d+$/)) return true;
  
  // Range pattern [1-4]
  if (pattern.match(/^\[\d+-\d+\]$/)) return true;
  
  // Enumeration pattern {1,2,3}
  if (pattern.match(/^\{\d+(?:,\d+)*\}$/)) return true;
  
  return false;
}

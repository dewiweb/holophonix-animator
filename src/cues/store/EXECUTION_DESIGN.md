# Cue Execution Design Document

## Overview

This document outlines the execution logic for the new modular cue system, including priority handling and transition modes.

## Priority System

### Default: LTP (Last Takes Precedence)

Following professional lighting console standards, the **default priority mode is LTP** (Last Takes Precedence):
- When a new cue targets tracks already controlled by another cue, the new cue **takes over**
- Previous cue on those tracks is stopped
- This is the most intuitive behavior for live performance

### Available Priority Modes

```typescript
export type CuePriorityMode = 
  | 'ltp'        // Last Takes Precedence (DEFAULT)
  | 'htp'        // Highest Takes Precedence  
  | 'first'      // First cue keeps control
  | 'blend'      // Blend multiple cues
```

**LTP** - Last Takes Precedence (DEFAULT)
- Most recent cue wins
- Previous cues on same tracks are stopped
- Standard for lighting consoles

**HTP** - Highest Takes Precedence
- Could be based on cue priority value
- Future enhancement

**First** - First Keeps Control
- Running cue blocks new cues on same tracks
- New cue is rejected

**Blend** - Allow Multiple Cues  
- Multiple cues can run on same tracks
- Results are blended/averaged
- Uses crossfade transition

## Transition Modes

When a new cue interrupts an existing cue, the transition mode determines how tracks move from their current position to the new animation's start position.

```typescript
export type TransitionMode = 
  | 'direct'               // DEFAULT
  | 'fade-through-initial'
  | 'crossfade'           
  | 'hard-cut'
```

### Direct (DEFAULT)

**Behavior**: Jump directly from current position to new animation's start position
- Most efficient
- Can be jarring if positions are far apart
- Good for: quick cue changes, rehearsals

**Example**:
```
Current position: (5, 3, 2)
New animation start: (0, 0, 1)
→ Track jumps directly to (0, 0, 1), then animation plays
```

### Fade Through Initial

**Behavior**: Fade back to initial position, pause, then start new animation
- Smooth return to known state
- Predictable starting point
- Good for: scene changes, rehearsed cues

**Example**:
```
Current position: (5, 3, 2)
Track initial: (1, 0, 1.5)
New animation start: (0, 0, 1)

Step 1: Fade from (5, 3, 2) → (1, 0, 1.5) over transition duration
Step 2: Jump to (0, 0, 1)
Step 3: Start new animation
```

### Crossfade

**Behavior**: Blend from current animation to new animation over time
- Smoothest transition
- No sudden jumps
- Good for: musical cues, smooth scene transitions

**Example**:
```
Current animation: Circular at progress 45%
New animation: Linear

Over crossfade duration:
- Current animation fades out (100% → 0%)
- New animation fades in (0% → 100%)
- Position is weighted blend of both
```

### Hard Cut

**Behavior**: Stop immediately, start new animation at its start position
- Instantaneous change
- No transition time
- Good for: emergency stops, hard scene cuts

**Example**:
```
Current position: (5, 3, 2)
New animation start: (0, 0, 1)

→ Immediate hard cut to (0, 0, 1), animation starts
No fading, no blending
```

## Configuration

### Global Settings
```typescript
interface CueExecutionContext {
  priorityMode: CuePriorityMode           // Default: 'ltp'
  defaultTransitionMode: TransitionMode   // Default: 'direct'
  defaultTransitionDuration: number       // Default: 1.0 seconds
}
```

### Per-Execution Overrides
```typescript
interface ExecutionOptions {
  transitionMode?: TransitionMode      // Override global setting
  transitionDuration?: number          // Override global duration
  priority?: CuePriorityMode          // Override global priority
}
```

## User-Facing Settings

### In Cue System Settings Panel

```
Priority Mode: [LTP (Last Takes Precedence) ▼]
  └─ LTP - Last cue wins (recommended)
  └─ First - First cue keeps control  
  └─ Blend - Allow multiple cues

Default Transition: [Direct ▼]
  └─ Direct - Jump to new position
  └─ Fade Through Initial - Return to start first
  └─ Crossfade - Smooth blend
  └─ Hard Cut - Instant change

Transition Duration: [1.0] seconds
```

### Per-Cue Override (Optional)

In cue editor, advanced section:
```
⚙️ Advanced Settings
  ☐ Override Transition
    Mode: [Crossfade ▼]
    Duration: [2.0] seconds
```

## Implementation Notes

### Track Ownership

```typescript
// Track which cue currently controls each track
trackOwnership: Map<string, string>  // trackId → cueId

// When new cue wants tracks:
1. Check trackOwnership for conflicts
2. Apply priority rules
3. Stop conflicting cues if needed
4. Update ownership map
5. Execute new cue
```

### Conflict Resolution

```typescript
function resolveTrackConflicts(
  newCue: Cue,
  requestedTracks: string[],
  context: CueExecutionContext,
  priorityMode: CuePriorityMode
): ConflictResolution {
  // Find which cues currently control these tracks
  const conflictingCues = getConflictingCues(requestedTracks, context)
  
  switch (priorityMode) {
    case 'ltp':
      // Stop all conflicting, new cue wins
      return {
        shouldExecute: true,
        conflictingCues: conflictingCues,  // Stop these
        tracksToUse: requestedTracks
      }
    
    case 'first':
      // If any conflicts, block new cue
      if (conflictingCues.length > 0) {
        return { shouldExecute: false }
      }
      return { shouldExecute: true }
    
    // ... other modes
  }
}
```

### Transition Handling

```typescript
async function handleTransition(
  trackIds: string[],
  mode: TransitionMode,
  duration: number,
  targetAnimation: Animation
): Promise<void> {
  switch (mode) {
    case 'direct':
      // No transition, return immediately
      break
    
    case 'fade-through-initial':
      // 1. Get initial positions
      const initialPositions = getTrackInitialPositions(trackIds)
      // 2. Create fade animation to initial
      await fadeToPositions(trackIds, initialPositions, duration)
      // 3. Then new animation starts
      break
    
    case 'crossfade':
      // Handled by orchestrator's blend system
      await wait(duration)
      break
    
    case 'hard-cut':
      // Immediate, no wait
      break
  }
}
```

## Examples

### Example 1: Quick Cue Change (LTP + Direct)

**Setup**:
- Cue 1 playing: Circular animation on tracks [1, 2, 3]
- User triggers Cue 2: Linear animation on tracks [2, 3, 4]

**What happens**:
```
1. Detect conflict: tracks [2, 3] in both cues
2. Apply LTP: Cue 2 wins
3. Stop Cue 1 on tracks [2, 3]
4. Cue 1 continues on track [1]
5. Cue 2 starts on tracks [2, 3, 4] in direct mode
   - Tracks [2, 3] jump to Cue 2's start position
   - Track [4] starts from its current position
```

### Example 2: Smooth Scene Change (LTP + Crossfade)

**Setup**:
- Cue 1 playing: Sweep animation
- User triggers Cue 2: Formation with 2-second crossfade

**What happens**:
```
1. Cue 2 starts while Cue 1 still running
2. Over 2 seconds:
   - Cue 1 fades out (influence: 100% → 0%)
   - Cue 2 fades in (influence: 0% → 100%)
   - Track positions are weighted blend
3. After 2 seconds:
   - Cue 1 stopped
   - Cue 2 at 100%
```

### Example 3: Protected Cue (First Priority)

**Setup**:
- Priority mode: First
- Cue 1 playing: Critical animation on tracks [1, 2]
- User triggers Cue 2 on tracks [1, 2, 3]

**What happens**:
```
1. Detect conflict: tracks [1, 2] busy
2. Apply First priority: Cue 1 keeps control
3. Cue 2 blocked completely (not executed)
4. Optional: Show warning "Tracks busy, cue not executed"
```

## Migration Path

### Phase 1 (Current)
- Define types and interfaces
- Document execution logic
- **This file**

### Phase 2
- Implement execution functions
- Integrate with orchestrator
- Handle type system migration

### Phase 3
- Add UI controls for settings
- Per-cue override options
- Testing and refinement

## Open Questions

1. **Should crossfade affect all animation parameters or just position?**
   - Currently: Just position
   - Future: Could blend rotation, speed, etc.

2. **How to handle fade-through-initial with multi-track formations?**
   - Option A: Each track independently fades to its initial
   - Option B: Formation maintains during fade, then breaks
   - **Recommendation**: Option A (simpler, more predictable)

3. **What if a track has no initial position defined?**
   - Fallback to (0, 0, 0)
   - Or use current position as "initial"
   - **Recommendation**: Use (0, 0, 0) as safe default

4. **Should we allow per-track transition modes?**
   - Currently: All tracks use same transition
   - Future: Could specify per track
   - **Recommendation**: Defer to later, keep simple

---

**Document Version**: 1.0  
**Author**: Cascade AI  
**Date**: 2024-11-14  
**Status**: Design - Pending Implementation

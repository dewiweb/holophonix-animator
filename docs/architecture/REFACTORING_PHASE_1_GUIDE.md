# Phase 1: Animation System Refactoring - Implementation Guide

**Duration**: 2-3 weeks  
**Goal**: Create core architecture foundation without breaking existing functionality  
**Status**: Ready to begin

---

## Overview

Phase 1 establishes the new architecture patterns while keeping the existing system fully operational. We'll create three new core systems:

1. **Animation Orchestrator** - Central playback coordinator
2. **Multi-Track Manager** - Unified multi-track logic  
3. **Animation Runtime** - Pure calculation layer

---

## Step 1: Create Animation Orchestrator (Week 1, Days 1-3)

### 1.1 Create Base Structure

**File**: `src/animation/orchestrator/index.ts`

```typescript
import { Animation, Position } from '@/types'
import { useAnimationStore } from '@/stores/animationStore'
import { useProjectStore } from '@/stores/projectStore'

// Core types
export interface ClipHandle {
  id: string
  animationId: string
  trackIds: string[]
  startTime: number
  priority: number
}

export interface ClipState {
  handle: ClipHandle
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
}

export interface ScheduleOptions {
  priority?: number
  fadeIn?: number
  fadeOut?: number
  loop?: boolean
}

// Orchestrator class
export class AnimationOrchestrator {
  private activeClips: Map<string, ClipState> = new Map()
  private nextClipId = 0

  /**
   * Play an animation immediately
   */
  play(animationId: string, trackIds: string[], options?: ScheduleOptions): ClipHandle {
    const handle: ClipHandle = {
      id: `clip-${this.nextClipId++}`,
      animationId,
      trackIds,
      startTime: Date.now(),
      priority: options?.priority ?? 0
    }

    // Delegate to existing animation store for now
    const animationStore = useAnimationStore.getState()
    animationStore.playAnimation(animationId, trackIds)

    // Track the clip
    this.activeClips.set(handle.id, {
      handle,
      isPlaying: true,
      isPaused: false,
      currentTime: 0
    })

    return handle
  }

  /**
   * Stop a specific clip
   */
  stop(handle: ClipHandle): void {
    const animationStore = useAnimationStore.getState()
    animationStore.stopAnimation(handle.animationId)
    this.activeClips.delete(handle.id)
  }

  /**
   * Pause a specific clip
   */
  pause(handle: ClipHandle): void {
    const state = this.activeClips.get(handle.id)
    if (state) {
      state.isPaused = true
      const animationStore = useAnimationStore.getState()
      animationStore.pauseAnimation(handle.animationId)
    }
  }

  /**
   * Stop all playing clips
   */
  stopAll(): void {
    const animationStore = useAnimationStore.getState()
    animationStore.stopAllAnimations()
    this.activeClips.clear()
  }

  /**
   * Get all active clips
   */
  getActiveClips(): ClipHandle[] {
    return Array.from(this.activeClips.values()).map(state => state.handle)
  }

  /**
   * Get state for specific clip
   */
  getClipState(handle: ClipHandle): ClipState | null {
    return this.activeClips.get(handle.id) ?? null
  }

  /**
   * Check if specific animation is playing
   */
  isAnimationPlaying(animationId: string): boolean {
    for (const state of this.activeClips.values()) {
      if (state.handle.animationId === animationId && state.isPlaying) {
        return true
      }
    }
    return false
  }
}

// Singleton instance
export const orchestrator = new AnimationOrchestrator()
```

### 1.2 Create Clip Manager

**File**: `src/animation/orchestrator/clipManager.ts`

```typescript
import { ClipHandle, ClipState } from './index'

export class ClipManager {
  private clips: Map<string, ClipState> = new Map()

  add(handle: ClipHandle): void {
    this.clips.set(handle.id, {
      handle,
      isPlaying: true,
      isPaused: false,
      currentTime: 0
    })
  }

  remove(clipId: string): void {
    this.clips.delete(clipId)
  }

  get(clipId: string): ClipState | undefined {
    return this.clips.get(clipId)
  }

  getAll(): ClipState[] {
    return Array.from(this.clips.values())
  }

  getByAnimation(animationId: string): ClipState[] {
    return Array.from(this.clips.values()).filter(
      state => state.handle.animationId === animationId
    )
  }

  getByTrack(trackId: string): ClipState[] {
    return Array.from(this.clips.values()).filter(
      state => state.handle.trackIds.includes(trackId)
    )
  }

  updateState(clipId: string, updates: Partial<ClipState>): void {
    const state = this.clips.get(clipId)
    if (state) {
      Object.assign(state, updates)
    }
  }

  clear(): void {
    this.clips.clear()
  }
}
```

### 1.3 Add Tests

**File**: `src/animation/orchestrator/__tests__/orchestrator.test.ts`

```typescript
import { orchestrator } from '../index'

describe('AnimationOrchestrator', () => {
  beforeEach(() => {
    orchestrator.stopAll()
  })

  test('play creates clip handle', () => {
    const handle = orchestrator.play('anim-1', ['track-1'])
    expect(handle.animationId).toBe('anim-1')
    expect(handle.trackIds).toEqual(['track-1'])
  })

  test('getActiveClips returns playing clips', () => {
    orchestrator.play('anim-1', ['track-1'])
    orchestrator.play('anim-2', ['track-2'])
    
    const clips = orchestrator.getActiveClips()
    expect(clips).toHaveLength(2)
  })

  test('stop removes clip', () => {
    const handle = orchestrator.play('anim-1', ['track-1'])
    orchestrator.stop(handle)
    
    const clips = orchestrator.getActiveClips()
    expect(clips).toHaveLength(0)
  })

  test('stopAll clears all clips', () => {
    orchestrator.play('anim-1', ['track-1'])
    orchestrator.play('anim-2', ['track-2'])
    orchestrator.stopAll()
    
    const clips = orchestrator.getActiveClips()
    expect(clips).toHaveLength(0)
  })
})
```

---

## Step 2: Create Multi-Track Manager (Week 1, Days 4-5)

### 2.1 Extract Multi-Track Logic

**File**: `src/animation/multitrack/index.ts`

```typescript
import { Position } from '@/types'
import { MultiTrackMode } from '@/types'

export interface MultiTrackContext {
  trackId: string
  trackIndex: number
  totalTracks: number
  basePosition: Position
  animationType?: string
  time?: number
  duration?: number
}

export class MultiTrackManager {
  /**
   * Calculate track offset based on multi-track mode
   */
  calculateTrackOffset(
    mode: MultiTrackMode,
    context: MultiTrackContext
  ): Position {
    switch (mode) {
      case 'identical':
        return { x: 0, y: 0, z: 0 }
      
      case 'position-relative':
        return context.basePosition
      
      case 'phase-offset':
      case 'phase-offset-relative':
        // Phase offset doesn't affect position, only time
        return mode === 'phase-offset-relative' 
          ? context.basePosition 
          : { x: 0, y: 0, z: 0 }
      
      case 'centered':
        // Offset calculated elsewhere (centerPoint parameter)
        return { x: 0, y: 0, z: 0 }
      
      case 'isobarycenter':
        // Offset stored in animation parameters
        return { x: 0, y: 0, z: 0 }
      
      default:
        return { x: 0, y: 0, z: 0 }
    }
  }

  /**
   * Calculate barycenter (center of mass) for tracks
   */
  calculateBarycenter(trackPositions: Position[]): Position {
    if (trackPositions.length === 0) {
      return { x: 0, y: 0, z: 0 }
    }

    const sum = trackPositions.reduce(
      (acc, pos) => ({
        x: acc.x + pos.x,
        y: acc.y + pos.y,
        z: acc.z + pos.z
      }),
      { x: 0, y: 0, z: 0 }
    )

    const count = trackPositions.length
    return {
      x: sum.x / count,
      y: sum.y / count,
      z: sum.z / count
    }
  }

  /**
   * Calculate formation offset with rotation
   */
  calculateFormationOffset(
    baseOffset: Position,
    rotationAngle: number,
    plane: 'xy' | 'xz' | 'yz' = 'xy'
  ): Position {
    const cos = Math.cos(rotationAngle)
    const sin = Math.sin(rotationAngle)

    switch (plane) {
      case 'xy':
        return {
          x: baseOffset.x * cos - baseOffset.y * sin,
          y: baseOffset.x * sin + baseOffset.y * cos,
          z: baseOffset.z
        }
      case 'xz':
        return {
          x: baseOffset.x * cos - baseOffset.z * sin,
          y: baseOffset.y,
          z: baseOffset.x * sin + baseOffset.z * cos
        }
      case 'yz':
        return {
          x: baseOffset.x,
          y: baseOffset.y * cos - baseOffset.z * sin,
          z: baseOffset.y * sin + baseOffset.z * cos
        }
    }
  }

  /**
   * Calculate phase offset time adjustment
   */
  calculatePhaseOffsetTime(
    baseTime: number,
    trackIndex: number,
    phaseOffsetSeconds: number
  ): number {
    return Math.max(0, baseTime - (trackIndex * phaseOffsetSeconds))
  }

  /**
   * Apply position-relative offset
   */
  applyPositionRelative(basePosition: Position, trackPosition: Position): Position {
    return {
      x: basePosition.x + trackPosition.x,
      y: basePosition.y + trackPosition.y,
      z: basePosition.z + trackPosition.z
    }
  }

  /**
   * Validate if multi-track mode is compatible with animation type
   */
  validateMultiTrackMode(mode: MultiTrackMode, animationType: string): boolean {
    // Path-based animations don't support centered mode
    const pathBased = ['linear', 'bezier', 'catmull-rom', 'zigzag', 'custom']
    if (mode === 'centered' && pathBased.includes(animationType)) {
      return false
    }

    // All other combinations are valid
    return true
  }
}

// Singleton instance
export const multiTrackManager = new MultiTrackManager()
```

### 2.2 Add Tests

**File**: `src/animation/multitrack/__tests__/multitrack.test.ts`

```typescript
import { multiTrackManager } from '../index'

describe('MultiTrackManager', () => {
  test('calculateBarycenter computes center of mass', () => {
    const positions = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 5, y: 10, z: 0 }
    ]
    
    const barycenter = multiTrackManager.calculateBarycenter(positions)
    expect(barycenter.x).toBeCloseTo(5)
    expect(barycenter.y).toBeCloseTo(3.33, 1)
    expect(barycenter.z).toBe(0)
  })

  test('calculatePhaseOffsetTime applies delay', () => {
    const time = multiTrackManager.calculatePhaseOffsetTime(10, 2, 1.5)
    expect(time).toBe(7) // 10 - (2 * 1.5)
  })

  test('validateMultiTrackMode rejects invalid combinations', () => {
    expect(multiTrackManager.validateMultiTrackMode('centered', 'linear')).toBe(false)
    expect(multiTrackManager.validateMultiTrackMode('centered', 'circular')).toBe(true)
  })
})
```

---

## Step 3: Refactor Animation Runtime (Week 2, Days 1-3)

### 3.1 Create Pure Runtime

**File**: `src/animation/runtime/index.ts`

```typescript
import { Animation, Position } from '@/types'
import { modelRuntime } from '@/models/runtime'
import { calculatePosition } from '@/utils/animations'

export interface CalculationContext {
  trackId: string
  trackIndex: number
  totalTracks: number
  frameCount: number
  deltaTime: number
  realTime: number
  multiTrackMode?: string
  trackOffset?: Position
}

export class AnimationRuntime {
  /**
   * Calculate position for single track
   */
  calculatePosition(
    animation: Animation,
    time: number,
    context: CalculationContext
  ): Position {
    // Try new model runtime first
    if (modelRuntime) {
      try {
        return modelRuntime.calculatePosition(animation, time, 0, context as any)
      } catch (error) {
        console.warn('Model runtime failed, falling back to legacy:', error)
      }
    }

    // Fallback to legacy calculation
    return calculatePosition(animation, time)
  }

  /**
   * Calculate positions for multiple tracks (batch processing)
   */
  calculateBatch(
    animation: Animation,
    time: number,
    trackIds: string[]
  ): Map<string, Position> {
    const positions = new Map<string, Position>()

    trackIds.forEach((trackId, index) => {
      const context: CalculationContext = {
        trackId,
        trackIndex: index,
        totalTracks: trackIds.length,
        frameCount: 0,
        deltaTime: 0.016,
        realTime: Date.now()
      }

      positions.set(trackId, this.calculatePosition(animation, time, context))
    })

    return positions
  }

  /**
   * Calculate with multi-track offset applied
   */
  calculateWithOffset(
    animation: Animation,
    time: number,
    context: CalculationContext,
    offset: Position
  ): Position {
    const basePosition = this.calculatePosition(animation, time, context)
    
    return {
      x: basePosition.x + offset.x,
      y: basePosition.y + offset.y,
      z: basePosition.z + offset.z
    }
  }
}

// Singleton instance
export const animationRuntime = new AnimationRuntime()
```

---

## Step 4: Integration (Week 2, Days 4-5)

### 4.1 Update Animation Store

**File**: `src/stores/animationStore.ts` (modifications)

```typescript
import { orchestrator } from '@/animation/orchestrator'
import { animationRuntime } from '@/animation/runtime'
import { multiTrackManager } from '@/animation/multitrack'

// In playAnimation method, optionally delegate to orchestrator
playAnimation: (animationId: string, trackIds: string[] = []) => {
  // Feature flag for new system
  const useOrchestrator = false // Set to true when ready

  if (useOrchestrator) {
    orchestrator.play(animationId, trackIds)
    return
  }

  // Existing implementation...
}

// In animation loop, use new runtime
const position = animationRuntime.calculatePosition(
  animation,
  animationTime,
  context
)

// Use multi-track manager for offsets
const offset = multiTrackManager.calculateTrackOffset(
  params._multiTrackMode,
  context
)
```

### 4.2 Update Cue System

**File**: `src/cues/store.ts` (modifications)

```typescript
import { orchestrator } from '@/animation/orchestrator'

// In triggerCue, optionally use orchestrator
case 'play':
  if (cue.parameters.animationId) {
    const trackIds = cue.parameters.trackIds || projectStore.selectedTracks
    
    // Feature flag for new system
    const useOrchestrator = false
    
    if (useOrchestrator) {
      orchestrator.play(cue.parameters.animationId, trackIds)
    } else {
      animationStore.playAnimation(cue.parameters.animationId, trackIds)
    }
  }
  break
```

---

## Step 5: Testing & Validation (Week 3)

### 5.1 Integration Tests

**File**: `src/__tests__/integration/orchestrator.integration.test.ts`

```typescript
import { orchestrator } from '@/animation/orchestrator'
import { useProjectStore } from '@/stores/projectStore'
import { useAnimationStore } from '@/stores/animationStore'

describe('Orchestrator Integration', () => {
  test('playing animation updates animation store', () => {
    const animationStore = useAnimationStore.getState()
    
    orchestrator.play('anim-1', ['track-1'])
    
    expect(animationStore.isPlaying).toBe(true)
  })

  test('stopping clip stops animation in store', () => {
    const handle = orchestrator.play('anim-1', ['track-1'])
    orchestrator.stop(handle)
    
    const animationStore = useAnimationStore.getState()
    expect(animationStore.isPlaying).toBe(false)
  })
})
```

### 5.2 Manual Testing Checklist

- [ ] Play animation from editor - works as before
- [ ] Trigger animation from cue - works as before
- [ ] Multiple simultaneous animations - still working
- [ ] Multi-track modes - all still functional
- [ ] OSC messages - sent correctly
- [ ] Performance - no regression

---

## Deliverables

By end of Phase 1:

1. ✅ Animation Orchestrator implemented and tested
2. ✅ Multi-Track Manager centralized and tested
3. ✅ Animation Runtime separated and tested
4. ✅ Integration with existing systems via feature flags
5. ✅ Comprehensive test coverage
6. ✅ No breaking changes to existing functionality
7. ✅ Documentation updated

---

## Next Steps

After Phase 1 completion:
- **Phase 2**: Migrate all components to use orchestrator
- **Phase 3**: Implement Schedule Engine
- **Phase 4**: Timeline UI
- **Phase 5**: Polish & optimization

---

## Notes

- Use feature flags to gradually enable new systems
- Keep old code paths working during transition
- Test extensively before each merge
- Document all API changes
- Communicate progress regularly

---

**Ready to begin implementation!**

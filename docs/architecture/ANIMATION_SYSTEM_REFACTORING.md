# Holophonix Animator: Unified Animation System Architecture

**Status**: Proposal for Major Refactoring  
**Date**: 2024  
**Version**: 2.0

## Executive Summary

This document proposes a comprehensive refactoring of the Holophonix Animator animation system to unify:
- Animation Editor components
- Built-in Animation Models system
- Multi-track behavior management
- Cue system (now with multiple simultaneous animations)
- Timeline implementation (DAW-style)
- OSC message management

**Goal**: Create a cohesive, scalable architecture that supports professional show control workflows.

---

## 1. Current State Analysis

### 1.1 Existing Systems

#### **Animation Store** (`src/stores/animationStore.ts`)
- ✅ Now supports multiple simultaneous animations via `Map<string, PlayingAnimation>`
- ✅ 60 FPS animation engine with requestAnimationFrame
- ✅ OSC batch manager integration
- ⚠️ Still has backward compatibility cruft (currentAnimationId, currentTrackIds)
- ⚠️ Animation calculation logic mixed with playback logic

#### **Animation Editor** (`src/components/animation-editor/`)
- ✅ Comprehensive UI for creating animations
- ✅ 3D preview with path visualization
- ✅ Control point editing
- ✅ Multi-track mode selector
- ⚠️ Animation parameters scattered across multiple handlers
- ⚠️ No direct integration with timeline or cue systems
- ⚠️ Per-track parameter editing is complex

#### **Model Runtime** (`src/models/`)
- ✅ Plugin-based animation model system
- ✅ Model registry with validation
- ✅ Built-in models (Linear, Circular, Pendulum, Spring, Wave, etc.)
- ⚠️ Still falls back to legacy `calculatePosition()`
- ⚠️ Not all animation types migrated to model system
- ⚠️ Multi-track logic partially duplicated

#### **Cue System** (`src/cues/store.ts`)
- ✅ 8x8 grid with multiple banks
- ✅ Now supports multiple simultaneous animations
- ✅ Hotkey triggers, OSC ready
- ⚠️ Limited scheduling capabilities
- ⚠️ No timeline integration
- ⚠️ Animation parameters not editable from cues

#### **Timeline** (`src/timeline/types.ts`)
- ✅ Comprehensive type definitions
- ✅ DAW-style architecture (tracks, clips, automation)
- ✅ Marker and region support
- ✅ Timecode sync ready
- ❌ **NOT YET IMPLEMENTED** - only type definitions exist
- ❌ No integration with animation store
- ❌ No UI components

#### **Multi-track System**
- ✅ 6 modes: identical, position-relative, phase-offset, phase-offset-relative, centered, isobarycenter
- ✅ Per-track parameter overrides
- ⚠️ Logic spread across: editor, store, models, path generation
- ⚠️ Track offset calculations duplicated
- ⚠️ Formation logic (isobarycenter) tightly coupled

### 1.2 Pain Points

1. **Fragmented Animation Management**
   - Animations created in editor, triggered by cues, but no central management
   - No way to sequence animations (timeline not implemented)
   - Parameters can't be automated over time

2. **Multi-track Complexity**
   - Different systems handle multi-track differently
   - Track offset logic duplicated in multiple places
   - Formation calculations (barycenter, rotation) spread out

3. **No Unified Playback Control**
   - Animation store handles immediate playback
   - Cues trigger animations
   - Timeline would add another layer
   - No coordination between these systems

4. **State Management Issues**
   - Animation state in projectStore (saved animations)
   - Playback state in animationStore
   - Track state in projectStore
   - Timeline state would be separate
   - No single source of truth

5. **Limited Scheduling**
   - Can't schedule animations for future execution
   - No automation of parameters over time
   - No crossfades or transitions between animations

---

## 2. Proposed Architecture

### 2.1 Core Principle: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                   USER INTERFACES                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ Animation  │  │    Cue     │  │  Timeline  │            │
│  │   Editor   │  │    Grid    │  │    View    │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
└────────┼───────────────┼───────────────┼───────────────────┘
         │               │               │
         └───────────────┴───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │    ANIMATION ORCHESTRATOR     │ ← New central system
         │  (Unified Playback Control)   │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                                │
    ┌────▼─────┐                   ┌─────▼────┐
    │ Schedule │                   │ Playback │
    │  Engine  │                   │  Engine  │
    └────┬─────┘                   └─────┬────┘
         │                               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────▼───────────────┐
         │      ANIMATION RUNTIME        │
         │   (Model Execution Layer)     │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                                │
    ┌────▼──────┐  ┌─────────┐    ┌─────▼────┐
    │   Model   │  │  Multi  │    │   OSC    │
    │  Registry │  │  Track  │    │  Output  │
    └───────────┘  │  Logic  │    └──────────┘
                   └─────────┘
```

### 2.2 New Core Systems

#### **2.2.1 Animation Orchestrator** (NEW)

Central coordinator for all animation playback.

```typescript
interface AnimationOrchestrator {
  // Playback control
  schedule(clip: AnimationClip, options?: ScheduleOptions): ClipHandle
  play(animationId: string, tracks: string[]): ClipHandle
  stop(handle: ClipHandle): void
  pause(handle: ClipHandle): void
  stopAll(): void
  
  // Timeline integration
  playTimeline(timelineId: string, startTime?: number): void
  seekTimeline(time: number): void
  
  // Cue integration
  triggerCue(cueId: string): void
  
  // State queries
  getActiveClips(): ClipHandle[]
  getClipState(handle: ClipHandle): ClipState
  
  // Automation
  automateParameter(target: AutomationTarget, points: AutomationPoint[]): void
}
```

**Responsibilities**:
- Manage all active animation clips (from editor, cues, or timeline)
- Coordinate scheduling and playback
- Handle clip priorities and conflicts
- Manage crossfades and transitions
- Provide unified API for all UI components

#### **2.2.2 Animation Runtime** (REFACTORED)

Pure execution layer - calculates positions from models.

```typescript
interface AnimationRuntime {
  // Model execution
  calculatePosition(
    model: AnimationModel,
    time: number,
    context: CalculationContext
  ): Position
  
  // Multi-track processing
  calculateMultiTrackPositions(
    model: AnimationModel,
    time: number,
    tracks: string[],
    mode: MultiTrackMode
  ): Map<string, Position>
  
  // Batch processing for performance
  calculateBatch(
    clips: ClipHandle[],
    time: number
  ): Map<string, Position>
}
```

**Responsibilities**:
- Execute animation models
- Apply multi-track logic
- Handle track offset calculations
- Optimize batch processing
- No state management, pure computation

#### **2.2.3 Schedule Engine** (NEW)

Handles time-based scheduling and automation.

```typescript
interface ScheduleEngine {
  // Scheduling
  scheduleClip(clip: AnimationClip, startTime: number): ScheduleHandle
  cancelSchedule(handle: ScheduleHandle): void
  
  // Automation
  registerAutomation(automation: Automation): void
  updateAutomation(id: string, points: AutomationPoint[]): void
  
  // Timeline playback
  playTimeline(timeline: Timeline, startTime: number): void
  updateTimelinePosition(time: number): void
  
  // Queries
  getScheduledClips(timeRange: TimeRange): AnimationClip[]
  getActiveAutomations(time: number): Automation[]
}
```

**Responsibilities**:
- Schedule animations for future execution
- Process automation curves
- Handle timeline playback
- Trigger time-based events
- Manage marker and cue triggers

#### **2.2.4 Multi-Track Manager** (NEW)

Centralized multi-track logic.

```typescript
interface MultiTrackManager {
  // Offset calculations
  calculateTrackOffset(
    trackId: string,
    mode: MultiTrackMode,
    context: MultiTrackContext
  ): Position
  
  // Formation calculations
  calculateBarycenter(tracks: string[]): Position
  calculateFormationOffset(
    trackId: string,
    barycenter: Position,
    rotationAngle: number
  ): Position
  
  // Mode-specific logic
  applyPositionRelative(base: Position, trackPosition: Position): Position
  applyPhaseOffset(time: number, trackIndex: number, offset: number): number
  applyCentered(base: Position, centerPoint: Position): Position
  
  // Utilities
  getTrackIndices(trackIds: string[]): Map<string, number>
  validateMultiTrackMode(mode: MultiTrackMode, animationType: AnimationType): boolean
}
```

**Responsibilities**:
- All track offset calculations
- Formation logic (barycenter, rotation)
- Multi-track mode implementations
- Mode validation
- Track index management

### 2.3 Refactored Existing Systems

#### **Animation Store** → **Playback Engine**

```typescript
interface PlaybackEngine {
  // Core playback (simplified)
  isPlaying: boolean
  frameCount: number
  
  // Engine control
  startEngine(): void
  stopEngine(): void
  tick(): void  // Called by orchestrator
  
  // Output
  sendOSCUpdates(positions: Map<string, Position>): void
}
```

**Changes**:
- Remove animation management (moved to orchestrator)
- Remove multi-track logic (moved to multi-track manager)
- Focus on engine loop and OSC output
- Controlled by orchestrator

#### **Animation Editor** → **Animation Designer**

```typescript
interface AnimationDesigner {
  // Design mode
  mode: 'create' | 'edit' | 'duplicate'
  
  // Animation being designed
  currentAnimation: Animation | null
  
  // Preview
  previewState: PreviewState
  
  // Actions
  createAnimation(template?: AnimationType): void
  editAnimation(animationId: string): void
  saveAnimation(): void
  exportToTimeline(timelineId: string, time: number): void
  exportToCue(cueId: string): void
  
  // No direct playback control - uses orchestrator for preview
  previewAnimation(): void
  stopPreview(): void
}
```

**Changes**:
- Separate design-time from runtime
- Remove direct animation playback
- Use orchestrator for previews
- Add export to timeline/cue functionality
- Focus on parameter editing and validation

#### **Cue System** → **Cue Manager**

```typescript
interface CueManager {
  // Cue management
  cues: Map<string, Cue>
  banks: CueBank[]
  
  // Triggering
  triggerCue(cueId: string): void
  stopCue(cueId: string): void
  
  // Uses orchestrator for playback
  // No direct animation control
  
  // Cue lists
  cueLists: CueList[]
  activeCueList: string | null
  goNext(): void
  goPrevious(): void
}
```

**Changes**:
- Delegate animation playback to orchestrator
- Focus on cue logic and triggering
- Cue lists for sequential playback
- Integration with timeline via orchestrator

---

## 3. Integration Scenarios

### 3.1 Simple Animation Playback (Current Workflow)

```typescript
// User creates animation in editor
animationDesigner.createAnimation('circular')
animationDesigner.setParameters({ radius: 5, plane: 'xy' })
animationDesigner.saveAnimation() // Saves to project store

// User triggers from cue
cueManager.triggerCue('cue-1') // Cue references animation
  ↓
orchestrator.play(animationId, trackIds)
  ↓
playbackEngine.tick() → runtime.calculatePosition()
  ↓
OSC output
```

### 3.2 Timeline-based Sequencing (New Workflow)

```typescript
// User creates animation in editor
animationDesigner.createAnimation('linear')
animationDesigner.exportToTimeline(timelineId, startTime: 10.0)

// Timeline playback
orchestrator.playTimeline(timelineId)
  ↓
scheduleEngine.playTimeline(timeline, 0)
  ↓
scheduleEngine processes clips at current time
  ↓
orchestrator schedules clips via schedule engine
  ↓
runtime calculates positions
  ↓
playbackEngine sends OSC
```

### 3.3 Complex Show (Mixed Workflow)

```typescript
// Pre-show: Timeline with background animations
orchestrator.playTimeline('pre-show-timeline')

// During show: Manual cue triggers
cueManager.triggerCue('spot-1') // Spotlight animation
  ↓
orchestrator.schedule(clip, { priority: 'high' })

// Post-show: Automated sequence
orchestrator.playTimeline('post-show-timeline')
```

### 3.4 Automation Example

```typescript
// Automate radius parameter over time
orchestrator.automateParameter(
  { type: 'animation', animationId: 'circular-1', parameter: 'radius' },
  [
    { time: 0, value: 5 },
    { time: 10, value: 10, curve: 'ease-in-out' },
    { time: 20, value: 5 }
  ]
)
```

---

## 4. Implementation Plan

### Phase 1: Foundation (2-3 weeks)

**Goal**: Create core architecture without breaking existing functionality

1. **Create Animation Orchestrator skeleton**
   - Implement basic clip management
   - Add play/stop/pause methods
   - Integrate with existing animation store

2. **Create Multi-Track Manager**
   - Extract multi-track logic from various places
   - Centralize offset calculations
   - Add comprehensive tests

3. **Refactor Animation Runtime**
   - Separate calculation from playback
   - Remove state management
   - Focus on pure computation

**Deliverable**: New systems in place, old system still working

### Phase 2: Integration (3-4 weeks)

**Goal**: Connect new systems and migrate components

1. **Migrate Animation Editor**
   - Update to use orchestrator for previews
   - Add export to timeline functionality
   - Separate design-time from runtime

2. **Migrate Cue System**
   - Update to use orchestrator for playback
   - Remove direct animation store access
   - Simplify triggering logic

3. **Update Animation Store → Playback Engine**
   - Remove animation management
   - Delegate to orchestrator
   - Focus on engine loop

**Deliverable**: All systems using orchestrator

### Phase 3: Schedule Engine (4-5 weeks)

**Goal**: Add time-based scheduling and automation

1. **Create Schedule Engine**
   - Implement clip scheduling
   - Add automation processing
   - Handle time-based events

2. **Automation UI**
   - Timeline-style automation editing
   - Curve editor
   - Parameter automation lanes

3. **Timeline Integration (Basic)**
   - Load timeline definitions
   - Play timeline clips
   - Handle markers and regions

**Deliverable**: Basic scheduling and automation working

### Phase 4: Timeline UI (5-7 weeks)

**Goal**: Full timeline implementation

1. **Timeline View Component**
   - Track view
   - Clip display
   - Playhead and rulers

2. **Timeline Editing**
   - Drag and drop clips
   - Trim and resize
   - Cut/copy/paste

3. **Timeline Playback**
   - Transport controls
   - Loop regions
   - Timecode sync

**Deliverable**: Full timeline system operational

### Phase 5: Polish & Optimization (2-3 weeks)

**Goal**: Production-ready system

1. **Performance Optimization**
   - Batch processing
   - WebAssembly for heavy calculations
   - Memory optimization

2. **Testing**
   - Unit tests for all systems
   - Integration tests
   - Load testing (100+ tracks)

3. **Documentation**
   - API documentation
   - User guide
   - Developer guide

**Deliverable**: Production-ready unified animation system

---

## 5. API Examples

### 5.1 Orchestrator API

```typescript
// Simple playback
const handle = orchestrator.play('circular-anim', ['track-1', 'track-2'])

// Scheduled playback
const handle = orchestrator.schedule({
  animationId: 'circular-anim',
  trackIds: ['track-1'],
  startTime: 5.0,
  duration: 10.0
})

// Timeline playback
orchestrator.playTimeline('show-timeline', { 
  startTime: 0,
  loopRegion: { start: 10, end: 30 }
})

// Crossfade between animations
orchestrator.crossfade(
  currentHandle,
  newHandle,
  { duration: 2.0, curve: 'ease-in-out' }
)
```

### 5.2 Multi-Track Manager API

```typescript
// Calculate offset for track
const offset = multiTrackManager.calculateTrackOffset(
  'track-1',
  'position-relative',
  { trackIndex: 0, totalTracks: 3, basePosition: { x: 0, y: 0, z: 0 } }
)

// Formation calculations
const barycenter = multiTrackManager.calculateBarycenter(['track-1', 'track-2', 'track-3'])

// Validate mode for animation type
const isValid = multiTrackManager.validateMultiTrackMode('phase-offset', 'circular')
```

### 5.3 Schedule Engine API

```typescript
// Schedule a clip
const handle = scheduleEngine.scheduleClip({
  animationId: 'anim-1',
  trackIds: ['track-1'],
  startTime: 10.0,
  duration: 20.0
}, 10.0)

// Automation
scheduleEngine.registerAutomation({
  target: { type: 'animation', id: 'anim-1', parameter: 'radius' },
  points: [
    { time: 0, value: 5 },
    { time: 10, value: 10, curve: 'ease-in-out' }
  ],
  mode: 'bezier'
})
```

---

## 6. Benefits

### 6.1 For Users

- **Unified workflow**: Design → Timeline → Cues → Performance
- **Complex sequencing**: Create sophisticated show sequences
- **Automation**: Animate any parameter over time
- **Flexibility**: Mix manual cues with automated timeline
- **Professional tools**: DAW-style editing for spatial audio

### 6.2 For Developers

- **Clear separation**: Each system has one responsibility
- **Easier testing**: Pure functions, no hidden state
- **Extensibility**: Add new features without modifying core
- **Maintainability**: Logic is centralized, not duplicated
- **Performance**: Optimize one place, benefits everywhere

### 6.3 For the Project

- **Scalability**: Handle 100+ tracks, complex timelines
- **Reliability**: Well-tested, clear data flow
- **Feature velocity**: Easy to add new capabilities
- **Documentation**: Clear APIs, easy to understand
- **Community**: Clean architecture attracts contributors

---

## 7. Migration Strategy

### 7.1 Backward Compatibility

- Keep old APIs during transition
- Add deprecation warnings
- Provide migration guides
- Gradual component migration

### 7.2 Data Migration

- Project files remain compatible
- Timeline data added to existing projects
- Cues reference animations as before
- No user data loss

### 7.3 Rollback Plan

- Feature flags for new systems
- Ability to switch back to old system
- Comprehensive testing before release
- Beta period with feedback

---

## 8. Open Questions

1. **Clip Priority System**: How do we handle multiple animations on same tracks?
   - Option A: Last-triggered wins
   - Option B: Priority levels
   - Option C: User-defined mixing

2. **Animation Parameter Hot-Swapping**: Can parameters change during playback?
   - Currently not supported
   - Would require interpolation logic

3. **Timeline vs Cue Conflicts**: What if both trigger same tracks?
   - Need conflict resolution strategy
   - Priority system?

4. **Performance Targets**: What are acceptable limits?
   - 100 tracks simultaneous?
   - 10 animations simultaneous?
   - Need benchmarking

5. **WebAssembly Integration**: Which models benefit most?
   - Complex calculations (perlin noise, physics)
   - Batch processing
   - Worth the complexity?

---

## 9. Conclusion

This refactoring will transform Holophonix Animator from a collection of separate systems into a unified, professional animation platform. The modular architecture ensures:

- **Clarity**: Each system has a clear responsibility
- **Flexibility**: Easy to extend and modify
- **Performance**: Optimized calculation and playback
- **Reliability**: Well-tested, maintainable code
- **User Experience**: Seamless workflow from design to performance

**Recommendation**: Proceed with phased implementation, starting with Phase 1 foundation work.

---

## Appendix A: File Structure

```
src/
├── animation/
│   ├── orchestrator/          # NEW: Animation Orchestrator
│   │   ├── index.ts
│   │   ├── clipManager.ts
│   │   ├── priorityManager.ts
│   │   └── transitionManager.ts
│   │
│   ├── runtime/               # REFACTORED: Animation Runtime
│   │   ├── index.ts
│   │   ├── calculator.ts
│   │   ├── batchProcessor.ts
│   │   └── cache.ts
│   │
│   ├── schedule/              # NEW: Schedule Engine
│   │   ├── index.ts
│   │   ├── scheduler.ts
│   │   ├── automation.ts
│   │   └── timelinePlayer.ts
│   │
│   └── multitrack/            # NEW: Multi-Track Manager
│       ├── index.ts
│       ├── offsetCalculator.ts
│       ├── formationManager.ts
│       └── modeValidator.ts
│
├── stores/
│   ├── animationStore.ts      # REFACTORED → playbackEngine.ts
│   ├── projectStore.ts        # Keep as is
│   ├── oscStore.ts            # Keep as is
│   └── timelineStore.ts       # NEW: Timeline state
│
├── components/
│   ├── animation-editor/      # REFACTORED → animation-designer/
│   ├── timeline/              # NEW: Timeline UI
│   └── cues/                  # REFACTORED: Simplified
│
├── models/                    # Keep as is
│   ├── registry.ts
│   ├── runtime.ts
│   └── builtin/
│
└── types/
    ├── animation.ts           # Extended types
    ├── timeline.ts            # Keep as is
    └── orchestrator.ts        # NEW: Orchestrator types
```

---

## Appendix B: Performance Considerations

### Batch Processing
- Process multiple tracks in single pass
- Minimize OSC message creation overhead
- Use WebAssembly for heavy calculations

### Memory Management
- Pool objects for frequent allocations
- Lazy evaluation of automation curves
- Clean up completed clips promptly

### Optimization Targets
- **60 FPS**: Maintain frame rate with 100+ tracks
- **Sub-millisecond**: Position calculation per track
- **< 10ms**: Schedule engine update cycle
- **< 50ms**: Timeline seek operation

---

**End of Document**

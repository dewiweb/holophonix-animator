# Complete Animation System Refactoring - Roadmap

**Date**: 2024-11-04  
**Status**: Phase 1 Complete - Starting Phase 2  
**Estimated Total Time**: 12-16 days

---

## 🎯 Overview

This document outlines the complete refactoring of the Holophonix Animator animation system, transforming it from a monolithic architecture to a modular, professional-grade system with clear separation of concerns.

---

## ✅ Phase 1: Foundation (COMPLETE)

**Status**: ✅ Completed  
**Duration**: 1 session  
**Date**: 2024-11-04

### Objectives
- Fix preset vs saved animation architecture issue
- Implement track locking system
- Improve CueEditor UI
- Prepare foundation for larger refactoring

### Deliverables
- ✅ Track locking (Animation interface updated)
- ✅ Preset integration (CueParameters updated)
- ✅ CueEditor UI overhaul (3 modes: preset/locked/unlocked)
- ✅ Cue store logic (handles all 3 modes)
- ✅ Comprehensive testing guide
- ✅ Architecture documentation (7 docs)

### Files Modified (6)
- `src/types/index.ts`
- `src/cues/types.ts`
- `src/cues/store.ts`
- `src/components/animation-editor/AnimationEditor.tsx`
- `src/components/animation-editor/handlers/saveAnimationHandler.ts`
- `src/components/cue-grid/CueEditor.tsx`

---

## 🔥 Phase 2: Core Architecture (PRIORITY 1)

**Status**: 🔄 In Progress  
**Estimated Duration**: 5-7 days

### 2.1: Animation Orchestrator ⭐ CRITICAL
**Priority**: Highest (Start First)  
**Duration**: 2-3 days  
**Dependencies**: None (foundation only)  
**Blocks**: All other phases

#### Objectives
Create a central coordinator that sits between the UI layer (cues, timeline) and execution layer (animationStore), managing all animation playback with proper scheduling and priorities.

#### Current Problems
```
❌ cueStore directly calls animationStore
❌ No central coordination
❌ Hard to add scheduling
❌ No priority system
❌ Can't manage conflicts
❌ Timeline integration will be messy
```

#### With Orchestrator
```
✅ Single point of control
✅ Scheduling layer
✅ Priority management
✅ Conflict resolution
✅ Timeline-ready
✅ Clean architecture
```

#### Architecture
```
UI Layer (Cues, Timeline, Manual)
    ↓
Animation Orchestrator ← NEW
    ├─→ Scheduler
    ├─→ Priority Manager
    ├─→ Queue Manager
    └─→ Animation Store (execution only)
        ↓
    OSC Output
```

#### Components to Create
1. **AnimationOrchestrator** (`src/orchestrator/animationOrchestrator.ts`)
   - Central coordinator
   - API for triggering animations
   - Queue management
   - Priority handling

2. **Scheduler** (`src/orchestrator/scheduler.ts`)
   - Time-based scheduling
   - Delay management
   - Follow actions
   - Fade in/out

3. **Types** (`src/orchestrator/types.ts`)
   - PlaybackRequest interface
   - Priority levels
   - Scheduler types

#### Key Features
- **Playback Queue**: FIFO or priority-based
- **Priority Levels**: 
  - Emergency (stop all)
  - High (timeline cues)
  - Normal (manual cues)
  - Background (ambient)
- **Scheduling**:
  - Delayed start
  - Fade in/out
  - Follow actions
  - Cue chaining
- **Conflict Resolution**:
  - Track overlap detection
  - Auto-stop or blend
  - User-defined rules

#### API Design
```typescript
interface AnimationOrchestrator {
  // Playback control
  play(request: PlaybackRequest): Promise<PlaybackId>
  stop(playbackId: PlaybackId): void
  pause(playbackId: PlaybackId): void
  resume(playbackId: PlaybackId): void
  stopAll(): void
  
  // Scheduling
  schedule(request: ScheduledRequest): ScheduleId
  cancelSchedule(scheduleId: ScheduleId): void
  
  // Status
  getActivePlaybacks(): PlaybackInfo[]
  getStatus(): OrchestratorStatus
}
```

#### Files to Create
- `src/orchestrator/animationOrchestrator.ts` (main)
- `src/orchestrator/types.ts`
- `src/orchestrator/scheduler.ts`
- `src/orchestrator/priorityManager.ts`
- `src/orchestrator/queueManager.ts`

#### Files to Modify
- `src/cues/store.ts` - Use orchestrator instead of direct animationStore calls
- `src/stores/animationStore.ts` - Simplify to execution only
- `src/components/animation-editor/AnimationEditor.tsx` - Use orchestrator for preview

#### Testing
- Queue management
- Priority handling
- Scheduling delays
- Conflict resolution
- Concurrent playback

---

### 2.2: Multi-Track Manager
**Priority**: High (After Orchestrator)  
**Duration**: 1-2 days  
**Dependencies**: Animation Orchestrator  
**Blocks**: Animation Runtime

#### Objectives
Consolidate scattered multi-track logic into a single, centralized manager that handles all 6 multi-track modes consistently.

#### Current Problems
```
❌ Logic scattered across:
   - AnimationEditor.tsx
   - saveAnimationHandler.ts
   - animationStore.ts
   - Various utils files
❌ Duplicate code
❌ Hard to maintain
❌ Inconsistent behavior
❌ Difficult to test
```

#### With Multi-Track Manager
```
✅ Single source of truth
✅ Consistent behavior
✅ Easy to test
✅ Easy to extend
✅ Clean separation
```

#### Components to Create
1. **MultiTrackManager** (`src/multitrack/multiTrackManager.ts`)
   - Mode handling
   - Offset calculations
   - Track parameter generation
   - Position transformations

2. **Mode Handlers** (`src/multitrack/modes/`)
   - `positionRelative.ts`
   - `phaseOffset.ts`
   - `isobarycenter.ts`
   - `centered.ts`
   - `identical.ts`
   - `phaseOffsetRelative.ts`

3. **Utilities** (`src/multitrack/utils/`)
   - Barycenter calculations
   - Offset transformations
   - Track grouping

#### API Design
```typescript
interface MultiTrackManager {
  // Apply multi-track mode
  applyMode(
    animation: Animation,
    tracks: Track[],
    mode: MultiTrackMode
  ): TrackAnimations[]
  
  // Calculate offsets
  calculateOffsets(tracks: Track[], mode: MultiTrackMode): TrackOffsets
  
  // Transform position
  transformPosition(
    basePosition: Position,
    track: Track,
    mode: MultiTrackMode,
    offsets: TrackOffsets
  ): Position
}
```

#### Files to Create
- `src/multitrack/multiTrackManager.ts`
- `src/multitrack/types.ts`
- `src/multitrack/modes/*.ts` (6 files)
- `src/multitrack/utils/*.ts`

#### Files to Modify
- `src/components/animation-editor/handlers/saveAnimationHandler.ts` - Use manager
- `src/stores/animationStore.ts` - Use manager for calculations
- `src/components/animation-editor/AnimationEditor.tsx` - Simplify

#### Testing
- All 6 multi-track modes
- Offset calculations
- Position transformations
- Edge cases (1 track, many tracks)

---

### 2.3: Animation Runtime
**Priority**: High (After Multi-Track Manager)  
**Duration**: 2 days  
**Dependencies**: Orchestrator, Multi-Track Manager  
**Blocks**: Model System Integration

#### Objectives
Create a pure execution layer that calculates animation positions efficiently, integrating with the model system and optimizing performance.

#### Current Problems
```
❌ calculatePosition() mixes concerns
❌ No model integration
❌ Hard to optimize
❌ No caching
❌ Difficult to test in isolation
```

#### With Animation Runtime
```
✅ Pure calculation layer
✅ Model system ready
✅ Optimized execution
✅ Position caching
✅ Easy to test
✅ Pluggable architecture
```

#### Components to Create
1. **AnimationRuntime** (`src/runtime/animationRuntime.ts`)
   - Position calculation
   - Model execution
   - Caching layer
   - Performance optimization

2. **Runtime Context** (`src/runtime/context.ts`)
   - Execution context
   - State management
   - Cache management

3. **Calculator** (`src/runtime/calculator.ts`)
   - Legacy animation calculations
   - Model-based calculations
   - Fallback logic

#### API Design
```typescript
interface AnimationRuntime {
  // Calculate position
  calculatePosition(
    animation: Animation,
    track: Track,
    time: number,
    context: RuntimeContext
  ): Position
  
  // Batch calculation
  calculateBatch(
    requests: CalculationRequest[]
  ): Position[]
  
  // Clear cache
  clearCache(): void
}
```

#### Files to Create
- `src/runtime/animationRuntime.ts`
- `src/runtime/types.ts`
- `src/runtime/context.ts`
- `src/runtime/calculator.ts`
- `src/runtime/cache.ts`

#### Files to Modify
- `src/stores/animationStore.ts` - Use runtime for calculations
- `src/utils/animations/*.ts` - Refactor into runtime

#### Testing
- Position accuracy
- Performance benchmarks
- Cache effectiveness
- Model integration

---

## 🎨 Phase 3: Advanced Features (PRIORITY 2)

**Status**: ⏳ Pending  
**Estimated Duration**: 4-5 days

### 3.1: Model System Integration
**Priority**: Medium  
**Duration**: 2-3 days  
**Dependencies**: Animation Runtime  
**Blocks**: Community features

#### Objectives
Fully integrate the existing model system (types, registry, validation) with the Animation Runtime, providing UI for browsing and editing models.

#### Components to Create
1. **Runtime Integration** (`src/runtime/modelIntegration.ts`)
   - Connect models to runtime
   - Execute model calculations
   - Handle lifecycle

2. **Model Browser UI** (`src/components/model-browser/`)
   - Browse available models
   - Search and filter
   - Preview animations
   - Model details

3. **Model Editor UI** (`src/components/model-editor/`)
   - Edit model parameters
   - Visual parameter editors
   - Real-time preview
   - Save custom configurations

#### Files to Create
- `src/runtime/modelIntegration.ts`
- `src/components/model-browser/ModelBrowser.tsx`
- `src/components/model-editor/ModelEditor.tsx`
- `src/components/model-editor/ParameterEditor.tsx`

#### Files to Modify
- `src/runtime/animationRuntime.ts` - Use models
- `src/components/animation-editor/AnimationEditor.tsx` - Add model browser

---

### 3.2: Schedule Engine
**Priority**: Medium  
**Duration**: 2 days  
**Dependencies**: Animation Orchestrator  
**Blocks**: Timeline automation

#### Objectives
Create a sophisticated scheduling system for time-based automation, cue chaining, and complex timing scenarios.

#### Components to Create
1. **Schedule Engine** (`src/schedule/scheduleEngine.ts`)
   - Time-based triggers
   - Event system
   - Cue chains
   - Conditional execution

2. **Event System** (`src/schedule/events.ts`)
   - Event definitions
   - Event handlers
   - Event queue

3. **Automation Rules** (`src/schedule/rules.ts`)
   - Conditional logic
   - Rule evaluation
   - Action execution

#### API Design
```typescript
interface ScheduleEngine {
  // Schedule actions
  scheduleAt(time: number, action: Action): ScheduleId
  scheduleAfter(delay: number, action: Action): ScheduleId
  scheduleChain(chain: ActionChain): ChainId
  
  // Events
  on(event: EventType, handler: EventHandler): void
  emit(event: Event): void
  
  // Rules
  addRule(rule: AutomationRule): RuleId
  removeRule(ruleId: RuleId): void
}
```

#### Files to Create
- `src/schedule/scheduleEngine.ts`
- `src/schedule/types.ts`
- `src/schedule/events.ts`
- `src/schedule/rules.ts`
- `src/schedule/chains.ts`

#### Files to Modify
- `src/orchestrator/animationOrchestrator.ts` - Integrate scheduling
- `src/cues/store.ts` - Use schedule engine for follow actions

---

## 🎬 Phase 4: Timeline System (PRIORITY 3)

**Status**: ⏳ Pending  
**Estimated Duration**: 3-4 days

### 4.1: Timeline Integration
**Priority**: Lower (Complex feature)  
**Duration**: 3-4 days  
**Dependencies**: Orchestrator, Schedule Engine  
**Blocks**: Nothing (end feature)

#### Objectives
Integrate the existing timeline type system with the Animation Orchestrator, enabling timeline-driven animation playback.

#### Components to Create
1. **Timeline Controller** (`src/timeline/controller.ts`)
   - Playhead management
   - Clip playback
   - Cue triggering
   - Sync management

2. **Clip Manager** (`src/timeline/clipManager.ts`)
   - Clip tracking
   - Clip playback
   - Transitions

3. **Timeline UI Enhancements** (`src/components/Timeline.tsx`)
   - Playback controls
   - Clip visualization
   - Scrubbing
   - Markers

#### API Design
```typescript
interface TimelineController {
  // Playback
  play(): void
  pause(): void
  stop(): void
  seek(time: number): void
  
  // Clips
  playClip(clipId: string): void
  stopClip(clipId: string): void
  
  // Cues
  triggerCuesAt(time: number): void
}
```

#### Files to Create
- `src/timeline/controller.ts`
- `src/timeline/clipManager.ts`
- `src/timeline/sync.ts`

#### Files to Modify
- `src/components/Timeline.tsx` - Major enhancements
- `src/orchestrator/animationOrchestrator.ts` - Timeline integration
- `src/timeline/store.ts` - Connect controller

---

## 📊 Implementation Schedule

### Week 1
- Days 1-3: Animation Orchestrator
- Days 4-5: Multi-Track Manager

### Week 2
- Days 1-2: Animation Runtime
- Days 3-5: Model System Integration

### Week 3
- Days 1-2: Schedule Engine
- Days 3-5: Timeline Integration

**Total**: 12-16 days for complete refactoring

---

## 🎯 Success Criteria

### Phase 2 (Core Architecture)
- ✅ All playback goes through Orchestrator
- ✅ Multi-track logic consolidated
- ✅ Runtime is pure and testable
- ✅ No breaking changes
- ✅ Performance maintained or improved

### Phase 3 (Advanced Features)
- ✅ Models integrate seamlessly
- ✅ Scheduling works reliably
- ✅ UI is intuitive
- ✅ Performance is acceptable

### Phase 4 (Timeline)
- ✅ Timeline triggers cues correctly
- ✅ Playhead sync is accurate
- ✅ Clips play smoothly
- ✅ Professional DAW-like feel

---

## 🔄 Migration Strategy

### Backward Compatibility
- Maintain all existing APIs during transition
- Deprecation warnings for old patterns
- Gradual migration path
- No user-facing breaking changes

### Testing Strategy
- Unit tests for each component
- Integration tests for workflows
- Performance benchmarks
- User acceptance testing

---

## 📚 Documentation

### Per Phase
- Architecture diagrams
- API documentation
- Implementation guides
- Testing procedures
- Migration guides

### Final
- Complete system documentation
- User guide updates
- Developer onboarding
- Best practices

---

## 🚀 Current Status

**Phase 1**: ✅ Complete  
**Phase 2.1**: 🔄 Starting Now (Animation Orchestrator)  
**Phase 2.2**: ⏳ Pending  
**Phase 2.3**: ⏳ Pending  
**Phase 3**: ⏳ Pending  
**Phase 4**: ⏳ Pending

---

**Next Action**: Begin Animation Orchestrator implementation  
**Estimated Completion**: 2-3 days  
**Blocks**: All remaining phases

---

*This roadmap is a living document and will be updated as implementation progresses.*

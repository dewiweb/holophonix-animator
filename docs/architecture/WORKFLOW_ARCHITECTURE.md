# Holophonix Animator: Workflow Architecture

**Revised**: 2024  
**Status**: Architectural Clarification

---

## Workflow Hierarchy

The system follows a clear, linear workflow:

```
┌─────────────────┐
│ 1. Track        │  User selects tracks to animate
│    Selection    │  (from project's track list)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Animation    │  User creates/edits animations
│    Creation     │  (Animation Editor/Designer)
│                 │  → Saved to Animation Library
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Cue          │  User creates cues that reference:
│    Creation     │  - Animation (from library)
│                 │  - Tracks (which ones to animate)
│                 │  - Trigger method (manual/OSC/timecode)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Timeline     │  [OPTIONAL] For timecoded/synced shows
│    Creation     │  Timeline triggers cues at specific times
│                 │  - Cue triggers as timeline items
│                 │  - Timecode sync (LTC/MTC)
│                 │  - Automated sequences
└─────────────────┘
```

---

## System Relationships

### **Core Principle**: Cues are the Animation Triggers

**Cues** are the central triggering mechanism. They can be triggered in two ways:

1. **Manual/OSC** (Non-timecoded shows)
   - User presses button in cue grid
   - OSC message received
   - Hotkey pressed

2. **Timeline** (Timecoded/synced shows)
   - Timeline reaches cue trigger point
   - Timecode sync triggers cue
   - Automated sequence

```
Animation Library
    ↓ (references)
   Cue
    ↓ (triggered by)
Manual OR Timeline
    ↓ (executes)
Animation Playback
```

---

## Cue System Operating Modes

### **IMPORTANT: Cues Work Independently**

The cue system has **TWO independent operating modes**:

#### **Mode 1: Live Mode** (Primary - Works Now)
Cues are triggered directly in real-time:
- ✅ Manual button press in cue grid
- ✅ Hotkey press
- ✅ OSC message received
- ✅ External controller

**NO TIMELINE REQUIRED** - This is the default mode for live performances.

#### **Mode 2: Timeline Mode** (Optional - To Be Implemented)
The same cues can ALSO be triggered automatically:
- ⏱️ Timeline playback reaching cue marker
- ⏱️ Timecode sync (LTC/MTC)
- ⏱️ Automated sequences

**Timeline is OPTIONAL** - Only needed for synchronized/timecoded shows.

---

## Use Cases

### **Use Case 1: Live Performance (No Timeline)**

**Scenario**: Concert with manual cue triggering  
**Mode**: Live Mode Only

```
Workflow:
1. Select tracks (instruments/sources)
2. Create animations (circular, linear, effects)
3. Create cues for each song section
4. During show: Manually trigger cues
   - Intro: Trigger cue 1
   - Verse: Trigger cue 2
   - Chorus: Trigger cue 3
```

**No timeline needed** - Operator triggers cues in real-time.

---

### **Use Case 2: Theater Production (Timecoded)**

**Scenario**: Synchronized with playback/timecode

```
Workflow:
1. Select tracks (dialogue zones, ambience)
2. Create animations (scene transitions, effects)
3. Create cues for each scene
4. Create timeline:
   - 00:00:00 - Cue 1 (House lights)
   - 00:05:23 - Cue 2 (Scene 1 start)
   - 00:12:45 - Cue 3 (Scene 2 transition)
   - 00:20:00 - Cue 4 (Intermission)
```

**Timeline required** - Synced to show playback.

---

### **Use Case 3: Installation (Looped Timeline)**

**Scenario**: Automated loop for gallery installation

```
Workflow:
1. Select tracks (zones in space)
2. Create animations (ambient movement)
3. Create cues for each phase
4. Create timeline (looped):
   - 00:00 - Cue 1 (Phase A: 5min)
   - 05:00 - Cue 2 (Phase B: 3min)
   - 08:00 - Cue 3 (Phase C: 4min)
   - 12:00 - Loop back to start
```

**Timeline required** - Fully automated, no operator.

---

### **Use Case 4: Hybrid Show**

**Scenario**: Mix of automated sequences and manual triggers

```
Workflow:
1. Select tracks
2. Create animations
3. Create cues (some for timeline, some for manual)
4. Create timeline for automated parts:
   - Pre-show sequence (automated)
   - Main show (manual cues)
   - Post-show sequence (automated)
```

**Timeline + Manual** - Best of both worlds.

---

## Architectural Implications

### **Simplified Architecture**

```
┌────────────────────────────────────────┐
│         Animation Library              │
│    (Created in Animation Editor)       │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│            Cue System                  │
│  - References animations               │
│  - Defines which tracks                │
│  - Specifies parameters                │
└────────┬───────────────────────────────┘
         │
         ├──────────┬─────────────┐
         ▼          ▼             ▼
    ┌────────┐ ┌──────────┐ ┌─────────┐
    │ Manual │ │   OSC    │ │Timeline │
    │Trigger │ │ Trigger  │ │ Trigger │
    └────┬───┘ └────┬─────┘ └────┬────┘
         │          │            │
         └──────────┴────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Animation Orchestrator│
         │    (Playback Engine)  │
         └──────────────────────┘
```

### **Key Changes from Previous Proposal**

1. **Cues are Primary Triggers**
   - Not a parallel system to timeline
   - Timeline triggers cues, not animations directly
   - Simpler mental model

2. **Timeline is Optional**
   - Only needed for timecoded/synced shows
   - When present, it triggers cues
   - Still allows manual overrides

3. **Animation Orchestrator Simplified**
   - Receives cue triggers
   - Doesn't need to understand timeline directly
   - Cleaner separation of concerns

---

## Updated System Components

### **1. Animation Library** (Existing)
- Created in Animation Editor
- Stored in project
- Referenced by cues

**API**:
```typescript
interface AnimationLibrary {
  animations: Animation[]
  createAnimation(type: AnimationType): Animation
  updateAnimation(id: string, updates: Partial<Animation>): void
  deleteAnimation(id: string): void
  getAnimation(id: string): Animation | null
}
```

---

### **2. Cue System** (Refactored)

**Purpose**: Central triggering mechanism

```typescript
interface Cue {
  id: string
  name: string
  
  // What to trigger
  animationId: string
  trackIds: string[]
  
  // Trigger methods
  triggers: CueTrigger[]
  
  // Execution
  action: 'play' | 'stop' | 'pause' | 'fade'
  fadeTime?: number
  priority?: number
  
  // Cue list integration
  autoFollow?: boolean
  followDelay?: number
}

interface CueTrigger {
  type: 'manual' | 'hotkey' | 'osc' | 'timecode'
  
  // Type-specific config
  hotkey?: string
  oscAddress?: string
  timecode?: string  // For timeline triggers
}

interface CueSystem {
  // Cue management
  cues: Map<string, Cue>
  createCue(config: Partial<Cue>): Cue
  updateCue(id: string, updates: Partial<Cue>): void
  deleteCue(id: string): void
  
  // Triggering
  triggerCue(id: string, source: 'manual' | 'timeline' | 'osc' | 'midi'): void
  stopCue(id: string): void
  
  // Cue lists
  cueLists: CueList[]
  goNext(): void
  goPrevious(): void
}
```

**Changes**:
- Cues now track their trigger sources
- Timeline is just another trigger source
- Clear API for external triggering

---

### **3. Timeline System** (To Implement)

**Purpose**: Trigger cues at specific times (optional)

```typescript
interface Timeline {
  id: string
  name: string
  duration: number
  
  // Timeline contains cue triggers, not animations directly
  cueMarkers: TimelineCueMarker[]
  
  // Transport
  isPlaying: boolean
  currentTime: number
  loopEnabled: boolean
  loopStart?: number
  loopEnd?: number
  
  // Sync
  timecodeSync?: TimecodeSync
}

interface TimelineCueMarker {
  id: string
  time: number           // When to trigger
  cueId: string          // Which cue to trigger
  
  // Optional overrides
  fadeTime?: number
  parameterOverrides?: Record<string, any>
}

interface TimelineSystem {
  // Playback
  play(timelineId: string): void
  stop(): void
  pause(): void
  seek(time: number): void
  
  // Timeline management
  createTimeline(): Timeline
  addCueMarker(timelineId: string, time: number, cueId: string): void
  removeCueMarker(timelineId: string, markerId: string): void
  
  // When playhead reaches a cue marker, trigger it
  private onTimeUpdate(time: number): void {
    const markers = this.getMarkersAtTime(time)
    markers.forEach(marker => {
      cueSystem.triggerCue(marker.cueId, 'timeline')
    })
  }
}
```

**Key Points**:
- Timeline doesn't know about animations
- Timeline only knows about cues
- Triggering a cue from timeline is same as manual trigger
- Timeline is purely a scheduling layer

---

### **4. Animation Orchestrator** (Simplified)

**Purpose**: Execute cue actions

```typescript
interface AnimationOrchestrator {
  // Triggered by cue system
  playCue(cue: Cue): ClipHandle
  stopCue(cue: Cue): void
  pauseCue(cue: Cue): void
  
  // Internal playback management
  private activeClips: Map<string, ClipState>
  private playAnimation(animationId: string, trackIds: string[]): void
  private stopAnimation(handle: ClipHandle): void
}
```

**Changes**:
- Doesn't need to understand timelines
- Doesn't need to understand cue lists
- Just executes what cues tell it to do
- Simpler API, clearer responsibility

---

## Data Flow Examples

### **Manual Trigger**
```
User clicks cue button
    ↓
cueSystem.triggerCue('cue-1', 'manual')
    ↓
orchestrator.playCue(cue)
    ↓
Animation plays on specified tracks
```

### **Timeline Trigger**
```
Timeline reaches 00:05:23
    ↓
timeline.onTimeUpdate(323.0)  // 5min 23sec
    ↓
Finds cue marker at 323.0
    ↓
cueSystem.triggerCue('cue-1', 'timeline')
    ↓
orchestrator.playCue(cue)
    ↓
Animation plays on specified tracks
```

### **OSC Trigger**
```
OSC message received: /cue/1/go
    ↓
oscHandler parses message
    ↓
cueSystem.triggerCue('cue-1', 'osc')
    ↓
orchestrator.playCue(cue)
    ↓
Animation plays on specified tracks
```

**Same execution path** regardless of trigger source (manual, OSC, or timeline)!

---

## Updated Implementation Plan

### **Phase 1: Foundation** (2-3 weeks)
- Create Animation Orchestrator
- Refactor Cue System (simplified)
- Extract Multi-Track Manager

### **Phase 2: Cue System Polish** (2-3 weeks)
- Multiple trigger types
- Cue lists
- Priority management
- Better UI

### **Phase 3: Timeline System** (4-5 weeks)
- Timeline data structure
- Cue marker management
- Transport controls
- Timecode sync

### **Phase 4: Timeline UI** (3-4 weeks)
- Timeline view component
- Cue marker editing
- Playhead and scrubbing
- Transport UI

### **Phase 5: Integration** (2-3 weeks)
- Connect all systems
- Testing
- Documentation
- Polish

**Total**: ~13-18 weeks for complete implementation

---

## Benefits of This Approach

### **Simpler Mental Model**
- Linear workflow: Tracks → Animations → Cues → Timeline
- Clear hierarchy, no confusion
- Each step builds on previous

### **Flexibility**
- Timeline optional (not everyone needs it)
- Cues work standalone
- Easy to add new trigger types

### **Maintainability**
- Clear separation of concerns
- Each system has one job
- Easy to test independently

### **User Experience**
- Intuitive workflow
- Learn one step at a time
- Advanced features (timeline) optional

---

## Comparison to Previous Proposal

### **Before** (Complex)
```
Animation Editor ──┐
                   ├──→ Animation Orchestrator
Cue System ────────┤
                   │
Timeline ──────────┘

Three parallel systems competing for control
```

### **After** (Simple)
```
Animation Editor → Animation Library
                        ↓
                    Cue System
                        ↓
            Manual OR Timeline trigger
                        ↓
            Animation Orchestrator

Clear hierarchy, cues are the bridge
```

---

## Migration Path

### **Current State** → **Target State**

1. **Keep existing cue system working**
   - Add trigger source tracking
   - Add timeline trigger support
   - Don't break manual triggers

2. **Implement timeline incrementally**
   - Start with data structure
   - Add basic playback
   - Add cue marker support
   - Add UI last

3. **No breaking changes**
   - Timeline is additive
   - Existing projects work as-is
   - New features opt-in

---

## Conclusion

This workflow architecture provides:

✅ **Clear hierarchy**: Each system builds on the previous  
✅ **Flexibility**: Timeline optional for simple shows  
✅ **Simplicity**: Cues are the single triggering point  
✅ **Extensibility**: Easy to add new trigger types  
✅ **Maintainability**: Clean separation of concerns  

**This is a much cleaner architecture than the previous proposal!**

---

**Ready to implement with this clarified workflow?**

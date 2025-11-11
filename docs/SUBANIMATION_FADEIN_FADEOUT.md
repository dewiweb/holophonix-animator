# Subanimation System: Fade-In / Fade-Out

## Overview

User Request: "goToStart and return to initial position features should be thought of as subanimations. It could be interesting in cues and timeline to think them as fade-in/fade-out features and make their own times settable."

This document proposes a **subanimation system** that treats position transitions (like goToStart, return to initial) as first-class animation elements that can be configured, reused, and integrated into the timeline/cue system.

---

## Current State

### How Position Transitions Work Now

**goToStart (Automatic)**
```
User clicks Play
  ↓
animationStore detects: track position ≠ initialPosition
  ↓
Automatically eases to start (hardcoded 500ms)
  ↓
Animation begins
```

**Return to Initial (Manual)**
```
User clicks Stop
  ↓
Animation stops
  ↓
Track remains at current position
  ↓
(No automatic return)
```

### Limitations

1. **Hardcoded Duration**: 500ms easing is fixed
2. **No User Control**: Can't adjust fade-in/fade-out timing
3. **Not Composable**: Can't use in cues/timeline
4. **No Easing Options**: Always cubic ease-out
5. **Hidden Behavior**: Users don't see these as controllable elements
6. **Timeline Gap**: No representation of pre/post animation movement

---

## Proposed Solution: Subanimation System

### Concept

Treat position transitions as **subanimations**:
- **Fade-In Subanimation**: Ease from current position → animation start position
- **Fade-Out Subanimation**: Ease from animation end position → initial/home position
- **Configurable**: Duration, easing, behavior
- **Timeline Integration**: Show as visual elements in timeline
- **Cue Support**: Can be triggered independently

### Visual Representation

**Timeline View:**
```
Track 1: [Fade-In] [═══ Main Animation ═══] [Fade-Out]
         └─ 0.5s ─┘ └────── 10s ─────────┘ └─ 0.5s ─┘
```

**Cue List:**
```
Cue 1: Fade-In (Track 1, 0.5s, ease-out)
Cue 2: Play Animation (Track 1, 10s)
Cue 3: Fade-Out (Track 1, 0.5s, ease-in)
```

---

## Architecture Design

### 1. Subanimation Type Definition

```typescript
// New types in src/types/index.ts

export type SubanimationType = 
  | 'fade-in'      // Ease to animation start
  | 'fade-out'     // Ease to initial/home position
  | 'crossfade'    // Blend between two animations
  | 'hold'         // Hold at position

export interface SubanimationConfig {
  id: string
  type: SubanimationType
  duration: number          // Duration in seconds
  easing: EasingFunction    // cubic-bezier, linear, etc.
  
  // Target positions
  fromPosition?: Position   // If undefined, use current
  toPosition?: Position     // If undefined, use animation start or initial
  
  // Behavior
  autoTrigger: boolean      // Auto-play when animation starts/stops
  priority: number          // For conflict resolution
}

export interface Animation {
  // ... existing fields ...
  
  // Subanimations
  fadeIn?: SubanimationConfig
  fadeOut?: SubanimationConfig
}
```

### 2. Default Subanimation Settings

```typescript
// src/stores/animationEditorStoreV2.ts

interface AnimationEditorState {
  // ... existing fields ...
  
  // Subanimation defaults
  fadeInDuration: number      // Default: 0.5s
  fadeOutDuration: number     // Default: 0.5s
  fadeInEasing: EasingFunction
  fadeOutEasing: EasingFunction
  autoFadeIn: boolean         // Default: true
  autoFadeOut: boolean        // Default: false
}
```

### 3. Animation Store Integration

```typescript
// src/stores/animationStore.ts

interface AnimationStore {
  // ... existing methods ...
  
  // New subanimation methods
  playFadeIn: (animationId: string, trackIds: string[], config?: SubanimationConfig) => void
  playFadeOut: (animationId: string, trackIds: string[], config?: SubanimationConfig) => void
  
  // State tracking
  activeSubanimations: Map<string, {
    subanimationId: string
    type: SubanimationType
    startTime: number
    config: SubanimationConfig
  }>
}
```

### 4. UI Components

**Subanimation Settings Panel**
```tsx
// src/components/animation-editor/components/settings/SubanimationSettings.tsx

<div className="subanimation-settings">
  <h3>Fade-In</h3>
  <label>
    <input type="checkbox" checked={autoFadeIn} />
    Automatic fade-in when animation starts
  </label>
  <label>
    Duration:
    <input type="number" value={fadeInDuration} step={0.1} />
    seconds
  </label>
  <label>
    Easing:
    <select value={fadeInEasing}>
      <option value="ease-out">Ease Out (smooth start)</option>
      <option value="ease-in">Ease In (smooth end)</option>
      <option value="ease-in-out">Ease In-Out</option>
      <option value="linear">Linear</option>
    </select>
  </label>
  
  <h3>Fade-Out</h3>
  {/* Similar controls */}
</div>
```

**Timeline Subanimation Blocks**
```tsx
// In timeline view

{animation.fadeIn && (
  <div className="subanimation-block fade-in" style={{ width: `${fadeIn.duration}%` }}>
    Fade-In ({fadeIn.duration}s)
  </div>
)}

<div className="animation-block" style={{ width: `${animation.duration}%` }}>
  {animation.name}
</div>

{animation.fadeOut && (
  <div className="subanimation-block fade-out" style={{ width: `${fadeOut.duration}%` }}>
    Fade-Out ({fadeOut.duration}s)
  </div>
)}
```

---

## Use Cases

### 1. Smooth Animation Starts

**Scenario**: User wants 1 second gentle fade-in before animation

**Configuration**:
```typescript
animation.fadeIn = {
  id: 'fade-in-1',
  type: 'fade-in',
  duration: 1.0,
  easing: 'ease-out',
  autoTrigger: true,
  priority: 1
}
```

**Result**:
- Click Play
- 1 second smooth ease to start position
- Animation begins
- Total time: 1s fade-in + 10s animation = 11s

### 2. Return to Home Position

**Scenario**: User wants tracks to return to home after animation stops

**Configuration**:
```typescript
animation.fadeOut = {
  id: 'fade-out-1',
  type: 'fade-out',
  duration: 0.8,
  easing: 'ease-in',
  toPosition: { x: 0, y: 0, z: 0 },  // Home position
  autoTrigger: true,
  priority: 1
}
```

**Result**:
- Animation ends
- Automatically triggers 0.8s fade-out
- Tracks ease back to home (0,0,0)

### 3. Timeline Sequencing

**Scenario**: Complex sequence with precise timing

**Timeline**:
```
0.0s:  Cue 1 - Fade-In Track 1 (0.5s)
0.5s:  Cue 2 - Play Animation Track 1 (10s)
10.5s: Cue 3 - Fade-Out Track 1 (0.5s)
11.0s: Cue 4 - Fade-In Track 2 (1.0s)
12.0s: Cue 5 - Play Animation Track 2 (8s)
```

### 4. Crossfade Between Animations

**Scenario**: Smooth transition between two different animations

```typescript
// Overlap fade-out of Animation A with fade-in of Animation B
Timeline:
  0-10s:    Animation A
  10-10.5s: Animation A Fade-Out + Animation B Fade-In (crossfade)
  10.5-20s: Animation B
```

---

## Implementation Phases

### Phase 1: Basic Subanimations (Immediate)
**Scope**: Add configurable fade-in/fade-out to editor
**Deliverables**:
- SubanimationConfig types
- Fade-in/fade-out duration settings in UI
- Integration with playAnimation/stopAnimation
- Store fade settings with animation

**Estimate**: 1-2 days

### Phase 2: Timeline Integration (Short-term)
**Scope**: Visual representation in timeline
**Deliverables**:
- Subanimation blocks in timeline view
- Drag-to-adjust duration
- Timeline ruler accounts for subanimations
- Total time calculation includes fade-in/fade-out

**Estimate**: 2-3 days

### Phase 3: Cue System Integration (Medium-term)
**Scope**: Subanimations as independent cues
**Deliverables**:
- Fade-in/fade-out as triggerable cues
- Cue list shows subanimations
- Manual triggering from cue list
- Crossfade support between animations

**Estimate**: 3-4 days

### Phase 4: Advanced Features (Long-term)
**Scope**: Custom easing, crossfades, holds
**Deliverables**:
- Custom cubic-bezier easing editor
- Visual easing curve preview
- Hold subanimation (pause at position)
- Crossfade composer (blend two animations)
- Per-track subanimation overrides

**Estimate**: 5-7 days

---

## Benefits

### User Experience
✅ **Predictable Behavior**: Users see and control transitions
✅ **Fine-Tuned Timing**: Adjust fade durations to match audio/visual
✅ **Professional Output**: Smooth, polished animations
✅ **Timeline Clarity**: Visual representation of all movement
✅ **Flexibility**: Enable/disable fades per animation

### Technical Benefits
✅ **Composability**: Reuse subanimations across animations
✅ **Modularity**: Clean separation of concerns
✅ **Timeline Integration**: Natural fit for cue system
✅ **Extensibility**: Easy to add new subanimation types
✅ **Consistency**: Same easing system everywhere

### Creative Benefits
✅ **Artistic Control**: Fine-tune movement feel
✅ **Sequencing Power**: Complex multi-track choreography
✅ **Crossfades**: Smooth transitions between animations
✅ **Holds**: Pause at specific positions
✅ **Layering**: Combine multiple subanimations

---

## Example Workflows

### Workflow 1: Simple Performance

```
1. Create circular animation (10s)
2. Enable auto fade-in (0.5s)
3. Enable auto fade-out (0.5s)
4. Set fade-out target: home position

Result:
  Click Play → 0.5s fade to start → 10s circle → 0.5s fade home
  Total: 11s smooth performance
```

### Workflow 2: Multi-Track Sequence

```
1. Track 1: Linear animation (5s)
   - Fade-in: 0.3s
   - Fade-out: 0.5s

2. Track 2: Circular animation (8s)
   - Fade-in: 0.5s (starts at 4.8s on timeline)
   - Fade-out: 0.3s

Timeline:
  0.0s:  T1 Fade-In
  0.3s:  T1 Animation Start
  4.8s:  T2 Fade-In (overlaps T1)
  5.3s:  T1 Animation End, T1 Fade-Out, T2 Animation Start
  5.8s:  T1 Fade-Out Complete
  13.3s: T2 Animation End
  13.6s: T2 Fade-Out Complete
```

### Workflow 3: Crossfade Effect

```
1. Animation A: Circular (track at center)
2. Animation B: Linear (track moves right)

Crossfade:
  10s: Start crossfade
       - Animation A fade-out (0.5s)
       - Animation B fade-in (0.5s)
       - Positions blend smoothly
  10.5s: Animation B fully active
```

---

## Configuration UI Mockup

```
┌─────────────────────────────────────────────┐
│ Animation Settings                          │
├─────────────────────────────────────────────┤
│                                             │
│ Name: Circular Motion                      │
│ Type: Circular                              │
│ Duration: 10s                               │
│                                             │
│ ┌─── Fade-In ────────────────────────────┐ │
│ │ ☑ Auto-trigger when animation starts   │ │
│ │ Duration: [0.5] seconds                 │ │
│ │ Easing: [Ease Out ▼]                    │ │
│ │ Target: ⦿ Animation start position      │ │
│ │         ○ Custom position               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─── Fade-Out ───────────────────────────┐ │
│ │ ☐ Auto-trigger when animation stops    │ │
│ │ Duration: [0.8] seconds                 │ │
│ │ Easing: [Ease In ▼]                     │ │
│ │ Target: ○ Initial position              │ │
│ │         ⦿ Home (0, 0, 0)                │ │
│ │         ○ Custom position               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Preview Timeline:                           │
│ [Fade] [════ Animation ════] [Fade]        │
│ 0.5s   10s                    0.8s          │
│ Total: 11.3s                                │
└─────────────────────────────────────────────┘
```

---

## Technical Considerations

### 1. Timing State Management

**Challenge**: Track both main animation and subanimation states

**Solution**:
```typescript
interface PlayingAnimation {
  animationId: string
  trackIds: string[]
  timingState: AnimationTimingState
  
  // Subanimation states
  activeSubanimation?: {
    type: SubanimationType
    timingState: AnimationTimingState
    onComplete: () => void
  }
}
```

### 2. Timeline Synchronization

**Challenge**: Ensure timeline accounts for fade durations

**Solution**:
```typescript
function calculateTotalDuration(animation: Animation): number {
  let total = animation.duration
  
  if (animation.fadeIn?.autoTrigger) {
    total += animation.fadeIn.duration
  }
  
  if (animation.fadeOut?.autoTrigger) {
    total += animation.fadeOut.duration
  }
  
  return total
}
```

### 3. Crossfade Implementation

**Challenge**: Blend two animations smoothly

**Solution**:
```typescript
function crossfade(
  animationA: PlayingAnimation,
  animationB: PlayingAnimation,
  progress: number // 0-1
): Position {
  const posA = calculatePosition(animationA, progress)
  const posB = calculatePosition(animationB, progress)
  
  // Blend positions based on crossfade progress
  return {
    x: posA.x * (1 - progress) + posB.x * progress,
    y: posA.y * (1 - progress) + posB.y * progress,
    z: posA.z * (1 - progress) + posB.z * progress
  }
}
```

---

## Migration Path

### Existing Animations

**Current Behavior**: 
- Hardcoded 500ms fade-in
- No fade-out

**Migration**:
```typescript
// Auto-migrate existing animations
function migrateToSubanimations(animation: Animation): Animation {
  return {
    ...animation,
    fadeIn: {
      id: generateId(),
      type: 'fade-in',
      duration: 0.5,  // Preserve current 500ms
      easing: 'ease-out',
      autoTrigger: true,
      priority: 1
    },
    // fadeOut: undefined (preserve no fade-out behavior)
  }
}
```

### Backward Compatibility

- Old animations without fadeIn/fadeOut work as before
- New animations explicitly define subanimations
- Editor offers "Convert to Subanimations" button

---

## Future Enhancements

### 1. Custom Easing Curves
Visual bezier curve editor for precise control

### 2. Subanimation Templates
Save/load fade configurations as presets

### 3. Multi-Point Fades
Fade through multiple positions (not just start/end)

### 4. Position Locks
Lock certain axes during fades (e.g., fade X/Y but not Z)

### 5. Velocity-Based Fades
Adjust fade duration based on distance traveled

### 6. Audio-Reactive Fades
Trigger fades based on audio cues/beats

---

## Conclusion

Treating goToStart and return-to-initial as **subanimations** provides:

1. **User Control**: Configurable durations and easing
2. **Timeline Integration**: Visual representation and sequencing
3. **Cue Support**: Independent triggering
4. **Professional Results**: Smooth, predictable transitions
5. **Creative Flexibility**: Crossfades, holds, custom easing
6. **Extensibility**: Foundation for advanced features

This system transforms hidden, hardcoded transitions into first-class, controllable animation elements, enabling sophisticated spatial audio choreography.

---

## Recommendation

**Start with Phase 1** (Basic Subanimations):
- Immediate value for users
- Clean architecture foundation
- Easy to extend in phases 2-4

Estimated total implementation: 2-3 weeks for full feature set.

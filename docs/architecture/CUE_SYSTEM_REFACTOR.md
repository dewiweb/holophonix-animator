# Cue System Refactor - Architecture & Implementation Plan

## Executive Summary

Refactor the cue system from an audio-style cue system to a professional lighting-style cue system with modular architecture, enhanced UX/UI, and support for multiple cue types.

## Current Issues

### 1. **Bugs**
- Duplicate buttons appearing in cue grid when assigning cues
- Button duplication when creating/assigning cues
- Unclear arming system behavior

### 2. **Architecture**
- Monolithic cue editor (546 lines)
- Mixed concerns (preset vs animation cues)
- Tight coupling with animation system
- No dedicated save-to-cue workflow

### 3. **UX/UI**
- No visual progression bars for animations
- Missing track information display
- No cue color display
- Not compact enough for professional use
- Arming system confusing (not standard in lighting)

## New Architecture

### Cue Types (Modular)

```
src/cues/
├── types/
│   ├── index.ts              # Core cue interfaces
│   ├── animationCue.ts       # Animation cue type
│   ├── oscCue.ts             # OSC message cue type
│   └── resetCue.ts           # Track reset cue type
├── store/
│   ├── index.ts              # Main cue store
│   ├── cueActions.ts         # Cue CRUD actions
│   ├── cueExecution.ts       # Execution logic per type
│   └── cueBank.ts            # Bank/grid management
├── components/
│   ├── CueGrid/
│   │   ├── CueGrid.tsx       # Main grid component
│   │   ├── CueButton.tsx     # Individual cue button
│   │   └── CueProgress.tsx   # Progress bar component
│   ├── CueEditor/
│   │   ├── CueEditor.tsx     # Main editor
│   │   ├── editors/
│   │   │   ├── AnimationCueEditor.tsx
│   │   │   ├── OSCCueEditor.tsx
│   │   │   └── ResetCueEditor.tsx
│   │   └── CueEditorSidebar.tsx
│   └── shared/
│       ├── TrackSelector.tsx
│       ├── ColorPicker.tsx
│       └── TriggerConfig.tsx
└── utils/
    ├── cueValidation.ts
    └── cueDefaults.ts
```

## Cue Types Definition

### 1. Animation Cue (Primary)

**Purpose**: Execute a stored animation with all its parameters

**Data Structure**:
```typescript
interface AnimationCue extends BaseCue {
  type: 'animation'
  data: {
    animationId: string           // Reference to stored animation
    trackIds?: string[]           // Override tracks (if unlocked)
    playbackSpeed?: number        // Override speed
    loop?: boolean                // Override loop
    reverse?: boolean             // Override direction
    
    // Cue-specific overrides (optional)
    cueSpecificParams?: {
      // Tweaked parameters that differ from library version
      parameters?: Record<string, any>
      duration?: number
      fadeIn?: number
      fadeOut?: number
    }
  }
}
```

**Features**:
- References animation from library
- Supports locked animations (uses animation's embedded tracks)
- Supports unlocked animations (can override tracks)
- **Edit button** opens animation editor with loaded animation
- **Save options**:
  - "Save to Cue Only" - saves tweaked params to `cueSpecificParams`
  - "Update Library Animation" - saves back to animation library
  - "Save as New Animation" - creates new library entry

**UI Display**:
- Cue color from user selection
- Cue name
- Progress bar showing animation progress (0-100%)
- Track badges (compact icons or initials)
- Animation icon

### 2. OSC Message Cue

**Purpose**: Send direct OSC messages to devices

**Data Structure**:
```typescript
interface OSCCue extends BaseCue {
  type: 'osc'
  data: {
    messages: Array<{
      address: string           // e.g., "/track/1/xyz"
      args: any[]              // OSC arguments
      delay?: number           // Delay before sending (ms)
    }>
    targetDevice?: string      // Optional device filter
  }
}
```

**Features**:
- Send multiple OSC messages in sequence
- Support for delays between messages
- Device targeting (if multiple OSC connections)
- Message templates library

**UI Display**:
- Cue color
- Cue name
- OSC icon
- Message count badge

### 3. Reset Position Cue

**Purpose**: Return tracks to initial positions

**Data Structure**:
```typescript
interface ResetCue extends BaseCue {
  type: 'reset'
  data: {
    trackIds: string[]           // Tracks to reset
    resetType: 'initial' | 'zero' | 'custom'
    customPositions?: Record<string, Position>  // For custom reset
    duration?: number            // Fade time to position
    easing?: string             // Easing function
  }
}
```

**Features**:
- Reset to initial position (from project)
- Reset to origin (0, 0, 0)
- Reset to custom positions
- Configurable fade time

**UI Display**:
- Cue color
- Cue name
- Reset icon
- Track badges

## Base Cue Interface

```typescript
interface BaseCue {
  id: string
  name: string
  type: 'animation' | 'osc' | 'reset'
  
  // Visual
  color: string              // User-selectable color
  number?: number            // Optional cue number (1, 1.5, 2.0)
  
  // Status
  status: 'idle' | 'active' | 'complete' | 'error'
  isEnabled: boolean
  
  // Triggers
  triggers: CueTrigger[]
  followActions?: FollowAction[]
  
  // Timing (optional per type)
  duration?: number
  fadeIn?: number
  fadeOut?: number
  
  // Metadata
  description?: string
  tags?: string[]
  created: Date
  modified: Date
  lastTriggered?: Date
  triggerCount: number
}
```

## Removed Features

### ❌ Cue Arming
- Not standard in lighting cue systems
- Confusing for users
- Can be replaced with better visual feedback
- Remove: `armCue()`, `disarmCue()`, `armedCues` state

### ❌ Preset-Based Cues
- Redundant with animation cues
- Animation cues can reference any stored animation
- Simplifies architecture
- Remove: `presetId` from cue parameters

## New Features

### 1. Edit Animation from Cue

**Button**: "Edit Animation" (only visible for animation cues)

**Behavior**:
1. User clicks "Edit Animation" button in cue editor
2. App switches to Animation Editor tab
3. Animation loads with:
   - All parameters from animation library
   - Correct track selection (from animation or cue override)
   - Cue-specific overrides highlighted in UI
4. Animation editor shows special indicator: "Editing from Cue: [Cue Name]"

**Save Menu** (in Animation Editor when editing from cue):
```
┌─────────────────────────────────┐
│ Save Options:                   │
├─────────────────────────────────┤
│ ○ Save to Cue Only             │
│   Changes apply to this cue     │
│   Library animation unchanged   │
├─────────────────────────────────┤
│ ○ Update Library Animation      │
│   Updates the original          │
│   Affects all cues using it     │
├─────────────────────────────────┤
│ ○ Save as New Animation         │
│   Creates new library entry     │
│   Give it a new name            │
└─────────────────────────────────┘
```

### 2. Enhanced Cue Button UI

**Compact Design** (inspired by lighting consoles):

```
┌─────────────────────────┐
│ ███████████████████████ │ ← Color bar (top)
│                         │
│  [Icon] 1.5            │ ← Type icon + number
│  Animation Name        │ ← Cue name (truncated)
│                         │
│  ▓▓▓▓▓▓▓░░░░░░░░ 45%   │ ← Progress (if active)
│  [T1] [T2] [T3] +2     │ ← Track badges
└─────────────────────────┘
```

**Elements**:
- **Color bar**: User-selected color at top
- **Icon**: Type-specific icon (animation, OSC, reset)
- **Number**: Optional cue number (1, 1.5, 2.0)
- **Name**: Cue name (truncated with ellipsis)
- **Progress bar**: Only visible when cue is active (animation type)
- **Track badges**: Compact display of affected tracks
  - Show first 3-4 tracks as badges
  - "+N" indicator if more tracks
  - Different visual for locked vs unlocked

**States**:
- **Idle**: Normal appearance
- **Active**: Highlighted, progress bar visible
- **Complete**: Checkmark indicator
- **Error**: Red border, error icon
- **Disabled**: Grayed out, strike-through

### 3. Cue Editor Improvements

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Edit Cue: [Name]                           [X]  │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────────────────┐ │
│ │   Sidebar   │  │                          │ │
│ │             │  │   Type-Specific Editor   │ │
│ │ • Basic     │  │                          │ │
│ │ • Type      │  │                          │ │
│ │ • Triggers  │  │   (Animation/OSC/Reset)  │ │
│ │ • Timing    │  │                          │ │
│ │             │  │                          │ │
│ └─────────────┘  └──────────────────────────┘ │
├─────────────────────────────────────────────────┤
│                    [Delete] [Cancel] [Save]     │
└─────────────────────────────────────────────────┘
```

**Modular Editors**:
- Each cue type has dedicated editor component
- Shared components for common fields
- Type-switching rebuilds editor panel

## Store Architecture

### Split Store into Modules

**Main Store** (`src/cues/store/index.ts`):
- Orchestrates all cue operations
- Maintains current show state
- Delegates to specialized modules

**Cue Actions** (`src/cues/store/cueActions.ts`):
- `createCue()`
- `updateCue()`
- `deleteCue()`
- `duplicateCue()`

**Cue Execution** (`src/cues/store/cueExecution.ts`):
- `triggerCue()` - Delegates to type-specific handler
- `stopCue()`
- `pauseCue()` - If supported by type
- Execution tracking

**Type-Specific Executors**:
- `executeAnimationCue()`
- `executeOSCCue()`
- `executeResetCue()`

**Bank Management** (`src/cues/store/cueBank.ts`):
- Grid operations
- Slot assignment
- Bank switching
- **Fix duplicate button bug**

## Bug Fixes

### Duplicate Button Bug

**Root Cause**: 
In `assignCueToSlot()`, cue is added to slot but also auto-assigned to first empty slot in `createCue()`.

**Fix**:
```typescript
// In store/cueActions.ts
createCue: (cueData, options?: { skipAutoAssign?: boolean }) => {
  const cue = { ...cueData, id: generateId() }
  
  // Add to cue list
  addToCueList(cue)
  
  // Only auto-assign if not manually assigning later
  if (!options?.skipAutoAssign) {
    autoAssignToBank(cue.id)
  }
  
  return cue.id
}

// In CueGrid.tsx
handleCreateCue: (row, col) => {
  const cueId = createCue(cueData, { skipAutoAssign: true })
  assignCueToSlot(cueId, bankId, row, col)
}
```

## Implementation Phases

### Phase 1: Architecture & Types (Week 1)
- [ ] Create new modular folder structure
- [ ] Define new cue types (Animation, OSC, Reset)
- [ ] Create base interfaces
- [ ] Remove arming-related types

### Phase 2: Store Refactor (Week 1-2)
- [ ] Split store into modules
- [ ] Implement type-specific executors
- [ ] Fix duplicate button bug
- [ ] Add cue-specific parameter storage
- [ ] Remove arming logic

### Phase 3: UI Components (Week 2)
- [ ] Create new CueButton component with enhanced UI
- [ ] Add progress bar component
- [ ] Create track badge component
- [ ] Implement color picker

### Phase 4: Cue Editors (Week 2-3)
- [ ] Create modular editor structure
- [ ] Implement AnimationCueEditor
- [ ] Implement OSCCueEditor
- [ ] Implement ResetCueEditor
- [ ] Add type switching

### Phase 5: Animation Editor Integration (Week 3)
- [ ] Add "Edit Animation" button to animation cues
- [ ] Implement tab switching with context
- [ ] Add cue-editing mode indicator
- [ ] Create save options menu
- [ ] Implement save-to-cue logic

### Phase 6: Testing & Polish (Week 4)
- [ ] Test all cue types
- [ ] Test animation editing workflow
- [ ] Test grid operations (no duplicates)
- [ ] UI polish and refinements
- [ ] Documentation

## Migration Strategy

### Backward Compatibility

**Old Cue Format**:
```typescript
// Old preset-based cue
{
  parameters: {
    presetId: "preset-123",
    trackIds: ["track-1"]
  }
}
```

**Migration**:
```typescript
// Convert to animation cue
{
  type: 'animation',
  data: {
    // Find animation from preset
    animationId: lookupAnimationFromPreset(presetId),
    trackIds: oldCue.parameters.trackIds
  }
}
```

**Migration Function**:
```typescript
function migrateOldCues(show: Show): Show {
  show.cueLists.forEach(list => {
    list.cues = list.cues.map(cue => {
      // Detect old format
      if (cue.parameters?.presetId) {
        return migratePresetCue(cue)
      }
      return cue
    })
  })
  return show
}
```

## API Changes

### Breaking Changes

**Removed**:
- `armCue(cueId)`
- `disarmCue(cueId)`
- `armedCues` state
- `CueParameters.presetId`

**Changed**:
- `createCue(cueData)` → `createCue(cueData, options?)`
- Cue structure now has `type` field
- `parameters` → type-specific `data` field

**Added**:
- `editCueAnimation(cueId)` - Opens animation editor
- `saveCueAnimation(cueId, saveMode)` - Saves with options
- `getCueProgress(cueId)` - Returns 0-1 progress for UI

## UI/UX Guidelines

### Professional Lighting Console Feel

1. **Compact**: Maximum information, minimum space
2. **Color-coded**: Visual distinction at a glance
3. **Status-aware**: Clear active/idle/error states
4. **Fast workflow**: Double-click to edit, single-click to trigger
5. **Keyboard shortcuts**: Number keys to trigger cues
6. **No arming**: Direct triggering like lighting consoles

### Color System

**Default Colors** (user can override):
- Animation cues: Blue (#3B82F6)
- OSC cues: Purple (#8B5CF6)
- Reset cues: Orange (#F59E0B)

**States**:
- Idle: Normal color
- Active: Bright, pulsing border
- Complete: Dimmed
- Error: Red border

## Technical Considerations

### Performance

- Limit progress bar updates to 30fps
- Debounce grid re-renders
- Lazy load cue editors
- Virtual scrolling for large cue lists

### Testing

- Unit tests for each cue type executor
- Integration tests for animation editing workflow
- E2E tests for grid operations
- Snapshot tests for UI components

### Documentation

- User guide for each cue type
- Migration guide from old format
- API documentation for custom cue types (future)
- Video tutorials for workflows

## Success Metrics

- ✅ No duplicate buttons in grid
- ✅ Clear cue type differentiation
- ✅ <500ms to trigger cue
- ✅ <2 clicks to edit animation from cue
- ✅ 100% test coverage for cue executors
- ✅ Positive user feedback on new UI

## Future Enhancements (Post-MVP)

- **Cue Groups**: Trigger multiple cues together
- **Cue Macros**: Record and playback cue sequences
- **Timeline View**: Alternative to grid view
- **Cue Templates**: Pre-configured cue types
- **External Control**: MIDI/DMX/Timecode triggers
- **Cue Comments**: Notes for performers
- **Version History**: Track cue changes over time

---

**Document Version**: 1.0  
**Created**: 2024-11-14  
**Author**: Cascade AI  
**Status**: Approved for Implementation

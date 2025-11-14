# Cue System Migration Guide

**From**: Old Cue Store (`src/cues/store.ts`)  
**To**: New Cue Store V2 (`src/cues/storeV2/index.ts`)

## Overview

The cue system is being migrated to a new modular architecture with:
- ✅ Three cue types (Animation, OSC, Reset)
- ✅ No arming system
- ✅ Priority modes (LTP default)
- ✅ Transition modes
- ✅ Duplicate bug fixed

## Migration Strategy

### Parallel Running (Current Phase)

Both stores run simultaneously:
```typescript
// Old store (still active)
import { useCueStore } from '@/cues/store'

// New store (ready to use)
import { useCueStoreV2 } from '@/cues/storeV2'
```

### Gradual Component Migration

Components can migrate one at a time:
1. Update imports
2. Test functionality
3. Remove old code
4. Commit

## Key Changes

### 1. No More Arming

**OLD**:
```typescript
const { armCue, disarmCue, armedCues } = useCueStore()

<button onClick={() => armCue(cueId)}>Arm</button>
```

**NEW**:
```typescript
// Arming removed - just trigger cues directly
const { triggerCue } = useCueStoreV2()

<button onClick={() => triggerCue(cueId)}>Go</button>
```

### 2. Simplified Cue Creation

**OLD**:
```typescript
const cueId = createCue({
  name: 'My Cue',
  category: 'animation',
  action: 'play',
  targetType: 'animation',
  targets: [],
  parameters: { animationId: 'anim-123' }
})
// Automatically assigns to first empty slot
```

**NEW**:
```typescript
const cueId = createCue({
  name: 'My Cue',
  type: 'animation',
  color: '#3B82F6',
  status: 'idle',
  isEnabled: true,
  triggers: [],
  data: {
    animationId: 'anim-123',
    playbackSpeed: 1.0
  }
}, { skipAutoAssign: true })  // Prevent duplicate bug

// Then manually assign
assignCueToSlot(cueId, bankId, row, col)
```

### 3. Priority & Transition Settings

**NEW** (not in old store):
```typescript
const {
  setPriorityMode,
  setDefaultTransition,
  executionContext
} = useCueStoreV2()

// Set priority mode
setPriorityMode('ltp')  // Last Takes Precedence (default)

// Set default transition
setDefaultTransition('crossfade', 2.0)  // 2 second crossfade

// Read current settings
console.log(executionContext.priorityMode)  // 'ltp'
console.log(executionContext.defaultTransitionMode)  // 'crossfade'
```

### 4. Active Cue Tracking

**OLD**:
```typescript
const { activeCues } = useCueStore()
// activeCues is a Map
```

**NEW**:
```typescript
const { executionContext } = useCueStoreV2()
// executionContext.activeCues is a Map
// executionContext.trackOwnership shows which cue controls which tracks
```

## Component Migration Examples

### CueGrid Component

**Before**:
```typescript
import { useCueStore } from '@/cues/store'

const CueGrid = () => {
  const {
    currentShow,
    activeCues,
    armedCues,  // ❌ Removed
    createCue,
    triggerCue,
    armCue,     // ❌ Removed
    disarmCue   // ❌ Removed
  } = useCueStore()
  
  // ...
}
```

**After**:
```typescript
import { useCueStoreV2 } from '@/cues/storeV2'

const CueGrid = () => {
  const {
    currentShow,
    executionContext,  // Contains activeCues
    createCue,
    triggerCue,
    assignCueToSlot    // ✅ Explicit slot assignment
  } = useCueStoreV2()
  
  const activeCues = executionContext.activeCues
  
  // Create cue with manual assignment
  const handleCreateCue = (row: number, col: number) => {
    const cueId = createCue({
      name: `Cue ${row + 1}-${col + 1}`,
      type: 'animation',
      color: '#4F46E5',
      status: 'idle',
      isEnabled: true,
      triggers: [],
      data: { animationId: '', playbackSpeed: 1.0 }
    }, { skipAutoAssign: true })  // ✅ Prevents duplicate
    
    assignCueToSlot(cueId, bankId, row, col)  // ✅ Explicit
  }
  
  // ...
}
```

### CueEditor Component

**Before**:
```typescript
const CueEditor = ({ cueId }) => {
  const { updateCue, deleteCue } = useCueStore()
  const [sourceType, setSourceType] = useState<'preset' | 'animation'>('animation')
  
  // ...preset logic
}
```

**After**:
```typescript
const CueEditor = ({ cueId }) => {
  const { updateCue, deleteCue, getCueById } = useCueStoreV2()
  const cue = getCueById(cueId)
  
  // No more preset vs animation - just check cue type
  if (cue?.type === 'animation') {
    // Show animation cue editor
  } else if (cue?.type === 'osc') {
    // Show OSC cue editor
  } else if (cue?.type === 'reset') {
    // Show reset cue editor
  }
}
```

## Data Migration

### Shows Created with Old Store

Old shows will need migration:

```typescript
function migrateOldShow(oldShow: any): Show {
  return {
    ...oldShow,
    cueLists: oldShow.cueLists.map(list => ({
      ...list,
      cues: list.cues.map(migrateOldCue)
    }))
  }
}

function migrateOldCue(oldCue: any): Cue {
  // Convert preset cues to animation cues
  if (oldCue.parameters?.presetId) {
    return {
      id: oldCue.id,
      name: oldCue.name,
      type: 'animation',
      color: oldCue.color || '#3B82F6',
      status: 'idle',
      isEnabled: oldCue.isEnabled,
      triggers: oldCue.triggers || [],
      data: {
        animationId: findAnimationFromPreset(oldCue.parameters.presetId),
        trackIds: oldCue.parameters.trackIds
      },
      created: oldCue.created || new Date(),
      modified: new Date(),
      triggerCount: oldCue.triggerCount || 0
    }
  }
  
  // Regular animation cues
  return {
    id: oldCue.id,
    name: oldCue.name,
    type: 'animation',
    color: oldCue.color || '#3B82F6',
    status: 'idle',
    isEnabled: oldCue.isEnabled,
    triggers: oldCue.triggers || [],
    data: {
      animationId: oldCue.parameters?.animationId || '',
      trackIds: oldCue.parameters?.trackIds,
      playbackSpeed: oldCue.parameters?.playbackSpeed || 1.0,
      loop: oldCue.parameters?.loop,
      reverse: oldCue.parameters?.reverse
    },
    created: oldCue.created || new Date(),
    modified: new Date(),
    triggerCount: oldCue.triggerCount || 0
  }
}
```

## Testing Checklist

When migrating a component:

- [ ] Import new store (`useCueStoreV2`)
- [ ] Remove arming logic
- [ ] Update cue creation (use `skipAutoAssign`)
- [ ] Update active cue access (`executionContext.activeCues`)
- [ ] Test cue creation (no duplicates)
- [ ] Test cue triggering
- [ ] Test grid operations
- [ ] Test with multiple cues
- [ ] Test priority behavior (LTP)
- [ ] Test panic stop

## Rollback Plan

If issues arise:

1. **Component Level**: Revert component to old store
   ```typescript
   // Change back to
   import { useCueStore } from '@/cues/store'
   ```

2. **Full Rollback**: Remove `storeV2` folder
   ```bash
   git revert [commit-hash]
   ```

## Timeline

**Week 1** (Current):
- [x] Create storeV2
- [ ] Update CueGrid
- [ ] Update CueEditor
- [ ] Test basic operations

**Week 2**:
- [ ] Implement full execution logic
- [ ] Add priority/transition handling
- [ ] Create new UI components

**Week 3**:
- [ ] Migration complete
- [ ] Remove old store
- [ ] Update all references

## Support

**Questions?** Check:
- [Architecture Doc](./architecture/CUE_SYSTEM_REFACTOR.md)
- [Execution Design](../src/cues/store/EXECUTION_DESIGN.md)
- [Phase 1 Summary](./CUE_SYSTEM_PHASE1_COMPLETE.md)

**Issues?** Create an issue with:
- Component being migrated
- Error message
- Expected vs actual behavior

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-14  
**Status**: Active Migration

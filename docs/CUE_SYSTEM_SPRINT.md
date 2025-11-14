# Cue System Refactor - Sprint Plan

**Sprint Duration**: 3-4 weeks  
**Priority**: High  
**Status**: Planning

## Quick Reference

- 📋 [Full Architecture Document](./architecture/CUE_SYSTEM_REFACTOR.md)
- 🐛 [Bug Tracker](#known-bugs)
- ✅ [Progress Checklist](#progress)

## Sprint Goals

1. **Fix Critical Bugs**: Eliminate duplicate button issue
2. **Simplify Architecture**: Remove arming, consolidate cue types
3. **Enhance UX**: Professional lighting-style interface
4. **Enable Edit Workflow**: Edit animations from cues
5. **Modularize Code**: Clean, maintainable architecture

## Known Bugs

### 🔴 Critical
- [ ] **Duplicate cue buttons**: Creating cue creates duplicate button in grid
  - **Root cause**: Auto-assignment in `createCue()` + manual `assignCueToSlot()`
  - **Fix location**: `src/cues/store.ts` line 209-250

### 🟡 Medium
- [ ] **Arming unclear**: Users don't understand arming concept
  - **Solution**: Remove arming system entirely

### 🟢 Low
- [ ] **Grid refresh lag**: Grid re-renders on every state change
  - **Solution**: Add memo/useMemo optimizations

## Architecture Changes

### File Structure

```
src/cues/
├── types/
│   ├── index.ts              # ✅ Base types
│   ├── animationCue.ts       # 🆕 Animation cue
│   ├── oscCue.ts             # 🆕 OSC cue
│   └── resetCue.ts           # 🆕 Reset cue
├── store/
│   ├── index.ts              # ♻️  Refactored main store
│   ├── cueActions.ts         # 🆕 CRUD operations
│   ├── cueExecution.ts       # 🆕 Execution logic
│   └── cueBank.ts            # 🆕 Bank management
├── components/
│   ├── CueGrid/
│   │   ├── CueGrid.tsx       # ♻️  Refactored
│   │   ├── CueButton.tsx     # 🆕 Enhanced button
│   │   └── CueProgress.tsx   # 🆕 Progress bar
│   └── CueEditor/
│       ├── CueEditor.tsx     # ♻️  Refactored
│       ├── editors/
│       │   ├── AnimationCueEditor.tsx  # 🆕
│       │   ├── OSCCueEditor.tsx        # 🆕
│       │   └── ResetCueEditor.tsx      # 🆕
│       └── shared/
│           ├── TrackSelector.tsx       # 🆕
│           └── ColorPicker.tsx         # 🆕
└── utils/
    ├── cueValidation.ts      # 🆕 Validation
    ├── cueDefaults.ts        # 🆕 Default values
    └── cueMigration.ts       # 🆕 Old format migration
```

Legend:
- ✅ Keep as-is
- ♻️  Refactor existing
- 🆕 Create new
- ❌ Remove

## Progress

### Week 1: Foundation

#### Day 1-2: Type System
- [ ] Create `types/animationCue.ts`
- [ ] Create `types/oscCue.ts`
- [ ] Create `types/resetCue.ts`
- [ ] Update `types/index.ts` with new base types
- [ ] Remove arming-related types

#### Day 3-4: Store Setup
- [ ] Create `store/cueActions.ts` with CRUD
- [ ] Create `store/cueExecution.ts` with executors
- [ ] Create `store/cueBank.ts` with grid logic
- [ ] Fix duplicate button bug in cueActions

#### Day 5: Migration
- [ ] Create `utils/cueMigration.ts`
- [ ] Write migration for preset→animation cues
- [ ] Add migration tests

### Week 2: UI Components

#### Day 1-2: Cue Button
- [ ] Create `CueButton.tsx` component
- [ ] Add color bar rendering
- [ ] Add icon support (animation/OSC/reset)
- [ ] Add cue number display
- [ ] Add track badges component

#### Day 3: Progress & State
- [ ] Create `CueProgress.tsx` component
- [ ] Add progress bar animation
- [ ] Add status indicators (idle/active/error)
- [ ] Add state-based styling

#### Day 4-5: Grid Updates
- [ ] Update `CueGrid.tsx` to use new button
- [ ] Remove arming UI elements
- [ ] Add grid optimizations (memo)
- [ ] Test no-duplicate behavior

### Week 3: Editors

#### Day 1: Editor Structure
- [ ] Create `CueEditor/CueEditor.tsx` with sidebar
- [ ] Add type selector/switcher
- [ ] Create editor routing logic

#### Day 2: Animation Cue Editor
- [ ] Create `editors/AnimationCueEditor.tsx`
- [ ] Add animation selector dropdown
- [ ] Add track selector (for unlocked anims)
- [ ] Add "Edit Animation" button
- [ ] Add playback overrides (speed, loop, reverse)

#### Day 3: Other Editors
- [ ] Create `editors/OSCCueEditor.tsx`
- [ ] Add OSC message builder
- [ ] Create `editors/ResetCueEditor.tsx`
- [ ] Add reset type selector

#### Day 4-5: Shared Components
- [ ] Create `shared/TrackSelector.tsx`
- [ ] Create `shared/ColorPicker.tsx`
- [ ] Create `shared/TriggerConfig.tsx`
- [ ] Polish editor UX

### Week 4: Integration & Testing

#### Day 1-2: Animation Editor Integration
- [ ] Add "editingFromCue" mode to AnimationEditorStoreV2
- [ ] Add "Edit Animation" button handler in CueEditor
- [ ] Implement tab switching with context
- [ ] Add cue indicator in animation editor header

#### Day 3: Save Workflow
- [ ] Add save options menu in animation editor
- [ ] Implement "Save to Cue Only" logic
- [ ] Implement "Update Library Animation"
- [ ] Implement "Save as New Animation"
- [ ] Store cue-specific overrides

#### Day 4: Testing
- [ ] Write unit tests for cue executors
- [ ] Test animation editing workflow E2E
- [ ] Test grid operations (no duplicates)
- [ ] Test all cue types (create/edit/trigger)

#### Day 5: Polish & Docs
- [ ] UI polish pass
- [ ] Performance optimizations
- [ ] Write user documentation
- [ ] Create video tutorial (optional)

## Testing Checklist

### Grid Operations
- [ ] Create new cue → appears once in correct slot
- [ ] Assign cue to slot → no duplicate
- [ ] Switch banks → correct cues shown
- [ ] Delete cue → removed from slot
- [ ] Drag cue to new slot (if implemented)

### Animation Cues
- [ ] Create animation cue
- [ ] Trigger animation cue → animation plays
- [ ] Edit animation from cue → opens editor
- [ ] Save to cue only → library unchanged
- [ ] Update library → all cues see change
- [ ] Save as new → creates new animation

### OSC Cues
- [ ] Create OSC cue
- [ ] Configure OSC messages
- [ ] Trigger OSC cue → messages sent
- [ ] Multiple messages with delays

### Reset Cues
- [ ] Create reset cue
- [ ] Select tracks to reset
- [ ] Trigger reset → tracks return to position
- [ ] Test with fade duration

### UI/UX
- [ ] Cue colors display correctly
- [ ] Progress bar updates smoothly
- [ ] Track badges show correctly
- [ ] Active state visual feedback
- [ ] Error state visual feedback
- [ ] Responsive layout

## Performance Targets

- ⚡ Grid render: <100ms
- ⚡ Cue trigger: <50ms
- ⚡ Progress update: 30fps (33ms)
- ⚡ Editor open: <200ms
- ⚡ Animation switch: <100ms

## Documentation Deliverables

- [ ] User Guide: "Working with Cues"
- [ ] User Guide: "Creating Animation Cues"
- [ ] User Guide: "Editing Animations from Cues"
- [ ] Developer Guide: "Cue System Architecture"
- [ ] Migration Guide: "Upgrading from Old Cue Format"
- [ ] API Reference: "Cue Store Methods"

## Risk Assessment

### High Risk
- **Animation editor integration complexity**
  - Mitigation: Start simple, iterate
  - Fallback: Read-only edit view initially

### Medium Risk
- **Backward compatibility issues**
  - Mitigation: Thorough migration testing
  - Fallback: Support both formats temporarily

### Low Risk
- **Performance with many cues**
  - Mitigation: Virtual scrolling, memoization
  - Fallback: Pagination

## Success Criteria

✅ **Must Have**:
- Zero duplicate button bugs
- All three cue types working
- Edit animation from cue workflow
- Professional UI design
- No arming system

🎯 **Should Have**:
- Smooth progress animations
- Keyboard shortcuts
- Undo/redo for cue edits
- Performance optimizations

⭐ **Nice to Have**:
- Cue templates
- Drag-and-drop reordering
- Bulk operations
- Export/import cues

## Review Points

### End of Week 1 Review
- [ ] Types complete and approved
- [ ] Store refactor complete
- [ ] Duplicate bug fixed
- [ ] Migration strategy validated

### End of Week 2 Review
- [ ] UI components complete
- [ ] Visual design approved
- [ ] Grid working smoothly
- [ ] Performance acceptable

### End of Week 3 Review
- [ ] All editors complete
- [ ] Edit workflow functional
- [ ] Save options working
- [ ] Integration stable

### End of Week 4 Review
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance targets met
- [ ] Ready for production

## Notes

### Design Decisions

**Why remove arming?**
- Not standard in professional lighting consoles
- Confuses users familiar with lighting systems
- Adds complexity without clear benefit
- Direct triggering is more intuitive

**Why merge preset and animation cues?**
- Redundant functionality
- Simpler mental model
- Easier to maintain
- Animation library serves same purpose as presets

**Why separate cue types?**
- Clear separation of concerns
- Easier to extend with new types
- Type-specific validation
- Better TypeScript support

### Open Questions

1. **Should we support cue groups?**
   - Defer to post-MVP

2. **How to handle cue conflicts?**
   - Last triggered wins (LIFO)
   - Configure in stack settings

3. **Should locked animations allow overrides?**
   - No - defeats purpose of locking
   - Display as read-only in cue editor

4. **How many tracks to show in button?**
   - First 3-4, then "+N" indicator
   - Hover for full list

---

**Last Updated**: 2024-11-14  
**Sprint Lead**: Cascade AI  
**Status**: Ready to Start

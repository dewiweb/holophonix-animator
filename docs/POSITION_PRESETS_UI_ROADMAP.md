# Position Presets UI Roadmap

## Overview

The Position Presets backend is complete and fully integrated. This roadmap outlines the UI components needed to expose this functionality to users.

## Priority Levels

- 🔴 **Critical**: Core functionality, blocks basic usage
- 🟡 **Important**: Enhances usability significantly
- 🟢 **Nice-to-have**: Quality of life improvements

## Phase 1: Core UI (Week 1) 🔴

### 1.1 Preset Manager Panel 🔴

**Location**: `src/components/presets/PresetManager.tsx`

**Features**:
- List all presets with name, category, track count
- Search/filter by name, tags, category
- Folder tree navigation
- Create/edit/delete presets
- Import/export buttons
- Favorite toggle
- Apply button (quick recall)

**Design**:
```
┌─────────────────────────────────────────┐
│ 🎯 Position Presets                    │
├─────────────────────────────────────────┤
│ 🔍 [Search...]          [+ New] [⚙️]  │
├─────────────────────────────────────────┤
│ 📁 Folders              📑 All Presets  │
│   ├─ 📁 Scenes (5)                      │
│   ├─ 📁 Formations (3)                  │
│   └─ 📁 Effects (2)                     │
│                                          │
│ ⭐ Favorites                             │
│ 🕐 Recently Used                         │
├─────────────────────────────────────────┤
│ Scene 1 - Opening            [Apply]    │
│   📍 scene • 6 tracks • 2 days ago      │
│                                          │
│ Front Stage                  [Apply]    │
│   📍 formation • 4 tracks • global      │
│                                          │
│ Surround Circle             [Apply]     │
│   📍 formation • 8 tracks • 1 week ago  │
└─────────────────────────────────────────┘
```

**Actions**:
- Click name → Edit preset
- Click Apply → Open apply dialog
- Right-click → Context menu (edit, delete, duplicate, export)
- Drag → Reorder or move to folder

### 1.2 Capture Preset Dialog 🔴

**Location**: `src/components/presets/CapturePresetDialog.tsx`

**Features**:
- Name input (required)
- Description textarea
- Category selector
- Tags input (comma-separated)
- Scope (project/global)
- Track selection (all/selected/custom)
- Preview current positions
- Save button

**Design**:
```
┌─────────────────────────────────────────┐
│ 📸 Capture Position Preset             │
├─────────────────────────────────────────┤
│ Name *                                   │
│ [Scene 1 - Opening            ]         │
│                                          │
│ Description                              │
│ [Opening positions for Act 1  ]         │
│ [                              ]         │
│                                          │
│ Category: [scene ▾]  Scope: [project ▾] │
│                                          │
│ Tags: [act1, opening, frontal]          │
│                                          │
│ Tracks (6 selected):                    │
│ ☑️ Track 1: Actor A (2.0, 3.0, 1.2)    │
│ ☑️ Track 2: Actor B (-1.0, 3.0, 1.2)   │
│ ☑️ Track 3: Actor C (0.0, 4.0, 1.2)    │
│ ☑️ Track 4: Ambient L (-4.0, 2.0, 2.0) │
│ ☑️ Track 5: Ambient R (4.0, 2.0, 2.0)  │
│ ☑️ Track 6: FX Center (0.0, 0.0, 3.0)  │
│                                          │
│ [Select All] [Clear] [From Selected]   │
│                                          │
│           [Cancel]  [Save Preset]       │
└─────────────────────────────────────────┘
```

**Trigger**: Button in toolbar, shortcut Ctrl+Shift+P

### 1.3 Apply Preset Dialog 🔴

**Location**: `src/components/presets/ApplyPresetDialog.tsx`

**Features**:
- Preset selector (if not pre-selected)
- Transition settings:
  - Duration slider (0-10s)
  - Easing selector
  - Interpolation mode selector
- Stagger configuration (collapsible)
- Options:
  - Interrupt animations checkbox
  - Respect bounds checkbox
- Preview button
- Apply button

**Design**:
```
┌─────────────────────────────────────────┐
│ 🎯 Apply Position Preset               │
├─────────────────────────────────────────┤
│ Preset: Scene 1 - Opening               │
│   6 tracks • scene • Act 1              │
│                                          │
│ Transition                               │
│ Duration: [██████═════] 2.0s            │
│ Easing: [ease-in-out ▾]                 │
│ Mode: [spherical ▾]                     │
│                                          │
│ ▼ Stagger (optional)                    │
│   ☑️ Enable stagger                     │
│   Pattern: [outside-in ▾]               │
│   Delay: [███══════] 0.15s              │
│   Overlap: [██████════] 60%             │
│                                          │
│ Options                                  │
│ ☑️ Interrupt running animations         │
│ ☑️ Respect safety bounds                │
│ ☐ Validate before apply                 │
│                                          │
│ Tracks: 6 will move                     │
│ Estimated time: 2.9s (with stagger)    │
│                                          │
│      [Preview]  [Cancel]  [Apply]       │
└─────────────────────────────────────────┘
```

### 1.4 Position Cue Editor 🔴

**Location**: `src/components/cues/editors/PositionCueEditor.tsx`

**Features**:
- Preset selector (dropdown with search)
- Transition settings (same as apply dialog)
- Track override (optional)
- Behavior options
- Preview button
- Save to cuelist button

**Design**:
```
┌─────────────────────────────────────────┐
│ Position Cue Editor                     │
├─────────────────────────────────────────┤
│ Cue Name                                 │
│ [Recall: Scene 1 - Opening    ]         │
│                                          │
│ Preset *                                 │
│ [Scene 1 - Opening ▾         ]          │
│   6 tracks • scene category             │
│                                          │
│ Transition                               │
│ Duration: [██████═════] 2.0s            │
│ Easing: [ease-in-out ▾]                 │
│ Mode: [spherical ▾]                     │
│                                          │
│ ▼ Advanced                              │
│   ☐ Override tracks (use cue tracks)   │
│   ☑️ Interrupt animations               │
│   ☑️ Wait for completion                │
│   ☐ Resume animations after             │
│                                          │
│ ▼ Stagger                               │
│   ☐ Enable stagger                      │
│                                          │
│    [Preview]  [Cancel]  [Save to Cue]   │
└─────────────────────────────────────────┘
```

**Integration**: Add to cue palette alongside animation/OSC/reset cues

## Phase 2: Visualization (Week 2) 🟡

### 2.1 Preset Preview 3D 🟡

**Location**: `src/components/presets/PresetPreview3D.tsx`

**Features**:
- 3D view of preset positions
- Show track labels
- Color-code by category
- Show compared to current (diff mode)
- Rotate/zoom controls
- Grid and bounds overlay

**Design**:
```
┌─────────────────────────────────────────┐
│ 3D Preview: Scene 1 - Opening          │
├─────────────────────────────────────────┤
│                                          │
│         🔵 Track 1                      │
│    🔵 Track 2   🔵 Track 3              │
│                                          │
│         📍 Center (0,0)                 │
│                                          │
│  🔵 Track 4              🔵 Track 5    │
│                                          │
│                 🔵 Track 6               │
│                                          │
├─────────────────────────────────────────┤
│ View: [Top ▾] | [Rotate] [Pan] [Zoom]  │
│ ☑️ Show grid   ☑️ Show bounds           │
│ ☐ Compare to current positions          │
└─────────────────────────────────────────┘
```

**Tech**: Use existing Three.js setup from animation preview

### 2.2 Preset Comparison View 🟡

**Location**: `src/components/presets/PresetComparisonView.tsx`

**Features**:
- Side-by-side or overlay comparison
- Highlight moved tracks
- Show distances
- Statistics panel
- Visual diff with arrows

**Design**:
```
┌─────────────────────────────────────────┐
│ Compare Presets                         │
├─────────────────────────────────────────┤
│ Preset A: [Scene 1 - Opening ▾]        │
│ Preset B: [Scene 2 - Surround ▾]       │
│                                          │
│ View: [Side-by-side] [Overlay] [Diff]  │
├─────────────────────────────────────────┤
│ Statistics                               │
│ • Moved: 6 tracks                       │
│ • Average distance: 2.4m                │
│ • Max distance: 4.2m                    │
│ • Min distance: 0.8m                    │
│                                          │
│ Track Changes:                           │
│ Track 1: 2.1m → (arrow visualization)   │
│ Track 2: 3.8m → (arrow visualization)   │
│ Track 3: 1.5m → (arrow visualization)   │
│ ...                                      │
│                                          │
│ [Create Interpolated Presets]          │
│ [25%] [50%] [75%]                       │
└─────────────────────────────────────────┘
```

### 2.3 Transition Preview 🟡

**Location**: `src/components/presets/TransitionPreview.tsx`

**Features**:
- Animated preview of transition
- Play/pause/scrub controls
- Speed control
- Show stagger effect
- Timeline marker

**Design**:
```
┌─────────────────────────────────────────┐
│ Transition Preview                      │
├─────────────────────────────────────────┤
│ [▶️] [⏸️] [⏹️]  Speed: [1x ▾]          │
│                                          │
│ [═══════█══════════════] 1.2s / 2.9s   │
│                                          │
│ (Animated 3D view showing tracks         │
│  moving from current to preset           │
│  positions with stagger effect)          │
│                                          │
│ Track 4 ████░░░░░░ transitioning        │
│ Track 5 ██████░░░░ transitioning        │
│ Track 6 ████████░░ transitioning        │
└─────────────────────────────────────────┘
```

## Phase 3: Advanced Features (Week 3+) 🟢

### 3.1 Preset Generator Dialog 🟢

**Location**: `src/components/presets/PresetGeneratorDialog.tsx`

**Features**:
- Pattern selector (circle, line, grid, arc, sphere)
- Parameter inputs (radius, spacing, etc.)
- Track selection
- Live preview
- Generate button

### 3.2 Preset Library Browser 🟢

**Location**: `src/components/presets/PresetLibraryBrowser.tsx`

**Features**:
- Grid/list view toggle
- Thumbnail previews
- Category filters
- Tag cloud
- Sort options
- Batch operations

### 3.3 Preset Morphing Timeline 🟢

**Location**: `src/components/presets/PresetMorphingTimeline.tsx`

**Features**:
- Multi-preset morphing setup
- Keyframe editor
- Weight curves
- Preview animation
- Export as position cue

### 3.4 Folder Management 🟢

**Location**: `src/components/presets/FolderManager.tsx`

**Features**:
- Create/rename/delete folders
- Nested folders
- Drag-and-drop organization
- Folder colors/icons
- Smart folders (auto-filter)

## Component Dependencies

```
PresetManager
├─ CapturePresetDialog
├─ ApplyPresetDialog
│  ├─ TransitionSettings (shared)
│  └─ PresetPreview3D
├─ PresetComparisonView
│  └─ PresetPreview3D
└─ FolderManager

PositionCueEditor
├─ TransitionSettings (shared)
└─ PresetPreview3D

PresetGeneratorDialog
└─ PresetPreview3D

PresetLibraryBrowser
├─ PresetPreview3D
└─ PresetComparisonView
```

## Shared Components

### TransitionSettings

Reusable component for transition configuration:
- Duration slider
- Easing selector
- Mode selector
- Stagger configuration

### PresetSelector

Searchable dropdown for selecting presets:
- Search by name
- Filter by category
- Show track count
- Recent/favorites sections

## Integration Points

### 1. Main Navigation

Add "Presets" section to sidebar:
```
- Animations
- Tracks
- Cues
- Presets  ← NEW
  - Manager
  - Generator
  - Library
- Timeline
- Settings
```

### 2. Keyboard Shortcuts

```
Ctrl+Shift+P  - Capture preset
Ctrl+Shift+R  - Recall (apply) preset
Ctrl+Shift+N  - New position cue
```

### 3. Cue Palette

Add position cue icon alongside existing cue types:
```
[🎬 Animation] [📡 OSC] [🔄 Reset] [🎯 Position] ← NEW
```

### 4. Context Menus

**Track context menu**:
- "Capture positions..." → Opens capture dialog

**3D View context menu**:
- "Capture as preset..." → Opens capture dialog with tracks in view

## State Management

All UI components consume from:
- `usePositionPresetStore` - Preset CRUD and operations
- `useCueStoreV2` - Cue creation and execution
- `useProjectStore` - Track data

No additional state management needed - leverage existing Zustand stores.

## Styling

Use existing design system:
- Tailwind CSS for layout
- Shadcn/ui components
- Lucide icons
- Existing color palette
- Dark mode support

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- Form validation
- State updates

### Integration Tests
- Capture → Apply workflow
- Create position cue → Execute
- Import/export
- Folder operations

### E2E Tests
- Full theatrical scenario
- Multiple presets in sequence
- Comparison and analysis
- Error handling

## Development Order

### Week 1: Core UI
1. Day 1-2: PresetManager + CaptureDialog
2. Day 3-4: ApplyDialog + PositionCueEditor
3. Day 5: Integration + testing

### Week 2: Visualization
1. Day 1-2: PresetPreview3D
2. Day 3: PresetComparisonView
3. Day 4: TransitionPreview
4. Day 5: Polish + testing

### Week 3+: Advanced
1. PresetGenerator
2. LibraryBrowser
3. MorphingTimeline
4. FolderManager
5. Final polish

## Success Criteria

### Minimum Viable Product (MVP)
- ✅ Can capture current positions
- ✅ Can apply preset with transition
- ✅ Can create position cue
- ✅ Can execute cue in cuelist
- ✅ Can import/export presets

### Full Feature Set
- ✅ All MVP features
- ✅ 3D preview working
- ✅ Comparison tool functional
- ✅ Generator patterns available
- ✅ Folder organization
- ✅ Full documentation

## Conclusion

The UI roadmap is clear and achievable. With the complete backend already in place, UI development can proceed without blockers. Each component is well-defined with mockups and specifications.

**Estimated Timeline**: 3-4 weeks for full implementation  
**Priority**: Start with Phase 1 (Core UI) for MVP functionality  
**Risk**: Low - backend is complete and tested

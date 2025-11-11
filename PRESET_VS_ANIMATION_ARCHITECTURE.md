# Preset vs Animation Architecture - Analysis & Recommendations

## Current Architecture

### Animations (Project-Level)
**Location:** `src/stores/projectStore.ts` → `animations: Animation[]`  
**Scope:** Per-project (saved in project .json files)  
**Purpose:** Actual animation instances used in timeline and cues

```typescript
interface Animation {
  id: string
  name: string
  type: AnimationType
  duration: number
  loop: boolean
  pingPong?: boolean
  parameters: AnimationParameters
  keyframes?: Keyframe[]
  coordinateSystem: CoordinateSystem
  transform?: AnimationTransform  // Multi-track configuration
  trackIds?: string[]             // Track binding
  trackSelectionLocked?: boolean  // Lock to specific tracks
}
```

**Key Features:**
- ✅ Has unique ID
- ✅ Can be locked to specific tracks
- ✅ Includes multi-track transform data
- ✅ Saved with project
- ✅ Used in timeline/cues
- ❌ Not shared across projects

### Presets (Global Templates)
**Location:** `src/stores/presetStore.ts` → `presets: AnimationPreset[]`  
**Scope:** Global (persisted in local storage across all projects)  
**Purpose:** Reusable animation templates/library

```typescript
interface AnimationPreset {
  id: string
  name: string
  description?: string
  category: 'physics' | 'wave' | 'curve' | 'procedural' | 'interactive' | 'spatial' | 'basic' | 'user'
  animation: Omit<Animation, 'id'>  // Animation WITHOUT id
  thumbnail?: string
  tags: string[]
  author?: string
  createdAt: string
  modifiedAt: string
}
```

**Key Features:**
- ✅ Has metadata (category, tags, description, author)
- ✅ Global library (shared across projects)
- ✅ Organized by category
- ✅ Searchable by tags
- ❌ NO track bindings
- ❌ NO ID (generates new ID when loaded)

## How They're Used

### Saving an Animation (to Project)
```
Animation Editor → "Save Animation"
  ↓
Builds full Animation object with:
  - Track bindings (trackIds)
  - Multi-track transform
  - Track locking state
  ↓
projectStore.addAnimation(animation)
  ↓
Saved in project.json
```

**Use Case:** "I want to use this animation in my timeline/cues"

### Saving a Preset (to Library)
```
Animation Editor → "Save as Preset"
  ↓
Builds AnimationPreset with:
  - Animation parameters (no ID, no track bindings)
  - Metadata (category, tags, description)
  ↓
presetStore.addPreset(preset)
  ↓
Saved in localStorage (persistent across projects)
```

**Use Case:** "I want to reuse this animation config in other projects"

### Loading a Preset
```
User selects preset from library
  ↓
Animation Editor loads preset.animation
  ↓
Generates new ID, applies to selected tracks
  ↓
User can save as new Animation in project
```

## Problems with Current Architecture

### 1. User Confusion 😕
- **Two "Save" buttons**: "Save Animation" vs "Save as Preset"
- **Unclear difference**: When should I use which?
- **Duplicate names**: Can have same name in both places
- **Two libraries**: Animation Library vs Preset Browser

### 2. Name Collision ❌
- **Animations**: No duplicate checking within project
- **Presets**: No duplicate checking in global library
- **Cross-contamination**: Same name can exist as both animation & preset

### 3. Workflow Issues 🔄
- **Can't update presets**: Save creates new preset, no "update existing"
- **No versioning**: Can't track preset changes
- **Lost track bindings**: When loading preset, have to rebind tracks

## Current Issues to Fix

### Issue 1: goToStart Easing Doesn't Work 🐛
**Problem:** `_easeToPositions` uses `requestAnimationFrame` but main animation loop (also using `requestAnimationFrame`) continues running and overrides the easing positions.

**Root Cause:**
```typescript
// goToStart calls:
_easeToPositions(tracks, durationMs)  // Tries to ease
  ↓
// BUT main animate loop is still running:
animate() // Overrides positions every frame!
```

**Solution:** Pause animations during goToStart easing, resume after.

### Issue 2: No Duplicate Name Checking 🏷️
**Problem:** Can save animations/presets with duplicate names.

**Impact:**
- Confusing: Multiple "Circular Animation" in list
- Hard to find: Which one is which?
- Overwrite risk: Might update wrong one

**Solution:** Check for duplicates and auto-number or warn user.

### Issue 3: Architecture Confusion 🤔
**Problem:** Users don't understand preset vs animation difference.

**User Mental Model:**
- "I made an animation, I want to save it" → But which button?
- "I want to load an animation" → But which library?

## Proposed Solutions

### Option A: Keep Both (with Improvements) ✨

**Improvements:**
1. **Clear naming:**
   - "Save to Project" (Animation)
   - "Save to Library" (Preset)

2. **Visual distinction:**
   - Project animations: 📁 icon, "In Project" badge
   - Library presets: 📚 icon, "In Library" badge

3. **Unified browser:**
   - Single "Animation Browser" with tabs:
     - "Project" tab (animations in current project)
     - "Library" tab (global presets)
     - "Import" tab (from other projects)

4. **Duplicate detection:**
   - Check names before saving
   - Offer to rename or overwrite
   - Show numbered suggestions

5. **Preset updates:**
   - "Update Preset" button when preset is loaded
   - Versioning support (optional)

### Option B: Simplify to Single System 🎯

**Merge into one "Saved Animations" system:**

```typescript
interface SavedAnimation {
  id: string
  name: string
  scope: 'project' | 'library'  // Instead of two separate systems
  
  // Animation data
  type: AnimationType
  duration: number
  parameters: AnimationParameters
  // ... etc
  
  // Project-specific (only if scope='project')
  trackIds?: string[]
  trackSelectionLocked?: boolean
  
  // Library-specific (only if scope='library')
  category?: string
  tags?: string[]
  description?: string
  thumbnail?: string
}
```

**Benefits:**
- ✅ Single save dialog with "Scope" dropdown
- ✅ Single browser with filter (project/library/all)
- ✅ Unified duplicate checking
- ✅ Simpler mental model
- ✅ Can promote project → library or import library → project

**Drawbacks:**
- ⚠️ More refactoring required
- ⚠️ Migration path for existing data
- ⚠️ localStorage might not be ideal for larger libraries

### Option C: Make Presets More Prominent 🌟

**Flip the paradigm:**
- **Primary:** Library presets (the templates)
- **Secondary:** Project instances (derived from presets)

**Workflow:**
1. User creates animation → Automatically saved to library
2. User applies to tracks → Creates project instance (references preset)
3. Project just stores: `{ presetId, trackIds, overrides? }`

**Benefits:**
- ✅ Reduces duplication
- ✅ Updates to preset affect all uses
- ✅ Clearer "template → instance" model

**Drawbacks:**
- ⚠️ Breaking change to current workflow
- ⚠️ Need preset dependency management
- ⚠️ What if preset deleted but project uses it?

## Recommendation

**I recommend Option A: Keep Both with Improvements**

**Why:**
- ✅ Preserves current architecture (less breaking)
- ✅ Addresses user confusion with better UX
- ✅ Fixes technical issues (goToStart, duplicates)
- ✅ Keeps both use cases clear:
  - Projects: Timeline/cue-ready animations
  - Library: Reusable templates
- ✅ Incremental improvements (ship faster)

**Implementation Priority:**
1. **HIGH**: Fix goToStart easing bug (blocking)
2. **HIGH**: Add duplicate name checking (UX blocker)
3. **MEDIUM**: Rename buttons/labels for clarity
4. **MEDIUM**: Unified animation browser
5. **LOW**: Preset update/versioning
6. **LOW**: Cross-project import

## Next Steps

### Immediate Fixes (This Session)
1. ✅ Fix goToStart easing conflict
2. ✅ Add duplicate name detection
3. ✅ Auto-number duplicates

### Short-term UX (Next Sprint)
1. Rename "Save Animation" → "Save to Project"
2. Rename "Save as Preset" → "Save to Library"
3. Add icons and badges for visual distinction
4. Unified browser with tabs

### Long-term (Future)
1. Preset versioning
2. Cross-project animation import/export
3. Community preset sharing
4. Preset marketplace (?)

## Technical Notes

### Storage Locations
```
Animations:
  projectStore → animations: Animation[]
    ↓
  Saved in: <project-name>.json (user's file system)
  Scope: Per-project

Presets:
  presetStore → presets: AnimationPreset[]
    ↓
  Saved in: localStorage['holophonix-animation-presets']
  Scope: Global (all projects)
```

### Loading Flow
```
Load Project:
  - Loads project.json
  - Restores tracks, animations, timelines
  - Animations already have track bindings
  
Load Preset:
  - Gets preset from presetStore
  - Strips ID, track bindings
  - User selects tracks
  - Creates new Animation instance
```

### Migration Considerations
If we ever merge systems:
- Read old preset localStorage
- Convert to new unified format
- Migrate project .json files
- Provide "import old presets" tool

---

**Conclusion:** The architecture is sound but the UX needs clarity. With focused improvements to naming, duplicate detection, and visual distinction, users will understand when and why to use each system.

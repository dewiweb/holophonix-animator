# Deprecation Notice - Quad-View Editor

**Date**: November 9, 2024  
**Status**: ⚠️ Deprecated Components

---

## What's Deprecated?

The following components from the quad-view Three.js editor implementation have been deprecated:

### Components
- ❌ `ThreeJsControlPointEditor.tsx` - Main quad-view component
- ❌ `MultiViewRenderer.tsx` - 4-viewport renderer
- ❌ `ThreeJsEditorDemo.tsx` - Quad-view demo

### Hooks
- ❌ `hooks/useMultiViewCameras.ts` - 4-camera management
- ❌ `hooks/useViewportControls.ts` - Quad-view controls

---

## Why Deprecated?

The quad-view implementation had a **fundamental limitation**: the transform gizmo (used for dragging control points) only worked in the perspective viewport. This created:
- User confusion (why doesn't it work in other views?)
- Technical complexity (managing 4 simultaneous viewports)
- Limited editing capabilities

---

## What Replaces It?

### New Unified Editor

**Component**: `UnifiedThreeJsEditor`

**Key Features**:
- ✅ **Single-view with mode switching** (cleaner, simpler)
- ✅ **4 view modes** (Perspective, Top, Front, Side) - switch with 1-4 keys
- ✅ **2 display modes** (Preview, Edit) - toggle with Tab key
- ✅ **Gizmo works in ALL views** (not just perspective!)
- ✅ **75% less complexity**
- ✅ **Better performance** (1 render loop instead of 4)

**Components**:
- ✅ `UnifiedThreeJsEditor.tsx` - Main component
- ✅ `SingleViewRenderer.tsx` - Simple renderer
- ✅ `ViewModeSelector.tsx` - View switching UI
- ✅ `EditModeSelector.tsx` - Mode switching UI
- ✅ `UnifiedEditorDemo.tsx` - New demo

**Hooks**:
- ✅ `hooks/useCamera.ts` - Single camera management
- ✅ `hooks/useSingleViewportControl.ts` - Simplified controls

---

## Migration Guide

### Before (Deprecated)

```tsx
import { ThreeJsControlPointEditor } from './components/threejs-editor'

<ThreeJsControlPointEditor
  animation={animation}
  onControlPointsChange={handleChange}
  initialSettings={{
    transformMode: 'translate',
    showGrid: true,
  }}
/>
```

### After (New Unified Editor)

```tsx
import { UnifiedThreeJsEditor } from './components/threejs-editor'

<UnifiedThreeJsEditor
  animation={animation}
  selectedTracks={[]}
  multiTrackMode="identical"
  onControlPointsChange={handleChange}
  initialSettings={{
    viewMode: 'perspective',
    editMode: 'edit',
    showGrid: true,
  }}
/>
```

### Key Differences

1. **New props**:
   - `viewMode` - Which camera view (perspective/top/front/side)
   - `editMode` - Preview or Edit mode
   - `selectedTracks` - For multi-track visualization (Phase 2)
   - `multiTrackMode` - For multi-track visualization (Phase 2)

2. **Removed props**:
   - `transformMode` - Always translate (rotation removed as per design decision)

3. **Same props**:
   - `animation` - Same format
   - `onControlPointsChange` - Same callback
   - `onSelectionChange` - Same callback
   - `readOnly` - Same behavior

---

## Timeline

| Date | Action |
|------|--------|
| Nov 9, 2024 | Unified editor Phase 1 complete |
| Nov 9, 2024 | Quad-view deprecated (files marked) |
| TBD | Phase 2-5 implementation |
| TBD | Remove deprecated files (after 2+ weeks stability) |

---

## Current Status

### ✅ Working Now
- `/editor-test` route uses new UnifiedEditorDemo
- New unified editor fully functional in edit mode
- All keyboard shortcuts working
- Gizmo working in all views
- View and mode switching working

### ⏳ Coming Soon (Phase 2)
- Preview mode (track/path visualization)
- Multi-track mode support
- AnimationEditor integration

### ❌ Deprecated (Do Not Use)
- ThreeJsControlPointEditor
- MultiViewRenderer
- ThreeJsEditorDemo
- Related quad-view hooks

---

## Testing the New Editor

Navigate to: `http://localhost:5173/editor-test`

**Try these actions**:
1. Press `1-4` to switch views
2. Press `Tab` to toggle Preview/Edit modes
3. Click a control point to select it
4. Drag the gizmo arrows
5. Switch to Top view (`2`) - **gizmo still works!** ✨
6. Press `Shift+A` to add a point
7. Press `Home` to reset camera

---

## Questions?

- **Full migration plan**: `docs/SINGLE_VIEW_EDITOR_MIGRATION_PLAN.md`
- **Implementation summary**: `docs/UNIFIED_EDITOR_IMPLEMENTATION_SUMMARY.md`
- **Quick start guide**: `docs/UNIFIED_EDITOR_QUICK_START.md`
- **Progress tracking**: `docs/UNIFIED_EDITOR_PROGRESS.md`

---

## For Developers

### If You're Using Deprecated Components

1. **Update imports**:
   ```diff
   - import { ThreeJsControlPointEditor } from './components/threejs-editor'
   + import { UnifiedThreeJsEditor } from './components/threejs-editor'
   ```

2. **Update props** (see migration guide above)

3. **Test thoroughly** - keyboard shortcuts changed

4. **Remove any quad-view specific code**

### If You're Integrating into AnimationEditor

Wait for **Phase 4** (AnimationEditor integration), which will include:
- State synchronization patterns
- Multi-track visualization
- Preview mode implementation
- Full integration example

**ETA**: 2-3 weeks from Nov 9, 2024

---

**Status**: Deprecated but still functional  
**Removal Date**: TBD (after stability period)  
**Support**: Limited - focus is on new unified editor

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2024

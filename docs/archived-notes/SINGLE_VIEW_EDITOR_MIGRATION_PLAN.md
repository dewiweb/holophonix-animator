# Single-View 3D Editor Migration Plan

## Executive Summary

**Objective**: Refactor the quad-view Three.js editor into a single-view editor with view switching and dual modes (Preview/Edit) to resolve gizmo interaction conflicts and simplify the UI.

**Benefits**:
- ✅ Solves gizmo interaction limitation (only works in one view)
- ✅ Cleaner, more focused UI
- ✅ Better user experience with explicit mode switching
- ✅ Easier to integrate with AnimationEditor
- ✅ Removes complexity of quad-view management

**Timeline**: 2-3 weeks

---

## Problem Analysis

### Current Issues

1. **Gizmo Limitation**: TransformControls can only work in one viewport at a time (perspective view)
2. **Complexity**: Managing 4 viewports simultaneously is complex
3. **User Confusion**: Users may not understand why gizmo only appears in one view
4. **Integration Challenge**: Quad view is hard to integrate cleanly into AnimationEditor layout

### Current Architecture

```
ThreeJsControlPointEditor (Quad View)
├── MultiViewRenderer (4 viewports: Perspective, Front, Top, Side)
├── useMultiViewCameras (4 cameras)
├── useViewportControls (4 OrbitControls)
├── useTransformControls (1 gizmo, only works in perspective)
└── useControlPointSelection (works in all views)
```

### Documentation Status
- ✅ THREEJS_CONTROL_POINT_EDITOR_MIGRATION.md - Overall migration plan
- ✅ THREEJS_EDITOR_GIZMO_PROGRESS.md - Current progress (85% complete, gizmo interaction blocked)
- ✅ THREEJS_EDITOR_TESTING_GUIDE.md - Testing procedures

---

## New Architecture

### Single View with Switching

```
UnifiedThreeJsEditor (Single View)
├── ViewModeSelector (Buttons: Perspective | Top | Front | Side)
├── EditModeSelector (Buttons: Preview Mode | Edit Mode)
├── SingleViewRenderer (One active view at a time)
├── useCamera (One active camera based on view mode)
├── useViewportControl (One OrbitControls for active camera)
├── useTransformControls (Works in any view)
└── useControlPointSelection (Works in active view)
```

### View Modes (4 options)

1. **Perspective View** (default)
   - Full 3D navigation
   - Rotate (Alt+drag)
   - Pan (Ctrl+drag or right-click+drag)
   - Zoom (scroll)

2. **Top View (XZ Plane)**
   - Orthographic camera looking down
   - Pan only (right-click+drag or middle-click+drag)
   - Zoom (scroll)
   - NO rotation (keeps it as true plane view)

3. **Front View (XY Plane)**
   - Orthographic camera looking at front
   - Pan only
   - Zoom
   - NO rotation

4. **Side View (YZ Plane)**
   - Orthographic camera looking from side
   - Pan only
   - Zoom
   - NO rotation

### Display Modes (2 options)

#### **Preview Mode**
- Shows all selected tracks as spheres
- Shows animation paths for all selected tracks
- Highlights the path of the primary selected track
- Path color coding based on multi-track mode:
  - **Identical mode**: All tracks same color (cyan)
  - **Position-relative mode**: Each track different color
  - **Phase-offset modes**: Gradient by time offset
  - **Formation mode**: Formation structure visualization
  - **Centered mode**: Radial pattern from center point
- No control points visible
- No gizmo visible
- Read-only visualization

#### **Edit Mode**
- Shows control points of the highlighted animation path
- Shows the path curve
- Shows primary selected track (optional)
- Transform gizmo visible when point selected
- Full editing capabilities:
  - Select control points
  - Translate with gizmo
  - Add/delete/duplicate points
  - Keyboard shortcuts

---

## Implementation Plan

### Phase 1: Core Architecture Refactor (Week 1)

#### 1.1 Create New Components

**`UnifiedThreeJsEditor.tsx`** (Main component, replaces ThreeJsControlPointEditor)
- Single canvas renderer
- View mode state (perspective/top/front/side)
- Edit mode state (preview/edit)
- Integrated toolbar with mode selectors

**`SingleViewRenderer.tsx`** (Replaces MultiViewRenderer)
- Renders one view at a time
- No viewport calculations
- Simpler render loop
- Full screen usage

**`ViewModeSelector.tsx`** (New UI component)
```tsx
<div className="flex gap-1 border-r border-gray-700 pr-2">
  <button className={perspective ? 'active' : ''}>
    <Cube size={18} /> Perspective
  </button>
  <button className={top ? 'active' : ''}>
    <SquareDashedTop size={18} /> Top
  </button>
  <button className={front ? 'active' : ''}>
    <SquareDashedFront size={18} /> Front
  </button>
  <button className={side ? 'active' : ''}>
    <SquareDashedSide size={18} /> Side
  </button>
</div>
```

**`EditModeSelector.tsx`** (New UI component)
```tsx
<div className="flex gap-1 border-r border-gray-700 pr-2">
  <button className={previewMode ? 'active' : ''}>
    <Eye size={18} /> Preview
  </button>
  <button className={editMode ? 'active' : ''}>
    <Edit3 size={18} /> Edit
  </button>
</div>
```

#### 1.2 Refactor Hooks

**`useCamera.ts`** (New hook, replaces useMultiViewCameras)
```typescript
export const useCamera = (viewMode: 'perspective' | 'top' | 'front' | 'side') => {
  const cameraRef = useRef<THREE.Camera | null>(null)
  
  useEffect(() => {
    if (viewMode === 'perspective') {
      // Create PerspectiveCamera
      cameraRef.current = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
      cameraRef.current.position.set(10, 10, 10)
      cameraRef.current.lookAt(0, 0, 0)
    } else if (viewMode === 'top') {
      // Create OrthographicCamera looking down Y axis
      cameraRef.current = new THREE.OrthographicCamera(...)
      cameraRef.current.position.set(0, 20, 0)
      cameraRef.current.lookAt(0, 0, 0)
      cameraRef.current.up.set(0, 0, -1) // Important for top view
    }
    // ... similar for front and side
  }, [viewMode, aspect])
  
  return { camera: cameraRef.current }
}
```

**`useViewportControl.ts`** (Simplified version)
```typescript
export const useViewportControl = (
  camera: THREE.Camera | null,
  domElement: HTMLElement | null,
  viewMode: 'perspective' | 'top' | 'front' | 'side'
) => {
  const controlsRef = useRef<OrbitControls | null>(null)
  
  useEffect(() => {
    if (!camera || !domElement) return
    
    const controls = new OrbitControls(camera, domElement)
    
    if (viewMode !== 'perspective') {
      // Lock rotation for orthographic views
      controls.enableRotate = false
      controls.mouseButtons = {
        RIGHT: THREE.MOUSE.PAN, // Right-click to pan
      }
    } else {
      // Full control for perspective
      controls.enableRotate = true
      controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }
    }
    
    controlsRef.current = controls
    return () => controls.dispose()
  }, [camera, domElement, viewMode])
  
  return { controls: controlsRef.current }
}
```

**`useControlPointScene.ts`** (Update for dual modes)
- Add `editMode` parameter
- Show control points only in Edit mode
- Show tracks and paths in Preview mode

#### 1.3 Update Types

```typescript
export type ViewMode = 'perspective' | 'top' | 'front' | 'side'
export type EditMode = 'preview' | 'edit'

export interface UnifiedEditorProps {
  animation: Animation
  selectedTracks?: Track[]
  multiTrackMode?: MultiTrackMode
  onControlPointsChange?: (points: THREE.Vector3[]) => void
  onSelectionChange?: (indices: number[]) => void
  initialSettings?: EditorSettings
  readOnly?: boolean
  initialViewMode?: ViewMode
  initialEditMode?: EditMode
}

export interface EditorSettings {
  // Existing settings
  transformMode: 'translate' | 'rotate'
  showGrid: boolean
  snapSize: number
  showCurve: boolean
  curveResolution: number
  showDirectionIndicators: boolean
  // New settings
  viewMode: ViewMode
  editMode: EditMode
  highlightPrimaryTrack: boolean
}
```

---

### Phase 2: Preview Mode Implementation (Week 1-2)

#### 2.1 Track Rendering

**Create `TrackRenderer.ts`** utility
```typescript
export const renderTracks = (
  scene: THREE.Scene,
  tracks: Track[],
  primaryTrackId?: string
) => {
  tracks.forEach(track => {
    const geometry = new THREE.SphereGeometry(0.2, 16, 16)
    const material = new THREE.MeshPhongMaterial({
      color: track.id === primaryTrackId ? 0x00ff00 : 0x0088ff
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(track.position.x, track.position.y, track.position.z)
    scene.add(mesh)
  })
}
```

#### 2.2 Multi-Track Path Visualization

**Update `AnimationPathRenderer.ts`** utility
```typescript
export const renderAnimationPaths = (
  scene: THREE.Scene,
  animation: Animation,
  tracks: Track[],
  multiTrackMode: MultiTrackMode,
  primaryTrackId?: string
) => {
  switch (multiTrackMode) {
    case 'identical':
      // Render one path, all tracks follow it (cyan)
      renderSinglePath(scene, animation, 0x00ffff)
      break
    case 'position-relative':
      // Render one path per track (different colors)
      tracks.forEach((track, index) => {
        const color = track.id === primaryTrackId ? 0x00ff00 : getTrackColor(index)
        renderTrackPath(scene, animation, track, color)
      })
      break
    case 'phase-offset':
    case 'phase-offset-relative':
      // Gradient by phase offset
      renderPhaseOffsetPaths(scene, animation, tracks, primaryTrackId)
      break
    case 'formation':
      // Show formation structure
      renderFormationPaths(scene, animation, tracks, primaryTrackId)
      break
    case 'centered':
      // Show radial pattern from center
      renderCenteredPaths(scene, animation, tracks, centerPoint, primaryTrackId)
      break
  }
}
```

#### 2.3 Path Highlighting

- Primary selected track path: Bright green, thicker line (width: 4)
- Other selected tracks: Normal color, standard width (width: 2)
- Direction indicators only on highlighted path

---

### Phase 3: Edit Mode Implementation (Week 2)

#### 3.1 Control Point Editing

- Show control points of the highlighted animation path
- Show path curve
- Optionally show primary selected track position
- Full gizmo functionality (translate only, remove rotation)
- All existing CRUD operations (add/delete/duplicate)

#### 3.2 Gizmo Simplification

**Remove rotation gizmo** (as per user request - rotation doesn't make sense for control points)

Update `useTransformControls.ts`:
```typescript
export const useTransformControls = ({
  scene,
  camera,
  domElement,
  snapSize,
  onTransformStart,
  onTransform,
  onTransformEnd,
}: UseTransformControlsProps) => {
  // ... initialization ...
  
  useEffect(() => {
    if (!scene || !camera || !domElement) return
    
    const controls = new TransformControls(camera, domElement)
    controls.setMode('translate') // ALWAYS translate, never rotate
    controls.setSize(1)
    controls.setSpace('world')
    
    // ... rest of setup ...
  }, [scene, camera, domElement])
  
  // Remove mode switching functionality
}
```

Update toolbar: Remove rotate button, keep only translate

#### 3.3 Keyboard Shortcuts Update

Remove rotation-related shortcuts:
- ❌ Remove: `R` key for rotate mode
- ✅ Keep: `G` key for translate (or just make it default, no toggle needed)
- ✅ Keep: `F` for frame selection
- ✅ Keep: `Home` for frame all
- ✅ Keep: `Shift+A` for add point
- ✅ Keep: `Ctrl+D` for duplicate
- ✅ Keep: `Delete` for remove
- ✅ Add: `Tab` to toggle Preview/Edit mode
- ✅ Add: `1`-`4` keys to switch views (1=Perspective, 2=Top, 3=Front, 4=Side)

---

### Phase 4: Integration with AnimationEditor (Week 2-3)

#### 4.1 Replace Existing Components

Current AnimationEditor uses:
- `<AnimationPreview3D />` (lines 12, 764, 804)
- `<ControlPointEditor />` (lines 13, 764, 812)

New approach - Replace both with:
```tsx
<UnifiedThreeJsEditor
  animation={currentAnimation}
  selectedTracks={selectedTrackObjects}
  multiTrackMode={multiTrackMode}
  onControlPointsChange={handleControlPointsChange}
  initialSettings={{
    viewMode: 'perspective',
    editMode: previewMode ? 'preview' : 'edit',
    showGrid: true,
    snapSize: 0.5,
  }}
  readOnly={false}
/>
```

#### 4.2 State Synchronization

Connect to AnimationEditor state:
- `previewMode` from AnimationEditorStoreV2
- `multiTrackMode` from AnimationEditorStoreV2
- `selectedTracks` from ProjectStore
- `animationForm.parameters` for control points

#### 4.3 UI Integration

**Option A: Single Pane (Recommended)**
```tsx
{isFormPanelOpen ? (
  <div className="flex flex-1 flex-col lg:flex-row gap-6">
    {/* Single unified editor */}
    <div className="flex-1">
      <UnifiedThreeJsEditor ... />
    </div>
    
    {/* Settings panel on the right */}
    <AnimationSettingsPanel ... />
  </div>
) : (
  <div className="flex-1">
    <UnifiedThreeJsEditor ... />
  </div>
)}
```

**Option B: Dual Pane with Mode Toggle**
Keep existing preview/control pane structure but both use UnifiedThreeJsEditor:
```tsx
<div className="flex-1 grid gap-6 lg:grid-cols-2">
  <div className="preview-pane">
    <UnifiedThreeJsEditor editMode="preview" ... />
  </div>
  <div className="control-pane">
    <UnifiedThreeJsEditor editMode="edit" ... />
  </div>
</div>
```

**Recommendation**: Option A - Single pane is cleaner and matches the "one view at a time" philosophy

#### 4.4 activeWorkPane Simplification

Update AnimationEditorStoreV2:
```typescript
// OLD
activeWorkPane: 'preview' | 'control'

// NEW (if keeping dual mode in editor)
// Can be removed if using single pane
activeWorkPane: 'unified'
```

---

### Phase 5: Testing & Validation (Week 3)

#### 5.1 Functional Testing

**View Switching**
- [ ] Perspective view renders correctly
- [ ] Top view renders correctly (XZ plane)
- [ ] Front view renders correctly (XY plane)
- [ ] Side view renders correctly (YZ plane)
- [ ] Camera position and controls correct for each view
- [ ] Keyboard shortcuts (1-4) switch views
- [ ] View state persists during mode switching

**Edit Mode Switching**
- [ ] Preview mode shows tracks and paths
- [ ] Edit mode shows control points
- [ ] Tab key toggles modes
- [ ] Mode state persists during view switching
- [ ] Gizmo only visible in Edit mode

**Control Point Editing**
- [ ] Can select control points in all views
- [ ] Gizmo works in all views (perspective, top, front, side)
- [ ] Translation smooth and accurate
- [ ] Snap to grid works
- [ ] Add/delete/duplicate work
- [ ] Keyboard shortcuts work
- [ ] Frame selection/all works in all views

**Preview Mode**
- [ ] All selected tracks render
- [ ] Primary track highlighted
- [ ] Path rendering correct for each multi-track mode
- [ ] Direction indicators on highlighted path
- [ ] No control points visible
- [ ] No gizmo visible
- [ ] Read-only (no accidental edits)

#### 5.2 Multi-Track Mode Testing

Test each mode in Preview mode:
- [ ] Identical: Single path, all tracks cyan
- [ ] Position-relative: Multiple paths, color-coded
- [ ] Phase-offset: Gradient paths
- [ ] Phase-offset-relative: Multiple gradient paths
- [ ] Formation: Formation visualization
- [ ] Centered: Radial pattern from center

#### 5.3 Integration Testing

- [ ] AnimationEditor loads editor correctly
- [ ] State synchronization works (control points → parameters)
- [ ] Save animation includes updated control points
- [ ] Load animation displays correct control points
- [ ] Multi-track settings affect preview correctly
- [ ] Animation playback works (if integrated)
- [ ] Settings panel interactions work

#### 5.4 Performance Testing

- [ ] 60fps with 50+ control points in edit mode
- [ ] Smooth view switching (<100ms)
- [ ] Smooth mode switching (<100ms)
- [ ] No memory leaks during extended use
- [ ] Gizmo interaction smooth (no lag)

---

## File Structure

### New Files
```
src/components/animation-editor/components/threejs-editor/
├── UnifiedThreeJsEditor.tsx          [NEW - Main component]
├── SingleViewRenderer.tsx            [NEW - Replaces MultiViewRenderer]
├── ViewModeSelector.tsx              [NEW - UI component]
├── EditModeSelector.tsx              [NEW - UI component]
├── utils/
│   ├── TrackRenderer.ts              [NEW - Track visualization]
│   ├── AnimationPathRenderer.ts      [NEW - Path visualization]
│   └── CameraConfigs.ts              [NEW - Camera presets]
└── hooks/
    ├── useCamera.ts                  [NEW - Replaces useMultiViewCameras]
    ├── useViewportControl.ts         [REFACTOR - Simplified]
    ├── useControlPointScene.ts       [UPDATE - Add dual modes]
    ├── useTransformControls.ts       [UPDATE - Remove rotation]
    └── useControlPointSelection.ts   [UPDATE - Single view]
```

### Files to Deprecate (Keep for reference, mark as deprecated)
```
src/components/animation-editor/components/threejs-editor/
├── ThreeJsControlPointEditor.tsx     [DEPRECATED]
├── MultiViewRenderer.tsx             [DEPRECATED]
└── hooks/
    ├── useMultiViewCameras.ts        [DEPRECATED]
    └── useViewportControls.ts        [DEPRECATED]
```

### Files to Update
```
src/components/animation-editor/
├── AnimationEditor.tsx               [UPDATE - Use UnifiedThreeJsEditor]
└── components/
    └── 3d-preview/
        └── AnimationPreview3D.tsx    [OPTIONAL - Can keep for other uses]
```

---

## Migration Checklist

### Pre-Migration
- [x] Review documentation (MIGRATION, GIZMO_PROGRESS, TESTING)
- [x] Create migration plan
- [ ] Backup current implementation
- [ ] Create feature branch

### Development
- [ ] Phase 1: Core architecture (Week 1)
  - [ ] Create UnifiedThreeJsEditor component
  - [ ] Create SingleViewRenderer component
  - [ ] Create ViewModeSelector component
  - [ ] Create EditModeSelector component
  - [ ] Refactor useCamera hook
  - [ ] Refactor useViewportControl hook
  - [ ] Update useControlPointScene for dual modes
  - [ ] Update types
- [ ] Phase 2: Preview mode (Week 1-2)
  - [ ] Implement TrackRenderer utility
  - [ ] Implement AnimationPathRenderer utility
  - [ ] Implement multi-track path visualization
  - [ ] Implement path highlighting
  - [ ] Test preview mode
- [ ] Phase 3: Edit mode (Week 2)
  - [ ] Update control point editing
  - [ ] Simplify gizmo (translation only)
  - [ ] Update keyboard shortcuts
  - [ ] Test edit mode
- [ ] Phase 4: Integration (Week 2-3)
  - [ ] Replace AnimationPreview3D and ControlPointEditor
  - [ ] Connect to AnimationEditor state
  - [ ] Update UI layout
  - [ ] Test integration
- [ ] Phase 5: Testing (Week 3)
  - [ ] Functional testing
  - [ ] Multi-track mode testing
  - [ ] Integration testing
  - [ ] Performance testing

### Post-Migration
- [ ] Update documentation
- [ ] Update test routes
- [ ] Mark old components as deprecated
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Remove deprecated files (after 2 weeks)

---

## Risk Mitigation

### Risk: Regression in Existing Features
**Mitigation**:
- Keep old components as fallback
- Feature flag for gradual rollout
- Comprehensive testing before full replacement

### Risk: Performance Issues
**Mitigation**:
- Profile early and often
- Optimize render loops
- Use React.memo for expensive components
- Implement view frustum culling

### Risk: User Confusion
**Mitigation**:
- Clear UI labels and icons
- Tooltips on all buttons
- Keyboard shortcut hints
- In-app help/tutorial

### Risk: Breaking Animation Data
**Mitigation**:
- No changes to data format
- Same control point structure
- Backward compatible
- Test with existing animations

---

## Success Criteria

✅ **Functional**
- Gizmo works in all views
- View switching seamless
- Mode switching seamless
- All control point operations work
- Multi-track preview accurate

✅ **Performance**
- 60fps maintained
- <100ms view/mode switching
- Smooth gizmo interaction
- No memory leaks

✅ **Quality**
- Clean, maintainable code
- Comprehensive tests
- Good documentation
- Positive user feedback

✅ **Integration**
- Fully integrated in AnimationEditor
- Replaces old preview + control editor
- State synchronization working
- No breaking changes

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| 1. Core Architecture | 4-5 days | Working single-view renderer with view switching |
| 2. Preview Mode | 3-4 days | Multi-track path visualization |
| 3. Edit Mode | 2-3 days | Control point editing with gizmo |
| 4. Integration | 3-4 days | Full AnimationEditor integration |
| 5. Testing | 2-3 days | Validated and polished |
| **Total** | **2-3 weeks** | **Production ready** |

---

## Next Steps

1. ✅ **Review this plan**
2. **Get approval** for the approach
3. **Create feature branch** `feature/single-view-editor`
4. **Start Phase 1** - Core architecture refactor
5. **Daily progress updates** in THREEJS_EDITOR_GIZMO_PROGRESS.md
6. **Demo at end of Phase 2** for feedback

---

## Questions for Stakeholders

1. ✅ **Single pane in AnimationEditor** (Option A) or keep dual pane with mode toggle (Option B)?
   - **Recommendation**: Option A (cleaner, simpler)

2. ✅ **Remove rotation gizmo completely** or keep for future features?
   - **Confirmed**: Remove rotation (doesn't make sense for control points)

3. **Keyboard shortcuts** - Are `Tab` and `1-4` keys acceptable?
   - Tab: Toggle Preview/Edit
   - 1-4: Switch views

4. **Default view** - Should it be Perspective or Top view?
   - **Recommendation**: Perspective (most versatile)

5. **Default mode** - Should it be Preview or Edit?
   - **Recommendation**: Preview (safer, shows context)

---

**Document Version**: 1.0  
**Date**: 2024-11-09  
**Author**: Development Team  
**Status**: Ready for Approval

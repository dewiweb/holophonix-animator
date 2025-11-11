# Three.js Editor Gizmo Implementation Progress

**Date:** November 8, 2024  
**Status:** 🟡 In Progress - Core functionality implemented, interaction refinement needed

## 🎯 Objective

Implement a fully functional 3D control point editor with transform gizmos for the Holophonix Animator, allowing visual manipulation of animation control points in a multi-viewport 3D environment.

---

## ✅ Completed Features

### 1. **Multi-Viewport Layout** ✅
- **2x2 viewport grid:**
  - Top-left: Perspective view (3D camera)
  - Top-right: Front view (XY plane)
  - Bottom-left: Top view (XZ plane)
  - Bottom-right: Side view (YZ plane)
- Each viewport has independent camera controls
- Reset view button for each viewport
- Dynamic border highlighting for active viewport

### 2. **Camera Controls System** ✅
- **Perspective View:**
  - Alt + Drag = Rotate camera
  - Ctrl + Drag = Pan camera
  - Mouse Wheel = Zoom
- **Orthographic Views:**
  - Right-click + Drag = Pan
  - Mouse Wheel = Zoom
  - Left-click reserved for gizmo interaction
- Screen-space panning enabled for proper pan behavior
- OrbitControls properly disabled when not needed

### 3. **Control Point Selection** ✅
- Click any control point in any viewport to select
- Selected points turn yellow
- Hover effects on control points (outline appears)
- Selection works across all viewports
- Click empty space to deselect

### 4. **Transform Gizmo System** ✅ (Mostly Working)
- **TransformControls initialized and attached to scene**
- **Gizmo visibility:**
  - Hidden when no point selected ✅
  - Shows at selected point position ✅
  - Hides when point deselected ✅
- **World-space orientation** (consistent across views) ✅
- **Mode switching:**
  - Press G = Translate mode
  - Press R = Rotate mode
- **Gizmo size:** 1.0 (standard size)
- **Click detection:** Prevents deselection when clicking gizmo ✅

### 5. **Event System Optimization** ✅
- Event listeners stabilized to prevent re-registration
- TransformControls callbacks use refs to avoid recreation
- Passive event listeners for performance
- Proper cleanup on unmount

### 6. **UI Enhancements** ✅
- Compact controls legend (minimal height)
- Reset view buttons per viewport
- Active viewport highlighting
- Keyboard shortcuts (G, R, F, Delete, etc.)

---

## ⚠️ Known Issues

### 1. **Gizmo Hover/Interaction Not Working** 🔴
**Problem:**
- Gizmo arrows/planes don't highlight on hover
- Dragging gizmo doesn't move control points
- Event detection works (raycasting detects clicks)
- TransformControls initialized correctly

**Investigation Completed:**
- ✅ TransformControls properly initialized with perspective camera
- ✅ DomElement correctly passed (canvas)
- ✅ TransformControls added to scene
- ✅ Gizmo enabled (`enabled = true`)
- ✅ Pointer events reaching canvas
- ✅ Event listeners stabilized (no re-registration)
- ✅ Gizmo visibility toggled correctly
- ✅ Gizmo attached to mesh at correct position

**Likely Cause:**
TransformControls internal event handling may not be receiving or processing pointer events properly. Possible causes:
1. Event listener order/priority issues
2. TransformControls pointer event handlers not binding correctly
3. Canvas pointer-events CSS property
4. Three.js version compatibility issue with TransformControls from three-stdlib

**Next Steps:**
1. Check if TransformControls' internal `_pointerHover` and `_pointerDown` methods are firing
2. Verify three-stdlib TransformControls version compatibility
3. Try using TransformControls from 'three/examples/jsm/controls/TransformControls' instead
4. Add explicit pointer event listeners to debug event flow
5. Check if camera needs to be updated differently for TransformControls

### 2. **Gizmo Only Works in Perspective View** ℹ️
**Expected Behavior:**
TransformControls uses a single camera (perspective), so interaction only works in that viewport. This is standard for 3D editors.

**Workaround:**
- Select points in any view
- Switch to perspective view to manipulate with gizmo
- View changes in orthographic views for precise alignment

---

## 📁 Files Modified

### Core Editor Components:
1. **`ThreeJsControlPointEditor.tsx`**
   - Main editor component
   - Canvas state management (`canvasElement` state)
   - TransformControls initialization
   - Event listener setup (stabilized)
   - Gizmo attach/detach on selection

2. **`useTransformControls.ts`** (NEW)
   - TransformControls lifecycle management
   - Event listeners using refs (stable callbacks)
   - Attach/detach functionality
   - Mode and snap size management
   - Visibility control

3. **`useViewportControls.ts`**
   - OrbitControls for each viewport
   - Modifier key handling (Alt, Ctrl)
   - Mouse button detection
   - Active viewport tracking
   - Reset view functionality
   - Right-click pan in orthographic views

4. **`useControlPointSelection.ts`**
   - Raycasting-based selection
   - Viewport detection
   - Refs for stable callbacks
   - Hover effects

5. **`MultiViewRenderer.tsx`**
   - Viewport rendering
   - Reset buttons
   - Dynamic border highlighting
   - Updated control hints

6. **`ThreeJsEditorDemo.tsx`**
   - Compact controls legend

### Supporting Files:
- **`types.ts`** - TypeScript interfaces for TransformControls
- **`useControlPointScene.ts`** - Scene and control point management
- **`useMultiViewCameras.ts`** - Camera setup and management

---

## 🔑 Key Technical Decisions

### 1. Canvas Element State Management
**Problem:** TransformControls initialized before canvas ready
**Solution:** Added `canvasElement` state that updates when canvas available, triggering TransformControls initialization

```typescript
const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null)

const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
  canvasRef.current = canvas
  setCanvasElement(canvas) // Triggers TransformControls init
}, [])
```

### 2. Callback Stability with Refs
**Problem:** TransformControls recreated on every render due to callback changes
**Solution:** Store callbacks in refs, only depend on core scene/camera/domElement

```typescript
const onTransformStartRef = useRef(onTransformStart)
const onTransformRef = useRef(onTransform)
const onTransformEndRef = useRef(onTransformEnd)

// Update refs when callbacks change
useEffect(() => {
  onTransformStartRef.current = onTransformStart
  // ...
}, [onTransformStart, onTransform, onTransformEnd])

// Use refs in event listeners
controls.addEventListener('change', () => {
  onTransformRef.current?.(/* ... */)
})
```

### 3. Event Listener Stabilization
**Problem:** Event listeners re-registered on every render, interfering with TransformControls
**Solution:** Minimal dependencies, setup once when TransformControls ready

```typescript
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas || !transformControls) return
  
  // Setup listeners...
  
  return () => {
    // Cleanup...
  }
}, [transformControls, activeCamera]) // Only these core deps
```

### 4. Gizmo Visibility Management
**Problem:** Gizmo visible at origin when no selection
**Solution:** Hide by default, show only when attached

```typescript
// Initially hidden
controls.visible = false

// Show when attaching
transformControlsRef.current.attach(object)
transformControlsRef.current.visible = true

// Hide when detaching
transformControlsRef.current.detach()
transformControlsRef.current.visible = false
```

---

## 🧪 Testing Checklist

- [x] Multi-viewport rendering works
- [x] Camera controls work independently per viewport
- [x] Control points selectable in all viewports
- [x] Selection state syncs across viewports
- [x] Gizmo appears when point selected
- [x] Gizmo hides when point deselected
- [x] Gizmo positioned at selected point (not origin)
- [x] Clicking gizmo doesn't deselect point
- [x] Reset view buttons work
- [x] Active viewport highlighting works
- [x] Keyboard shortcuts work (G, R, F, Delete)
- [ ] **Gizmo arrows highlight on hover** ❌
- [ ] **Gizmo dragging moves control points** ❌
- [ ] Mode switching updates gizmo appearance
- [ ] Snap to grid works (when enabled)

---

## 📊 Progress Summary

| Category | Status | Progress |
|----------|--------|----------|
| Multi-viewport System | ✅ Complete | 100% |
| Camera Controls | ✅ Complete | 100% |
| Point Selection | ✅ Complete | 100% |
| Gizmo Initialization | ✅ Complete | 100% |
| Gizmo Visibility | ✅ Complete | 100% |
| Gizmo Positioning | ✅ Complete | 100% |
| **Gizmo Interaction** | 🔴 **Blocked** | **20%** |
| Event System | ✅ Complete | 100% |
| UI/UX | ✅ Complete | 100% |

**Overall Progress: ~85%**

---

## 🚀 Next Session TODO

1. **Debug TransformControls Pointer Events:**
   - Add logging to TransformControls internal methods
   - Verify pointer event propagation
   - Test with different Three.js TransformControls implementations
   - Check CSS pointer-events on canvas

2. **Alternative Approaches if Current Blocked:**
   - Try TransformControls from 'three/examples/jsm/controls/TransformControls'
   - Create custom gizmo using Three.js primitives
   - Use OrbitControls' event system as reference

3. **Final Polish:**
   - Add visual feedback for drag start/end
   - Implement undo/redo for transformations
   - Add numeric input for precise positioning
   - Add gizmo size control in settings

---

## 🎓 Lessons Learned

1. **React + Three.js Integration:**
   - Use refs for callbacks to avoid dependency hell
   - State triggers for external resource initialization (canvas)
   - Minimal useEffect dependencies for stability

2. **Event Management:**
   - Order matters - TransformControls needs events first
   - Passive listeners for performance
   - Proper cleanup prevents memory leaks

3. **Three.js Best Practices:**
   - World-space gizmos for consistent behavior
   - Single TransformControls per editor
   - Camera reference must be stable

---

## 📚 Resources

- [Three.js TransformControls Documentation](https://threejs.org/docs/#examples/en/controls/TransformControls)
- [three-stdlib on npm](https://www.npmjs.com/package/three-stdlib)
- [OrbitControls API](https://threejs.org/docs/#examples/en/controls/OrbitControls)

---

## 💡 Architecture Insights

The editor follows a clean separation of concerns:
- **Scene Management:** `useControlPointScene`
- **Camera System:** `useMultiViewCameras`
- **Viewport Controls:** `useViewportControls`
- **Selection System:** `useControlPointSelection`
- **Transform System:** `useTransformControls`
- **Rendering:** `MultiViewRenderer`
- **Main Orchestration:** `ThreeJsControlPointEditor`

Each system can be tested and debugged independently!

---

**End of Progress Report**

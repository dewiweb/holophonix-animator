# Three.js Control Point Editor

A modern 3D control point editor for animation curves, featuring **single-view rendering with mode switching** and industry-standard editing tools.

## Status: Phase 1 Complete ✅ - Unified Editor Live!

The new **UnifiedThreeJsEditor** is now the primary editor, replacing the old quad-view approach. See the migration plan in `docs/SINGLE_VIEW_EDITOR_MIGRATION_PLAN.md`.

**Test it now**: Navigate to `/editor-test` in your browser!

### What's New?
- ✨ **Single-view with view switching** (Perspective, Top, Front, Side)
- ✨ **Preview/Edit mode separation** (Green/Orange indicators)
- ✨ **Gizmo works in ALL views** (not just perspective!)
- ✨ **Keyboard shortcuts** (1-4 for views, Tab for modes)
- ✨ **Simpler, cleaner architecture**

### Old Quad-View (Deprecated)
The old `ThreeJsControlPointEditor` (quad-view) is deprecated and will be removed. All functionality has been migrated to the new unified editor.

## Features Implemented

### ✅ Multi-View Rendering
- 4 simultaneous viewports (Top, Front, Side, Perspective)
- 2x2 grid layout
- Independent cameras per view
- Viewport labels and borders

### ✅ Control Point Visualization
- 3D spheres for control points
- Color coding:
  - 🟢 Green: Start point
  - 🔵 Blue: Regular points
  - 🟡 Yellow: Selected point
- Selection outlines
- Always render on top (no occlusion)

### ✅ Curve Visualization
- Smooth Catmull-Rom curve through points
- Color gradient (green→red showing direction)
- Real-time updates

### ✅ Selection System
- Click to select control points
- Raycasting-based picking
- Works in all viewports
- Visual feedback (color + outline)
- Hover cursor changes

### ✅ View Controls
- Frame All (Home key)
- Frame Selection (F key)
- Automatic camera adjustment
- Resize handling

### ✅ Transform Controls (Phase 2)
- Interactive gizmos for dragging points
- Translate and Rotate modes
- Snap to grid support
- Real-time curve updates during drag
- Works with perspective camera

### ✅ CRUD Operations (Phase 2)
- Add point (Shift+A or toolbar button)
- Duplicate point (Ctrl+D)
- Delete point (Delete key)
- Insert point after selected
- Maintains curve smoothness

### ✅ Keyboard Shortcuts
- `G` - Switch to Translate mode
- `R` - Switch to Rotate mode  
- `F` - Frame selected / Frame all
- `Home` - Frame all points
- `Delete` - Delete selected point
- `Shift+A` - Add new point
- `Ctrl+D` - Duplicate selected point

### ✅ Editor UI
- Toolbar with mode buttons
- Add point button (green)
- Grid toggle
- Snap size input
- Stats display
- Status bar

## Architecture

### New Unified Editor (Active)
```
threejs-editor/
├── UnifiedThreeJsEditor.tsx         [Main component - single view]
├── SingleViewRenderer.tsx           [Simple renderer]
├── ViewModeSelector.tsx             [View switching UI]
├── EditModeSelector.tsx             [Mode switching UI]
├── UnifiedEditorDemo.tsx            [Demo component]
├── types.ts                         [TypeScript definitions]
├── index.ts                         [Public exports]
├── hooks/
│   ├── useCamera.ts                 [Single camera management]
│   ├── useSingleViewportControl.ts  [OrbitControls]
│   ├── useControlPointScene.ts      [Scene & point management]
│   ├── useControlPointSelection.ts  [Selection logic]
│   └── useTransformControls.ts      [Gizmo controls]
└── utils/
    └── CameraConfigs.ts             [Camera presets]
```

### Old Quad-View (Deprecated)
```
threejs-editor/
├── ThreeJsControlPointEditor.tsx    [DEPRECATED - use UnifiedThreeJsEditor]
├── MultiViewRenderer.tsx            [DEPRECATED - use SingleViewRenderer]
├── ThreeJsEditorDemo.tsx            [DEPRECATED - use UnifiedEditorDemo]
└── hooks/
    ├── useMultiViewCameras.ts       [DEPRECATED - use useCamera]
    └── useViewportControls.ts       [DEPRECATED - use useSingleViewportControl]
```

## Usage

### Basic Example (New Unified Editor)

```typescript
import { UnifiedThreeJsEditor } from './components/threejs-editor'
import * as THREE from 'three'

// Sample animation data
const animation = {
  id: 'my-animation',
  name: 'My Animation',
  type: 'bezier',
  parameters: {
    controlPoints: [
      new THREE.Vector3(-3, 0, -3),
      new THREE.Vector3(0, 2, 0),
      new THREE.Vector3(3, 0, 3),
    ]
  },
  coordinateSystem: { type: 'xyz' }
}

function MyComponent() {
  const handleChange = (points: THREE.Vector3[]) => {
    console.log('Updated points:', points)
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <UnifiedThreeJsEditor
        animation={animation}
        selectedTracks={[]}
        multiTrackMode="identical"
        onControlPointsChange={handleChange}
        onSelectionChange={(indices) => console.log('Selected:', indices)}
        initialSettings={{
          viewMode: 'perspective',
          editMode: 'edit',
          showGrid: true,
          snapSize: 0.5,
        }}
      />
    </div>
  )
}
```

### Demo Component

To see the editor in action:

```typescript
import { UnifiedEditorDemo } from './components/threejs-editor'

function App() {
  return <UnifiedEditorDemo />
}
```

Or navigate to `/editor-test` in your browser!

## Props

### `ThreeJsControlPointEditorProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `animation` | `any \| null` | No | Animation with control points |
| `onControlPointsChange` | `(points: Vector3[]) => void` | No | Callback when points change |
| `onSelectionChange` | `(indices: number[]) => void` | No | Callback when selection changes |
| `initialSettings` | `Partial<EditorSettings>` | No | Initial editor configuration |
| `readOnly` | `boolean` | No | Disable editing (default: false) |

### `EditorSettings`

```typescript
{
  transformMode: 'translate' | 'rotate' | 'scale'
  showGrid: boolean
  snapSize: number        // 0 = disabled
  showCurve: boolean
  curveResolution: number // segments
  showDirectionIndicators: boolean
}
```

## Keyboard Shortcuts (Unified Editor)

| Key | Action |
|-----|--------|
| `1` | Perspective view |
| `2` | Top view (XZ plane) |
| `3` | Front view (XY plane) |
| `4` | Side view (YZ plane) |
| `Tab` | Toggle Preview/Edit mode |
| `Home` | Reset camera |
| `Shift+A` | Add new point (edit mode) |
| `Ctrl+D` / `Cmd+D` | Duplicate selected point (edit mode) |
| `Delete` / `Backspace` | Delete selected point (edit mode) |
| `F` | Frame selection (coming soon) |
| `Click` | Select control point (edit mode) |
| `Drag gizmo` | Move selected point (works in ALL views!) |

## Dependencies

- `three` - ^0.159.0
- `three-stdlib` - Latest (for TransformControls)
- `react` - ^18.2.0
- `lucide-react` - ^0.303.0 (for icons)

## What's Next

### ✅ Phase 2 Progress
- [x] TransformControls integration (drag to move)
- [x] Add point operations (Shift+A)
- [x] Duplicate point (Ctrl+D)
- [x] Delete with gizmo detach

### 🔜 Phase 2 Remaining
- [ ] Context menu (right-click)
- [ ] Numerical position input (X/Y/Z fields)
- [ ] Direction indicators on curve
- [ ] Per-viewport camera controls (pan, zoom)
- [ ] Insert point between two points
- [ ] Align to axis tools

### 📋 Phase 3 & Beyond
- [ ] Undo/redo system
- [ ] Data migration from 2D format
- [ ] Integration with AnimationEditor
- [ ] Replace PlaneEditor
- [ ] Performance optimization

## Performance

Current benchmarks (Phase 1):
- ✅ 50+ control points at 60fps
- ✅ 4 viewports rendering simultaneously
- ✅ Real-time curve updates
- ✅ Smooth selection and interaction

Target for Phase 4:
- 200+ control points at 60fps
- <16ms render time for all viewports
- Memory usage <100MB

## Testing

### Manual Testing
1. Run the demo: Import and use `ThreeJsEditorDemo`
2. Click control points to select them
3. Use keyboard shortcuts to test modes
4. Try Frame All and Frame Selection
5. Delete points (keep at least 2)

### Automated Testing (TODO)
```bash
npm run test:unit
```

## Migration from PlaneEditor

This editor will eventually replace the existing 2D `PlaneEditor`. See the full migration plan:

📄 `docs/THREEJS_CONTROL_POINT_EDITOR_MIGRATION.md`

Key differences:
- ✨ Unified 3D editing instead of 3 separate 2D planes
- ✨ Industry-standard gizmo controls (like Blender/Maya)
- ✨ Better visual consistency with preview
- ✨ ~40% less code to maintain

## Contributing

When adding features:
1. Follow existing hook patterns
2. Add TypeScript types to `types.ts`
3. Update this README
4. Add keyboard shortcuts to toolbar tooltips
5. Test in all 4 viewports

## License

Same as parent project

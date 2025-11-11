# Unified Three.js Editor - Quick Start Guide

**5-Minute Getting Started Guide**

---

## What Is It?

A single-view 3D editor that replaces the quad-view approach. Key features:
- ✅ **One view at a time** (no viewport conflicts)
- ✅ **4 camera views**: Perspective, Top, Front, Side
- ✅ **2 display modes**: Preview (tracks/paths) and Edit (control points)
- ✅ **Gizmo works in ALL views** (not just perspective)
- ✅ **Keyboard shortcuts** for everything

---

## Quick Start

### 1. Test the Editor

```bash
npm run dev
```

Navigate to: `http://localhost:5173/unified-editor-test`

### 2. Switch Views

Press number keys or click buttons:
- `1` = Perspective (3D view)
- `2` = Top view (XZ plane)
- `3` = Front view (XY plane)
- `4` = Side view (YZ plane)

### 3. Switch Modes

Press `Tab` or click mode button:
- **Preview Mode** (Green) = View tracks and animation paths
- **Edit Mode** (Orange) = Edit control points with gizmo

### 4. Edit Control Points

In Edit Mode:
- **Click** a point to select it (turns yellow)
- **Drag gizmo arrows** to move the point
- **Shift+A** to add a new point
- **Ctrl+D** to duplicate selected point
- **Delete** to remove selected point

### 5. Camera Controls

**Perspective View:**
- Alt + Drag = Rotate
- Ctrl + Drag or Right-click = Pan
- Scroll = Zoom

**Orthographic Views (Top/Front/Side):**
- Right-click + Drag = Pan
- Scroll = Zoom
- (Rotation is locked to keep plane view)

---

## Keyboard Shortcuts Cheatsheet

| Key | Action |
|-----|--------|
| `1` | Perspective view |
| `2` | Top view (XZ) |
| `3` | Front view (XY) |
| `4` | Side view (YZ) |
| `Tab` | Toggle Preview/Edit mode |
| `Home` | Reset camera |
| `Shift+A` | Add control point (edit mode) |
| `Ctrl+D` | Duplicate point (edit mode) |
| `Delete` | Remove point (edit mode) |
| `F` | Frame selection (coming soon) |

---

## Integration Example

Replace your existing preview/editor components:

```tsx
import { UnifiedThreeJsEditor } from '@/components/animation-editor/components/threejs-editor/UnifiedThreeJsEditor'

// In your AnimationEditor component:
<UnifiedThreeJsEditor
  animation={currentAnimation}
  selectedTracks={selectedTracks}
  multiTrackMode={multiTrackMode}
  onControlPointsChange={(points) => {
    // Update your animation parameters
    updateAnimationForm({ 
      parameters: { ...params, controlPoints: points } 
    })
  }}
  initialSettings={{
    viewMode: 'perspective',
    editMode: 'edit',
    showGrid: true,
    snapSize: 0.5,
  }}
/>
```

---

## Visual Guide

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Toolbar                                              │
│ [Preview|Edit] [Persp|Top|Front|Side] [Tools...]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│             3D View (Canvas)                        │
│                                                      │
│  [Control points or tracks based on mode]          │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Status: Mode | View | Stats                         │
└─────────────────────────────────────────────────────┘
```

### Mode Indicators

- **🟢 Green** = Preview Mode (safe, read-only)
- **🟠 Orange** = Edit Mode (active editing)

### View Labels

- **Perspective** = Full 3D (Box icon)
- **Top** = Bird's eye XZ plane (Grid icon)
- **Front** = XY plane (Square icon)
- **Side** = YZ plane (Eye icon)

---

## Common Tasks

### Task: View Animation Path from Different Angles

1. Ensure you're in **Preview Mode** (green)
2. Press `1` for perspective overview
3. Press `2` for top-down view
4. Press `3` for front elevation
5. Press `4` for side profile

### Task: Edit a Specific Control Point

1. Switch to **Edit Mode** (press `Tab`, turns orange)
2. Choose best view angle (1-4 keys)
3. Click the control point to select it
4. Drag gizmo arrows to adjust position
5. Switch views if needed (gizmo follows!)

### Task: Add Control Points

1. Be in **Edit Mode**
2. Select a point near where you want to insert
3. Press `Shift+A` to add after selected point
4. Or use the **+** button in toolbar

### Task: Fine-Tune Position in Plane View

1. Edit Mode
2. Press `2` for Top view (XZ plane)
3. Select point
4. Drag gizmo in 2D plane
5. Switch to `3` (Front) or `4` (Side) for other axes

### Task: Reset Everything

1. Press `Home` to reset camera
2. Or click **🔄 Reset View** button

---

## Troubleshooting

### Gizmo Not Visible
- Make sure you're in **Edit Mode** (orange indicator)
- Select a control point by clicking it
- Check that the point turned yellow (selected)

### Can't Rotate in Top/Front/Side View
- **This is intentional!** Orthographic views are locked to remain as plane views
- Use Perspective view (`1` key) if you need rotation
- Right-click to pan instead

### Control Points Not Showing
- Make sure you're in **Edit Mode** (press `Tab`)
- In Preview Mode, only tracks and paths are shown

### Camera Feels Wrong
- Press `Home` to reset to default position
- Or click **🔄 Reset View** button
- Try switching to a different view mode

---

## Tips & Tricks

1. **Use keyboard shortcuts** - Much faster than clicking
2. **Start in Perspective** - Get oriented, then switch to planes for precision
3. **Use plane views for alignment** - Top/Front/Side lock axes for precise positioning
4. **Tab frequently** - Switch between Preview and Edit to see results
5. **Number keys are your friend** - Fast view switching is key to efficient editing

---

## Next Steps

Once comfortable with basic usage:

1. **Test with different animation types** (bezier, catmull-rom, etc.)
2. **Try multi-track editing** (Phase 2 feature)
3. **Experiment with snap-to-grid** (adjust in toolbar)
4. **Learn advanced shortcuts** (coming in Phase 3)

---

## Getting Help

- **Documentation**: See `UNIFIED_EDITOR_IMPLEMENTATION_SUMMARY.md`
- **Migration Plan**: See `SINGLE_VIEW_EDITOR_MIGRATION_PLAN.md`
- **Progress**: See `UNIFIED_EDITOR_PROGRESS.md`
- **Testing**: See `THREEJS_EDITOR_TESTING_GUIDE.md`

---

## Known Limitations (Phase 1)

- ✅ Edit mode fully functional
- ⏳ Preview mode (tracks/paths) not yet implemented (Phase 2)
- ⏳ Frame selection (F key) not yet implemented (Phase 3)
- ⏳ Multi-track visualization coming in Phase 2

---

**Version**: 1.0 (Phase 1 Complete)  
**Last Updated**: November 9, 2024  
**Status**: Ready for testing and feedback

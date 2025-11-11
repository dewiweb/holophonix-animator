# Three.js Control Point Editor - Testing Guide

## 🚀 Quick Start

### Method 1: Test Route (Easiest)

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the test page**:
   ```
   http://localhost:5173/editor-test
   ```

3. **You should see**:
   - 4 viewports (Top, Front, Side, Perspective)
   - 4 control points with a curve through them
   - Toolbar with controls
   - Instructions panel below

---

## 🧪 What to Test

### ✅ Basic Interaction

1. **Selection**
   - Click any control point in any viewport
   - Point should turn yellow
   - Gizmo should appear (translate arrows by default)
   - Status bar should show "Selected: Point X"

2. **Deselection**
   - Click empty space
   - Point returns to blue (or green if first)
   - Gizmo disappears

### ✅ Transform Gizmos

1. **Translate Mode** (Default or press `G`)
   - Select a point
   - See 3 colored arrows (X=red, Y=green, Z=blue)
   - Drag an arrow → point moves along that axis
   - Drag plane handle → point moves in 2D plane
   - Curve updates in real-time

2. **Rotate Mode** (Press `R`)
   - Select a point
   - Gizmo changes to rotation circles
   - Drag a circle → point rotates
   - (Note: rotation doesn't affect curve, just for testing)

3. **Snap to Grid**
   - Set "Snap" to 0.5 in toolbar
   - Drag point → snaps to 0.5 grid increments
   - Set to 0 to disable snapping

### ✅ CRUD Operations

1. **Add Point** (Shift+A or green + button)
   - Press Shift+A
   - New point appears (near selected or at origin)
   - Curve updates to include new point
   - New point is inserted after selected

2. **Duplicate Point** (Ctrl+D / Cmd+D)
   - Select a point
   - Press Ctrl+D (or Cmd+D on Mac)
   - Duplicate appears with 0.5 offset
   - Inserted after original

3. **Delete Point** (Delete / Backspace)
   - Select a point
   - Press Delete or Backspace
   - Point removed
   - Gizmo detaches
   - Curve updates
   - ⚠️ Cannot delete if only 2 points remain

### ✅ View Controls

1. **Frame All** (Home key)
   - Press Home
   - All cameras adjust to show all points
   - Works in all viewports

2. **Frame Selection** (F key)
   - Select a point
   - Press F
   - Cameras zoom to selected point
   - If no selection, acts like Frame All

### ✅ Keyboard Shortcuts

Test all shortcuts:

| Key | Expected Result |
|-----|-----------------|
| `G` | Switch to Translate mode (arrows gizmo) |
| `R` | Switch to Rotate mode (circles gizmo) |
| `F` | Frame selection or all |
| `Home` | Frame all points |
| `Shift+A` | Add new point |
| `Ctrl+D` | Duplicate selected point |
| `Delete` | Delete selected point |

### ✅ Multi-Viewport Behavior

1. **Selection Works Everywhere**
   - Click point in Top view → selects
   - Click point in Front view → selects
   - Click point in Side view → selects
   - Click point in Perspective view → selects

2. **Gizmo Visible in Perspective**
   - Gizmo only shows in Perspective view
   - But selection works in all views
   - This is by design (gizmo uses perspective camera)

3. **Cursor Changes**
   - Hover over point → cursor becomes pointer
   - Hover empty space → default cursor

---

## 🎯 Expected Behaviors

### Curve Visualization
- **Color Gradient**: Green (start) → Red (end)
- **Smoothness**: Catmull-Rom interpolation
- **Updates**: Real-time during drag
- **Segments**: ~200 for smooth appearance

### Control Points
- **Start Point**: Always green
- **Other Points**: Blue when unselected
- **Selected Point**: Yellow
- **Outline**: White outline on selected
- **Rendering**: Always on top (no occlusion)

### Performance
- **Target**: 60fps with 4 viewports
- **Smooth dragging**: No lag during gizmo drag
- **Instant updates**: Curve updates without delay

---

## 🐛 Common Issues & Solutions

### Issue: Gizmo doesn't appear
**Solution**: 
- Make sure you clicked a point (should turn yellow)
- Gizmo only shows in Perspective viewport
- Try pressing `G` to ensure translate mode

### Issue: Can't drag gizmo
**Solution**:
- Click and hold the arrow/plane handle
- Drag slowly at first
- Make sure you're in Perspective view

### Issue: Point jumps when adding
**Solution**:
- This is expected - new points use smart positioning
- Offset of 1 unit from selected point
- Or (0,0,0) if no selection

### Issue: Can't delete last 2 points
**Solution**:
- This is intentional (minimum 2 points for curve)
- Add more points first, then delete

### Issue: Snap not working
**Solution**:
- Check "Snap" value in toolbar is > 0
- Try setting to 0.5 or 1.0
- Snapping is subtle - watch coordinates

---

## 📊 Test Scenarios

### Scenario 1: Build a Path
1. Start with 4 default points
2. Add 3 more points (Shift+A × 3)
3. Select and move each to create a path
4. Use Frame All to see full path
5. Delete unnecessary points

**Expected**: Smooth workflow, curve updates

### Scenario 2: Precise Editing
1. Select a point
2. Enable snap (set to 0.5)
3. Drag to snap positions
4. Duplicate point (Ctrl+D)
5. Move duplicate to precise position

**Expected**: Points snap to grid, precise control

### Scenario 3: Rapid Operations
1. Quickly add 5 points (Shift+A spam)
2. Select each and duplicate (Ctrl+D)
3. Delete half of them
4. Frame All

**Expected**: No crashes, smooth operation

### Scenario 4: Multi-Select Workflow
1. Add points in different viewports
2. Switch between Top/Front/Side for selection
3. Use gizmo in Perspective
4. Frame selection from any view

**Expected**: Cross-viewport workflow seamless

---

## 🔍 Advanced Testing

### Browser Console Tests

Open browser console (F12) and try:

```javascript
// Check if demo is loaded
console.log('Demo component mounted')

// Monitor control point changes
// (Will log when you drag points)
```

### Performance Monitoring

1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Drag points around for 10 seconds
5. Stop recording
6. Check for:
   - FPS should be ~60
   - No long tasks (>50ms)
   - Smooth frame timeline

### Memory Check

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Use editor for 2 minutes (add/delete/drag)
4. Take another snapshot
5. Compare → should not grow significantly

---

## 📝 Testing Checklist

Copy this checklist for systematic testing:

### Core Functionality
- [ ] App loads at /editor-test
- [ ] 4 viewports visible
- [ ] 4 control points visible
- [ ] Curve visible
- [ ] Click selects point
- [ ] Gizmo appears on selection
- [ ] Drag gizmo moves point
- [ ] Curve updates during drag

### Keyboard Shortcuts
- [ ] G switches to translate
- [ ] R switches to rotate
- [ ] F frames view
- [ ] Home frames all
- [ ] Shift+A adds point
- [ ] Ctrl+D duplicates
- [ ] Delete removes point

### CRUD Operations
- [ ] Can add points
- [ ] Can duplicate points
- [ ] Can delete points (min 2)
- [ ] Points insert intelligently
- [ ] Curve stays smooth

### UI/UX
- [ ] Toolbar buttons work
- [ ] Snap input works
- [ ] Grid toggle works
- [ ] Stats display correct
- [ ] Cursor changes on hover
- [ ] Instructions clear

### Performance
- [ ] No lag during drag
- [ ] 60fps maintained
- [ ] No memory leaks
- [ ] Responsive resize

### Edge Cases
- [ ] Works with 2 points (minimum)
- [ ] Works with 20+ points
- [ ] Rapid add/delete stable
- [ ] Snap 0 disables correctly

---

## 🎥 Video Testing (Recommended)

Record a short video showing:

1. Loading the editor
2. Selecting and dragging a point
3. Adding new points
4. Duplicating a point
5. Deleting a point
6. Using keyboard shortcuts
7. Framing views

This helps identify UX issues and provides documentation.

---

## 💡 Tips for Best Testing Experience

1. **Use a mouse**: Trackpad works but mouse is better for gizmo dragging
2. **Full screen**: More space = easier testing
3. **Try all viewports**: Don't just use Perspective
4. **Test keyboard shortcuts**: Much faster than clicking
5. **Check console**: Watch for errors or warnings
6. **Test edge cases**: Min points, max points, rapid operations

---

## 🚀 Next Steps After Testing

Once you've tested and confirmed everything works:

1. **Report Issues**: Note any bugs or UX problems
2. **Suggest Improvements**: What would make it better?
3. **Integration**: Ready to integrate with AnimationEditor?
4. **Phase 3**: Continue with context menu and advanced features?

---

## 📞 Need Help?

If something doesn't work:

1. Check browser console for errors
2. Verify you're on the test route: `/editor-test`
3. Try refreshing the page
4. Check that build completed successfully
5. Review this guide for expected behavior

---

**Happy Testing! 🎉**

The editor should be fully interactive and fun to use. Enjoy experimenting with 3D control point editing!

# Unified Editor Testing Checklist

**Quick validation checklist for the new unified Three.js editor**

---

## 🚀 Getting Started

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/editor-test`
3. You should see a single 3D view with a toolbar

---

## ✅ Basic Checks

### Scene Loads
- [ ] Scene renders correctly
- [ ] 4 control points visible (3D spheres)
- [ ] Curve visible through the points (green to red gradient)
- [ ] Grid visible on the ground
- [ ] No console errors

### UI Elements
- [ ] Toolbar at top with buttons
- [ ] "Preview" and "Edit" mode buttons (Edit is orange/active by default)
- [ ] View mode buttons: Perspective, Top, Front, Side
- [ ] Status bar at bottom showing mode and view
- [ ] Quick reference guide at bottom

---

## 🎨 Mode Switching

### Edit Mode (Orange)
- [ ] Press Tab or click "Edit" button
- [ ] Button turns orange
- [ ] Toolbar shows edit controls (grid, snap, add button)
- [ ] Control points visible
- [ ] Status shows "Edit" in orange

### Preview Mode (Green)
- [ ] Press Tab or click "Preview" button
- [ ] Button turns green
- [ ] Toolbar hides edit controls
- [ ] Status shows "Preview" in green
- [ ] (Note: track visualization coming in Phase 2)

### Toggle Test
- [ ] Press Tab repeatedly - should toggle smoothly
- [ ] No lag or flicker
- [ ] Mode indicator updates immediately

---

## 📹 View Switching

### Press Number Keys
- [ ] Press `1` → Perspective view (3D camera at angle)
- [ ] Press `2` → Top view (looking down, XZ plane)
- [ ] Press `3` → Front view (looking at front, XY plane)
- [ ] Press `4` → Side view (looking from side, YZ plane)

### View Characteristics
**Perspective (1)**:
- [ ] Can see depth (3D)
- [ ] Label says "3D Perspective"
- [ ] Control hint: "Alt+🖱️ Rotate | Ctrl+🖱️ Pan | Wheel Zoom"

**Top (2)**:
- [ ] Looking straight down
- [ ] Grid aligned with XZ plane
- [ ] Label says "Top View (XZ)"
- [ ] Control hint: "Right-click Pan | Wheel Zoom"

**Front (3)**:
- [ ] Looking at front face
- [ ] Grid aligned with XY plane
- [ ] Label says "Front View (XY)"
- [ ] Control hint: "Right-click Pan | Wheel Zoom"

**Side (4)**:
- [ ] Looking from the side
- [ ] Grid aligned with YZ plane
- [ ] Label says "Side View (YZ)"
- [ ] Control hint: "Right-click Pan | Wheel Zoom"

---

## 🎯 Control Point Selection (Edit Mode)

### Select Point
- [ ] Click a control point
- [ ] Point turns yellow (selected)
- [ ] White outline appears around point
- [ ] Gizmo appears at point location
- [ ] Status bar shows "Selected: Point X"

### Deselect
- [ ] Click empty space
- [ ] Point returns to original color (blue or green for first)
- [ ] Gizmo disappears
- [ ] Status clears selection info

### Selection Across Views
- [ ] Select point in Perspective view
- [ ] Switch to Top view - point still selected
- [ ] Switch to Front view - point still selected
- [ ] Selection state persists across view changes

---

## 🎮 Transform Gizmo (THE KEY TEST!)

### In Perspective View
- [ ] Select a point
- [ ] See 3 colored arrows (X=red, Y=green, Z=blue)
- [ ] Hover arrow - arrow highlights
- [ ] Drag red arrow - point moves along X axis
- [ ] Drag green arrow - point moves along Y axis
- [ ] Drag blue arrow - point moves along Z axis
- [ ] Curve updates in real-time during drag

### In Top View ⭐ CRITICAL
- [ ] Switch to Top view (press `2`)
- [ ] Point still selected with gizmo
- [ ] **Gizmo is visible and interactive**
- [ ] Drag arrows - point moves
- [ ] **This works! (impossible in quad-view)**

### In Front View ⭐ CRITICAL
- [ ] Switch to Front view (press `3`)
- [ ] **Gizmo still works**
- [ ] Can move point with gizmo
- [ ] Curve updates correctly

### In Side View ⭐ CRITICAL
- [ ] Switch to Side view (press `4`)
- [ ] **Gizmo still works**
- [ ] Can move point with gizmo
- [ ] Curve updates correctly

**🎉 If gizmo works in all 4 views, this is SUCCESS! This was the main goal!**

---

## 📐 Camera Controls

### Perspective View
- [ ] Alt + Drag → Rotates camera around scene
- [ ] Ctrl + Drag → Pans camera
- [ ] Right-click + Drag → Also pans camera
- [ ] Scroll wheel → Zooms in/out
- [ ] Smooth damping (camera eases to rest)

### Orthographic Views (Top/Front/Side)
- [ ] Right-click + Drag → Pans camera
- [ ] Scroll wheel → Zooms in/out
- [ ] **Rotation is locked** (cannot rotate - this is intentional!)
- [ ] View stays as true plane projection

### Reset Camera
- [ ] Press `Home` key → Camera resets to default
- [ ] Or click "🔄 Reset View" button
- [ ] Camera smoothly returns to starting position

---

## ⌨️ Keyboard Shortcuts

### View Switching
- [ ] `1` → Perspective
- [ ] `2` → Top
- [ ] `3` → Front
- [ ] `4` → Side
- [ ] Switching is instant

### Mode Switching
- [ ] `Tab` → Toggles Preview/Edit
- [ ] Repeated presses toggle back and forth

### Edit Operations (Edit Mode Only)
- [ ] `Shift+A` → Adds new control point
- [ ] `Ctrl+D` → Duplicates selected point (with 0.5 offset)
- [ ] `Delete` → Removes selected point (min 2 points enforced)
- [ ] `Home` → Resets camera

### Try This Sequence
1. Select point
2. Press `Ctrl+D` → Duplicate appears
3. Press `2` → Switch to Top view
4. Drag gizmo → Move duplicate
5. Press `Shift+A` → Add another point
6. Press `1` → Back to Perspective
7. Press `Home` → Reset view

---

## 🎛️ Toolbar Controls (Edit Mode)

### Grid Toggle
- [ ] Click grid checkbox → Grid disappears
- [ ] Click again → Grid reappears

### Snap to Grid
- [ ] Set snap value to 0.5
- [ ] Select and drag point
- [ ] Point snaps to 0.5 increments
- [ ] Set to 0 → Snapping disabled

### Add Point Button
- [ ] Click green "+" button
- [ ] New point appears
- [ ] If point selected, inserts after it
- [ ] If no selection, adds to end

### Stats Display
- [ ] Shows point count
- [ ] Shows selected point number when selected
- [ ] Updates in real-time

---

## 🐛 Edge Cases

### Minimum Points
- [ ] Delete points until only 2 remain
- [ ] Try to delete one more
- [ ] Should be prevented (curve needs min 2 points)

### Rapid View Switching
- [ ] Press 1-2-3-4-1-2-3-4 rapidly
- [ ] Should handle gracefully
- [ ] No lag or errors

### Rapid Mode Switching
- [ ] Press Tab repeatedly (10+ times)
- [ ] Should toggle smoothly
- [ ] No lag or errors

### Gizmo While Switching Views
- [ ] Select point and start dragging gizmo
- [ ] While dragging, press `2` to switch views
- [ ] Should handle gracefully

---

## 🚨 Common Issues

### Gizmo Not Visible
✅ **Solution**: Make sure you're in Edit mode (orange indicator)
✅ **Solution**: Select a control point first

### Can't Rotate in Top/Front/Side View
✅ **Expected!** Orthographic views have rotation locked intentionally

### Control Points Not Showing
✅ **Solution**: Switch to Edit mode (press Tab)

### Camera Feels Wrong
✅ **Solution**: Press Home to reset camera

---

## ✨ Success Criteria

If all these pass, the unified editor is working perfectly:

### Core Functionality
- ✅ Scene renders correctly
- ✅ Control points visible
- ✅ Curve visible
- ✅ Selection works

### View System
- ✅ 4 view modes work
- ✅ View switching is smooth
- ✅ Camera controls appropriate for each view

### Mode System
- ✅ Preview/Edit toggle works
- ✅ Clear visual indicators

### Gizmo (Most Important!)
- ✅ **Gizmo works in Perspective**
- ✅ **Gizmo works in Top**
- ✅ **Gizmo works in Front**
- ✅ **Gizmo works in Side**
- ✅ **THIS IS THE WIN!**

### Keyboard Shortcuts
- ✅ All shortcuts respond
- ✅ No conflicts
- ✅ Smooth interaction

### Performance
- ✅ Smooth 60fps
- ✅ No lag during interaction
- ✅ Responsive UI

---

## 📊 Performance Check

Open browser DevTools (F12) → Performance tab:
- [ ] Record 10 seconds of interaction
- [ ] FPS should be ~60
- [ ] No long tasks (red bars)
- [ ] Smooth frame timeline

Open Console (F12):
- [ ] No errors during normal use
- [ ] No warnings (some debug logs OK)

---

## 🎓 User Experience

Ask yourself:
- [ ] Is it clear which mode I'm in? (color indicators)
- [ ] Is it clear which view I'm in? (labels)
- [ ] Can I figure out the controls? (tooltips help)
- [ ] Does the gizmo feel natural? (drag arrows to move)
- [ ] Are keyboard shortcuts helpful? (1-4, Tab)

---

## 📝 Report Format

If you find issues, report with:

```
Issue: [Brief description]
Steps to Reproduce:
1. ...
2. ...
Expected: [What should happen]
Actual: [What actually happened]
Browser: [Chrome/Firefox/etc + version]
Console Errors: [Any red errors]
```

---

## 🎉 Completion

✅ **If all checks pass**: The unified editor is working perfectly!

🚀 **Next step**: Proceed to Phase 2 (Preview mode with track visualization)

⚠️ **If issues found**: Document them and prioritize fixes

---

**Test Duration**: ~15-20 minutes for thorough check  
**Critical Test**: Gizmo working in all 4 views ⭐  
**Status Check**: Read `MIGRATION_COMPLETE.md` for current status

Happy testing! 🧪

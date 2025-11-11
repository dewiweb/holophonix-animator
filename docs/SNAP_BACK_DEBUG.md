# Control Point Snap-Back Debug Guide

**Date**: November 9, 2024  
**Status**: 🔍 **DEBUG MODE ACTIVE** - Console logging enabled

---

## Issues Fixed

### ✅ 1. Stable Animation ID
**Problem**: Animation ID was regenerated on every render (`Date.now()`)  
**Fix**: Created stable preview ID with `useRef`

**Code**:
```typescript
const previewIdRef = useRef<string>(`preview-${Date.now()}`)

// Animation ID now stable for same editing session
id: loadedAnimationId || previewIdRef.current
```

### ✅ 2. WebGL Texture Errors Fixed
**Problem**: Canvas textures causing "Texture is immutable" errors  
**Fix**: Proper texture cleanup and configuration

**Changes**:
- Added `texture.needsUpdate = true`
- Removed flipY for canvas textures
- Proper texture disposal in cleanup
- Store texture reference for later disposal

---

## Debug Console Logs Added

### When you drag the gizmo, you should see:

#### 1. Drag End Event
```
🔧 Gizmo drag ended: {
  animationId: "preview-123456" or actual ID,
  animationType: "linear",
  oldParams: { startPosition: {x:0,y:0,z:0}, ... },
  newParams: { startPosition: {x:5,y:2,z:1}, ... }
}
```

#### 2. Callback Reception
```
📝 AnimationEditor received update: {
  animationId: "preview-123456",
  parameters: { startPosition: {x:5,y:2,z:1}, ... },
  loadedAnimationId: null or actual ID
}
```

#### 3. Form Update
```
✅ Parameters updated in form
```

#### 4. (If saved animation) Store Update
```
✅ Animation updated in project store
```

#### 5. Control Point Reload Check
```
⏭️ Skipping control point reload (same animation): preview-123456-linear
```

**OR** (if reloading - this is the problem):
```
🔄 Reloading control points: {
  oldKey: "preview-123456-linear",
  newKey: "preview-123456-linear",  // Should be same!
  parameters: { ... }
}
```

---

## What To Check

### ✅ Expected Behavior (Good)
1. Drag gizmo
2. See "🔧 Gizmo drag ended"
3. See "📝 AnimationEditor received update"
4. See "✅ Parameters updated"
5. See "⏭️ Skipping control point reload"
6. **Point STAYS in new position** ✅

### ❌ Problem Behavior (Bad)
1. Drag gizmo
2. See "🔧 Gizmo drag ended"
3. See "📝 AnimationEditor received update"
4. See "✅ Parameters updated"
5. See "🔄 Reloading control points" ← **Problem!**
6. Point snaps back ❌

---

## Possible Causes If Still Snapping

### A. Animation ID changing
**Console shows**: Different `animationId` in logs  
**Cause**: `previewIdRef` being reset  
**Check**: Look for ID changing between drag end and reload

### B. Animation type changing
**Console shows**: Different `animationType` in logs  
**Cause**: Form type being reset somehow  
**Check**: Verify type stays same

### C. useEffect dependency issue
**Console shows**: "🔄 Reloading" when shouldn't  
**Cause**: React effect running when it shouldn't  
**Check**: Dependencies in useControlPointScene

### D. updateParameters not working
**Console shows**: "✅ Parameters updated" but old values still used  
**Cause**: Store update not propagating  
**Check**: Look at parameter values in logs

---

## Testing Steps

### Test 1: Basic Drag
1. Open app, go to Animation Editor
2. Create linear animation
3. Press Tab → Edit mode
4. Open browser console (F12)
5. Click control point (should turn yellow with gizmo)
6. **Drag gizmo arrow**
7. **Check console logs**
8. **Does point stay or snap back?**

### Test 2: Check Animation ID
From console logs when dragging:
```
🔧 Gizmo drag ended: { animationId: "???" }
📝 AnimationEditor received update: { animationId: "???" }
⏭️ Skipping control point reload: "???-linear"
```

**All three should show THE SAME animation ID!**

If IDs are different → Animation object is being recreated

### Test 3: Check Parameters
From console logs:
```
🔧 Gizmo drag ended: {
  newParams: { startPosition: {x:5, y:0, z:0} }  ← New value
}
📝 AnimationEditor received update: {
  parameters: { startPosition: {x:5, y:0, z:0} }  ← Should match
}
```

**New params should match received params!**

### Test 4: Check Reload Skip
After drag, console should show:
```
⏭️ Skipping control point reload (same animation): preview-123-linear
```

**NOT**:
```
🔄 Reloading control points: { oldKey: ..., newKey: ... }
```

If reloading → Something is triggering useEffect

---

## If Still Snapping After Fixes

### Share these console logs:
1. Complete sequence from drag to snap
2. All 🔧 📝 ✅ ⏭️ 🔄 messages
3. Any errors or warnings
4. Whether IDs match between logs

### Possible additional fixes needed:
1. Check if animationForm.type is changing
2. Check if loadedAnimationId is changing
3. Check Zustand store update timing
4. Check React re-render cycle
5. Verify memoization dependencies

---

## Quick Diagnosis

**Look at the console when you drag:**

| Console Shows | Problem | Solution |
|---------------|---------|----------|
| No 🔧 log | Gizmo not firing | Check TransformControls |
| No 📝 log | Callback not called | Check onAnimationChange prop |
| No ✅ log | updateParameters failing | Check store function |
| See 🔄 instead of ⏭️ | Reloading when shouldn't | Check animation ID stability |
| IDs don't match | Animation recreated | Fix memoization |
| Params don't match | Conversion error | Check coordinate conversion |

---

## Success Criteria

### When working correctly:
1. ✅ Drag gizmo
2. ✅ See all logs in sequence
3. ✅ Animation ID stays same
4. ✅ Parameters update correctly
5. ✅ Control points NOT reloaded
6. ✅ Point stays in new position
7. ✅ Form shows new values

---

## Files Modified

1. ✅ `AnimationEditor.tsx` - Stable preview ID + logging
2. ✅ `UnifiedThreeJsEditor.tsx` - Parameter update logging
3. ✅ `useControlPointScene.ts` - Reload skip logging
4. ✅ `useTrackVisualization.ts` - Texture cleanup fixes

---

**Next**: Test and share console logs if still snapping!

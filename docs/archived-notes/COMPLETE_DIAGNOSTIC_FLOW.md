# Complete Data Flow Diagnostic - Animation Form to Visualization

**Status**: 🔍 **DIAGNOSTIC MODE** - Full logging enabled

---

## Complete Data Flow

```
AnimationEditor Form
  ↓ (animationForm.parameters)
unifiedEditorAnimation object
  ↓ (animation prop)
UnifiedThreeJsEditor component
  ↓ (animation)
useControlPointScene hook
  ↓ (extractControlPointsFromAnimation)
Control points extracted
  ↓ (createControlPointMesh)
Meshes added to scene
  ↓ (renderer)
VISIBLE on screen
```

---

## What You Should See in Console (Step by Step)

### 1. Animation Object Creation
```
🎬 Animation object created for unified editor: {
  id: "preview-123...",
  type: "linear",
  parameters: {
    startPosition: {x: 0, y: 0, z: 0},
    endPosition: {x: 10, y: 0, z: 0}
  },
  hasStartPosition: true,
  hasEndPosition: true
}
```

**If you see**:
- ❌ No log → Animation object not created (check `USE_UNIFIED_EDITOR` flag)
- ❌ `hasStartPosition: false` → **Form doesn't have parameters!**
- ✅ `hasStartPosition: true` → Good, continue

---

### 2. Viewport Size Measurement
```
📐 Initial viewport size: {width: 800, height: 600}
```

**If you see**:
- ❌ `{width: 0, height: 0}` or negative → Container sizing issue
- ✅ Positive numbers → Good, renderer can initialize

---

### 3. Control Point Extraction
```
🔍 Extracting control points: {
  hasAnimation: true,
  type: "linear",
  hasParameters: true,
  parameters: {startPosition: {...}, endPosition: {...}}
}
```

**Then**:
```
✅ Extracted control points: {
  count: 2,
  points: [
    {x: "0.00", y: "0.00", z: "0.00"},
    {x: "10.00", y: "0.00", z: "0.00"}
  ]
}
```

**If you see**:
- ❌ `hasParameters: false` → **Animation object has no parameters!**
- ❌ `count: 0` → Extraction logic didn't find positions
- ✅ `count: 2` → Good, points extracted

---

### 4. Control Points Loaded
```
🔄 Reloading control points: {
  oldKey: null,
  newKey: "preview-123-linear",
  hasLoaded: false,
  parameters: {...}
}
✅ Control points loaded: 2
```

**If you see**:
- ❌ "⏭️ Skipping" on first load → hasLoadedRef bug
- ❌ "✅ No control points for this animation type" → No points extracted
- ✅ "✅ Control points loaded: 2" → Good, meshes created

---

### 5. Renderer Initialization
```
(No error about invalid size)
```

**If you see**:
- ❌ "⚠️ Invalid renderer size" → Viewport sizing problem
- ✅ No errors → Renderer initialized correctly

---

## Diagnostic Checklist

### ✅ Step 1: Check Animation Form Has Parameters

**Open console, type**:
```javascript
// Check what's in the form
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
```

**Or check the log**:
```
🎬 Animation object created: {
  parameters: {...}  ← Should have startPosition/endPosition
}
```

**Problem if**: `parameters: {}` (empty object)

**Solution**: Animation form isn't setting parameters. Check:
- Did you select animation type?
- Did you set start/end positions?
- Are form inputs working?

---

### ✅ Step 2: Check Extraction Finds Parameters

**Look for**:
```
🔍 Extracting control points: {
  type: "linear",
  parameters: {startPosition: {...}, endPosition: {...}}
}
```

**Problem if**: Parameters object is empty or missing positions

**Solution**: 
- Form → Animation object mapping is broken
- Check `unifiedEditorAnimation` memoization

---

### ✅ Step 3: Check Control Points Created

**Look for**:
```
✅ Control points loaded: 2
```

**Problem if**: Number is 0

**Solution**:
- Extraction returned empty array
- Check animation type matches case in switch statement
- Check parameter names match exactly

---

### ✅ Step 4: Check Renderer Has Valid Size

**Look for**:
```
📐 Initial viewport size: {width: >0, height: >0}
```

**Problem if**: Width/height are 0 or negative

**Solution**:
- Viewport ref not attached correctly
- Container hasn't measured yet
- CSS flexbox issue

---

## Quick Test Sequence

1. **Refresh browser**
2. **Open console** (F12)
3. **Create new animation**:
   - Type: Linear
   - Start: (0, 0, 0)
   - End: (10, 0, 0)
4. **Watch console logs in this order**:
   ```
   📐 Initial viewport size
   🎬 Animation object created
   🔍 Extracting control points
   ✅ Extracted control points: count: 2
   🔄 Reloading control points
   ✅ Control points loaded: 2
   ```

5. **If ANY step is missing**:
   - Note which step failed
   - That's where the problem is

---

## Common Problems & Solutions

### Problem: No Animation Object Created
**Log**: No 🎬 message

**Causes**:
- `USE_UNIFIED_EDITOR` = false
- `animationForm.type` is empty

**Fix**:
- Check feature flag is true
- Check animation type is selected

---

### Problem: Animation Object Has No Parameters
**Log**: `🎬 ... hasStartPosition: false`

**Causes**:
- Form doesn't have parameters set
- User didn't input positions
- Form state not initialized

**Fix**:
- Check form UI - are inputs visible?
- Check if values are entered
- Check form state initialization

---

### Problem: Extraction Returns 0 Points
**Log**: `✅ Extracted control points: count: 0`

**Causes**:
- Parameters exist but wrong names
- Animation type doesn't match switch case
- Positions are undefined/null

**Fix**:
- Log `params` object - check field names
- Verify animation type spelling
- Check coordinate conversion

---

### Problem: Points Load But Not Visible
**Log**: `✅ Control points loaded: 2` but nothing on screen

**Causes**:
- Renderer size invalid (0x0 or negative)
- Camera not initialized
- Scene not rendering
- Points outside camera view

**Fix**:
- Check viewport size log
- Check for WebGL errors
- Verify camera setup
- Check point positions (too far from origin?)

---

## Expected Full Console Output

```
📐 Initial viewport size: {width: 800, height: 600}
🎬 Animation object created for unified editor: {
  id: "preview-1762...",
  type: "linear",
  parameters: {startPosition: {...}, endPosition: {...}},
  hasStartPosition: true,
  hasEndPosition: true
}
🔍 Extracting control points: {
  hasAnimation: true,
  type: "linear",
  hasParameters: true,
  parameters: {startPosition: {...}, endPosition: {...}}
}
✅ Extracted control points: {
  count: 2,
  points: [{x:"0.00",y:"0.00",z:"0.00"}, {x:"10.00",y:"0.00",z:"0.00"}]
}
🔄 Reloading control points: {
  oldKey: null,
  newKey: "preview-1762...-linear",
  hasLoaded: false
}
✅ Control points loaded: 2
```

**Then on screen**: See 2 spheres and a line!

---

## If Still Not Visible After All Logs Look Good

**Possible causes**:
1. **Camera looking wrong direction**
   - Points at (0,0,0) and (10,0,0)
   - Camera should see XY plane

2. **Scene not rendering**
   - Check for WebGL context errors
   - Check animation frame loop

3. **Points too small to see**
   - Sphere radius is 0.2 units
   - Camera zoom might be wrong

4. **Colors blending with background**
   - Points are green/blue
   - Background is dark gray
   - Should be visible

---

## Test This Immediately

1. **Refresh browser**
2. **Console open**
3. **Create linear animation with positions**
4. **Share COMPLETE console output**
   - Every log message
   - In order
   - Include any errors

**This will show exactly where the data flow breaks!**

---

**Status**: Diagnostic logging active  
**Next**: Run test and share ALL console output

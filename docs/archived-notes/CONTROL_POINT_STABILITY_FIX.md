# ✅ Control Point Stability Fix

**Date:** November 10, 2025 - 8:59am UTC+01:00  
**Issue:** Control points were constantly resetting during animation playback
**Status:** 🎉 **FIXED**

---

## 🐛 The Problem

**Symptom:**
```
🎬 Animation object created for unified editor: 
{id: 'preview-1762761065429', type: 'linear', ...}

[This log appears every frame during animation playback]
```

**Root Cause:**
The `unifiedEditorAnimation` useMemo was recreating constantly because:

1. **`selectedTrackObjects` in dependency array**
   - Track objects contain `position` property
   - During animation playback, `position` updates every frame
   - New array reference → useMemo recalculates → control points reset

2. **Using animated positions for barycenter**
   - `track.position` changes during playback
   - Barycenter recalculates every frame
   - Control points jump around

---

## ✅ The Fix

### **1. Use Track IDs Instead of Objects**

**Before (Unstable):**
```typescript
}, [
  animationForm.type,
  // ... other deps
  selectedTrackObjects  // ❌ Changes every frame during animation!
])
```

**After (Stable):**
```typescript
}, [
  animationForm.type,
  // ... other deps
  selectedTrackIds.join(',')  // ✅ Only changes when selection changes
])
```

**Why this works:**
- `selectedTrackIds` is just an array of strings: `['track1', 'track2']`
- String IDs don't change during animation
- `.join(',')` creates stable string: `'track1,track2'`
- useMemo only recalculates when IDs actually change

### **2. Use Initial Positions for Barycenter**

**Before (Unstable):**
```typescript
const center = {
  x: selectedTrackObjects.reduce((sum, t) => 
    sum + t.position.x, 0) / length  // ❌ position changes!
}
```

**After (Stable):**
```typescript
const center = {
  x: trackObjects.reduce((sum, t) => 
    sum + (t.initialPosition?.x ?? t.position.x), 0) / length  // ✅ Stable!
}
```

**Why this works:**
- `track.initialPosition` = position before animation started
- Doesn't change during playback
- Barycenter stays stable
- Control points don't jump

---

## 📊 Behavior Comparison

### **Before Fix:**

```
Frame 0: Animation created, control points at correct positions
Frame 1: Track position updates → animation recreated → control points reset
Frame 2: Track position updates → animation recreated → control points reset
...
[Control points constantly jumping/resetting]
```

### **After Fix:**

```
Frame 0: Animation created, control points at correct positions
Frame 1-60: Track positions update, but animation NOT recreated
Frame 61: User changes customCenter → animation recreated (correct!)
[Control points stable during playback]
```

---

## 🎯 When Animation SHOULD Recreate

**Correct triggers (now working):**
- ✅ Animation type changes (`linear` → `circular`)
- ✅ Duration changes
- ✅ Barycentric variant changes (`isobarycentric` → `centered`)
- ✅ User drags customCenter
- ✅ Parameters update (via form inputs)
- ✅ Active track changes (in relative mode)

**Incorrect triggers (now fixed):**
- ❌ Track positions update during animation playback
- ❌ Every render frame
- ❌ Constant recreation

---

## 🧪 Testing

### **Test 1: Animation Playback Stability**
```
1. Select tracks
2. Create circular animation
3. Play animation
4. Watch console
5. ✅ Should NOT log "Animation object created" every frame
6. ✅ Control points should stay stable during playback
```

### **Test 2: User Edits Still Work**
```
1. Create animation with control points
2. Drag a control point
3. ✅ Should update immediately
4. Drag barycentric center (if editable)
5. ✅ Should update control points
```

### **Test 3: Barycentric Center Stability**
```
1. Barycentric → Isobarycentric
2. Play animation (tracks move)
3. ✅ Barycenter marker should NOT move
4. ✅ Should stay at initial geometric center
```

---

## 💡 Design Principle

**Stable References for Animated Data:**

When data updates frequently (like track positions during animation), use:
- **IDs** instead of objects
- **Initial values** instead of current values  
- **String keys** instead of object references
- **Serialized state** instead of live references

**React useMemo Best Practice:**
```typescript
// ❌ BAD: Object with changing properties
}, [trackObject])  // position changes → recalc

// ✅ GOOD: Stable identifier
}, [trackObject.id])  // ID never changes

// ✅ ALSO GOOD: Serialized
}, [JSON.stringify(trackIds)])
```

---

## 📝 Summary

**Problem:** Animation recreated constantly during playback due to unstable dependencies

**Solution:** 
1. Use `selectedTrackIds.join(',')` instead of `selectedTrackObjects`
2. Use `track.initialPosition` instead of `track.position` for barycenter
3. Recalculate track objects inside useMemo (not in dependency)

**Result:** Control points remain stable during animation playback while still updating correctly when user makes edits.

**Performance Impact:** Significantly reduced - animation object now creates once per user action instead of 60 times per second during playback! 🚀

# Issue #2: Multiple Form and Playback Issues (IN PROGRESS)

**Date**: 2024-11-05  
**Status**: 🔧 Analyzing & Fixing  
**Severity**: High  

---

## 🐛 **Problems Reported**

### **1. Control Points Not Visible Initially**
- 3D preview shows correct path ✅
- Form values look correct ✅  
- But control points in control point editor planes **don't appear** until values are manually changed ❌

### **2. Track Returns to Origin Before Moving**
- When playing animation (if values weren't manually changed)
- Track goes to origin (0,0,0) first ❌
- Then starts moving along x-axis ❌
- Expected: Move from configured start position directly ✅

### **3. Form Resets After Animation Ends**
- Animation plays and finishes
- Animation Editor form **resets to default** ❌
- Loses the edited animation ❌
- Expected: Keep animation editable after playback ✅

---

## 🔍 **Root Causes Found**

### **Cause #1: Double setAnimationForm** ✅ FIXED

**File**: `src/components/animation-editor/hooks/useAnimationForm.ts:43-46`

```typescript
// OLD CODE (WRONG):
const handleAnimationTypeChange = (type: AnimationType) => {
  setAnimationForm(prev => ({ ...prev, type }))  // First update
  const defaultParams = getDefaultAnimationParameters(type, selectedTrack ?? null)
  setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))  // Second update
}
```

**Problem**:
- Two consecutive `setAnimationForm` calls
- React batches them, but timing issue can cause second call to see stale `prev`
- Parameters might not merge correctly with type
- **Result**: Parameters are set but form might not reflect them immediately

**Fix**:
```typescript
// NEW CODE (CORRECT):
const handleAnimationTypeChange = (type: AnimationType) => {
  const defaultParams = getDefaultAnimationParameters(type, selectedTrack ?? null)
  setAnimationForm(prev => ({ 
    ...prev, 
    type,
    parameters: defaultParams  // Set both in single update
  }))
}
```

---

### **Cause #2: Form Resets When currentAnimation Changes**

**File**: `src/components/animation-editor/hooks/useAnimationForm.ts:24-41`

```typescript
// Load existing animation when track is selected
useEffect(() => {
  if (currentAnimation) {
    setAnimationForm(currentAnimation)
    // ...
  } else {
    // ❌ RESETS FORM when currentAnimation becomes null!
    setAnimationForm({
      name: '',
      type: 'linear',
      duration: animationSettings.defaultAnimationDuration,
      loop: false,
      coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
      parameters: {}
    })
    // ...
  }
}, [selectedTrack?.id, currentAnimation, ...]) // ❌ currentAnimation in deps!
```

**Problem**:
- `currentAnimation` is derived from `track.animationState.animation.id`
- When animation finishes playing, animation store might clear track's animation state
- This causes `currentAnimation` to become `null`
- Which triggers useEffect
- Which resets the form to defaults
- **Result**: User loses their edited animation after playback!

**Root Issue**:
```typescript
// AnimationEditor.tsx:73
const trackAnimationId = selectedTrack?.animationState?.animation?.id
const currentAnimation = trackAnimationId ? animations.find(a => a.id === trackAnimationId) ?? null : null
```

When animation ends:
1. `stopAnimation()` is called
2. Track's `animationState` might be cleared or modified
3. `currentAnimation` becomes `null`
4. useEffect sees `currentAnimation` changed to `null`
5. Form resets 💥

---

### **Cause #3: Parameters Not Saved Properly**

**Related to Cause #1**

When type changes and parameters are set via double update, the form might display correct values but the actual state might be inconsistent. When saving, if the parameters haven't fully merged into the form state, wrong values get saved.

---

## ✅ **Fixes Applied**

### **Fix #1: Single State Update** ✅ DONE

**File**: `src/components/animation-editor/hooks/useAnimationForm.ts`

Changed `handleAnimationTypeChange` to update type and parameters in a single `setAnimationForm` call.

**Status**: ✅ Fixed in code, needs testing

---

### **Fix #2: Separate Form State from Playback State** 🔧 TODO

**Strategy**:

The form should maintain its own independent state. It should only reset when:
- User explicitly loads a different animation
- User explicitly creates new animation
- User changes track selection

It should **NOT** reset when:
- Animation finishes playing
- Track's animationState changes
- Playback stops

**Proposed Solution**:

```typescript
useEffect(() => {
  // Only reset form when:
  // 1. Track selection changes AND
  // 2. Either loading an animation OR explicitly creating new
  
  if (currentAnimation) {
    // Load existing animation
    setAnimationForm(currentAnimation)
    setKeyframes(currentAnimation.keyframes || [])
    setOriginalAnimationParams(currentAnimation.parameters)
  } else if (!animationForm.name) {
    // Only reset if form is empty (new session)
    // Don't reset if user is actively editing
    setAnimationForm({
      name: '',
      type: 'linear',
      duration: animationSettings.defaultAnimationDuration,
      loop: false,
      coordinateSystem: { type: currentProject?.coordinateSystem.type || 'xyz' },
      parameters: {}
    })
    setKeyframes([])
    setOriginalAnimationParams(null)
  }
  // Otherwise: preserve form state
}, [selectedTrack?.id]) // Remove currentAnimation from deps!
```

---

### **Fix #3: Control Points Editor Sync** 🔧 TODO

**Problem**: Control point editor components don't show initial values from form

**Likely Cause**: 
- Components read from `animationForm.parameters` 
- But parameters might be undefined or not spread correctly
- Need to ensure parameters are properly initialized and readable

**Need to check**:
- How control point editor components receive props
- If they have default values that override form values
- If they properly react to parameter changes

---

## 🧪 **Testing Plan**

### **Test 1: Parameter Persistence**
1. Select track
2. Choose Linear animation
3. **Don't change any values**
4. Save animation
5. Play animation
6. ✅ Expected: Track moves from startPosition to endPosition (from model defaults)
7. ❌ Currently: Track goes to origin then moves

### **Test 2: Form Persistence After Playback**
1. Select track
2. Choose Linear animation
3. Modify some parameters
4. Save animation
5. Play animation
6. Wait for animation to finish
7. ✅ Expected: Form still shows your edited animation
8. ❌ Currently: Form resets to default

### **Test 3: Control Points Visible**
1. Select track
2. Choose Linear or Bezier animation
3. ✅ Expected: Control points immediately visible in 3D preview and editors
4. ❌ Currently: Only appear after manually changing values

---

## 📊 **Status**

| Issue | Root Cause | Fix Status | Test Status |
|-------|------------|------------|-------------|
| Double setAnimationForm | Race condition | ✅ Fixed | ⏳ Pending |
| Form resets after playback | currentAnimation dependency | 🔧 In Progress | ⏳ Pending |
| Control points not visible | Unknown - needs investigation | 🔍 Investigating | ⏳ Pending |
| Track goes to origin | Parameters not saved | 🔧 Related to fix #1 | ⏳ Pending |

---

## 🚀 **Next Steps**

1. **Apply Fix #2**: Separate form state from playback state
2. **Investigate**: Control point editor initialization
3. **Test**: Build and verify all fixes work
4. **Document**: Final solution and verification

---

**Current Status**: 🔧 Fixes in progress - DO NOT TEST YET

Will update when ready for testing!

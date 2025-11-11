# Barycentric Center Position Visibility Fix

## Problem
The barycentric center position inputs were not showing in the animation settings panel when the variant was editable (custom, centered, shared) because `customCenter` was `undefined` by default.

## Root Cause
The UI panel had a condition:
```tsx
{(variant === 'custom' || variant === 'centered' || variant === 'shared') && customCenter && (
  // Panel content
)}
```

When `customCenter` was `undefined` (default state), the panel wouldn't render.

## Solution
**Two-part fix:**

### 1. **Remove the customCenter Condition from UI**
```tsx
{(variant === 'custom' || variant === 'centered' || variant === 'shared') && (
  // Panel always shows for editable variants
)}
```

### 2. **Handle Undefined in Inputs**
```tsx
<input
  type="number"
  value={(customCenter?.x ?? 0).toFixed(2)}
  onChange={(e) => {
    const newCenter = { 
      x: parseFloat(e.target.value) || 0,
      y: customCenter?.y ?? 0,
      z: customCenter?.z ?? 0
    }
    onCustomCenterChange?.(newCenter)
  }}
/>
```

### 3. **Auto-Initialize customCenter in Store**
```typescript
setBarycentricVariant: (variant) => {
  set((state) => {
    // Initialize customCenter if switching to a variant that uses it
    const needsCustomCenter = variant === 'shared' || variant === 'centered' || variant === 'custom'
    const updates: Partial<AnimationEditorState> = { barycentricVariant: variant }
    
    if (needsCustomCenter && !state.customCenter) {
      updates.customCenter = { x: 0, y: 0, z: 0 }
      console.log('🎯 Initialized customCenter to origin for variant:', variant)
    }
    
    return updates
  })
}
```

## Changes Made

### **File: `MultiTrackModeSelector.tsx`**

1. **Removed condition:**
   - OLD: `&& customCenter &&`
   - NEW: (condition removed)

2. **Added null-safe value access:**
   - `(customCenter?.x ?? 0).toFixed(2)`
   - `customCenter?.y ?? 0`
   - `customCenter?.z ?? 0`

3. **Create complete Position object:**
   - Always provides all three coordinates
   - Defaults to 0 if undefined

### **File: `animationEditorStoreV2.ts`**

1. **Enhanced `setBarycentricVariant`:**
   - Detects variants that need customCenter
   - Auto-initializes to `{x: 0, y: 0, z: 0}` if undefined
   - Logs initialization for debugging

## User Experience

### **Before:**
- Select "custom" variant → No position inputs visible ❌
- User has no way to set center position
- Must drag in 3D to initialize center

### **After:**
- Select "custom" variant → Position inputs immediately visible ✅
- Shows `0.00, 0.00, 0.00` by default
- User can type coordinates directly
- Alternatively can drag in 3D view
- Both methods work seamlessly

## Benefits

1. **Immediate Feedback:** Users see the position panel as soon as they select an editable variant
2. **Default Values:** Clear starting point at origin (0,0,0)
3. **Two-Way Editing:** Can edit via UI inputs OR 3D dragging
4. **Graceful Initialization:** Store automatically creates center when needed
5. **No Undefined Errors:** Inputs handle undefined gracefully

## Testing

1. ✅ Select "shared" variant → Position inputs visible at 0,0,0
2. ✅ Select "centered" variant → Position inputs visible
3. ✅ Select "custom" variant → Position inputs visible
4. ✅ Type in X value → Center updates
5. ✅ Drag in 3D view → Panel updates with new coordinates
6. ✅ Switch to "isobarycentric" → Shows read-only calculated center
7. ✅ Switch back to "custom" → Shows editable inputs again

## Technical Details

### Initialization Flow:
```
User selects "custom" variant
  ↓
setBarycentricVariant('custom') called
  ↓
Store checks: needsCustomCenter && !state.customCenter
  ↓
Initializes: customCenter = {x:0, y:0, z:0}
  ↓
UI renders with default values
  ↓
User can immediately edit
```

### Update Flow:
```
User types X = 10
  ↓
onChange creates: {x:10, y:0, z:0}
  ↓
onCustomCenterChange(newCenter) called
  ↓
Store updates customCenter
  ↓
3D view updates center marker position
  ↓
UI stays in sync
```

## Files Modified

1. `/src/components/animation-editor/components/controls/MultiTrackModeSelector.tsx`
   - Removed customCenter condition
   - Added null-safe operators
   - Ensured complete Position objects

2. `/src/stores/animationEditorStoreV2.ts`
   - Enhanced setBarycentricVariant
   - Auto-initialization logic
   - Console logging for debugging

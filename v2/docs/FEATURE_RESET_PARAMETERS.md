# Feature: Reset Parameters & Use Track Position

## Overview

Two new buttons in AnimationEditor allow you to:
1. **Reset to Defaults** - Reset all animation parameters to their default values
2. **Use Track Position** - Update animation center/start position to track's current initial position

## Location

**AnimationEditor** → Animation Parameters section → Top-right corner

```
┌─────────────────────────────────────────────────┐
│ Animation Parameters  [Use Track Position]      │
│                       [Reset to Defaults]       │
├─────────────────────────────────────────────────┤
│ Center Position                                 │
│ [X] [Y] [Z]                                     │
└─────────────────────────────────────────────────┘
```

---

## Feature 1: Reset to Defaults

### Purpose
Resets ALL animation parameters to their default values while using the track's **initialPosition** as the base.

### When to Use
- Animation parameters got messed up
- Want to start fresh with default settings
- After refreshing track position from Holophonix, reset animation to use new position

### How It Works

**For Each Animation Type:**

#### Linear
```typescript
startPosition = track.initialPosition
endPosition = track.initialPosition + (5, 0, 0)
```

#### Circular
```typescript
center = track.initialPosition
radius = 3
startAngle = 0
endAngle = 360
plane = 'xy'
```

#### Elliptical
```typescript
centerX/Y/Z = track.initialPosition
radiusX = 4
radiusY = 2
radiusZ = 0
startAngle = 0
endAngle = 360
```

#### Spiral
```typescript
center = track.initialPosition
startRadius = 1
endRadius = 5
rotations = 3
direction = 'clockwise'
plane = 'xy'
```

#### Random
```typescript
center = track.initialPosition
bounds = { x: 5, y: 5, z: 5 }
speed = 1
smoothness = 0.5
updateFrequency = 10
```

#### Custom
```typescript
interpolation = 'linear'
```

### Example Workflow

```
1. Track at (0, 0, 0)
2. Create circular animation with radius 5
3. Change parameters: center = (10, 10, 0), radius = 8
4. Click "Reset to Defaults"
5. ✅ Center back to (0, 0, 0), radius back to 3
```

---

## Feature 2: Use Track Position

### Purpose
Updates **only** the center/start position to match the track's current initial position, keeping all other parameters unchanged.

### When to Use
- Refreshed track position from Holophonix
- Want to re-center animation on track's current location
- Track moved but want to keep other parameters (radius, angles, etc.)

### How It Works

**Updates Only Position Fields:**

- **Linear:** Updates `startPosition`
- **Circular:** Updates `center`
- **Spiral:** Updates `center`
- **Random:** Updates `center`
- **Elliptical:** Updates `centerX`, `centerY`, `centerZ`
- **Custom:** No effect (uses keyframes)

**Preserves:**
- Radius, angles, speed, bounds, etc.
- All non-position parameters stay the same

### Example Workflow

```
1. Track at (0, 0, 0)
2. Create circular animation: center (0, 0, 0), radius 5, angle 0-360
3. Refresh position from Holophonix → track now at (10, 5, 2)
4. Click "Use Track Position"
5. ✅ Center updated to (10, 5, 2)
6. ✅ Radius still 5, angles still 0-360
```

---

## Integration with Position Refresh

### Complete Workflow

```
┌─────────────────────────────────────────────────┐
│ 1. Track position changed in Holophonix        │
│    Original: (0, 0, 0) → New: (10, 5, 2)       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Click Refresh Position in TrackList         │
│    Updates track.initialPosition to (10, 5, 2) │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Open AnimationEditor                         │
│    Choose one:                                  │
│                                                 │
│    A) Use Track Position                        │
│       → Updates center only to (10, 5, 2)      │
│       → Keeps radius, angles, etc.             │
│                                                 │
│    B) Reset to Defaults                         │
│       → Resets ALL parameters                   │
│       → Uses (10, 5, 2) as base                │
└─────────────────────────────────────────────────┘
```

---

## Comparison

| Feature | What It Updates | Other Parameters |
|---------|----------------|------------------|
| **Use Track Position** | Center/Start only | ✅ Preserved |
| **Reset to Defaults** | Everything | ❌ Reset to defaults |

### When to Use Which?

**Use Track Position:**
- You like your current animation settings
- Only want to move the animation to new track position
- After refreshing position from Holophonix

**Reset to Defaults:**
- Parameters are broken/corrupted
- Want to start completely fresh
- Testing default animation behavior

---

## Console Logging

### Use Track Position
```
📍 Using track position: { x: 10, y: 5, z: 2 }
✅ Updated center/start position to track position
```

### Reset to Defaults
```
🔄 Resetting animation parameters to defaults
✅ Reset to defaults with track position: { x: 10, y: 5, z: 2 }
```

---

## Button States

### Disabled States

**Use Track Position:**
- No track selected

**Reset to Defaults:**
- No animation type selected

### Visual Feedback

```css
/* Use Track Position - Blue */
text-blue-700 bg-blue-50 border-blue-300

/* Reset to Defaults - Gray */
text-gray-700 bg-gray-50 border-gray-300

/* Disabled */
opacity-50 cursor-not-allowed
```

---

## Code Implementation

### Handler: handleUseTrackPosition
```typescript
const handleUseTrackPosition = () => {
  // Get track's initialPosition (updated by refresh)
  const trackPosition = selectedTrack.initialPosition || selectedTrack.position
  
  // Update only position fields based on animation type
  switch (type) {
    case 'linear':
      updatedParams.startPosition = trackPosition
      break
    case 'circular':
    case 'spiral':
    case 'random':
      updatedParams.center = trackPosition
      break
    case 'elliptical':
      updatedParams.centerX = trackPosition.x
      updatedParams.centerY = trackPosition.y
      updatedParams.centerZ = trackPosition.z
      break
  }
}
```

### Handler: handleResetToDefaults
```typescript
const handleResetToDefaults = () => {
  // Get track position
  const trackPosition = selectedTrack?.initialPosition || 
                       selectedTrack?.position || 
                       { x: 0, y: 0, z: 0 }
  
  // Reset ALL parameters to defaults for animation type
  const defaultParams = getDefaultsForType(type, trackPosition)
  
  setAnimationForm(prev => ({ ...prev, parameters: defaultParams }))
}
```

---

## Testing Scenarios

### Test 1: Basic Reset
```
1. Create circular animation
2. Change center to (5, 5, 5), radius to 10
3. Click "Reset to Defaults"
4. ✅ Center = track.initialPosition, radius = 3
```

### Test 2: After Position Refresh
```
1. Track at (0, 0, 0), circular animation center (0, 0, 0)
2. Change position in Holophonix to (20, 0, 0)
3. Click Refresh Position in TrackList
4. Click "Use Track Position" in AnimationEditor
5. ✅ Center = (20, 0, 0), other params unchanged
```

### Test 3: Reset After Refresh
```
1. Track at (0, 0, 0), create animation
2. Refresh position → now (15, 10, 5)
3. Click "Reset to Defaults"
4. ✅ All defaults use (15, 10, 5) as base
```

### Test 4: No Track Selected
```
1. No track selected
2. "Use Track Position" button disabled
3. ✅ Cannot click
```

---

## Benefits

✅ Quick way to re-center animations after position changes  
✅ Easy recovery from parameter mistakes  
✅ Works seamlessly with position refresh feature  
✅ Intelligent: uses `initialPosition` (stable reference)  
✅ Two options: selective update or full reset  
✅ Visual feedback via button styles  
✅ Console logging for debugging  

---

## Future Enhancements

- Preset library (save/load parameter sets)
- Undo/redo for parameter changes
- Copy parameters from another animation
- Batch reset multiple animations
- Animation templates

---

**Date:** 2025-10-02  
**Status:** ✅ Implemented  
**Related:** FEATURE_REFRESH_POSITION.md, BUG_FIX_PAUSE_POSITION.md

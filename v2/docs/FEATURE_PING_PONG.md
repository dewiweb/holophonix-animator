# Feature: Ping-Pong Animation Mode

## Overview

Ping-pong mode creates a smooth back-and-forth animation that plays forward, then backward, creating a bouncing or oscillating effect. This is perfect for creating natural-looking motion patterns.

## What It Does

**Normal Loop:**
```
Start → End → [Jump back to Start] → End → [Jump back] → ...
```

**Ping-Pong Mode:**
```
Start → End → [Reverse] → Start → [Forward] → End → [Reverse] → ...
```

---

## Implementation

### Type Definition
Added to `Animation` interface:
```typescript
interface Animation {
  loop: boolean
  pingPong?: boolean    // Requires loop to be true
}
```

### Animation Engine State
Added direction tracking:
```typescript
interface AnimationEngineState {
  loopCount: number
  isReversed: boolean   // true when playing backward
}
```

### Time Calculation
Time moves forward or backward based on direction:
```typescript
const direction = state.isReversed ? -1 : 1
const newGlobalTime = state.globalTime + (timeIncrement * direction)
```

---

## How It Works

### Forward Phase
1. Animation plays from time 0 → duration
2. When reaching duration, if pingPong enabled:
   - Don't reset to 0
   - Set `isReversed = true`
   - Time now counts backward

### Reverse Phase
1. Time decreases from duration → 0
2. When reaching 0:
   - Set `isReversed = false`
   - Time counts forward again

### Loop Behavior

| Loop | Ping-Pong | Behavior |
|------|-----------|----------|
| ❌ Off | - | Play once, stop at end |
| ✅ On | ❌ Off | Restart from beginning each time |
| ✅ On | ✅ On | Play forward → backward → forward... |

---

## UI

### Toggle Location
AnimationEditor → Below Loop toggle

### Visual Design
- **Container:** Blue background (`bg-blue-50`) with blue border
- **Only visible when Loop is enabled**
- **Toggle switch:** Blue when active

### Layout
```
┌─────────────────────────────────────────────┐
│ Loop Animation                        [ON]  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ 🔷 Ping-Pong Mode                     [ON]  │
│    Play forward then backward               │
└─────────────────────────────────────────────┘
```

---

## Animation Types Support

### ✅ Fully Supported
- **Linear:** Smooth back and forth between start/end
- **Circular:** Oscillates around circle path
- **Elliptical:** Back and forth on ellipse
- **Spiral:** Expands then contracts
- **Custom:** Plays keyframes forward then backward

### ⚠️ Partial Support
- **Random:** Direction reversal doesn't make much visual sense (random is random)

---

## Example Use Cases

### 1. Pendulum Motion
```typescript
{
  type: 'circular',
  loop: true,
  pingPong: true,
  parameters: {
    center: { x: 0, y: 0, z: 0 },
    radius: 3,
    startAngle: -45,
    endAngle: 45,
    plane: 'xz'
  }
}
// Creates pendulum swinging back and forth
```

### 2. Breathing Effect
```typescript
{
  type: 'spiral',
  loop: true,
  pingPong: true,
  parameters: {
    center: { x: 0, y: 0, z: 0 },
    startRadius: 1,
    endRadius: 3,
    rotations: 0  // No rotation, just in/out
  }
}
// Expands and contracts like breathing
```

### 3. Panning Motion
```typescript
{
  type: 'linear',
  loop: true,
  pingPong: true,
  parameters: {
    startPosition: { x: -10, y: 0, z: 0 },
    endPosition: { x: 10, y: 0, z: 0 }
  }
}
// Smooth left-right panning
```

---

## Console Logging

### Forward to Reverse
```
🔄 Ping-pong: reversing direction
```

### Reverse to Forward
```
🔄 Ping-pong: forward again
```

---

## Technical Details

### Loop Handling

**At End (time >= duration):**
```typescript
if (animation.pingPong) {
  set({ 
    globalTime: animation.duration,
    isReversed: !state.isReversed,
    loopCount: state.loopCount + 1
  })
} else {
  // Normal loop
  set({ globalTime: 0, loopCount: state.loopCount + 1 })
}
```

**At Start (time <= 0 while reversed):**
```typescript
if (animation.pingPong && state.isReversed) {
  set({ 
    globalTime: 0,
    isReversed: false,
    loopCount: state.loopCount + 1
  })
}
```

### Position Calculation
No changes needed to calculation functions - they receive time normally. The engine simply reverses time direction, so calculations naturally work backward.

---

## Benefits

✅ **Smooth Motion:** No jarring jumps back to start  
✅ **Natural Feel:** Creates organic back-and-forth patterns  
✅ **Versatile:** Works with all animation types  
✅ **Easy to Use:** Just one toggle  
✅ **Efficient:** No extra calculations needed  
✅ **Visual Feedback:** Blue highlight when enabled  

---

## Testing

### Test 1: Linear Ping-Pong
```
1. Create linear animation: (0,0,0) → (10,0,0)
2. Duration: 5 seconds
3. Enable Loop + Ping-Pong
4. Play
5. ✅ Track moves right (0→10), then left (10→0), repeat
```

### Test 2: Circular Ping-Pong
```
1. Create circular: center (0,0,0), radius 3, 0°-180°
2. Enable Loop + Ping-Pong
3. Play
4. ✅ Track traces semicircle forward, then backward
```

### Test 3: Disable Loop
```
1. Ping-pong enabled with loop
2. Disable loop toggle
3. ✅ Ping-pong toggle disappears
4. ✅ Animation plays once and stops
```

### Test 4: Loop Count
```
1. Enable ping-pong
2. Play animation
3. Watch console
4. ✅ Loop count increments on each reversal
```

---

## UI State Logic

### Toggle Visibility
```typescript
{animationForm.loop && (
  <div className="ping-pong-toggle">
    // Ping-pong controls
  </div>
)}
```

### Auto-disable
When user disables Loop:
- Ping-pong setting is preserved in form
- But has no effect (ignored by engine)
- Toggle hidden from UI

---

## Animation Flow Comparison

### Without Ping-Pong (5s duration)
```
Time:     0s   1s   2s   3s   4s   5s   0s   1s   2s   3s   4s   5s
Position: ●----●----●----●----●----●    ●----●----●----●----●----●
          Start                   End  [Jump] Start              End
```

### With Ping-Pong (5s duration)
```
Time:     0s   1s   2s   3s   4s   5s   4s   3s   2s   1s   0s   1s
Position: ●----●----●----●----●----●----●----●----●----●----●----●
          Start                   End  Reverse              Start  Forward
```

---

## OSC Messages

Ping-pong mode sends OSC messages normally - the position calculation handles the reversal automatically, so OSC just sees smooth position updates in both directions.

**Example for linear (0,0,0) → (10,0,0):**
```
📤 /track/1/xyz [0.0, 0.0, 0.0]   // Start
📤 /track/1/xyz [2.5, 0.0, 0.0]   // Forward
📤 /track/1/xyz [5.0, 0.0, 0.0]   // Forward
📤 /track/1/xyz [7.5, 0.0, 0.0]   // Forward
📤 /track/1/xyz [10.0, 0.0, 0.0]  // End (reverse triggered)
📤 /track/1/xyz [7.5, 0.0, 0.0]   // Backward
📤 /track/1/xyz [5.0, 0.0, 0.0]   // Backward
📤 /track/1/xyz [2.5, 0.0, 0.0]   // Backward
📤 /track/1/xyz [0.0, 0.0, 0.0]   // Start (forward again)
```

---

## Performance

**Impact:** Minimal
- One boolean check per frame
- One multiplication (direction: +1 or -1)
- No additional position calculations

---

## Future Enhancements

- Ping-pong count limit (e.g., bounce 3 times then stop)
- Custom bounce points (not just start/end)
- Acceleration curves (ease-in/out at reversal points)
- Visual indicator in 3D preview showing direction
- Different speeds for forward vs backward

---

**Date:** 2025-10-02  
**Status:** ✅ Implemented  
**Impact:** High - Adds natural motion capability

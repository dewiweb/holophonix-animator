# Oscillator Visualization Problem & Solutions

## The Problem

Having both stationary and traveling modes in one model creates control point conflicts:
- **Stationary needs:** 1 control point (center)
- **Traveling needs:** 2 control points (start, end)

Current solution (1 control point) is not clear for users in traveling mode.

---

## Solution Options

### Option 1: Split Back Into Two Models (Reverting) ❌
**Pros:** Clear, no conflicts
**Cons:** Loses all benefits of unification

### Option 2: Conditional Control Points ⚠️
**Pros:** Shows right points for each mode
**Cons:** Complex, requires visualization system changes

### Option 3: Always Show 3 Points, Smart Logic 🤔
**Pros:** All points visible
**Cons:** Confusing which points are active

### Option 4: Two Separate Oscillator Models (Recommended) ✅
Keep unified **logic** but split into **two user-facing models:**
- `oscillator-stationary` (replaces wave)
- `oscillator-path` (replaces zigzag)

**Pros:**
- Clear UX - each model has obvious control points
- Shared implementation (same calculate function)
- No control point conflicts
- Easy to understand

---

## Recommended: Dual Model Approach

### Architecture
```typescript
// Shared implementation
function calculateOscillator(params, time, duration, isStationary) {
  // Common waveform logic
}

// Two models with different parameters/visualization
createStationaryOscillatorModel()  // 1 control point
createPathOscillatorModel()        // 2 control points
```

### User Experience
**Animation Library:**
- 📊 Oscillator (Stationary) - Sine/Triangle/Square/Sawtooth around fixed point
- 📈 Oscillator (Path) - Sine/Triangle/Square/Sawtooth along path

**Clear for users:**
- Want to oscillate in place? → Stationary
- Want to oscillate while moving? → Path

---

## Implementation

### File Structure
```
models/builtin/
├── oscillatorStationary.ts  # Replaces wave.ts
├── oscillatorPath.ts         # Replaces zigzag.ts
└── oscillatorShared.ts       # Shared logic
```

### Shared Logic
```typescript
// oscillatorShared.ts
export interface OscillatorConfig {
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth'
  amplitude: number
  frequency: number
  phase: number
  plane: 'xy' | 'xz' | 'yz'
}

export function calculateWaveform(
  waveform: string,
  angle: number
): number {
  // Waveform calculation (shared)
}

export function applyOscillation(
  base: Position,
  waveValue: number,
  amplitude: number,
  plane: string
): Position {
  // Apply oscillation to position (shared)
}
```

### Stationary Model
```typescript
// oscillatorStationary.ts
export function createStationaryOscillatorModel(): AnimationModel {
  return {
    metadata: {
      type: 'oscillator-stationary',
      name: 'Oscillator (Stationary)',
      description: 'Oscillates around fixed point',
    },
    parameters: {
      center: Position,
      ...sharedOscillatorParams
    },
    visualization: {
      controlPoints: [
        { parameter: 'center', type: 'center' }
      ]
    },
    calculate: (params, time, duration) => {
      const waveValue = calculateWaveform(params.waveform, angle)
      return applyOscillation(params.center, waveValue, ...)
    }
  }
}
```

### Path Model
```typescript
// oscillatorPath.ts
export function createPathOscillatorModel(): AnimationModel {
  return {
    metadata: {
      type: 'oscillator-path',
      name: 'Oscillator (Path)',
      description: 'Oscillates along a path',
    },
    parameters: {
      pathStart: Position,
      pathEnd: Position,
      ...sharedOscillatorParams
    },
    visualization: {
      controlPoints: [
        { parameter: 'pathStart', type: 'start' },
        { parameter: 'pathEnd', type: 'end' }
      ]
    },
    calculate: (params, time, duration) => {
      const progress = time / duration
      const base = lerp(params.pathStart, params.pathEnd, progress)
      const waveValue = calculateWaveform(params.waveform, angle)
      return applyOscillation(base, waveValue, ...)
    }
  }
}
```

---

## Benefits of Dual Model

### For Users ✅
- **Clear choice:** Stationary vs Path
- **Obvious controls:** Right control points for each
- **No confusion:** Each model does one thing well

### For Developers ✅
- **Shared logic:** DRY principle maintained
- **Easy testing:** Test shared logic once
- **Clear separation:** Stationary vs traveling concerns

### For Maintainability ✅
- **Single source of truth:** Waveform logic in one place
- **Easy to extend:** Add new waveforms in shared module
- **Type safety:** Clear parameter types for each model

---

## Migration from Current Unified Model

### Step 1: Create Shared Module
Extract common waveform logic to `oscillatorShared.ts`

### Step 2: Create Two Models
- `oscillatorStationary.ts` using shared logic
- `oscillatorPath.ts` using shared logic

### Step 3: Update Registry
```typescript
// Before (current)
createOscillatorModel(),  // Confusing

// After (clear)
createStationaryOscillatorModel(),  // Clear purpose
createPathOscillatorModel(),        // Clear purpose
```

### Step 4: Update Type System
```typescript
// Add to AnimationType
| 'oscillator-stationary'
| 'oscillator-path'
```

---

## Alternative: Enhanced Single Model

If you really want to keep one model, we need:

1. **Smart control point filtering** based on movementMode
2. **UI indication** of which points are active
3. **Better naming** to clarify the mode switch

But this is more complex and less intuitive than dual models.

---

## Conclusion

**Recommendation:** Split into two user-facing models with shared implementation.

This gives us:
- ✅ Clear UX (each model has obvious purpose)
- ✅ DRY code (shared waveform logic)
- ✅ Easy to use (right control points for each)
- ✅ Future-proof (easy to add more oscillator types)

The unified model was a good attempt at reducing duplication, but the **user experience should drive the architecture**, not code minimalism.

**Better:** Two clear models with shared implementation
**Worse:** One confusing model with mode switches

---

## Decision Time

Should I implement the dual model approach?
- oscillator-stationary (1 control point, clear)
- oscillator-path (2 control points, clear)
- Shared waveform logic module

This takes ~30 minutes but results in much clearer UX.

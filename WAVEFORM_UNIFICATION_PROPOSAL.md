# Waveform Unification Proposal

## Current Situation

### wave.ts (Stationary Oscillation)
```typescript
// Oscillates around a fixed center point
center: { x: 0, y: 0, z: 0 }
amplitude: { x: 5, y: 0, z: 0 }
waveType: ['sine', 'square', 'triangle', 'sawtooth']
```
**Behavior:** Like a buoy bobbing in water - stays in place

### zigzag.ts (Traveling Oscillation)
```typescript
// Travels from start to end while oscillating
zigzagStart: { x: -5, y: 0, z: 0 }
zigzagEnd: { x: 5, y: 0, z: 0 }
amplitude: 2
zigzagCount: 3
// Currently only triangle waveform
```
**Behavior:** Like a moving snake - moves forward while oscillating

---

## Proposed: Unified "Oscillator" Model

### Key Insight
Both models are fundamentally **oscillators** with different movement contexts:
- **Stationary**: Oscillate around a fixed point
- **Traveling**: Oscillate along a path

---

## Unified Model Design

### New Model Name: `oscillator`

### Movement Mode Parameter
```typescript
movementMode: {
  type: 'enum',
  default: 'stationary',
  label: 'Movement Mode',
  description: 'How the oscillation moves through space',
  group: 'Motion',
  order: 1,
  options: ['stationary', 'traveling'],
  uiComponent: 'select',
}
```

### Conditional Parameters

**When `movementMode === 'stationary'`:**
```typescript
center: {
  type: 'position',
  default: { x: 0, y: 0, z: 0 },
  label: 'Center',
  description: 'Center point of oscillation',
  visible: (params) => params.movementMode === 'stationary',
}
```

**When `movementMode === 'traveling'`:**
```typescript
pathStart: {
  type: 'position',
  default: { x: -5, y: 0, z: 0 },
  label: 'Path Start',
  visible: (params) => params.movementMode === 'traveling',
}

pathEnd: {
  type: 'position',
  default: { x: 5, y: 0, z: 0 },
  label: 'Path End',
  visible: (params) => params.movementMode === 'traveling',
}
```

### Shared Parameters
```typescript
waveform: {
  type: 'enum',
  default: 'sine',
  options: ['sine', 'triangle', 'square', 'sawtooth'],
  label: 'Waveform Type',
}

amplitude: {
  type: 'number',  // or position for 3D
  default: 2,
  label: 'Amplitude',
}

frequency: {
  type: 'number',
  default: 1,
  label: 'Frequency',
  unit: 'Hz',
}

plane: {
  type: 'enum',
  default: 'xy',
  options: ['xy', 'xz', 'yz', 'xyz'],
  label: 'Oscillation Plane',
}
```

---

## Calculate Function Logic

```typescript
calculate(params, time, duration, context): Position {
  const movementMode = params.movementMode || 'stationary'
  const waveform = params.waveform || 'sine'
  const amplitude = params.amplitude || 2
  const frequency = params.frequency || 1
  const plane = params.plane || 'xy'
  
  // Calculate waveform value
  const angle = time * frequency * Math.PI * 2
  let waveValue = calculateWaveform(waveform, angle)
  
  // Calculate base position
  let basePosition: Position
  
  if (movementMode === 'stationary') {
    // Fixed center point
    basePosition = params.center || { x: 0, y: 0, z: 0 }
    
  } else if (movementMode === 'traveling') {
    // Interpolate along path
    const progress = Math.min(time / duration, 1)
    const start = params.pathStart || { x: -5, y: 0, z: 0 }
    const end = params.pathEnd || { x: 5, y: 0, z: 0 }
    
    basePosition = {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
      z: start.z + (end.z - start.z) * progress
    }
  }
  
  // Apply oscillation to base position
  return applyOscillation(basePosition, waveValue, amplitude, plane)
}

function calculateWaveform(type: string, angle: number): number {
  switch (type) {
    case 'sine':
      return Math.sin(angle)
    case 'triangle':
      return (2 / Math.PI) * Math.asin(Math.sin(angle))
    case 'square':
      return Math.sin(angle) > 0 ? 1 : -1
    case 'sawtooth':
      return (2 * ((angle / (2 * Math.PI)) % 1)) - 1
    default:
      return Math.sin(angle)
  }
}
```

---

## Benefits of Unification

### 1. **Conceptual Clarity** ✅
- One model for all oscillations
- Users learn one pattern instead of two
- "Oscillator" clearly describes behavior

### 2. **Reduced Code Duplication** ✅
- Single waveform implementation
- Shared parameter validation
- One set of tests

### 3. **Feature Parity** ✅
- Both modes get all waveforms
- Consistent UI/UX
- Easier to maintain

### 4. **Progressive Disclosure** ✅
- Simple by default (stationary)
- Advanced users discover traveling mode
- Conditional parameters keep UI clean

### 5. **Future Extensibility** ✅
- Easy to add new modes (circular path, etc.)
- Easy to add new waveforms
- Foundation for modulation

---

## Migration Path

### Option A: Replace Both (Breaking)
- Delete `wave.ts` and `zigzag.ts`
- Create new `oscillator.ts`
- ❌ Breaks existing projects

### Option B: Keep Compatibility (Recommended) ✅
1. Create new `oscillator.ts` with both modes
2. Mark `wave.ts` and `zigzag.ts` as **deprecated**
3. Add migration helper to convert old animations
4. Keep old models for 1-2 versions
5. Eventually remove deprecated models

```typescript
// Migration helper
function migrateToOscillator(oldAnimation: Animation): Animation {
  if (oldAnimation.type === 'wave') {
    return {
      ...oldAnimation,
      type: 'oscillator',
      parameters: {
        movementMode: 'stationary',
        center: oldAnimation.parameters.center,
        waveform: oldAnimation.parameters.waveType,
        amplitude: oldAnimation.parameters.amplitude.x, // simplified
        frequency: oldAnimation.parameters.frequency,
        // ... map other params
      }
    }
  }
  
  if (oldAnimation.type === 'zigzag') {
    return {
      ...oldAnimation,
      type: 'oscillator',
      parameters: {
        movementMode: 'traveling',
        pathStart: oldAnimation.parameters.zigzagStart,
        pathEnd: oldAnimation.parameters.zigzagEnd,
        waveform: 'triangle', // zigzag default
        amplitude: oldAnimation.parameters.amplitude,
        frequency: oldAnimation.parameters.zigzagCount / oldAnimation.duration,
        // ... map other params
      }
    }
  }
}
```

---

## UI Mockup

```
┌─────────────────────────────────────┐
│ Oscillator Animation                │
├─────────────────────────────────────┤
│ Motion                               │
│   Movement Mode: ○ Stationary       │
│                  ● Traveling         │
│                                      │
│   Path Start:    [-5, 0, 0]         │
│   Path End:      [ 5, 0, 0]         │
│                                      │
├─────────────────────────────────────┤
│ Waveform                             │
│   Type:         [Sine ▼]            │
│   Amplitude:    [▬▬▬●▬▬] 2.0        │
│   Frequency:    [▬●▬▬▬▬] 1.0 Hz     │
│                                      │
├─────────────────────────────────────┤
│ Orientation                          │
│   Plane:        [XY ▼]              │
└─────────────────────────────────────┘
```

---

## Comparison Matrix

| Feature | Current (2 models) | Unified (1 model) |
|---------|-------------------|-------------------|
| Models to maintain | 2 | 1 ✅ |
| Code duplication | High | Low ✅ |
| Waveforms in stationary | 4 ✅ | 4 ✅ |
| Waveforms in traveling | 1 ❌ | 4 ✅ |
| Learning curve | Medium | Low ✅ |
| Feature discoverability | Hard | Easy ✅ |
| Migration complexity | N/A | Medium ⚠️ |
| Backward compatibility | N/A | Possible ✅ |

---

## Implementation Complexity

### Simple Approach (3-4 hours)
- Create `oscillator.ts` from scratch
- Basic stationary + traveling modes
- Standard waveforms
- No migration helper

### Complete Approach (1 day)
- Full-featured `oscillator.ts`
- Migration helper for old projects
- Deprecation warnings in old models
- Updated documentation
- Tests for both modes
- UI conditional parameters

---

## Recommendation

### YES - Unify the models ✅

**Reasons:**
1. **Better UX** - One concept instead of two
2. **More powerful** - Traveling mode gets all waveforms
3. **Easier maintenance** - Single source of truth
4. **Future-proof** - Easy to extend with new modes

**Approach:**
- Create new `oscillator` model
- Keep old models deprecated (1-2 versions)
- Add migration helper
- Document migration path

**Timeline:**
- Phase 1: Create oscillator model (Now)
- Phase 2: Add deprecation warnings (Next release)
- Phase 3: Remove old models (2 releases later)

---

## Alternative: Keep Separate

**Arguments for keeping separate:**
- ❌ "Users might want simple, focused models" 
  - Counter: Conditional UI handles this
- ❌ "Mixing concepts is confusing"
  - Counter: They're the same concept (oscillation)
- ❌ "Migration is risky"
  - Counter: We can keep backward compatibility

**Verdict:** Not compelling enough to avoid unification

---

## Conclusion

**Merge wave.ts and zigzag.ts into unified oscillator.ts**

This creates a more powerful, maintainable, and user-friendly animation system while maintaining backward compatibility through deprecation and migration helpers.

**Next Step:** Implement `oscillator.ts` model?

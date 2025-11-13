# Zigzag Model Enhancement Proposal

## Current Implementation

The zigzag model currently uses a **triangle wave** pattern:
```typescript
const zigzagPhase = (zigzagProgress % 1) * 2 - 1  // Triangle wave
const zigzagValue = zigzagPhase * amplitude
```

This creates a linear back-and-forth movement (sharp zigzag).

---

## Proposed Enhancement: Waveform-Based Model

Transform zigzag into a versatile **waveform generator** with multiple wave shapes.

### New Parameter: `waveform`

Add waveform type selection:
```typescript
waveform: {
  type: 'enum',
  default: 'triangle',
  label: 'Waveform Type',
  description: 'Shape of the oscillation',
  group: 'Shape',
  order: 4,
  options: ['sine', 'triangle', 'square', 'sawtooth'],
  uiComponent: 'select',
}
```

---

## Waveform Implementations

### 1. **Sine Wave** (Smooth, Natural)
```typescript
const phase = zigzagProgress % 1
const zigzagValue = Math.sin(phase * Math.PI * 2) * amplitude
```
**Use case:** Smooth, natural oscillations like swaying or floating

### 2. **Triangle Wave** (Current - Sharp Linear)
```typescript
const phase = (zigzagProgress % 1) * 2 - 1
const zigzagValue = phase * amplitude
```
**Use case:** Sharp angular movements, geometric patterns

### 3. **Square Wave** (Binary On/Off)
```typescript
const phase = zigzagProgress % 1
const zigzagValue = (phase < 0.5 ? -1 : 1) * amplitude
```
**Use case:** Sudden jumps, robotic movements, step patterns

### 4. **Sawtooth Wave** (Asymmetric Ramp)
```typescript
const phase = zigzagProgress % 1
const zigzagValue = (phase * 2 - 1) * amplitude
```
**Use case:** One-way ramps, scanning patterns

---

## Enhanced Calculate Function

```typescript
calculate: function(
  parameters: Record<string, any>,
  time: number,
  duration: number,
  context: CalculationContext
): Position {
  const progress = Math.min(time / duration, 1)
  
  const zigzagStart = parameters.zigzagStart || { x: 0, y: 0, z: 0 }
  const zigzagEnd = parameters.zigzagEnd || { x: 10, y: 0, z: 0 }
  const zigzagCount = parameters.zigzagCount || 5
  const amplitude = parameters.amplitude || 2
  const plane = parameters.plane || 'xy'
  const waveform = parameters.waveform || 'triangle'
  
  // Base position along path
  const baseX = zigzagStart.x + (zigzagEnd.x - zigzagStart.x) * progress
  const baseY = zigzagStart.y + (zigzagEnd.y - zigzagStart.y) * progress
  const baseZ = zigzagStart.z + (zigzagEnd.z - zigzagStart.z) * progress
  
  // Calculate waveform value
  const zigzagProgress = progress * zigzagCount
  const phase = zigzagProgress % 1
  
  let zigzagValue: number
  
  switch (waveform) {
    case 'sine':
      zigzagValue = Math.sin(phase * Math.PI * 2) * amplitude
      break
    
    case 'triangle':
      const trianglePhase = phase * 2 - 1
      zigzagValue = trianglePhase * amplitude
      break
    
    case 'square':
      zigzagValue = (phase < 0.5 ? -1 : 1) * amplitude
      break
    
    case 'sawtooth':
      zigzagValue = (phase * 2 - 1) * amplitude
      break
    
    default:
      zigzagValue = (phase * 2 - 1) * amplitude
  }
  
  // Apply to correct plane
  let x = baseX, y = baseY, z = baseZ
  
  if (plane === 'xy') {
    y += zigzagValue
  } else if (plane === 'xz') {
    z += zigzagValue
  } else if (plane === 'yz') {
    z += zigzagValue
  }
  
  return { x, y, z }
}
```

---

## Visual Comparison

```
Sine Wave (smooth):
   ╱╲    ╱╲    ╱╲
  ╱  ╲  ╱  ╲  ╱  ╲
━━━━━━━━━━━━━━━━━━━━━
      ╲╱    ╲╱    ╲╱

Triangle Wave (sharp):
  ╱╲    ╱╲    ╱╲
 ╱  ╲  ╱  ╲  ╱  ╲
━━━━━━━━━━━━━━━━━━━━━
     ╲╱    ╲╱    ╲╱

Square Wave (steps):
┌──┐  ┌──┐  ┌──┐
│  │  │  │  │  │
━━━━━━━━━━━━━━━━━━━━━
   └──┘  └──┘  └──┘

Sawtooth (ramp):
 ╱│ ╱│ ╱│ ╱│ ╱│
╱ │╱ │╱ │╱ │╱ │
━━━━━━━━━━━━━━━━━━━━━
```

---

## Updated Metadata

```typescript
metadata: {
  type: 'zigzag',
  name: 'Waveform Path',  // NEW NAME
  version: '2.0.0',
  category: 'builtin',
  description: 'Oscillating movement with multiple waveform types',  // NEW
  tags: ['waveform', 'oscillation', 'path', 'zigzag', 'sine', 'triangle'],
  icon: 'Activity',  // More appropriate icon
}
```

---

## Benefits

### 1. **Versatility**
One model covers multiple use cases:
- Sine: Natural, smooth movements
- Triangle: Sharp, mechanical movements  
- Square: Digital, stepped movements
- Sawtooth: Scanning, radar-like patterns

### 2. **Backward Compatibility**
Default is still `triangle`, maintaining current behavior

### 3. **Better Naming**
"Waveform Path" is more descriptive than "Zigzag"

### 4. **Educational**
Users learn about waveforms and their applications

### 5. **Creative Freedom**
More artistic options for sound designers

---

## Use Cases

### Sine Wave
- **Swaying trees** in wind
- **Floating objects** in water
- **Smooth scanning** patterns
- **Natural vibrations**

### Triangle Wave (Current)
- **Sharp angular** movements
- **Geometric patterns**
- **Precise zigzag** paths
- **Electronic glitches**

### Square Wave
- **Binary switching** between positions
- **Robotic movements**
- **Strobe-like** effects
- **Digital artifacts**

### Sawtooth Wave
- **Radar sweeps**
- **One-way scanning**
- **Asymmetric oscillations**
- **Rising/falling** patterns

---

## Implementation Checklist

- [ ] Add `waveform` parameter to model
- [ ] Implement waveform switch statement in calculate()
- [ ] Update metadata (name, description, tags, icon)
- [ ] Update visualization to show different waveforms
- [ ] Add waveform to default parameters
- [ ] Update tests
- [ ] Update documentation

---

## Alternative Names

Consider renaming the model:
- ✅ **"waveform"** - Clear, descriptive
- ✅ **"oscillator"** - Technical, accurate
- ⏸️ Keep "zigzag" - Familiar but limiting

**Recommendation:** Rename to **"waveform"** for clarity

---

## Conclusion

This enhancement transforms a specialized "zigzag" model into a versatile **waveform generator**, providing 4x the creative options while maintaining backward compatibility.

**Estimated Implementation Time:** 20 minutes

**Breaking Changes:** None (default behavior unchanged)

**Value:** HIGH ✅

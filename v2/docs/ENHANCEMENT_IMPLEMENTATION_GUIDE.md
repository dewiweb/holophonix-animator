# Enhancement Implementation Guide

This document provides a structured approach to implementing the four major enhancements for Holophonix Animator.

## Overview of Enhancements

1. **Detailed UI Parameter Forms** - Full editing interface for all 18 new animations
2. **Animation Presets Library** - Save/load/browse animation presets
3. **Visual Path Preview** - 3D visualization of animation paths
4. **Parameter Keyframes** - Animate parameters over time

---

## Feature 1: Detailed UI Parameter Forms

### Implementation Strategy

Add cases to `renderAnimationParameters()` in `AnimationEditor.tsx` for each animation type. Follow the pattern used by `random` and `spiral` animations.

### Template Structure

```tsx
case 'animation-name':
  return (
    <div className="space-y-4">
      {/* Position inputs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          <input type="number" step="0.1" value={...} onChange={...} placeholder="X" />
          <input type="number" step="0.1" value={...} onChange={...} placeholder="Y" />
          <input type="number" step="0.1" value={...} onChange={...} placeholder="Z" />
        </div>
      </div>

      {/* Numeric parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Parameter Name</label>
          <input type="number" min="0" step="0.1" value={...} onChange={...} />
        </div>
      </div>

      {/* Select dropdowns */}
      <div>
        <label>Option</label>
        <select value={...} onChange={...}>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
      </div>
    </div>
  )
```

### Priority Order for UI Forms

**High Priority (Most Used):**
1. Wave - Simple and commonly used
2. Lissajous - Creates impressive patterns
3. Perlin Noise - Smooth organic motion
4. Orbit - Common spatial audio use case

**Medium Priority:**
5. Pendulum
6. Bounce
7. Spring
8. Helix
9. Bézier
10. Rose Curve

**Lower Priority (Complex/Specialized):**
11. Catmull-Rom (needs dynamic control point management)
12. Zigzag
13. Epicycloid
14. Formation (simplified)
15. Attract-Repel
16. Doppler
17. Circular Scan
18. Zoom

### Example: Wave Animation Form

```tsx
case 'wave':
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Center Position</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(animationForm.parameters as any)?.center?.x || 0}
            onChange={(e) => handleParameterChange('center', {
              ...(animationForm.parameters as any)?.center,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="X"
          />
          {/* Y and Z similar */}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amplitude</label>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            value={(animationForm.parameters as any)?.amplitude?.x || 2}
            onChange={(e) => handleParameterChange('amplitude', {
              ...(animationForm.parameters as any)?.amplitude,
              x: parseFloat(e.target.value)
            })}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="X"
          />
          {/* Y and Z similar */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency (Hz)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={(animationForm.parameters as any)?.frequency || 1}
            onChange={(e) => handleParameterChange('frequency', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phase Offset</label>
          <input
            type="number"
            step="0.1"
            value={(animationForm.parameters as any)?.phaseOffset || 0}
            onChange={(e) => handleParameterChange('phaseOffset', parseFloat(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Wave Type</label>
        <select
          value={(animationForm.parameters as any)?.waveType || 'sine'}
          onChange={(e) => handleParameterChange('waveType', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="sine">Sine Wave</option>
          <option value="square">Square Wave</option>
          <option value="triangle">Triangle Wave</option>
          <option value="sawtooth">Sawtooth Wave</option>
        </select>
      </div>
    </div>
  )
```

---

## Feature 2: Animation Presets Library

### Step 1: Extend Types

Add to `types/index.ts`:

```typescript
export interface AnimationPreset {
  id: string
  name: string
  description?: string
  category: 'physics' | 'wave' | 'curve' | 'procedural' | 'interactive' | 'spatial'
  animation: Omit<Animation, 'id'>
  thumbnail?: string  // Base64 or path
  tags: string[]
  author?: string
  createdAt: Date
  modifiedAt: Date
}

export interface PresetLibrary {
  presets: AnimationPreset[]
  categories: string[]
}
```

### Step 2: Create Preset Store

Create `src/stores/presetStore.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AnimationPreset } from '@/types'

interface PresetStore {
  presets: AnimationPreset[]
  addPreset: (preset: AnimationPreset) => void
  removePreset: (id: string) => void
  updatePreset: (id: string, updates: Partial<AnimationPreset>) => void
  getPresetsByCategory: (category: string) => AnimationPreset[]
  searchPresets: (query: string) => AnimationPreset[]
}

export const usePresetStore = create<PresetStore>()(
  persist(
    (set, get) => ({
      presets: getDefaultPresets(), // Import from presets.ts
      
      addPreset: (preset) => set((state) => ({
        presets: [...state.presets, preset]
      })),
      
      removePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id)
      })),
      
      updatePreset: (id, updates) => set((state) => ({
        presets: state.presets.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      
      getPresetsByCategory: (category) => {
        return get().presets.filter(p => p.category === category)
      },
      
      searchPresets: (query) => {
        const lowerQuery = query.toLowerCase()
        return get().presets.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery) ||
          p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      }
    }),
    {
      name: 'holophonix-presets',
      version: 1
    }
  )
)
```

### Step 3: Default Presets

Create `src/data/defaultPresets.ts`:

```typescript
import { AnimationPreset } from '@/types'

export const defaultPresets: AnimationPreset[] = [
  {
    id: 'preset-pendulum-slow',
    name: 'Slow Pendulum',
    description: 'Gentle swinging motion',
    category: 'physics',
    tags: ['slow', 'gentle', 'physics'],
    author: 'Holophonix',
    createdAt: new Date(),
    modifiedAt: new Date(),
    animation: {
      name: 'Slow Pendulum',
      type: 'pendulum',
      duration: 10,
      loop: true,
      parameters: {
        anchorPoint: { x: 0, y: 5, z: 0 },
        pendulumLength: 3,
        initialAngle: 30,
        damping: 0.05,
        gravity: 9.81
      },
      coordinateSystem: { type: 'xyz' }
    }
  },
  // Add more presets for each animation type
]
```

### Step 4: Preset Browser Component

Create `src/components/PresetBrowser.tsx`:

```tsx
import React, { useState } from 'react'
import { usePresetStore } from '@/stores/presetStore'
import { Search, Save, Trash2 } from 'lucide-react'

export const PresetBrowser: React.FC<{
  onSelectPreset: (preset: AnimationPreset) => void
  onClose: () => void
}> = ({ onSelectPreset, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { presets, searchPresets, removePreset } = usePresetStore()
  
  const filteredPresets = searchQuery 
    ? searchPresets(searchQuery) 
    : presets

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold mb-4">Animation Presets</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Preset Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map(preset => (
              <div
                key={preset.id}
                className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all"
                onClick={() => onSelectPreset(preset)}
              >
                <h3 className="font-semibold text-lg mb-2">{preset.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {preset.category}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removePreset(preset.id)
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Feature 3: Visual Path Preview

### Step 1: Path Generation Functions

Create `src/utils/pathGeneration.ts`:

```typescript
import { Animation, Position } from '@/types'
import { calculatePosition } from './animationCalculations'

export interface PathPoint {
  position: Position
  time: number
}

export function generateAnimationPath(
  animation: Animation,
  numPoints: number = 100
): PathPoint[] {
  const points: PathPoint[] = []
  const timeStep = animation.duration / numPoints

  for (let i = 0; i <= numPoints; i++) {
    const time = i * timeStep
    const position = calculatePosition(animation, time)
    points.push({ position, time })
  }

  return points
}

export function generatePathSegments(
  points: PathPoint[]
): [Position, Position][] {
  const segments: [Position, Position][] = []
  
  for (let i = 0; i < points.length - 1; i++) {
    segments.push([points[i].position, points[i + 1].position])
  }
  
  return segments
}
```

### Step 2: Update AnimationPreview3D

Add path rendering to `AnimationPreview3D.tsx`:

```tsx
// Import Three.js Line components
import { Line } from '@react-three/drei'

// Inside component
const [pathPoints, setPathPoints] = useState<PathPoint[]>([])

useEffect(() => {
  if (animation) {
    const points = generateAnimationPath(animation, 200)
    setPathPoints(points)
  }
}, [animation])

// Render path
{pathPoints.length > 0 && (
  <Line
    points={pathPoints.map(p => [p.position.x, p.position.y, p.position.z])}
    color="cyan"
    lineWidth={2}
    dashed={false}
  />
)}

// Add direction indicators (arrows)
{pathPoints.filter((_, i) => i % 20 === 0).map((point, i) => (
  <mesh key={i} position={[point.position.x, point.position.y, point.position.z]}>
    <coneGeometry args={[0.1, 0.3, 8]} />
    <meshStandardMaterial color="yellow" />
  </mesh>
))}
```

---

## Feature 4: Parameter Keyframes

### Step 1: Extend Animation Type

Update `types/index.ts`:

```typescript
export interface ParameterKeyframe {
  id: string
  time: number
  parameter: string // Parameter name like 'radius', 'frequency'
  value: any // Parameter value
  interpolation?: InterpolationType
}

export interface Animation {
  // ... existing fields
  parameterKeyframes?: ParameterKeyframe[] // NEW
}
```

### Step 2: Parameter Interpolation

Add to `animationCalculations.ts`:

```typescript
export function getParameterValueAtTime(
  animation: Animation,
  parameterName: string,
  time: number
): any {
  const keyframes = animation.parameterKeyframes?.filter(
    kf => kf.parameter === parameterName
  ) || []

  if (keyframes.length === 0) {
    return animation.parameters[parameterName]
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time)
  
  // Before first keyframe
  if (time < sorted[0].time) {
    return animation.parameters[parameterName] || sorted[0].value
  }
  
  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value
  }
  
  // Between keyframes - interpolate
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time < sorted[i + 1].time) {
      const t = (time - sorted[i].time) / (sorted[i + 1].time - sorted[i].time)
      return interpolateValue(sorted[i].value, sorted[i + 1].value, t)
    }
  }
}

function interpolateValue(a: any, b: any, t: number): any {
  if (typeof a === 'number' && typeof b === 'number') {
    return a + (b - a) * t
  }
  if (typeof a === 'object' && typeof b === 'object') {
    // Interpolate Position objects
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    }
  }
  return t < 0.5 ? a : b // Step interpolation for other types
}
```

### Step 3: Use in Calculations

Modify calculation functions to use dynamic parameters:

```typescript
export function calculateWavePosition(params: any, time: number, duration: number, animation?: Animation): Position {
  // Get potentially animated parameters
  const frequency = animation 
    ? getParameterValueAtTime(animation, 'frequency', time) 
    : (Number(params?.frequency) || 1)
  
  const amplitude = animation
    ? getParameterValueAtTime(animation, 'amplitude', time)
    : (params?.amplitude || { x: 2, y: 2, z: 1 })
  
  // Rest of calculation...
}
```

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Base animation system (DONE)
2. Add UI forms for top 4 animations (Wave, Lissajous, Perlin, Orbit)
3. Create 5-10 default presets

### Phase 2: Full UI (2-3 hours)
4. Complete all 18 UI forms
5. Implement preset browser UI
6. Add save/load preset functionality

### Phase 3: Visualization (2-3 hours)
7. Implement path generation
8. Add 3D path preview rendering
9. Add preview controls (show/hide, color, style)

### Phase 4: Advanced Features (3-4 hours)
10. Implement parameter keyframe system
11. Add keyframe editor UI
12. Update all calculation functions to support parameter animation

---

## Next Steps

Choose your preferred implementation order:
1. **User-focused**: Start with UI forms for most-used animations
2. **Feature-complete**: Implement preset library for instant usability
3. **Visual**: Add path preview for better understanding
4. **Advanced**: Implement parameter keyframes for pro users

Each feature is independent and can be implemented incrementally.

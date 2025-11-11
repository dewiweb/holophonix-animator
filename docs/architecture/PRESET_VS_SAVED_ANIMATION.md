# Presets vs Saved Animations Architecture

**Status**: Critical Clarification  
**Date**: 2024

---

## Problem Statement

The system has TWO concurrent animation library systems that serve different purposes but are currently conflated:

1. **Presets** - Reusable animation templates (track-agnostic)
2. **Saved Animations** - Complete animation packages (track-specific)

**Current Issue**: Cue editor allows reassigning saved animations to different tracks, breaking the Animation Editor's intended track selection.

---

## Architecture

### **System 1: Presets (Templates)**

**Purpose**: Reusable animation blueprints WITHOUT track assignment

```typescript
interface AnimationPreset {
  id: string
  name: string
  type: AnimationType
  description: string
  icon: string
  
  // Base parameters (can be customized)
  defaultParameters: AnimationParameters
  
  // NO trackIds - track-agnostic template
}
```

**Characteristics**:
- ✅ Track-agnostic
- ✅ Reusable across different track groups
- ✅ Can be customized when applied
- ✅ Minimal - just the animation definition

**Where they live**: 
- `src/presets/` or built into application
- Predefined library (circular, linear, etc.)

**Usage in Cue**:
```typescript
{
  source: {
    type: 'preset',
    presetId: 'circular-scan',
    trackIds: ['track-1', 'track-2']  // User selects
  }
}
```

---

### **System 2: Saved Animations (Packages)**

**Purpose**: Complete animation packages WITH track assignment

```typescript
interface SavedAnimation {
  id: string
  name: string
  type: AnimationType
  description?: string
  
  // Complete configuration
  parameters: AnimationParameters
  
  // LOCKED track assignment
  trackIds: string[]
  multiTrackMode: MultiTrackMode
  
  // Multi-track specific settings
  trackOffsets?: Map<string, Position>
  phaseOffsetSeconds?: number
  centerPoint?: Position
  
  // Saved from Animation Editor
  createdAt: Date
  modifiedAt: Date
}
```

**Characteristics**:
- ✅ Track-specific (locked to original tracks)
- ✅ Complete package (parameters + tracks + multi-track settings)
- ✅ Created in Animation Editor
- ✅ Rehearsed and refined
- ❌ Cannot be reassigned to different tracks

**Where they live**:
- `projectStore.animations[]`
- Saved with project file

**Usage in Cue**:
```typescript
{
  source: {
    type: 'saved-animation',
    savedAnimationId: 'intro-strings-movement'
    // trackIds come from saved animation - LOCKED
  }
}
```

---

## Workflow Distinction

### **Preset Workflow** (Flexible, Template-based)

```
┌─────────────────────┐
│ 1. User creates cue │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Select "Preset"  │
│    mode             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Choose preset    │
│    (e.g., Circular) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Select tracks    │
│    [✓] Track 1      │
│    [✓] Track 3      │
│    [ ] Track 5      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Cue triggers →   │
│    Preset applied   │
│    to selected      │
│    tracks           │
└─────────────────────┘
```

**Use Cases**:
- Quick setup for live shows
- Same effect on different track groups
- Experimental/improvised performances
- Don't need precise pre-programming

---

### **Saved Animation Workflow** (Locked, Precise)

```
┌──────────────────────────┐
│ 1. Animation Editor      │
│    - Select tracks 1,2,3 │
│    - Design animation    │
│    - Set multi-track     │
│    - Fine-tune params    │
│    - Save as "Intro"     │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 2. User creates cue      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 3. Select "Saved         │
│    Animation" mode       │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 4. Choose animation      │
│    "Intro"               │
│                          │
│    Tracks: 1, 2, 3       │
│    (locked - read-only)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 5. Cue triggers →        │
│    Animation plays on    │
│    original tracks       │
│    (1, 2, 3)            │
└──────────────────────────┘
```

**Use Cases**:
- Rehearsed theater productions
- Precise spatial choreography
- Complex multi-track formations
- Show files that need repeatability

---

## Implementation

### **1. Cue Type Definition**

```typescript
// src/cues/types.ts

export type CueAnimationSource = 
  | {
      type: 'preset'
      presetId: string
      trackIds: string[]  // User-selected in cue editor
      parameterOverrides?: Partial<AnimationParameters>
    }
  | {
      type: 'saved-animation'
      savedAnimationId: string
      // trackIds embedded in saved animation
    }

export interface Cue {
  id: string
  name: string
  color?: string
  
  // Animation source
  source: CueAnimationSource
  
  // Execution settings
  action: 'play' | 'stop' | 'pause' | 'fade'
  fadeTime?: number
  priority?: number
  
  // Triggers
  triggers: CueTrigger[]
  
  // Cue list
  autoFollow?: boolean
  followDelay?: number
}
```

### **2. Cue Store Logic**

```typescript
// src/cues/store.ts

triggerCue: (cueId: string) => {
  const cue = get().cues.get(cueId)
  if (!cue) return
  
  const projectStore = useProjectStore.getState()
  const animationStore = useAnimationStore.getState()
  
  switch (cue.source.type) {
    case 'preset': {
      const { presetId, trackIds, parameterOverrides } = cue.source
      
      // Get preset template
      const preset = getPreset(presetId)
      if (!preset) {
        console.error(`Preset ${presetId} not found`)
        return
      }
      
      // Create animation from preset
      const parameters = {
        ...preset.defaultParameters,
        ...parameterOverrides
      }
      
      // Create temporary animation instance
      const tempAnimation: Animation = {
        id: `temp-${Date.now()}`,
        name: preset.name,
        type: preset.type,
        duration: preset.defaultParameters.duration || 10,
        loop: false,
        parameters
      }
      
      // Play on selected tracks
      animationStore.playAnimation(tempAnimation.id, trackIds)
      break
    }
    
    case 'saved-animation': {
      const { savedAnimationId } = cue.source
      
      // Get saved animation (includes embedded tracks)
      const animation = projectStore.animations.find(
        a => a.id === savedAnimationId
      )
      
      if (!animation) {
        console.error(`Animation ${savedAnimationId} not found`)
        return
      }
      
      // Play on animation's LOCKED tracks
      animationStore.playAnimation(
        animation.id,
        animation.trackIds  // From saved animation
      )
      break
    }
  }
}
```

### **3. CueEditor UI**

```typescript
// src/components/cue-grid/CueEditor.tsx

export function CueEditor({ cue, onSave }: CueEditorProps) {
  const [sourceType, setSourceType] = useState<'preset' | 'saved-animation'>(
    cue?.source.type || 'preset'
  )
  
  // Preset state
  const [selectedPresetId, setSelectedPresetId] = useState<string>()
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  
  // Saved animation state
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>()
  
  const presets = getAvailablePresets()
  const savedAnimations = useProjectStore(state => state.animations)
  const allTracks = useProjectStore(state => state.tracks)
  
  const selectedAnimation = savedAnimations.find(
    a => a.id === selectedAnimationId
  )
  
  return (
    <div>
      <h3>Cue Settings</h3>
      
      {/* Source Type Toggle */}
      <div>
        <label>Animation Source:</label>
        <RadioGroup value={sourceType} onChange={setSourceType}>
          <Radio value="preset">Use Preset (flexible tracks)</Radio>
          <Radio value="saved-animation">Use Saved Animation (locked tracks)</Radio>
        </RadioGroup>
      </div>
      
      {/* Preset Mode */}
      {sourceType === 'preset' && (
        <div>
          <label>Select Preset:</label>
          <Select value={selectedPresetId} onChange={setSelectedPresetId}>
            <option value="">-- Choose Preset --</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.icon} {preset.name}
              </option>
            ))}
          </Select>
          
          {selectedPresetId && (
            <div>
              <label>Select Tracks:</label>
              <div className="track-checkboxes">
                {allTracks.map(track => (
                  <Checkbox
                    key={track.id}
                    checked={selectedTrackIds.includes(track.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedTrackIds([...selectedTrackIds, track.id])
                      } else {
                        setSelectedTrackIds(
                          selectedTrackIds.filter(id => id !== track.id)
                        )
                      }
                    }}
                  >
                    {track.name}
                  </Checkbox>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Saved Animation Mode */}
      {sourceType === 'saved-animation' && (
        <div>
          <label>Select Animation:</label>
          <Select value={selectedAnimationId} onChange={setSelectedAnimationId}>
            <option value="">-- Choose Animation --</option>
            {savedAnimations.map(anim => (
              <option key={anim.id} value={anim.id}>
                {anim.name}
              </option>
            ))}
          </Select>
          
          {selectedAnimation && (
            <div className="locked-tracks">
              <label>Tracks (locked):</label>
              <div className="track-badges">
                {selectedAnimation.trackIds.map(trackId => {
                  const track = allTracks.find(t => t.id === trackId)
                  return track ? (
                    <Badge key={trackId} color="blue">
                      {track.name}
                    </Badge>
                  ) : null
                })}
              </div>
              <p className="help-text">
                Tracks are locked to the animation's original configuration.
                To use different tracks, create a new animation or use a preset.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Save button */}
      <Button onClick={() => {
        const source: CueAnimationSource = sourceType === 'preset'
          ? { type: 'preset', presetId: selectedPresetId!, trackIds: selectedTrackIds }
          : { type: 'saved-animation', savedAnimationId: selectedAnimationId! }
        
        onSave({ ...cue, source })
      }}>
        Save Cue
      </Button>
    </div>
  )
}
```

---

## Benefits

### **Clear Separation of Concerns**
- ✅ Presets = Templates (flexible)
- ✅ Saved Animations = Complete packages (locked)
- ✅ No confusion about which to use when

### **Workflow Clarity**
- ✅ Quick shows → Use presets
- ✅ Precise shows → Use saved animations
- ✅ Both can coexist in same project

### **Prevents Errors**
- ✅ Can't accidentally change tracks on rehearsed animations
- ✅ Animation Editor's work is preserved
- ✅ Multi-track settings stay intact

### **Flexibility**
- ✅ Presets for improvisation
- ✅ Saved animations for precision
- ✅ Mix both in same show

---

## Migration Path

### **Phase 1: Update Type System**
- Add `CueAnimationSource` discriminated union
- Update `Cue` interface
- Maintain backward compatibility with `animationId` (deprecated)

### **Phase 2: Update Cue Store**
- Add logic to handle both source types
- Keep old `animationId` path working (with warning)

### **Phase 3: Update UI**
- Add source type toggle in CueEditor
- Implement preset selection UI
- Implement saved animation selection UI
- Show locked tracks for saved animations

### **Phase 4: Create Preset System**
- Define preset interface
- Create built-in preset library
- Add preset browser

### **Phase 5: Deprecate Old System**
- Migrate existing cues to new format
- Remove deprecated `animationId` field
- Update documentation

---

## Conclusion

The distinction between **Presets** (flexible templates) and **Saved Animations** (locked packages) is critical for a professional workflow:

- **Presets**: Quick, flexible, reusable templates
- **Saved Animations**: Precise, rehearsed, complete packages

By enforcing this separation in the cue system, we preserve the Animation Editor's intent while still allowing flexibility where needed.

---

**Status**: Ready for implementation

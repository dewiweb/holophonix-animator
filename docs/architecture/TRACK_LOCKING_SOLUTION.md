# Track Locking Solution for Saved Animations

**Status**: Architecture Fix  
**Problem**: Animations don't store tracks, allowing cues to reassign any animation to any tracks

---

## Current Architecture Analysis

### **Presets (Already Exist)**

```typescript
// src/stores/presetStore.ts
interface AnimationPreset {
  id: string
  name: string
  description?: string
  category: 'physics' | 'wave' | 'curve' | 'procedural' | 'interactive' | 'spatial' | 'basic' | 'user'
  animation: Omit<Animation, 'id'>  // ❌ NO tracks
  tags: string[]
  author?: string
  createdAt: string
  modifiedAt: string
}
```

**✅ Currently Working:**
- Preset browser UI exists (`PresetBrowser.tsx`)
- Preset store with CRUD operations
- Default presets library (`defaultPresets.ts`)
- Categories and search

**❌ Missing:**
- Not integrated into cue system
- Cannot select tracks when using preset in cue

---

### **Saved Animations (Current)**

```typescript
// src/types/index.ts
interface Animation {
  id: string
  name: string
  type: AnimationType
  duration: number
  loop: boolean
  parameters: AnimationParameters
  multiTrackMode?: MultiTrackMode
  multiTrackParameters?: Record<string, AnimationParameters>
  phaseOffsetSeconds?: number
  centerPoint?: Position
  
  // ❌ NO trackIds - currently track-agnostic!
}
```

**Problem**: Animation Editor allows track selection, but tracks are NOT saved with the animation!

---

## Solution: Optional Track Locking

### **1. Update Animation Interface**

```typescript
// src/types/index.ts
export interface Animation {
  id: string
  name: string
  type: AnimationType
  duration: number
  loop: boolean
  pingPong?: boolean
  parameters: AnimationParameters
  keyframes?: Keyframe[]
  coordinateSystem: CoordinateSystem
  
  // Multi-track support
  multiTrackMode?: 'identical' | 'phase-offset' | 'position-relative' | 'phase-offset-relative' | 'isobarycenter' | 'centered'
  multiTrackParameters?: Record<string, AnimationParameters>
  phaseOffsetSeconds?: number
  centerPoint?: Position
  
  // NEW: Optional track locking
  trackIds?: string[]  // If set, tracks are LOCKED to this animation
  trackSelectionLocked?: boolean  // Explicit lock flag
}
```

**Rules:**
- If `trackIds` is undefined → animation is a template (like preset)
- If `trackIds` is defined → tracks are LOCKED to this animation

---

### **2. Update Animation Editor**

Add option to lock tracks when saving:

```typescript
// src/components/animation-editor/AnimationEditor.tsx

const [lockTracks, setLockTracks] = useState(false)

// In save dialog
<Checkbox 
  checked={lockTracks}
  onChange={setLockTracks}
>
  Lock tracks to this animation
</Checkbox>

{lockTracks && (
  <div className="info-box">
    <Info size={16} />
    <p>
      This animation will only work with the selected tracks.
      Cues cannot reassign it to different tracks.
    </p>
  </div>
)}
```

```typescript
// In saveAnimationHandler.ts
const animation: Animation = {
  id: animationId,
  name: animationForm.name || 'Unnamed Animation',
  type: animationForm.type || 'linear',
  duration: animationForm.duration || 10,
  loop: animationForm.loop ?? false,
  parameters: cleanedParameters,
  coordinateSystem: animationForm.coordinateSystem || { type: 'xyz' },
  
  // NEW: Save tracks if locked
  ...(lockTracks && {
    trackIds: selectedTrackIds,
    trackSelectionLocked: true,
    multiTrackMode,
    multiTrackParameters
  })
}
```

---

### **3. Update Cue System**

#### **Update CueParameters**

```typescript
// src/cues/types.ts
export interface CueParameters {
  // Animation source (mutually exclusive)
  animationId?: string     // Saved animation (may have locked tracks)
  presetId?: string        // Preset template (requires track selection)
  
  // Track selection
  trackIds?: string[]      // Used for presets or unlocked animations
  
  // Playback parameters
  playbackSpeed?: number
  loop?: boolean
  reverse?: boolean
  
  // ... rest of parameters
}
```

#### **Update Cue Store Logic**

```typescript
// src/cues/store.ts
triggerCue: (cueId: string) => {
  const cue = get().cues.get(cueId)
  if (!cue) return
  
  const projectStore = useProjectStore.getState()
  const animationStore = useAnimationStore.getState()
  const presetStore = usePresetStore.getState()
  
  // MODE 1: Using a preset
  if (cue.parameters.presetId) {
    const preset = presetStore.presets.find(p => p.id === cue.parameters.presetId)
    if (!preset) {
      console.error(`Preset ${cue.parameters.presetId} not found`)
      return
    }
    
    // Presets REQUIRE track selection in cue
    const trackIds = cue.parameters.trackIds || []
    if (trackIds.length === 0) {
      console.error('No tracks selected for preset')
      return
    }
    
    // Create temporary animation from preset
    const tempAnimation: Animation = {
      id: `temp-preset-${Date.now()}`,
      ...preset.animation
    }
    
    // Add to project temporarily and play
    animationStore.playAnimation(tempAnimation.id, trackIds)
  }
  
  // MODE 2: Using a saved animation
  else if (cue.parameters.animationId) {
    const animation = projectStore.animations.find(
      a => a.id === cue.parameters.animationId
    )
    
    if (!animation) {
      console.error(`Animation ${cue.parameters.animationId} not found`)
      return
    }
    
    // Check if animation has locked tracks
    if (animation.trackIds && animation.trackSelectionLocked) {
      // LOCKED: Use animation's embedded tracks, ignore cue's trackIds
      console.log('Using locked tracks from animation:', animation.trackIds)
      animationStore.playAnimation(animation.id, animation.trackIds)
    } else {
      // UNLOCKED: Use cue's track selection (or fallback to selected tracks)
      const trackIds = cue.parameters.trackIds || projectStore.selectedTracks
      console.log('Using cue track selection:', trackIds)
      animationStore.playAnimation(animation.id, trackIds)
    }
  }
  
  break
}
```

---

### **4. Update CueEditor UI**

```tsx
// src/components/cue-grid/CueEditor.tsx

export function CueEditor({ cue, onSave }: CueEditorProps) {
  const [sourceType, setSourceType] = useState<'preset' | 'animation'>('animation')
  const [selectedPresetId, setSelectedPresetId] = useState<string>()
  const [selectedAnimationId, setSelectedAnimationId] = useState<string>()
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  
  const presets = usePresetStore(state => state.presets)
  const savedAnimations = useProjectStore(state => state.animations)
  const allTracks = useProjectStore(state => state.tracks)
  
  const selectedAnimation = savedAnimations.find(a => a.id === selectedAnimationId)
  const isAnimationLocked = selectedAnimation?.trackSelectionLocked
  
  return (
    <div className="cue-editor">
      <h3>Cue Settings</h3>
      
      {/* Source Type Toggle */}
      <div className="source-selector">
        <label>Animation Source:</label>
        <RadioGroup value={sourceType} onChange={setSourceType}>
          <Radio value="preset">
            Use Preset (flexible tracks)
          </Radio>
          <Radio value="animation">
            Use Saved Animation
          </Radio>
        </RadioGroup>
      </div>
      
      {/* PRESET MODE */}
      {sourceType === 'preset' && (
        <div className="preset-mode">
          <label>Select Preset:</label>
          <Select value={selectedPresetId} onChange={setSelectedPresetId}>
            <option value="">-- Choose Preset --</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.category})
              </option>
            ))}
          </Select>
          
          {selectedPresetId && (
            <>
              <label>Select Tracks (required):</label>
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
              
              {selectedTrackIds.length === 0 && (
                <div className="warning">
                  ⚠️ You must select at least one track
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* SAVED ANIMATION MODE */}
      {sourceType === 'animation' && (
        <div className="animation-mode">
          <label>Select Animation:</label>
          <Select value={selectedAnimationId} onChange={setSelectedAnimationId}>
            <option value="">-- Choose Animation --</option>
            {savedAnimations.map(anim => (
              <option key={anim.id} value={anim.id}>
                {anim.name} 
                {anim.trackSelectionLocked && ' 🔒'}
              </option>
            ))}
          </Select>
          
          {selectedAnimation && (
            <>
              {isAnimationLocked ? (
                <div className="locked-tracks">
                  <label>Tracks (locked 🔒):</label>
                  <div className="track-badges">
                    {selectedAnimation.trackIds?.map(trackId => {
                      const track = allTracks.find(t => t.id === trackId)
                      return track ? (
                        <Badge key={trackId} color="blue">
                          {track.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                  <div className="info-box">
                    <Lock size={16} />
                    <p>
                      Tracks are locked to this animation's original configuration.
                      To use different tracks, duplicate the animation in the Animation Editor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="unlocked-tracks">
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
                  <div className="info-box">
                    <Info size={16} />
                    <p>
                      This animation is not locked to specific tracks.
                      You can select which tracks to apply it to.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Save Button */}
      <Button 
        onClick={() => {
          const params: CueParameters = sourceType === 'preset'
            ? {
                presetId: selectedPresetId,
                trackIds: selectedTrackIds
              }
            : {
                animationId: selectedAnimationId,
                ...(!isAnimationLocked && { trackIds: selectedTrackIds })
              }
          
          onSave({ ...cue, parameters: params })
        }}
        disabled={
          (sourceType === 'preset' && selectedTrackIds.length === 0) ||
          (sourceType === 'animation' && !isAnimationLocked && selectedTrackIds.length === 0)
        }
      >
        Save Cue
      </Button>
    </div>
  )
}
```

---

## Implementation Steps

### **Phase 1: Add Track Locking to Animation Type** (1 day)
1. Update `Animation` interface to add `trackIds?` and `trackSelectionLocked?`
2. Update TypeScript types across codebase
3. Ensure backward compatibility (existing animations have undefined trackIds)

### **Phase 2: Update Animation Editor** (2 days)
1. Add "Lock Tracks" checkbox to save dialog
2. Update `saveAnimationHandler` to save trackIds if locked
3. Add visual indicator for locked animations in Animation Library
4. Update duplicate function to preserve lock state

### **Phase 3: Update Cue System Logic** (2 days)
1. Update `CueParameters` to add `presetId`
2. Update `triggerCue` logic to handle presets vs locked vs unlocked animations
3. Add validation for track selection

### **Phase 4: Update CueEditor UI** (3 days)
1. Add preset/animation source toggle
2. Implement preset selector with track checkboxes
3. Implement animation selector with locked/unlocked display
4. Add helpful UI messages and icons
5. Disable save if validation fails

### **Phase 5: Testing** (2 days)
1. Test preset selection in cues
2. Test locked animation playback
3. Test unlocked animation track reassignment
4. Test backward compatibility with existing projects
5. Test edge cases (deleted tracks, etc.)

**Total Estimate**: 10 days

---

## Benefits

### **Clear Workflow**
- ✅ Presets: Quick templates, user selects tracks
- ✅ Locked Animations: Precise, rehearsed movements
- ✅ Unlocked Animations: Templates that can be reassigned

### **Flexibility**
- ✅ User chooses when to lock tracks
- ✅ Can duplicate locked animation to unlock it
- ✅ Presets always available for quick setup

### **Backward Compatibility**
- ✅ Existing animations work as unlocked (trackIds === undefined)
- ✅ No data migration required
- ✅ New feature is opt-in

### **User Control**
- ✅ Animation Editor: "Should this animation be tied to specific tracks?"
- ✅ Cue Editor: Clear UI showing locked vs unlocked
- ✅ Prevents accidental reassignment of rehearsed animations

---

## Summary

**Current State:**
- ✅ Presets exist but not integrated into cues
- ❌ All animations are track-agnostic
- ❌ Cues can reassign any animation to any tracks

**Solution:**
- Add optional `trackIds` to Animation interface
- Add "Lock Tracks" option in Animation Editor
- Update CueEditor to:
  - Support preset selection (with required track selection)
  - Show locked/unlocked status for saved animations
  - Prevent track reassignment for locked animations
- Update cue trigger logic to respect locked tracks

**Result:**
- Presets for flexibility
- Locked animations for precision
- Unlocked animations for templates
- Clear UI indicating what can/cannot be changed

---

**Status**: Ready for implementation

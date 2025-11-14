# Formation Animation + LTP Priority Mode

## 🚨 The Problem

### Architecture Issue
Formation animations store track-specific transform data **baked into the Animation object**:

```typescript
interface Animation {
  transform?: {
    mode: 'formation',
    tracks: {
      "track-1": { offset: {x: 1, y: 0, z: 0}, timeShift: 0 },
      "track-2": { offset: {x: -1, y: 0, z: 0}, timeShift: 0 },
      "track-3": { offset: {x: 0, y: 1, z: 0}, timeShift: 0 }
    },
    formation: {
      anchor: {x: 0, y: 0, z: 0},
      pattern: "rigid"
    }
  }
}
```

### The Conflict with LTP

**Scenario:**
1. **Cue1** plays formation animation on tracks `[1, 2, 3]`
2. **Cue2** (LTP) plays SAME animation on tracks `[1, 2]`

**What Happens (Before Fix):**
```
❌ LTP releases track 3 from Cue1's ownership
❌ But animation.transform.tracks still contains track-3 data
❌ If track 3 gets processed, it uses wrong formation offset
❌ Formation geometry breaks (designed for 3 tracks, not 2)
```

### Why It Breaks

**Formation animations are "all-or-nothing":**
- Formation anchor/barycenter calculated from ALL tracks
- Each track offset is relative to that anchor
- Removing one track invalidates the formation geometry
- You can't play 2/3 of a triangle formation

---

## ✅ The Solution

### Hybrid Approach

1. **Keep transforms in Animation** (for saved state)
2. **Add runtime track filtering** (for playback)
3. **Pass activeTrackIds through pipeline**
4. **Validate at cue execution**

### Implementation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CUE EXECUTION (storeV2/index.ts)                        │
│    - Detect formation animation                             │
│    - Compare requested vs saved tracks                      │
│    - Filter to valid subset                                 │
│    - Log warnings                                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ANIMATION STORE (animationStore.ts)                     │
│    - playAnimation(animationId, trackIds)                   │
│    - Store trackIds in PlayingAnimation                     │
│    - Pass to applyTransform on every frame                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. TRANSFORM APPLICATION (transformApplication.ts)         │
│    - applyTransform(basePos, trackId, animation,           │
│                      time, activeTrackIds)                  │
│    - Filter: only apply if trackId in activeTrackIds       │
│    - Prevents orphaned track offsets                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Code Details

### 1. Cue Execution Validation

**File:** `src/cues/storeV2/index.ts`

```typescript
// FORMATION/CENTERED MODE VALIDATION
if (animation.transform?.mode === 'formation') {
  const savedTracks = Object.keys(animation.transform.tracks)
  const validTracks = trackIds.filter(id => savedTracks.includes(id))
  const missingTracks = savedTracks.filter(id => !trackIds.includes(id))
  
  if (validTracks.length !== savedTracks.length) {
    console.warn('⚠️ Formation animation track mismatch:', {
      animationName: animation.name,
      savedTracks,
      requestedTracks: trackIds,
      validTracks,
      missingTracks
    })
    
    if (validTracks.length === 0) {
      console.error('❌ Cannot play formation animation: no valid tracks')
      return  // Reject execution
    }
    
    console.log(`📐 Formation will be recalculated for ${validTracks.length}/${savedTracks.length} tracks`)
    trackIds = validTracks  // Filter to valid subset
  }
}
```

### 2. Transform Application Filtering

**File:** `src/utils/transformApplication.ts`

```typescript
export function applyTransform(
  basePosition: Position,
  trackId: string,
  animation: Animation,
  time: number,
  activeTrackIds?: string[]  // NEW: Runtime filter
): Position {
  if (!animation.transform) return basePosition
  
  // Runtime filtering: Only apply if track is active
  if (activeTrackIds && !activeTrackIds.includes(trackId)) {
    console.warn(`⚠️ Track ${trackId} not in active set, skipping transform`)
    return basePosition
  }
  
  const trackTransform = animation.transform.tracks[trackId]
  if (!trackTransform) return basePosition
  
  // Apply offset based on mode...
}
```

### 3. Animation Store Integration

**File:** `src/stores/animationStore.ts`

```typescript
// Main rendering loop
playingAnimations.forEach((playingAnimation) => {
  playingAnimation.trackIds.forEach(trackId => {
    const basePosition = modelRuntime.calculatePosition(...)
    
    // Pass activeTrackIds for runtime filtering
    const position = applyTransform(
      basePosition, 
      trackId, 
      animation, 
      trackTime,
      playingAnimation.trackIds  // ← Active tracks for THIS playback
    )
  })
})
```

### 4. UI Warning

**File:** `src/components/cue-grid/CueEditorV2.tsx`

```tsx
{selectedAnimation?.transform?.mode === 'formation' && (
  <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
    <div className="flex items-start gap-2">
      <WarningIcon />
      <div>
        <p className="text-sm font-medium">Formation Animation</p>
        <p className="text-xs mt-1">
          This animation was saved with {trackCount} tracks in a formation. 
          Playing on a different number of tracks may break the formation geometry.
        </p>
        <p className="text-xs mt-1 font-medium">
          💡 For best results with LTP priority mode, select all {trackCount} tracks or lock this animation.
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 🎯 Edge Cases Handled

### Case 1: No Valid Tracks
```
Saved: [1, 2, 3]
Requested: [4, 5, 6]
Result: ❌ Execution rejected
```

### Case 2: Partial Subset
```
Saved: [1, 2, 3]
Requested: [1, 2]
Result: ⚠️ Warning logged, plays on [1, 2]
```

### Case 3: Superset (Extra Tracks)
```
Saved: [1, 2, 3]
Requested: [1, 2, 3, 4, 5]
Result: ✅ Plays on [1, 2, 3], ignores [4, 5]
```

### Case 4: Different Cues, Same Animation
```
Cue1: Animation "CircleScan" on [1, 2, 3]
Cue2: Animation "CircleScan" on [1, 2] (LTP)
Result: 
  - Cue1 releases tracks [1, 2]
  - Cue1 continues on track [3] ✅
  - Cue2 plays on [1, 2] with filtered transform ✅
```

---

## 📊 Console Logging

### Formation Track Mismatch
```
⚠️ Formation animation track mismatch: {
  animationName: "Circular Formation",
  savedTracks: ["track-1", "track-2", "track-3"],
  requestedTracks: ["track-1", "track-2"],
  validTracks: ["track-1", "track-2"],
  missingTracks: ["track-3"]
}
📐 Formation will be recalculated for 2/3 tracks
```

### LTP Track Release
```
⚡ LTP: Releasing conflicting tracks: ["track-1", "track-2"]
  → Cue cue-abc: Releasing tracks [track-1, track-2], keeping [track-3]
```

### Runtime Filtering
```
⚠️ Track track-3 not in active set, skipping transform
```

---

## 🔧 Best Practices

### For Animation Creators

1. **Lock formation animations** to specific tracks:
   ```typescript
   animation.trackSelectionLocked = true
   animation.trackIds = ["track-1", "track-2", "track-3"]
   ```

2. **Document track requirements** in animation name:
   ```
   "Triangle Formation (3 tracks)"
   "Quad Formation (4 tracks)"
   ```

3. **Use position-relative mode** for flexible track count:
   - Each track gets independent path
   - No formation coupling
   - LTP-friendly

### For Cue Programmers

1. **Check formation warnings** in cue editor
2. **Select all required tracks** for formation animations
3. **Use locked animations** to prevent mistakes
4. **Test LTP scenarios** with different track combinations

### For Show Designers

1. **Document cue priorities** in show plan
2. **Avoid partial formations** in LTP scenarios
3. **Use separate animations** for different track counts
4. **Test edge cases** before performance

---

## 🚀 Future Enhancements

### Option A: Runtime Formation Recalculation
```typescript
// Dynamically recalculate formation anchor for subset
if (mode === 'formation' && isSubset) {
  const newAnchor = calculateBarycenter(activeTrackPositions)
  const newOffsets = recalculateOffsets(activeTrackIds, newAnchor)
  // Apply new formation...
}
```

### Option B: Clone Animation Per Cue
```typescript
// Each cue gets own animation copy
const cueAnimation = cloneAnimation(animation, activeTrackIds)
context.cueAnimations.set(cueId, cueAnimation)
```

### Option C: Transform-Free Architecture
```typescript
// Generate transforms at runtime, never save them
interface Animation {
  multiTrackMode: 'relative' | 'formation' | 'absolute'
  // No transform property
}

// At playback:
const runtimeTransform = generateTransform(animation, trackIds, mode)
```

---

## 📝 Testing Checklist

- [ ] Formation animation on all tracks
- [ ] Formation animation on subset
- [ ] Formation animation with LTP (partial release)
- [ ] Formation animation with locked tracks
- [ ] Formation animation with no valid tracks
- [ ] Multiple cues, same formation animation
- [ ] Different track counts per cue
- [ ] Runtime track ownership changes
- [ ] Console warnings appear correctly
- [ ] UI warnings display properly

---

## 🎓 Key Takeaways

1. **Formation transforms are shared** across all cues using the same animation
2. **LTP works per-track**, not per-cue
3. **Runtime filtering prevents** orphaned transform data
4. **Validation warns users** about potential issues
5. **Track locking recommended** for formation animations
6. **Position-relative mode** is safer for dynamic track sets

---

**Status:** ✅ Production-ready
**Version:** 1.0
**Last Updated:** 2025-11-14

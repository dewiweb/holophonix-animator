# Feature: Refresh Track Position from Holophonix

## Overview

Allows users to refresh a track's position from the connected Holophonix device. This is useful when the track position has been changed directly in Holophonix and you want to sync it back to the animator.

## Use Case

1. User creates animation with track at position (0, 0, 0)
2. User changes track position in Holophonix to (5, 3, 2)
3. User clicks "Refresh Position" button in animator
4. Track position and initialPosition are updated to (5, 3, 2)
5. New animations created will use the updated position as center/start point

## Implementation

### OSC Query
**Command:** `/get` with argument `/track/{trackIndex}/xyz` (or `/aed` based on coordinate system)

**Example:**
```
Address: /get
Args: ["/track/1/xyz"]
```

### Response Handling
When Holophonix responds with `/track/1/xyz [5.0, 3.0, 2.0]`:

- **If track is NOT animating:**
  - Updates `track.position` to (5, 3, 2)
  - Updates `track.initialPosition` to (5, 3, 2)
  - This becomes the new base position for animations

- **If track IS animating:**
  - Only updates `track.position` to (5, 3, 2)
  - Leaves `initialPosition` unchanged
  - Animation continues from its original center

## UI

### Refresh Button
**Location:** Track List, next to each track's control buttons

**Icon:** 🔄 RefreshCw (blue)

**Visibility:** Only shown for tracks with `holophonixIndex` assigned

**Requirements:**
- Active OSC connection to Holophonix device
- Track must have a Holophonix index

### Button Actions
1. Click Refresh button on a track
2. Sends OSC query to Holophonix
3. Waits for response (automatic via OSC message handler)
4. Position updates when response arrives
5. Console logs confirm the update

## Code Structure

### oscStore.ts

#### New Function: `refreshTrackPosition`
```typescript
refreshTrackPosition: async (trackId: string) => {
  // 1. Validate connection and track
  // 2. Get track's holophonixIndex
  // 3. Query coordinate system from settings
  // 4. Send /get query with /track/{index}/{xyz|aed}
}
```

#### Updated: `processIncomingMessage`
Position update handling now checks if track is animating:
```typescript
if (isAnimating) {
  // Only update current position
  updateTrack(id, { position: { x, y, z } })
} else {
  // Update both position and initialPosition
  updateTrack(id, { 
    position: { x, y, z },
    initialPosition: { x, y, z }
  })
}
```

### TrackList.tsx

#### New Handler: `handleRefreshPosition`
```typescript
const handleRefreshPosition = async (track: Track) => {
  // 1. Check OSC connection
  // 2. Validate holophonixIndex
  // 3. Call oscStore.refreshTrackPosition
}
```

#### New Button
Added RefreshCw button before Remove button in track controls.

## Workflow Example

### Scenario 1: Update Base Position
```
1. Track "Violin" at (0, 0, 0) in animator
2. Move to (10, 5, 0) in Holophonix console
3. Click Refresh on "Violin" in animator
4. Track position updates to (10, 5, 0)
5. initialPosition also updates to (10, 5, 0)
6. Create new circular animation
7. Center defaults to (10, 5, 0) ✅
```

### Scenario 2: Track Currently Animating
```
1. Circular animation running (center at 0, 0, 0)
2. Track currently at (3, 2, 0) during animation
3. User changes position in Holophonix to (5, 5, 5)
4. Click Refresh on track
5. Track.position updates to (5, 5, 5)
6. initialPosition stays at (0, 0, 0)
7. Animation parameters remain unchanged ✅
```

## Console Logging

### Refresh Position
```
🔄 Refreshing position for track 1: Violin
📤 Sent position query for track 1
📨 Processing incoming OSC message: /track/1/xyz [10, 5, 0]
✅ Updating track 1 position
🔄 Also updated initialPosition (track not animating)
```

### While Animating
```
🔄 Refreshing position for track 2: Cello
📤 Sent position query for track 2
📨 Processing incoming OSC message: /track/2/xyz [5, 5, 5]
✅ Updating track 2 position
(initialPosition NOT updated - track is animating)
```

## Integration with Animation System

The refresh feature integrates seamlessly with the animation parameter fix:

1. **Animation parameters use `initialPosition`** (from previous fix)
2. **Refresh updates `initialPosition`** (when not animating)
3. **Result:** Animation centers/start points stay correct even after refresh

## OSC Message Format

### Query (sent by animator)
```
Address: /get
Args: ["/track/1/xyz"]
```

### Response (from Holophonix)
```
Address: /track/1/xyz
Args: [10.0, 5.0, 0.0]
```

## Error Handling

### No OSC Connection
```
❌ No active OSC connection for position refresh
Alert: "Please connect to a Holophonix device first"
```

### Missing Holophonix Index
```
❌ Track not found or missing holophonixIndex
Alert: "Track has no Holophonix index assigned"
```

## Benefits

✅ Keeps animator in sync with Holophonix console changes
✅ Prevents animation parameter corruption
✅ Works with both xyz and aed coordinate systems
✅ Safe during animation playback
✅ Simple one-click operation per track
✅ Real-time feedback via console logs

## Testing

### Test 1: Refresh Static Track
1. Create track with index 1
2. Change position in Holophonix to (5, 5, 5)
3. Click Refresh button
4. Verify position shows (5, 5, 5)
5. Create new animation
6. Verify parameters use (5, 5, 5) as base

### Test 2: Refresh During Animation
1. Play circular animation (center 0, 0, 0)
2. Track moves around circle
3. Change position in Holophonix to (10, 10, 10)
4. Click Refresh
5. Verify position updates but initialPosition stays at (0, 0, 0)
6. Stop animation
7. Verify track returns to original (0, 0, 0)

### Test 3: Multiple Tracks
1. Import multiple tracks from Holophonix
2. Change positions for tracks 1, 3, 5 in Holophonix
3. Refresh each track individually
4. Verify only refreshed tracks update

## Future Enhancements

- Bulk refresh all tracks button
- Auto-refresh on reconnection
- Visual indicator when position differs from Holophonix
- Position sync mode (continuous monitoring)
- Undo/redo for position changes

---

**Date:** 2025-10-02  
**Status:** ✅ Implemented  
**Related:** BUG_FIX_PAUSE_POSITION.md

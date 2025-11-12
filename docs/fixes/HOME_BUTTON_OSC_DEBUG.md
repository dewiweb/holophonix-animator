# Home Button OSC Message Debugging

## Purpose

The Home button should return all tracks to their initial positions and send OSC messages to the device. This document explains the debug logging added to diagnose OSC message delivery.

## Debug Logging

When you click the Home button, you should see console logs like this:

### 1. Initial Summary
```
🏠 Home button: Returning 3 tracks to initial positions
  Track: Track 1 (holophonixIndex: 1)
  Track: Track 2 (holophonixIndex: 2)
  Track: Track 3 (holophonixIndex: 3)
```

**What to check:**
- Number of tracks should match selected tracks
- Each track should have a valid `holophonixIndex` (not undefined)
- If holophonixIndex is undefined, the track was never assigned a Holophonix index

### 2. Easing Progress
```
🔄 Easing frame 10: progress 33.7%, 3 messages added
🔄 Easing frame 20: progress 66.4%, 3 messages added
🔄 Easing frame 30: progress 98.1%, 3 messages added
```

**What to check:**
- Frames should progress from 0% to 100%
- `messages added` should match number of tracks with holophonixIndex
- If 0 messages added, tracks don't have holophonixIndex

### 3. OSC Batch Sending
```
📤 Home transition: Sending OSC batch with 3 messages
📤 Home transition: Sending OSC batch with 3 messages
📤 Home transition: Sending OSC batch with 3 messages
```

**What to check:**
- This log appears for each frame (30-60 times per second)
- Number of messages matches number of tracks
- If this doesn't appear, the OSC batch callback isn't being called

## Troubleshooting

### Issue: "holophonixIndex: undefined"

**Problem:** Track hasn't been assigned a Holophonix device index.

**Solution:**
1. Select the track in Track List
2. In track properties, set "Holophonix Index" to a number (1-64)
3. Or use "Import from Holophonix" to auto-assign indices

### Issue: "0 messages added"

**Problem:** No tracks have valid holophonixIndex values.

**Solution:** Same as above - assign holophonixIndex to tracks.

### Issue: No "📤 Sending OSC batch" logs

**Problem:** OSC batch manager callback isn't set up or OSC connection is inactive.

**Solution:**
1. Check OSC connection in Settings → OSC
2. Verify device IP and port are correct
3. Click "Connect" if not already connected
4. Try the Home button again

### Issue: Logs appear but device doesn't move

**Problem:** OSC messages are being sent but device isn't receiving them.

**Solutions:**
1. **Network issue:**
   - Check device IP is correct
   - Verify device and app are on same network
   - Try ping device IP from command line

2. **Port issue:**
   - Verify OSC port matches device configuration
   - Default Holophonix port is usually 9000 or 9001

3. **Message format:**
   - Check coordinate system (xyz vs aed)
   - Verify in Settings → Project → Coordinate System
   - Should match device expectations

4. **Device configuration:**
   - Check if tracks exist on device
   - Verify track indices are valid (1-64)
   - Check if device is in correct mode

## Expected Behavior

**Successful Home Button Operation:**

1. Click Home button
2. See `🏠 Home button: Returning X tracks` log
3. See repeated `🔄 Easing frame` logs showing progress
4. See repeated `📤 Sending OSC batch` logs
5. Visualizer smoothly moves tracks to initial positions
6. **Device tracks smoothly move to initial positions** ✅

## Removing Debug Logs

Once OSC messaging is working correctly, the debug logs can be removed or converted to `debugLog()` to reduce console noise in production.

**Files to edit:**
- `src/stores/animationStore.ts`
  - Lines 624-641: Remove or convert Home button logs
  - Lines 914-916: Remove or convert easing frame logs
  - Lines 632-634: Remove or convert OSC batch sending logs

Replace `console.log()` with `debugLog()` from `src/config/debug.ts` to make them conditional.

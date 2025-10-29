# OSC Real-Time Synchronization Configuration

## Priority: Low Latency Over Smoothness

The system is now configured for **real-time synchronization** between app and Holophonix device, with minimal latency (~50-100ms network only).

## Configuration Summary

### 1. Minimal UDP Buffer (64KB)
**File: `main.ts`**
```typescript
client.socket.setSendBufferSize(64 * 1024) // 64KB
```

- **Capacity**: ~500 messages (0.5 seconds max latency)
- **Philosophy**: Keep buffer shallow to prevent delayed playback
- **Trade-off**: May drop messages under extreme load (10+ tracks), but device stays in sync

### 2. Aggressive Queue Limits
**File: `main.ts`**
```typescript
const MAX_QUEUE_SIZE = 20 // Only 20 pending messages max
```

- Messages dropped if queue exceeds 20
- Prevents buffer buildup
- Warning shown if dropping occurs

### 3. Small Batch Sizes
**File: `oscBatchManager.ts`**
```typescript
private maxBatchSize: number = 10 // Small batches
```

- Max 10 tracks per batch
- Forces frequent flushes
- Reduces per-message latency

### 4. Fast Throttle Rates
**File: `oscBatchManager.ts`**
```typescript
private minThrottleRate: number = 50  // ~20 FPS
private maxThrottleRate: number = 100 // Max 100ms between sends
```

- Adaptive throttling: 50-100ms
- ~10-20 messages/second
- Balances network load with responsiveness

### 5. Latest-Position-Wins Strategy
**File: `oscBatchManager.ts`**
```typescript
// If track already in batch, replace with latest position
if (existingIndex !== -1) {
  this.pendingBatch.messages[existingIndex] = { trackIndex, position, coordSystem }
}
```

- **Critical for real-time**: Always sends LATEST position
- Drops stale positions from 100ms ago
- Device receives current state, not history

### 6. Aggressive Flush Triggers
**File: `animationStore.ts`**
```typescript
const shouldAttemptFlush = timeSinceLastFlush >= adaptiveRate || pendingCount >= 5
```

- Flushes every 50-100ms (adaptive rate)
- OR immediately if 5+ messages pending
- Prevents queue buildup during animation

### 7. Buffer Clearing on Stop
**File: `animationStore.ts`**
```typescript
window.electronAPI.oscClearDeviceBuffer(activeConnection.id)
```

- Recreates OSC client when animation stops
- Discards any buffered messages
- Ensures clean slate for return-to-initial

## Latency Analysis

### Total Latency Breakdown:

| Component | Latency | Notes |
|-----------|---------|-------|
| **Animation frame** | 16ms | 60 FPS generation |
| **Batch queuing** | 0-10ms | Latest-position-wins |
| **Adaptive throttle** | 50-100ms | Controlled send rate |
| **UDP buffer** | 0-50ms | 64KB, typically empty |
| **Network transit** | 1-50ms | LAN: 1-5ms, WiFi: 10-50ms |
| **Device processing** | 5-20ms | Holophonix internal |
| **TOTAL** | **72-246ms** | **Typical: ~100ms** |

### Comparison with Previous Configs:

| Configuration | Buffer | Queue | Latency | Sync Quality |
|---------------|--------|-------|---------|--------------|
| Original | 64KB | No limit | 50-200ms | ⚠️ Overflows |
| Balanced | 256KB | 100 msgs | 500-2000ms | ❌ Delayed |
| **Real-Time** | **64KB** | **20 msgs** | **100-250ms** | ✅ **Synchronized** |

## How It Works During Animation

```
Frame 1 (T=0ms):
  - App calculates Track 1 position: {x: 1.0, y: 2.0, z: 3.0}
  - Adds to batch
  
Frame 2 (T=16ms):
  - App calculates Track 1 position: {x: 1.1, y: 2.0, z: 3.0}
  - REPLACES previous position in batch (not yet sent)
  
Frame 3 (T=32ms):
  - App calculates Track 1 position: {x: 1.2, y: 2.0, z: 3.0}
  - REPLACES previous position in batch
  
Frame 4 (T=50ms):
  - Adaptive throttle triggers (50ms elapsed)
  - Sends ONLY latest position: {x: 1.2, y: 2.0, z: 3.0}
  - Device receives at T=100ms (50ms network latency)
  
Result: Device is ~100ms behind app, not 2 seconds ✅
```

## Message Dropping Strategy

### When Messages Are Dropped:

1. **Queue Overflow** - More than 20 messages pending
2. **Batch Full** - More than 10 tracks in batch (forces flush first)
3. **Stale Positions** - Newer position for same track (replaces old)

### What Gets Dropped:

- ❌ Old positions for same track (superseded by newer)
- ❌ Messages when queue > 20 (overflow protection)
- ✅ Latest position always kept and sent

### Warning Signs:

If you see:
```
⚠️ OSC message queue overflow for device abc123
```

**Causes:**
- Too many tracks (>10 simultaneous)
- Network congestion
- Device processing too slow

**Solutions:**
- Reduce active track count
- Check network connection
- Verify device isn't CPU overloaded

## Testing Real-Time Sync

### Visual Sync Test:
1. Create simple circular animation (2 tracks)
2. Start animation in app
3. Observe device movement
4. Should see ~100ms delay (imperceptible)

### Stress Test:
1. Create animation with 10 tracks
2. Start animation
3. Monitor console for overflow warnings
4. Reduce tracks if warnings appear

### Network Test:
1. Check ping time to device:
   ```bash
   ping 192.168.1.100
   ```
2. Should be < 10ms on LAN
3. WiFi may be 10-50ms

## Performance Tuning

### If Device Lags Behind:

**Symptom**: Device is 200-500ms behind app

**Solutions**:
1. Check network latency (ping)
2. Reduce track count
3. Verify device isn't overloaded
4. May need to reduce FPS (see throttle rate)

### If Messages Dropping:

**Symptom**: Jerky device movement

**Solutions**:
1. Reduce simultaneous tracks
2. Simplify animation complexity
3. Check network stability
4. Consider increasing MAX_QUEUE_SIZE to 30 (in main.ts)

### If Too Smooth (No Real-Time):

**Symptom**: Device continues after app stops

**Solutions**:
1. Reduce buffer size further (32KB)
2. Reduce MAX_QUEUE_SIZE to 10
3. Check buffer clearing is working

## Trade-offs Accepted

✅ **Accepted**: Occasional message drops under extreme load (10+ tracks)
✅ **Accepted**: Slightly less smooth motion (drops stale positions)
❌ **Not Accepted**: 2+ second delay between app and device
❌ **Not Accepted**: Device continuing after app stops

## Monitoring

### Console Messages:

**Normal Operation**:
```
✅ OSC client socket optimized: 64KB send buffer (low latency)
```

**Overflow Protection Active**:
```
⚠️ OSC message queue overflow for device abc123
```

**Buffer Clearing**:
```
🧹 Clearing OSC buffer for device abc123 (192.168.1.100:8000)
✅ OSC buffer cleared, client recreated
```

## Conclusion

System now prioritizes **real-time synchronization** over perfectly smooth delivery:

- ✅ Device stays within 100-250ms of app (mostly network latency)
- ✅ Latest positions always sent (stale positions dropped)
- ✅ Small buffers prevent delayed playback
- ✅ Aggressive flushing keeps queue shallow
- ✅ Buffer clearing ensures immediate stop

**Result**: Device and app move together in real-time ✅

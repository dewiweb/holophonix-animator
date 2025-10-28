# OSC Timing Tuning Guide

## Problem: Animation Drift Over Time

**Symptoms:**
- Animation starts in sync ✅
- Over time, device falls behind (increasing latency) ❌
- Occasional speed-up/slow-down (jitter) ❌

**Root Cause:**
Network cannot sustain 60 messages/second consistently. Variable delivery times accumulate into drift.

## Solution: Rate-Limited Sending (30 FPS)

### Configuration

**Throttle Rate: 33ms (30 FPS)**
```typescript
// animationStore.ts
const shouldFlush = timeSinceLastFlush >= 33 && pendingCount > 0
```

**Batch Size: 8 tracks**
```typescript
// oscBatchManager.ts
private maxBatchSize: number = 8
```

### Why 30 FPS?

| Rate | Network Load | Sync Quality | Jitter |
|------|-------------|--------------|--------|
| 60 FPS | Very High | ❌ Drifts | High |
| 30 FPS | Moderate | ✅ Stable | Low |
| 20 FPS | Low | ⚠️ Choppy | Very Low |

**30 FPS is the sweet spot:**
- Smooth enough for spatial audio (imperceptible to listeners)
- Low enough network load to prevent congestion
- Stable timing prevents drift

### How It Works

```
App generates positions at 60 FPS internally
    ↓
Every 33ms (30 FPS):
    ↓
Latest 8 track positions batched
    ↓
Single OSC bundle sent
    ↓
Device receives and processes
    ↓
Device stays in sync ✅
```

**Key mechanism:**
- App calculates at 60 FPS (smooth internal animation)
- Sends to device at 30 FPS (network-friendly)
- Device interpolates between updates (smooth playback)

### Batch Size Tuning

**Small batches (5 tracks):**
- ✅ Low latency per send
- ❌ More network packets
- ❌ Higher overhead

**Large batches (10+ tracks):**
- ✅ Fewer network packets
- ❌ Higher latency per send
- ❌ Can cause jitter

**Balanced (8 tracks):**
- ✅ Good efficiency
- ✅ Reasonable latency
- ✅ Stable timing

### Preventing Drift

**Problem:** Network delays accumulate over time

**Solution:**
1. Fixed send rate (33ms) prevents queue buildup
2. Latest-position-wins strategy drops stale data
3. Small buffer (64KB) prevents delayed playback
4. Buffer clearing on stop ensures clean state

### Performance Monitoring

**Check for drift:**
1. Start animation
2. Observe sync at T=0s (should be tight)
3. Check sync at T=30s (should remain tight)
4. Check sync at T=60s (should not drift)

**Warning signs:**
- Increasing latency over time = drift
- Variable speed = network jitter
- Choppy movement = send rate too low

### Tuning Parameters

**If experiencing drift:**
```typescript
// Reduce send rate
const shouldFlush = timeSinceLastFlush >= 50 // 20 FPS
```

**If too choppy:**
```typescript
// Increase send rate
const shouldFlush = timeSinceLastFlush >= 25 // 40 FPS
```

**If network congestion:**
```typescript
// Reduce batch size
private maxBatchSize: number = 5
```

**If too many packets:**
```typescript
// Increase batch size
private maxBatchSize: number = 10
```

## Current Configuration

**Optimized for:**
- Multi-track animations (2-10 tracks)
- LAN network (1-10ms latency)
- Holophonix device processing (5-20ms)

**Total latency budget:**
- App calculation: 16ms (60 FPS)
- Batching delay: 33ms (max)
- Network transit: 10ms (typical LAN)
- Device processing: 10ms
- **Total: ~70ms** (imperceptible)

## Testing Procedure

1. **Baseline test (2 tracks):**
   - Should be smooth and in sync
   - No drift over 60 seconds

2. **Stress test (8 tracks):**
   - Should remain smooth
   - Minimal drift over 60 seconds

3. **Network test:**
   - Check ping time to device
   - Should be < 10ms on LAN

4. **Drift test:**
   - Run 5-minute animation
   - Device should stay within 100ms of app

## Conclusion

30 FPS sending rate with 8-track batches provides optimal balance between:
- Smooth animation playback
- Network efficiency
- Timing stability
- Low latency

This prevents drift while maintaining real-time synchronization.

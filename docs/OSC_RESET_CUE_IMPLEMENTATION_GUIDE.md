# OSC & Reset Cue Implementation Guide

**Status**: Foundation complete, ready for UI + execution  
**Branch**: `develop`  
**Last Commit**: `859e46b` - Foundation for OSC and Reset cue types

---

## ✅ What's Done

### Foundation (859e46b)
- Added `cueType` state to CueEditorV2
- Added OSC cue state: `oscMessages`
- Added Reset cue state: `resetTrackIds`, `resetType`, `resetDuration`
- Fixed variable naming: `oscAddress` → `oscTriggerAddress`
- Cue type detection from loaded cue

### Previous Session
- ✅ Animation cues fully working
- ✅ Loop support complete (both execution + progress bar)
- ✅ Professional UI with progress bar
- ✅ LTP priority mode
- ✅ Auto-stop for non-looped animations

---

## 📋 TODO: OSC Cue Implementation

### 1. Add Cue Type Selector (CueEditorV2.tsx)

Add after "Basic Information" section:

```tsx
{/* Cue Type Selector */}
<div>
  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
    Cue Type
  </h3>
  <div className="grid grid-cols-3 gap-2">
    <button
      onClick={() => setCueType('animation')}
      className={`px-3 py-2 rounded-md ${
        cueType === 'animation'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      Animation
    </button>
    <button
      onClick={() => setCueType('osc')}
      className={`px-3 py-2 rounded-md ${
        cueType === 'osc'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      OSC
    </button>
    <button
      onClick={() => setCueType('reset')}
      className={`px-3 py-2 rounded-md ${
        cueType === 'reset'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      Reset
    </button>
  </div>
</div>
```

### 2. OSC Message Builder UI

Replace animation section with conditional rendering:

```tsx
{cueType === 'animation' && (
  // Existing animation UI
)}

{cueType === 'osc' && (
  <div>
    <h3>OSC Messages</h3>
    {oscMessages.map((msg, idx) => (
      <div key={idx} className="border p-3 rounded">
        <input
          type="text"
          placeholder="/osc/address"
          value={msg.address}
          onChange={(e) => {
            const newMsgs = [...oscMessages]
            newMsgs[idx].address = e.target.value
            setOscMessages(newMsgs)
          }}
        />
        {/* TODO: Add argument editor */}
        <button onClick={() => {
          const newMsgs = oscMessages.filter((_, i) => i !== idx)
          setOscMessages(newMsgs)
        }}>
          Remove
        </button>
      </div>
    ))}
    <button onClick={() => {
      setOscMessages([...oscMessages, {address: '', args: []}])
    }}>
      + Add Message
    </button>
  </div>
)}
```

### 3. Update handleSave for OSC Cues

```tsx
const handleSave = () => {
  if (!cue || !cueId) return
  
  const trigger = { /* ... */ }
  
  if (cueType === 'animation') {
    // Existing animation save logic
  } else if (cueType === 'osc') {
    updateCue(cueId, {
      name: cueName,
      description: cueDescription,
      number: cueNumber,
      color: cueColor,
      type: 'osc',
      data: {
        messages: oscMessages
      },
      triggers: [trigger]
    } as any)
  }
  
  onClose()
}
```

### 4. OSC Execution (storeV2/index.ts)

Complete `_executeOSCCue`:

```typescript
_executeOSCCue: async (cueId: string, cue: Cue, context: ExecutionContext) => {
  const cueData = (cue as any).data || {}
  const messages = cueData.messages || []
  
  if (messages.length === 0) {
    console.warn('OSC cue has no messages:', cueId)
    return
  }
  
  // Get OSC store
  const { useOSCStore } = await import('@/stores/oscStore')
  const oscStore = useOSCStore.getState()
  
  console.log('📡 Sending OSC messages:', messages)
  
  // Send each message
  for (const msg of messages) {
    if (msg.address) {
      oscStore.sendMessage({
        address: msg.address,
        args: msg.args || []
      })
    }
  }
  
  // Mark as executed (instant)
  context.activeCues.set(cueId, {
    id: generateId(),
    cueId,
    startTime: new Date(),
    state: 'completed',
    progress: 1,
    activeTargets: []
  })
  
  // Remove after short delay (OSC cues are instant)
  setTimeout(() => {
    const currentContext = get().executionContext
    currentContext.activeCues.delete(cueId)
    get().updateCue(cueId, { status: 'idle' })
    set({ executionContext: { ...currentContext } })
  }, 500)
  
  set({ executionContext: { ...context } })
}
```

---

## 📋 TODO: Reset Cue Implementation

### 1. Reset Track Selector UI

```tsx
{cueType === 'reset' && (
  <div>
    <h3>Reset Tracks</h3>
    
    {/* Reset Type */}
    <div>
      <label>Reset Type</label>
      <select value={resetType} onChange={(e) => setResetType(e.target.value)}>
        <option value="initial">To Initial Position</option>
        <option value="home">To Home (0,0,0)</option>
        <option value="custom">To Custom Position</option>
      </select>
    </div>
    
    {/* Duration */}
    <div>
      <label>Transition Duration (seconds)</label>
      <input
        type="number"
        value={resetDuration}
        onChange={(e) => setResetDuration(parseFloat(e.target.value))}
        min="0.1"
        max="10"
        step="0.1"
      />
    </div>
    
    {/* Track Selection */}
    <div>
      <label>Tracks to Reset</label>
      <div className="grid grid-cols-2 gap-2">
        {tracks.map(track => (
          <label key={track.id}>
            <input
              type="checkbox"
              checked={resetTrackIds.includes(track.id)}
              onChange={() => {
                if (resetTrackIds.includes(track.id)) {
                  setResetTrackIds(resetTrackIds.filter(id => id !== track.id))
                } else {
                  setResetTrackIds([...resetTrackIds, track.id])
                }
              }}
            />
            {track.name}
          </label>
        ))}
      </div>
    </div>
  </div>
)}
```

### 2. Update handleSave for Reset Cues

```tsx
else if (cueType === 'reset') {
  updateCue(cueId, {
    name: cueName,
    description: cueDescription,
    number: cueNumber,
    color: cueColor,
    type: 'reset',
    data: {
      trackIds: resetTrackIds,
      resetType: resetType,
      duration: resetDuration
    },
    triggers: [trigger]
  } as any)
}
```

### 3. Reset Execution (storeV2/index.ts)

Complete `_executeResetCue`:

```typescript
_executeResetCue: async (cueId: string, cue: Cue, context: ExecutionContext) => {
  const cueData = (cue as any).data || {}
  const trackIds = cueData.trackIds || []
  const resetType = cueData.resetType || 'initial'
  const duration = cueData.duration || 1.0
  
  if (trackIds.length === 0) {
    console.warn('Reset cue has no tracks:', cueId)
    return
  }
  
  console.log('🔄 Resetting tracks:', trackIds, 'to:', resetType)
  
  // Get project store for initial positions
  const { useProjectStore } = await import('@/stores/projectStore')
  const projectStore = useProjectStore.getState()
  
  // Get animation store for smooth movement
  const { useAnimationStore } = await import('@/stores/animationStore')
  const animationStore = useAnimationStore.getState()
  
  // Determine target positions
  const targetPositions = trackIds.map(trackId => {
    const track = projectStore.tracks.find(t => t.id === trackId)
    if (!track) return null
    
    let targetPos
    if (resetType === 'initial') {
      targetPos = track.initialPosition || { x: 0, y: 0, z: 0 }
    } else if (resetType === 'home') {
      targetPos = { x: 0, y: 0, z: 0 }
    } else {
      targetPos = cueData.customPosition || { x: 0, y: 0, z: 0 }
    }
    
    return { trackId, from: track.position, to: targetPos }
  }).filter(Boolean)
  
  // Use animation store's easing function to smoothly move tracks
  animationStore._easeToPositions(targetPositions, duration * 1000, () => {
    // Done - mark cue as complete
    const currentContext = get().executionContext
    currentContext.activeCues.delete(cueId)
    get().updateCue(cueId, { status: 'idle' })
    set({ executionContext: { ...currentContext } })
  })
  
  // Track execution
  context.activeCues.set(cueId, {
    id: generateId(),
    cueId,
    startTime: new Date(),
    state: 'running',
    activeTargets: trackIds
  })
  
  get().updateCue(cueId, { status: 'active' })
  set({ executionContext: { ...context } })
}
```

---

## 🧪 Testing Checklist

### OSC Cues
- [ ] Create OSC cue
- [ ] Add message with address
- [ ] Trigger cue
- [ ] Check console for OSC send
- [ ] Verify message received in target

### Reset Cues
- [ ] Create reset cue
- [ ] Select tracks
- [ ] Choose reset type (initial/home)
- [ ] Set duration
- [ ] Trigger cue
- [ ] Watch tracks move smoothly

---

## 📝 Notes

### OSC Message Format
```typescript
{
  address: string,  // e.g., "/my/osc/address"
  args: any[]      // e.g., [1, 2.5, "hello"]
}
```

### OSC Store Methods
- `useOSCStore().sendMessage(message)`
- Check `src/stores/oscStore.ts` for exact API

### Animation Store Methods
- `_easeToPositions(targets, duration, onComplete)`
- May need to implement if not exists

---

## 🚀 Estimated Time

- **OSC UI**: 1 hour
- **OSC Execution**: 30 min
- **Reset UI**: 1 hour  
- **Reset Execution**: 1 hour
- **Testing**: 30 min

**Total**: ~4 hours

---

## 📊 Current Session Stats

```
Commits This Session: 11
Lines Added: 250+
Features Complete:
  ✅ Animation cues with loop
  ✅ Progress bar with loop
  ✅ Cue button UI
  ✅ LTP priority
  ✅ Auto-stop
  ✅ Foundation for OSC/Reset

Next: Full OSC + Reset implementation
```

---

**Ready to continue when you are!** 🚀

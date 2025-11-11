# Barycenter vs Animation Center - Clarification

**Important:** These are two **independent** concepts in barycentric formation modes!

---

## 1. Animation Path Center (Model Parameters)

**What it is:**
- Parameters like `circular.center`, `linear.startPosition`, `pendulum.anchorPoint`
- Defines where the **barycenter moves** along the animation path
- This is what the animation model calculates

**Examples:**
```typescript
circular: {
  center: {x: 10, y: 5, z: 0},  // Barycenter follows circle around this point
  radius: 3
}

linear: {
  startPosition: {x: -5, y: 0, z: 0},  // Barycenter moves from here
  endPosition: {x: 5, y: 0, z: 0}      // to here
}
```

**In the UI:**
- Edited in the **Animation Parameters Form**
- Control points in 3D view (for path definition)
- Defines the **path** the barycenter follows over time

---

## 2. Formation Barycenter (Transform Anchor)

**What it is:**
- The anchor point for calculating track offsets
- Where tracks are positioned relative to
- Independent from the animation path!

**Variants:**

### Isobarycentric
- **Auto-calculated** as geometric center of all tracks
- Formula: `{x: avg(track.x), y: avg(track.y), z: avg(track.z)}`
- Cannot be edited (read-only display in UI)

### User-Defined (Shared, Centered, Custom)
- **Manually set** by user
- Edited in **Multi-Track Mode Selector** → "Formation Barycenter" section
- Can be different from animation path center!

**Examples:**
```typescript
// Circular animation around (10, 5, 0)
// But formation barycenter at origin (0, 0, 0)
animation: {
  type: 'circular',
  parameters: {
    center: {x: 10, y: 5, z: 0},  // Barycenter circles around here
    radius: 3
  },
  transform: {
    mode: 'formation',
    formation: {
      anchor: {x: 0, y: 0, z: 0},  // But tracks start offset from here!
      pattern: 'rigid'
    }
  }
}
```

**Result:**
- Tracks maintain offsets from `{0, 0, 0}`
- The whole formation circles around `{10, 5, 0}`
- Formation shape stays rigid, barycenter moves along circular path

---

## How They Work Together

### Step 1: Model Calculates Barycenter Path Position
```typescript
// At time t=2s, circular model calculates:
barycentricPosition = circular.calculate({
  center: {x: 10, y: 5, z: 0},  // Animation path center
  radius: 3,
  // ... time: 2s
})
// Returns: {x: 13, y: 5, z: 0}  (barycenter position on circle)
```

### Step 2: Tracks Positioned Relative to Barycenter
```typescript
// Tracks maintain offsets from formation barycenter (anchor)
track1.offset = {x: -1, y: 0, z: 0}  // 1m left of anchor
track2.offset = {x: 1, y: 0, z: 0}   // 1m right of anchor

// Final positions = barycentricPosition + offsets
track1.position = {x: 13 + (-1), y: 5, z: 0} = {x: 12, y: 5, z: 0}
track2.position = {x: 13 + 1, y: 5, z: 0} = {x: 14, y: 5, z: 0}
```

---

## Common Scenarios

### Scenario 1: Circular Formation Around Moving Point
```typescript
// Formation barycenter = animation center (most common)
parameters.center = {x: 0, y: 0, z: 0}
formation.anchor = {x: 0, y: 0, z: 0}

Result: Formation circles around origin, tracks maintain offsets
```

### Scenario 2: Formation Offset from Animation Path
```typescript
// Formation barycenter ≠ animation center (advanced)
parameters.center = {x: 10, y: 0, z: 0}  // Circle around here
formation.anchor = {x: 0, y: 0, z: 0}    // But offsets from here

Result: Tracks start at their offsets from origin,
        then whole formation circles around (10, 0, 0)
```

### Scenario 3: Linear Movement with Formation
```typescript
parameters.startPosition = {x: -10, y: 0, z: 0}
parameters.endPosition = {x: 10, y: 0, z: 0}
formation.anchor = {x: 0, y: 0, z: 0}

Result: Formation moves linearly from -10 to +10,
        tracks maintain offsets from anchor
```

---

## UI Terminology (After Fix)

| Old (Confusing) | New (Clear) |
|-----------------|-------------|
| "Center Position" | "🎯 Formation Barycenter" |
| "Auto-Calculated Center" | "🟠 Auto-Calculated Formation Barycenter (Geometric Center)" |
| "User-defined center" | "User-defined barycenter" |
| "center in 3D view" | "barycenter in 3D view" |

**Key distinction in UI:**
- **Animation Parameters** tab: Edit animation path center (where barycenter moves)
- **Multi-Track Mode** section: Edit formation barycenter (anchor for offsets)

---

## Why They're Independent

**Design rationale:**
1. **Flexibility:** You might want formation centered at origin but animating around a different point
2. **Simplicity:** Animation parameters stay in absolute coordinates
3. **Clarity:** Separation of concerns (path definition vs formation anchor)
4. **Reusability:** Same animation can be applied with different formation anchors

**Real-world example:**
- Animation: "Circle around spotlight at (5, 10, 0)"
- Formation: "Speakers in triangle around origin"
- Result: Speaker triangle circles around spotlight position

---

## Summary

**Animation Path Center** (parameters.center):
- 🎯 WHERE the barycenter moves
- Defines the animation path
- Edited in parameter form

**Formation Barycenter** (transform.anchor):
- 📍 WHERE tracks are offset from
- Defines formation shape
- Auto-calculated OR user-defined

**They are independent!** This gives maximum flexibility in designing multi-track animations.

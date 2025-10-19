# Multi-Track Animation Modes - Redesign

## Overview
Redesign of multi-track animation modes to provide more useful and intuitive behaviors for spatial audio applications.

## Current Limitations
- **identical**: All tracks overlap on same path → Limited practical use
- **phase-offset**: Same path with time offset → Narrow use case
- **position-relative**: Good concept but can only edit first track's control points
- **phase-offset-relative**: Combines position-relative + timing offset

## Proposed Mode Architecture

### 1. Position-Relative Mode (ENHANCED)
**Concept**: Each track gets its own independent path centered on its initial position.

**Current Problem**: Can only edit control points for the first selected track (the "reference").

**Enhancement**: 
- Add track selector in `SelectedTracksIndicator` component
- Allow switching between tracks to edit individual control points
- ControlPointEditor shows active track's control points
- Visual indication of which track is being edited (highlight, badge, etc.)

**UI Flow**:
```
SelectedTracksIndicator:
  [Track 1* (editing)] [Track 2] [Track 3]
  
ControlPointEditor:
  Shows Track 1's control points (editable)
  
Click Track 2:
  → ControlPointEditor switches to Track 2's control points
```

**Use Cases**:
- Custom spatial patterns where each source has unique trajectory
- Individual speaker movements in array
- Independent sound source behaviors

---

### 2. Isobarycenter/Formation Mode (NEW)
**Concept**: Animation applies to the barycenter (center of mass) of all selected tracks. Each track maintains its offset vector from the barycenter, including rotation.

**Behavior**:
1. Calculate initial barycenter: `B₀ = (Σ Ti.position) / n`
2. Calculate each track's offset: `offset_i = Ti.position - B₀`
3. At time t:
   - Calculate new barycenter position from animation: `B(t)`
   - If animation includes rotation, apply rotation matrix to offsets
   - New position: `Ti(t) = B(t) + rotated(offset_i)`

**Rotation Behavior**:
- If animation path rotates (circular, orbit, etc.), the entire formation rotates around barycenter
- Tracks maintain relative distances and angles
- Formation stays "locked" as a rigid body

**Example - Circular Motion**:
```
Initial:
  Track A: (0, 0, 0)
  Track B: (5, 0, 0)
  Track C: (0, 5, 0)
  Barycenter: (1.67, 1.67, 0)
  
Animation: Circular path radius=10 around origin
  → Barycenter moves in circle
  → Triangle formation rotates while moving
  → Tracks maintain 5-meter spacing
```

**Use Cases**:
- Moving speaker arrays with maintained geometry
- Synchronized multi-source formations
- Dome or immersive array movements
- Holophonic soundfield translations

**UI**:
- Control points edit the barycenter path
- Preview shows all tracks moving in formation
- Optional: "Lock rotation" toggle if user wants translation only

---

### 3. Leader/Followers Mode (NEW CONCEPT)
**Concept**: First selected track is the "leader" with explicit path. Other tracks follow with elastic/spring-like behavior.

**Differences from position-relative + phase-offset-relative**:

| Feature | Position-Relative | Phase-Offset-Relative | Leader/Followers |
|---------|-------------------|----------------------|------------------|
| Path independence | ✅ Fully independent | ✅ Fully independent | ❌ Followers reference leader |
| Timing | Simultaneous | Staggered offsets | Dynamic lag/elasticity |
| Spatial relationship | Fixed centers | Fixed centers + time | Dynamic distance maintenance |
| Follow behavior | None | None | Spring/elastic following |
| Formation flexibility | Rigid (each path predefined) | Rigid (each path predefined) | Soft/organic (adaptive) |

**Suggested Parameters**:
- **Follow Distance**: Target distance each follower tries to maintain from leader
- **Follow Stiffness**: How rigidly followers track leader (0=loose, 1=tight)
- **Follow Lag**: Time delay in follower response (seconds)
- **Follow Damping**: How much followers overshoot/oscillate

**Behavior**:
```typescript
// Physics-based following
for each follower:
  direction = normalize(leader.position - follower.position)
  distance = length(leader.position - follower.position)
  
  // Spring force toward target distance
  targetDistance = followDistance
  springForce = stiffness * (distance - targetDistance)
  
  // Apply with damping
  velocity += springForce * dt
  velocity *= (1 - damping * dt)
  position += velocity * dt
```

**Use Cases**:
- Organic, flowing multi-source movements
- Sound swarm behaviors
- Convoy/procession effects
- Echo/reverberation spatial trails

**Visual Example**:
```
Leader path: ————————————>
Follower 1:   ~~~~~> (loose, lagging)
Follower 2:     ~~~~> (loose, lagging more)
Follower 3:       ~~~> (loose, lagging most)
```

---

## Mode Comparison Matrix

| Mode | Paths | Timing | Formation | Complexity | Best For |
|------|-------|--------|-----------|------------|----------|
| **Position-Relative** | Independent per track | Synchronized | None | Medium | Custom individual trajectories |
| **Phase-Offset-Relative** | Independent per track | Staggered | None | Medium | Cascading patterns, waves |
| **Isobarycenter** | Single (barycenter) | Synchronized | Rigid formation | Low | Array movements, formations |
| **Leader/Followers** | Leader + physics | Dynamic lag | Soft/elastic | High | Organic following, swarms |
| ~~Identical~~ (hidden) | Single (all overlap) | Synchronized | Complete overlap | Low | (Deprecated) |

---

## Implementation Plan

### Phase 1: UI Enhancements (Position-Relative)
1. Add active track selector to `SelectedTracksIndicator`
2. Enhance `ControlPointEditor` to switch between tracks
3. Store per-track control point data
4. Visual feedback for active editing track

### Phase 2: Isobarycenter Mode
1. Add barycenter calculation utility
2. Implement offset preservation logic
3. Add rotation transformation for animated paths
4. Update animation engine to support formation mode
5. Add UI toggle for "Lock Rotation" option

### Phase 3: Leader/Followers Mode
1. Implement spring physics for follower movement
2. Add parameter controls (distance, stiffness, lag, damping)
3. Create follower state management in animation engine
4. Real-time physics simulation during playback

### Phase 4: Code Cleanup
1. Hide "identical" mode from UI (keep internal for compatibility)
2. Update mode compatibility checks
3. Add mode descriptions/tooltips
4. Update documentation

---

## Technical Considerations

### Storage Format
```typescript
// Position-relative: Store per-track parameters
animation: {
  type: 'circular',
  multiTrackMode: 'position-relative',
  trackParameters: {
    'track-1': { center: {x:0, y:0, z:0}, radius: 5 },
    'track-2': { center: {x:10, y:0, z:0}, radius: 3 },
    'track-3': { center: {x:0, y:10, z:0}, radius: 7 }
  }
}

// Isobarycenter: Store barycenter path + initial offsets
animation: {
  type: 'circular',
  multiTrackMode: 'isobarycenter',
  barycentricParameters: {
    center: {x:5, y:5, z:0},
    radius: 10,
    lockRotation: false
  },
  initialOffsets: {
    'track-1': {x: -5, y: -5, z: 0},
    'track-2': {x: 5, y: -5, z: 0},
    'track-3': {x: 0, y: 5, z: 0}
  }
}

// Leader/Followers: Store leader path + follower physics
animation: {
  type: 'linear',
  multiTrackMode: 'leader-followers',
  leaderTrackId: 'track-1',
  leaderParameters: {
    startPosition: {x:0, y:0, z:0},
    endPosition: {x:20, y:20, z:0}
  },
  followParameters: {
    distance: 3,
    stiffness: 0.7,
    lag: 0.5,
    damping: 0.3
  }
}
```

### Compatibility Matrix
Which animation types work with which modes?

| Animation Type | Position-Relative | Isobarycenter | Leader/Followers |
|----------------|-------------------|---------------|------------------|
| Linear | ⚠️ Limited use | ✅ Yes | ✅ Yes |
| Circular | ✅ Yes | ✅ Yes | ✅ Yes |
| Spiral | ✅ Yes | ✅ Yes | ✅ Yes |
| Wave | ✅ Yes | ✅ Yes | ✅ Yes |
| Custom | ⚠️ Complex | ✅ Yes | ✅ Yes |
| Bézier | ⚠️ Limited use | ✅ Yes | ✅ Yes |

---

## User Experience Flow

### Scenario 1: Position-Relative Editing
1. Select 3 tracks
2. Choose "Position-Relative" mode
3. Select animation type (e.g., Circular)
4. Click on Track 1 badge → Edit its control points
5. Click on Track 2 badge → Edit different control points
6. Click on Track 3 badge → Edit different control points
7. Preview shows 3 independent circular paths
8. Save → Creates 3 separate animations

### Scenario 2: Isobarycenter Formation
1. Select speaker array (5 tracks in dome formation)
2. Choose "Isobarycenter/Formation" mode
3. Select animation type (e.g., Circular scan)
4. Edit control points → Edits path of formation center
5. Toggle "Lock Rotation" if needed
6. Preview shows entire array moving as rigid formation
7. Save → All tracks maintain relative positions

### Scenario 3: Leader/Followers Organic Movement
1. Select 4 tracks
2. Choose "Leader/Followers" mode
3. First track automatically becomes leader
4. Edit leader path (linear, spiral, etc.)
5. Adjust follower parameters (distance, stiffness, lag)
6. Preview shows organic following behavior
7. Save → Leader follows explicit path, followers use physics

---

## Next Steps
1. Review and approve design concept
2. Prioritize which modes to implement first
3. Create detailed technical specifications
4. Begin Phase 1 implementation (Position-Relative enhancements)

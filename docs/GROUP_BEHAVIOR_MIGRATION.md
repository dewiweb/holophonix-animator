# Group Behavior Migration Guide 

This guide helps you migrate existing behaviors to work with the new group behavior system.

## Table of Contents
- [Overview](#overview)
- [Leader-Follower Migration](#leader-follower-migration)
- [Isobarycentric Migration](#isobarycentric-migration)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Implementation Status](#implementation-status)

## Overview

The group behavior system introduces two new ways to coordinate multiple tracks:

1. **Leader-Follower**: One track leads, others follow with configurable delay, offset, and scaling
2. **Isobarycentric**: Tracks move around a weighted center point with configurable radius and phase

## Implementation Status

### Completed 
- Linear Behavior Implementation
  * XYZ and AED coordinate support
  * Center offset support
  * Range-based motion
  * Dynamic parameter updates
  * Comprehensive testing

### In Progress 
- Leader-Follower System
- Isobarycentric System
- Group Parameter Management
- Group State Persistence

## Leader-Follower Migration

### Before
```typescript
// Old way: Manual position calculation
class MyBehavior extends BaseBehavior {
  update(time: number) {
    const leaderPos = calculateLeaderPosition(time);
    const followerPos = {
      x: leaderPos.x + offset,
      y: leaderPos.y + offset,
      z: leaderPos.z + offset
    };
    return followerPos;
  }
}
```

### After
```typescript
// New way: Using LeaderFollowerManager and type-safe positions
import { LeaderFollowerManager } from '../behaviors/group/leader-follower';
import { createXYZPosition } from '../types/position';

const leader = new LinearBehavior();
const manager = new LeaderFollowerManager(leader);

// Add followers with configuration
manager.addFollower(trackId, new LinearBehavior(), {
  offset: createXYZPosition(5, 5, 5),
  delay: 1.0, // 1 second delay
  scale: 1.5  // 1.5x scaling
});

// Update all positions at once
const positions = manager.update(time);
```

## Isobarycentric Migration

### Before
```typescript
// Old way: Manual center calculation
class GroupBehavior extends BaseBehavior {
  update(time: number) {
    const positions = tracks.map(track => {
      const center = calculateCenter();
      const angle = time * track.speed;
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y,
        z: center.z + Math.sin(angle) * radius
      };
    });
    return positions;
  }
}
```

### After
```typescript
// New way: Using IsobarycentricManager and type-safe positions
import { IsobarycentricManager } from '../behaviors/group/isobarycentric';
import { createXYZPosition } from '../types/position';

const manager = new IsobarycentricManager();

// Add members with configuration
manager.addMember(trackId, new LinearBehavior(), {
  weight: 1.0,    // Influence on center
  radius: createXYZPosition(10, 0, 0),   // Distance from center
  phase: 0,       // Starting angle
  speed: 1.0      // Rotation speed
});

// Update all positions at once
const positions = manager.update(time);
```

## Best Practices

1. **Position Types**
   - Always use the type-safe position creation functions
   - Convert between coordinate systems using provided utilities
   - Validate positions before using them

2. **Parameter Handling**
   - Use the provided parameter definitions
   - Validate parameters when setting them
   - Keep parameters within defined ranges

3. **Performance**
   - Cache calculated positions when possible
   - Use batch updates for multiple tracks
   - Monitor update times in performance-critical sections

4. **Error Handling**
   - Check for null/undefined positions
   - Validate member IDs before operations
   - Handle removal of non-existent members gracefully

## Examples

### Complex Leader-Follower Setup
```typescript
// Create a sine wave leader
const leader = new SineWaveBehavior();
leader.setParameters({
  axis: 0,
  frequency: 1,
  amplitude: 10,
  phase: 0
});

const manager = new LeaderFollowerManager(leader);

// Add followers with different configurations
for (let i = 0; i < 5; i++) {
  const follower = new SineWaveBehavior();
  follower.setParameters({
    axis: 0,
    frequency: 1,
    amplitude: 10,
    phase: 0
  });
  
  manager.addFollower(i, follower, {
    offset: createXYZPosition(i * 2, 0, i * 2),
    delay: i * 0.2,
    scale: 1.0 - (i * 0.1)
  });
}
```

### Dynamic Isobarycentric Group
```typescript
// Create a group with mixed behaviors
const manager = new IsobarycentricManager();

// Add circular motion member
const circle = new CircleBehavior();
circle.setParameters({
  plane: 0,
  radius: 10,
  speed: 1,
  phase: 0
});

manager.addMember(1, circle, {
  weight: 2.0,
  radius: createXYZPosition(15, 0, 0),
  phase: 0,
  speed: 1
});

// Add sine wave member
const sine = new SineWaveBehavior();
sine.setParameters({
  axis: 0,
  frequency: 0.5,
  amplitude: 10,
  phase: 90
});

manager.addMember(2, sine, {
  weight: 1.0,
  radius: createXYZPosition(10, 0, 0),
  phase: 180,
  speed: 0.5
});
```

## Troubleshooting

### Common Issues

1. **Incorrect Position Updates**
   - Check that time values are consistent
   - Verify parameter ranges
   - Ensure coordinate systems match

2. **Performance Problems**
   - Reduce number of members if possible
   - Cache frequently accessed values
   - Use batch updates when possible

3. **Type Errors**
   - Use type-safe position creation
   - Check parameter types
   - Verify coordinate system conversions

### Debug Tips

1. Enable position logging:
```typescript
manager.update(time).forEach((pos, id) => {
  console.log(`Track ${id}:`, pos);
});
```

2. Monitor performance:
```typescript
const start = performance.now();
manager.update(time);
const duration = performance.now() - start;
console.log(`Update took ${duration}ms`);
```

3. Validate member states:
```typescript
manager.members.forEach((member, id) => {
  console.log(`Member ${id}:`, {
    weight: member.config.weight,
    radius: member.config.radius,
    phase: member.config.phase
  });
});
```

# Known Bugs and Issues

This document tracks known bugs and issues in the Holophonix Animator that need to be addressed. Each entry includes a description, steps to reproduce, expected behavior, and priority level.

## Legend
- **P1**: Critical - Must fix immediately (blocking)
- **P2**: High - Should be fixed soon
- **P3**: Medium - Nice to have, but not critical
- **P4**: Low - Minor issues, can be deferred

## Open Issues

### P1: Critical

#### [BUG-001] Random Motion Trajectory Inconsistency
- **Description**: Random Motion animation recalculates trajectory every frame instead of maintaining a fixed path
- **Repro Steps**:
  1. Create a Random Motion animation
  2. Play the animation
  3. Observe that the path changes every time the animation loops
- **Expected**: The random path should be calculated once at the start and remain consistent during playback
- **Status**: Needs fix

#### [BUG-002] Animation Playback Stutter
- **Description**: Occasional stuttering during animation playback, especially with multiple tracks
- **Repro Steps**:
  1. Create a complex animation with 5+ tracks
  2. Play the animation
  3. Observe frame drops after 2-3 minutes
- **Expected**: Smooth playback regardless of duration
- **Status**: Investigating

### P2: High

#### [BUG-002] OSC Message Loss Under Heavy Load
- **Description**: Some OSC messages are dropped when animating many tracks simultaneously
- **Repro Steps**:
  1. Create 20+ tracks with fast animations
  2. Enable OSC output
  3. Monitor Holophonix for missing position updates
- **Expected**: All position updates should be delivered reliably
- **Status**: Needs optimization

### P3: Medium

#### [BUG-003] Undo/Redo Inconsistent with Multi-track Edits
- **Description**: Undo/Redo doesn't properly handle multi-track operations
- **Repro Steps**:
  1. Select multiple tracks
  2. Apply position changes
  3. Press Ctrl+Z
- **Expected**: All track positions should revert
- **Actual**: Only the last track's changes are undone
- **Status**: Confirmed

#### [BUG-004] Memory Leak in Animation Preview
- **Description**: Memory usage increases over time when previewing animations
- **Repro Steps**:
  1. Open animation preview
  2. Switch between different animations for 10+ minutes
  3. Monitor memory usage
- **Expected**: Stable memory usage
- **Status**: Under investigation

### P4: Low

#### [BUG-005] Tooltip Persistence
- **Description**: Tooltips sometimes remain visible after moving mouse away
- **Repro Steps**:
  1. Hover over a parameter
  2. Quickly move mouse to another part of the UI
- **Expected**: Tooltip should disappear immediately
- **Status**: Confirmed, low priority

## Fixed Issues

### [FIXED-001] Timeline Zoom Reset on Playback
- **Fixed in**: v1.2.3
- **Description**: Timeline zoom was resetting when playback started
- **Resolution**: Preserve zoom level during playback

## Reporting New Bugs
When reporting a new bug, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment details (OS, browser, Holophonix version)
5. Any error messages or console logs

# Holophonix Animator Manual Test Plan

## Overview
This document outlines the manual testing procedures for the Holophonix Animator application. These tests should be performed after any significant changes and before releases to ensure the application functions correctly.

## Test Environment Setup
1. Ensure Holophonix simulator or device is running and accessible
2. Clear any existing saved states
3. Start the Holophonix Animator application

## Test Categories

### 1. Connection Management
#### OSC Connection
- [ ] Connect to Holophonix using default settings (localhost:4003)
- [ ] Connect using custom IP and port
- [ ] Verify connection status updates correctly
- [ ] Test connection with invalid settings
- [ ] Verify graceful handling of connection loss
- [ ] Test reconnection functionality

### 2. Track Management
#### Track Creation
- [ ] Create a new track
- [ ] Verify track appears in track list
- [ ] Verify default position (0,0,0)
- [ ] Create multiple tracks
- [ ] Verify unique IDs for each track

#### Track Position Control
- [ ] Change position using position visualizer
- [ ] Verify real-time OSC updates
- [ ] Test position bounds (-1 to 1)
- [ ] Test Z-axis control
- [ ] Verify position display updates

### 3. Animation Control
#### Timeline Controls
- [ ] Play animation
- [ ] Pause animation
- [ ] Stop/Reset animation
- [ ] Verify time display updates
- [ ] Test timeline scrubbing
- [ ] Verify playback speed control

#### Keyframe Management
- [ ] Add keyframe at current position
- [ ] Add keyframe at specific time
- [ ] Delete keyframe
- [ ] Move keyframe
- [ ] Verify keyframe interpolation
- [ ] Test keyframe selection

### 4. State Management
#### Save/Load State
- [ ] Save current state
- [ ] Load saved state
- [ ] Verify all tracks restored
- [ ] Verify keyframes restored
- [ ] Test loading invalid state file
- [ ] Test auto-save functionality

### 5. UI Responsiveness
#### Performance Tests
- [ ] Smooth animation playback
- [ ] Responsive position updates
- [ ] Multiple track handling
- [ ] Long timeline performance
- [ ] UI updates during heavy load

### 6. Error Handling
#### Error Scenarios
- [ ] Network disconnection
- [ ] Invalid OSC messages
- [ ] File system errors
- [ ] Memory exhaustion
- [ ] Verify error messages
- [ ] Test recovery procedures

## Test Execution

### Prerequisites
1. Clean test environment
2. Latest application build
3. Holophonix simulator running
4. Test data files available

### Test Procedure
1. Execute tests in order listed
2. Mark each test as Pass/Fail
3. Document any unexpected behavior
4. Note system conditions for failures
5. Capture screenshots of issues

### Test Results Template
```
Test ID: 
Category: 
Description: 
Steps:
1. 
2. 
3. 
Expected Result: 
Actual Result: 
Status: [Pass/Fail]
Notes: 
```

## Regression Testing
After fixing any issues:
1. Retest failed scenarios
2. Perform smoke test of related features
3. Verify no new issues introduced

## Performance Metrics
Track and verify:
- Position update latency (target: <5ms)
- UI frame rate (target: 60 FPS)
- Memory usage (target: <100MB)
- OSC message latency (target: <10ms)

## Issue Reporting
For any failures:
1. Document exact steps to reproduce
2. Note system configuration
3. Capture relevant logs
4. Record error messages
5. Take screenshots if applicable

## Sign-off Criteria
- All critical tests passed
- No blocking issues
- Performance metrics met
- Documentation updated
- All regressions verified

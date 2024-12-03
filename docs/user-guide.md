# Holophonix Animator User Guide

## Introduction
Holophonix Animator is a powerful tool for creating and managing spatial audio animations. This guide will help you get started and make the most of its features.

## Getting Started

### Installation
1. Ensure you have Node.js (v14 or later) installed
2. Clone the repository
3. Run `npm install` to install dependencies
4. Start the application with `npm start`

### Initial Setup
1. Launch Holophonix Animator
2. Configure OSC connection settings (default: localhost:4003)
3. Click "Connect" to establish communication with Holophonix

## Core Features

### Connection Management
- **Connect/Disconnect**: Use the connection panel to manage OSC connection
- **Status Indicator**: Shows current connection state
- **Settings**: Configure host, send port, and receive port

### Track Control
#### Creating Tracks
1. Click "Add Track" button
2. Track appears in track list with default position (0,0,0)
3. Select track to edit its properties

#### Position Control
- Use Position Visualizer to set track position:
  - Click and drag to change X/Y coordinates
  - Use scroll wheel or slider for Z-axis
  - Direct input available for precise control
- Position bounds: -1 to 1 on all axes

### Animation
#### Timeline Controls
- **Play/Pause**: Start/stop animation playback
- **Reset**: Return to start of timeline
- **Time Display**: Shows current playback position
- **Scrubbing**: Click and drag on timeline to change position

#### Keyframe Management
1. Move track to desired position
2. Click "Add Keyframe" at current time
3. Add multiple keyframes to create animation path
4. Edit keyframes by:
   - Dragging to new time
   - Updating position
   - Deleting unwanted keyframes

### State Management
- **Save**: Store current tracks and animations
- **Load**: Restore previously saved state
- **Auto-save**: Periodic state backup (every 5 minutes)

## Tips and Best Practices

### Performance Optimization
1. Limit number of simultaneous tracks
2. Use appropriate keyframe spacing
3. Monitor system resources

### Common Workflows
#### Basic Animation
1. Create track
2. Set initial position (keyframe at 0:00)
3. Set final position (keyframe at end time)
4. Play to preview movement
5. Adjust as needed

#### Complex Movements
1. Plan movement path
2. Add intermediate keyframes
3. Test movement sections
4. Refine timing and positions

### Troubleshooting
#### Connection Issues
1. Verify Holophonix is running
2. Check network settings
3. Confirm port numbers
4. Try reconnecting

#### Animation Problems
1. Verify keyframe positions
2. Check timeline settings
3. Ensure track is selected
4. Review animation path

## Keyboard Shortcuts
- Space: Play/Pause
- R: Reset timeline
- K: Add keyframe
- Delete: Remove selected keyframe
- Ctrl+S: Save state
- Ctrl+Z: Undo
- Ctrl+Y: Redo

## Support
For issues or questions:
1. Check documentation
2. Review troubleshooting guide
3. Submit issue on GitHub
4. Contact support team

## Version Information
- Current version: 0.1.0
- Release date: [Date]
- Supported platforms: Windows, macOS, Linux

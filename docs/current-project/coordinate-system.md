# Coordinate System Implementation

This document describes the coordinate system implementation in the Holophonix Animator, focusing on how we handle coordinate systems and their conversions.

## Overview

The Holophonix Animator supports two coordinate systems for spatial positioning:
- **Cartesian (XYZ)**: For precise spatial positioning
- **Polar (AED)**: For angle-based positioning

## Implementation Details

### Frontend (Electron/TypeScript)

The frontend handles:
- Message formatting and sending
- State tracking of the last used coordinate system
- UI representation of positions
- Error display and user feedback

#### Value Ranges
1. **Cartesian (XYZ)**
   - X: -1.0 to +1.0 (left to right)
   - Y: -1.0 to +1.0 (back to front)
   - Z: -1.0 to +1.0 (down to up)

2. **Polar (AED)**
   - Azimuth: 0° to 360°
   - Elevation: -90° to +90°
   - Distance: 0 to 1.0

### Backend (Rust)

The backend is responsible for:
- Value validation for all coordinate systems
- Coordinate system conversions
- Position calculations
- Trajectory computations
- Performance-critical operations
- Error handling and validation feedback

#### Validation
The backend performs comprehensive validation:
- Range checking for all coordinate values
- Consistency validation between coordinate systems
- Error reporting with detailed messages
- Safe handling of edge cases

### Message Format

We use combined messages for efficiency:

```
# Cartesian Position
/track/{id}/xyz {x} {y} {z}

# Polar Position
/track/{id}/aed {azim} {elev} {dist}
```

Note: Individual coordinate updates are not supported to maintain consistency and performance.

### State Management

The track state maintains:
- Only the explicitly provided coordinate system
- Last update timestamp
- Current parameter values
- Validation status

### Best Practices

1. **Position Updates**
   - Always send complete coordinate sets
   - Use the most natural coordinate system for your use case
   - Handle validation errors from backend appropriately

2. **Performance Considerations**
   - All coordinate operations handled by Rust backend
   - Frontend focuses on UI and message passing
   - State updates are atomic and efficient

3. **Error Handling**
   - Backend provides detailed validation errors
   - Frontend displays validation feedback to user
   - State remains consistent during errors

## Relationship with Holophonix

While the Holophonix system supports individual coordinate updates (as documented in the official OSC reference), our implementation:
- Uses only combined coordinate messages for efficiency
- Centralizes all coordinate operations in the backend
- Maintains a simpler and more consistent state model

## Future Considerations

1. **Potential Optimizations**
   - Enhanced validation rules in backend
   - Batch position updates for multiple tracks
   - Trajectory-specific coordinate system optimizations

2. **Planned Features**
   - Additional coordinate system visualizations
   - Custom validation ranges per project
   - Advanced trajectory calculations
   - Real-time validation feedback in UI

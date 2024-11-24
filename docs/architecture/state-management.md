# State Management

## Overview
The Holophonix Animator uses a centralized state management system with Rust at its core, handling real-time animations and OSC communication while React manages the UI state.

## Core State Components

### 1. Connection State
Manages the network connection configuration and status, including:
- Remote IP and port settings
- Local IP configuration
- Connection status tracking
- Error state management

### 2. Track Management
Handles the organization and state of tracks and groups:
- Track registry and identification
- Track properties and attributes
- Group management and membership
- Selection state tracking

### 3. Animation State
Manages all aspects of animation configuration and execution:
- Animation model registry
- Active animation tracking
- Parameter management
- Target selection (tracks/groups)

#### Animation Models
Supported animation model types:
- Linear Movement
- Circular Movement
- Random Movement
- Custom Path Movement

#### Model Parameters
Each animation model type has specific parameters:

**Linear Movement**
- Start position
- End position
- Duration

**Circular Movement**
- Center point
- Radius
- Speed
- Rotation direction

**Random Movement**
- Boundary limits
- Speed range
- Update interval

**Custom Path**
- Path points
- Movement speed
- Loop behavior

## State Flow

### 1. Connection Flow
1. User inputs connection parameters
2. System attempts connection
3. Connection state updated
4. UI reflects connection status

### 2. Track Management Flow
1. User adds track/group via form
2. Core validates and stores track
3. UI updates track list
4. Selection state managed

### 3. Animation Flow
1. User selects track/group from tracklist
2. Chooses animation model from selector
3. Animation is applied to selected track or group
4. Model-specific parameters are configurable in real-time:
   - Linear Movement: start position, end position, duration
   - Circular Movement: center point, radius, speed, direction
   - Random Movement: boundary limits, speed range, update interval
   - Custom Path: path points, speed, loop behavior
5. Real-time updates via OSC

## Core Responsibilities

### Core State (Rust)
- Connection management
- Track and group state management
- Animation processing
- Parameter validation
- OSC communication
- Performance monitoring

### UI State (React)
- Form state management
- Selection tracking
- Parameter editor states
- Error display management
- Loading states

## Error Handling
- Connection failures
- Invalid track configurations
- Animation parameter validation
- OSC communication errors

## Performance Optimization
- Batch OSC updates
- Efficient parameter updates
- Minimal state copying
- Lock-free operations where possible

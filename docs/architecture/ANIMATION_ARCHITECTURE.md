# Animation System Architecture Analysis

## Current Architecture Overview

The Holophonix Animator animation system is built on a modular, type-based architecture with the following key components:

### 1. Animation Calculation Pipeline

```
Animation → calculatePosition() → Position
    ↓
Animation Type (24 types)
    ↓
Type-specific calculator (basicAnimations.ts, physicsAnimations.ts, etc.)
    ↓
Position calculation with parameters
    ↓
Multi-track mode adjustments (offsets, rotations)
    ↓
Final Position { x, y, z }
```

### 2. Core Components

#### Animation Store (`src/stores/animationStore.ts`)
- **Engine Management**: 60 FPS animation loop with Electron main process timer support
- **Position Calculation**: Per-frame position updates for all animated tracks
- **Multi-track Support**: 6 modes (identical, phase-offset, position-relative, etc.)
- **State Management**: Global time, loop counts, playback controls
- **OSC Integration**: Real-time position updates via OSC messages

#### Animation Calculations (`src/utils/animations/`)
- **Modular Structure**: Organized by category (basic, physics, wave, curve, procedural, interactive, spatial)
- **24 Animation Types**: Each with dedicated calculation function
- **Stateful Physics**: Pendulum and Spring maintain state across frames
- **Context Awareness**: Separate states for 'playback' vs 'preview' modes

#### Type System (`src/types/index.ts`)
- **AnimationType Union**: 24 string literals for all animation types
- **AnimationParameters Interface**: 150+ optional parameters
- **Position Interface**: Simple { x, y, z } structure
- **Animation Interface**: Core animation data model

### 3. Parameter System

#### Current Parameter Handling
- **Flat Structure**: All parameters in single AnimationParameters interface
- **Type Validation**: TypeScript compile-time checking only
- **Default Values**: Hardcoded in calculation functions
- **UI Binding**: Manual mapping in AnimationEditor component

#### Parameter Categories
1. **Position Parameters**: center, startPosition, endPosition
2. **Motion Parameters**: radius, speed, amplitude, frequency
3. **Physics Parameters**: stiffness, damping, mass, gravity
4. **Path Parameters**: controlPoints, keyframes, waypoints
5. **Multi-track Parameters**: _isobarycenter, _trackOffset, _multiTrackMode

### 4. Multi-Track Implementation

#### Mode Architecture
- **Position-Relative**: Each track has independent animation
- **Phase-Offset**: Shared path with time delays
- **Isobarycenter**: Formation around calculated center
- **Centered**: Animation around user-defined point
- **Phase-Offset-Relative**: Combined independent + delayed
- **Identical**: All tracks follow same path (legacy)

#### Offset Calculations
- Track offsets maintained during animation
- Rotation of offsets for circular/rotational animations
- Per-track loop and ping-pong handling

### 5. Performance Characteristics

#### Strengths
- **Efficient Updates**: Direct position calculation without intermediate objects
- **Optimized State**: Minimal state updates via careful change detection
- **Batched OSC**: Message batching for network efficiency
- **Main Process Timer**: Uses Electron main process for consistent timing

#### Current Limitations
- **Single Animation**: Only one animation per track at a time
- **No Layering**: Cannot combine multiple animations
- **Static Types**: Animation types are hardcoded
- **Limited Extensibility**: Adding new animations requires code changes

### 6. UI Integration

#### Animation Editor (`src/components/AnimationEditor.tsx`)
- Parameter forms for select animations (Wave, Lissajous, PerlinNoise, Orbit)
- Preset system with 15 default presets
- Multi-track mode selection
- 3D path preview

#### Timeline Component (`src/components/Timeline.tsx`)
- Basic timeline visualization
- Play/pause/stop controls
- Track lanes with animation bars
- Time markers and navigation

### 7. Data Flow

```
User Input → AnimationEditor → Animation Object
                                    ↓
                              ProjectStore (save)
                                    ↓
                              AnimationStore (play)
                                    ↓
                              Calculate Position (60 FPS)
                                    ↓
                              Update Track Position
                                    ↓
                              Send OSC Message
```

## Key Findings for Model System

### 1. Separation of Concerns
- Clear separation between calculation, state, and UI
- Modular animation type handlers
- Independent physics state management

### 2. Extension Points
- `calculatePosition()` is the central routing function
- Animation types are string literals (easy to extend)
- Parameter system is flexible but unstructured

### 3. Refactoring Opportunities
- Extract parameter definitions from interface
- Create registration system for animation types
- Implement dynamic parameter validation
- Add plugin architecture for custom animations

### 4. Performance Considerations
- Position calculations must remain synchronous for 60 FPS
- State management needs to handle multiple concurrent animations
- Memory usage with many animation models needs optimization

## Migration Path to Model System

### Phase 1: Type System
1. Create AnimationModel interface
2. Implement model registry
3. Add backward compatibility layer

### Phase 2: Runtime Engine
1. Build model executor
2. Integrate with existing calculatePosition
3. Add validation and error handling

### Phase 3: Dynamic Loading
1. Implement model loader
2. Add JSON/JavaScript model support
3. Create model editor UI

### Phase 4: Advanced Features
1. WebAssembly support
2. Model composition
3. Community sharing

---
*Generated: 2025-11-04*

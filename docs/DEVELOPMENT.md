# Development Guide 🛣️

## Current Development Status 🚀

### Recently Completed Features ✨
1. **Track List Management**
   - [x] Track component implementation
   - [x] Group component implementation
   - [x] Selection system
   - [x] Drag and drop organization
   - [x] Pattern-based track creation
   - [x] Group merging and splitting
   - [x] Active/inactive states
   - [x] Individual track state management
   - [x] Group selection functionality
   - [x] Independent track toggling within groups
   - [x] Unified group-based track management
   - [x] Individual tracks as special group
   - [x] Group-to-group drag and drop
   - [x] Track state preservation during moves
   - [x] Bulk track deletion for individual tracks

2. **OSC Communication**
   - [x] Basic UDP port setup
   - [x] Connection UI component
   - [x] Port configuration interface
   - [x] Basic error handling
   - [x] Connection status management
   - [x] Test message functionality
   - [x] Message validation and parsing
   - [x] Comprehensive error handling
   - [x] Connection recovery
   - [x] Message queuing system

3. **Message Log**
   - [x] Real-time OSC message display
   - [x] Scrollable message history
   - [x] Clear message formatting
   - [x] Error highlighting
   - [x] Timestamp display
   - [x] Proper message formatting
   - [x] Configurable visibility through settings
   - [x] Message filtering and max message limit

### Current Sprint Tasks 🏃
1. **OSC Implementation**
   - [x] Test and verify bidirectional communication
   - [x] Implement message rate limiting
   - [x] Add message logging system
   - [x] Create message format validation
   - [x] Add connection recovery mechanism
   - [x] Implement batch message support
   - [x] Add OSC address pattern matching
   - [x] Create comprehensive error reporting

2. **Track List Refinements**
   - [x] Fix group merging edge cases
   - [x] Improve drag and drop visual feedback
   - [x] Add group collapse/expand animations
   - [x] Optimize performance for large lists
   - [ ] Add keyboard shortcuts
   - [ ] Implement multi-select functionality
   - [ ] Add track search and filtering
   - [ ] Implement track color persistence
   - [ ] Add track position visualization
   - [ ] Create track behavior preview

3. **Behavior System**
   - [ ] Modular Behavior Architecture
     * Plugin-based behavior system
     * Standard behavior interface/contract
     * Behavior composition utilities
     * Documentation for behavior development
     * Hot-reloading of custom behaviors
     * Behavior testing framework
   - [ ] Core Behavior Components
     * Parameter validation system
     * Real-time parameter updates
     * Behavior composition
     * Timeline integration
     * Transition handling
     * Behavior preview system
   - [ ] Track state restoration
     * Query initial track states from Holophonix on track addition
     * Store queried positions, colors, gains
     * Restore original states when behaviors/animations end
     * Handle state restoration for individual parameters
   - [ ] Position Cue System
     * Store track positions as named cues
     * Recall positions through behaviors
     * Cue management interface
     * Support for multiple cue banks
     * Transition timing between cues
   - [ ] Developer Tools
     * Behavior development guide
     * Debug visualization tools
     * State inspection tools
     * Performance profiling
     * Example behavior implementations

4. **Group Dynamics**
   - [ ] Leader/Follower relationships
     * Leader track defines primary motion
     * Followers with configurable delay/offset
     * Multiple leader hierarchies
   - [ ] Isobarycentric positioning
     * Tracks maintain relative positions
     * Group center calculation
     * Formation scaling and rotation

5. **Timeline System**
   - [ ] Multi-track timeline
   - [ ] Behavior sequencing
   - [ ] Transition points
   - [ ] Loop points
   - [ ] Time scaling
   - [ ] Transport controls

## Future Development 📅

### Planned Features 📋
1. **Advanced Behavior System**
   - Behavior composition and blending
   - Layered behaviors (base, modifier, effect)
   - Timeline-based sequencing
   - Custom behavior creation

2. **Group Dynamics**
   - Geometric Formations
     * Isobarycentric positioning
     * Relative spacing control
     * Formation maintenance
   - Group Motion Patterns
     * Swarm behavior
     * Synchronized movements
     * Relative phase offsets

3. **Interaction Models**
   - Distance-based triggers
   - State-based responses
   - Time-based synchronization
   - Physics-based movements

4. **User Experience**
   - Parameter presets
   - Undo/redo system
   - Behavior visualization
   - Performance monitoring
   - User settings persistence
     * Last used OSC ports
     * Recent configurations
     * UI preferences
     * Workspace layout

5. **System Integration**
   - Configuration persistence
   - External control integration
   - Multi-device synchronization
   - Resource optimization
   - Track state persistence
     * Initial positions
     * Default colors
     * Starting gain values
     * Base configuration templates
     * Track metadata

### Backlog 📝
- State persistence
- Bulk operations
- Track templates
- Performance optimization
- Track filtering and search
- Custom behavior creation
- Multi-select operations

## Development Guide 📚

### Setup Instructions 🛠️

#### Prerequisites
- Node.js (v22.1.0 or higher)
- Yarn package manager
- Git

#### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/holophonix-animator.git

# Navigate to project directory
cd holophonix-animator

# Install dependencies
yarn install
```

### Development Workflow 💻

#### Starting Development Server
```bash
# Start development server
yarn start

# Features enabled:
# - Hot Module Replacement
# - DevTools
# - Default OSC ports: 9000 (in) / 12000 (out)
```

#### Building for Production
```bash
# Create production build
yarn build

# Output: 'out' directory
# Platforms: Windows, macOS, Linux
```

### Testing Strategy 🧪

#### Unit Tests
- [ ] Coordinate conversions
- [ ] Behavior calculations
- [ ] Parameter validation
- [ ] State management

#### Integration Tests
- [ ] OSC message handling
- [ ] Behavior composition
- [ ] Group operations
- [ ] Timeline execution

#### Performance Tests
- [ ] Message throughput
- [ ] UI responsiveness
- [ ] Memory usage
- [ ] CPU utilization

### Contribution Guidelines 🤝

1. **Code Style**
   - Follow existing code formatting
   - Use TypeScript for new files
   - Add appropriate documentation
   - Include unit tests

2. **Pull Request Process**
   - Create feature branch
   - Update documentation
   - Add tests
   - Request review

3. **Commit Guidelines**
   - Use conventional commits
   - Keep changes focused
   - Reference issues

## Project Overview
- Application: Holophonix Track Motion Animator
- Primary Focus: Spatial audio track motion control application
- Technology Stack: 
  - Electron
  - React
  - TypeScript
  - OSC Communication

## Key Components

### Layout Structure
- Header with app title and controls
- Collapsible OSC connection section
- Main content area with three columns
- Footer with message log

### OSC Connection
- Connection form with local/remote ports and address
- Connect/Disconnect/Test buttons
- Error message display
- Collapsible section with smooth animation
- Real-time connection status

### Track Management
- Track list with selection capability
- Track grouping support
- Visual feedback for selected state
- Scroll support for long lists

### Behavior Configuration
- Behavior selection and configuration
- Parameter adjustment interface
- Real-time preview capabilities
- Validation and error handling

### Message Logging
- Real-time OSC message display
- Scrollable message history
- Clear message formatting
- Error highlighting
- Timestamp display
- Proper message formatting
- Configurable visibility through settings
- Message filtering and max message limit

## User Interface

### Theme and Styling
- Dark theme optimized for long sessions
- Consistent color scheme:
  - Background: #1a1a1a
  - Sections: #2a2a2a
  - Borders: #3a3a3a
  - Accents: #2196F3 (blue), #4CAF50 (green), #f44336 (red)
- Responsive layout with proper spacing
- Custom scrollbar styling

### Controls
- Toggle buttons with consistent 40x40px size
- Clear hover states with subtle animations
- Status indicators with color coding
- Proper spacing and alignment

### Layout Components
- Fixed header with app controls
- Collapsible OSC section
- Three-column main layout:
  - Tracks (350px)
  - Behaviors (flexible)
  - Parameters (300px)
- Fixed footer with message log

## Development Guidelines

### Code Organization
- Component-based architecture
- Separate style files per component
- TypeScript for type safety
- Consistent naming conventions

### State Management
- React hooks for local state
- Props for component communication
- Event-driven OSC message handling
- Centralized error management

### Styling Principles
- CSS modules for component styles
- Global styles for common elements
- CSS Grid and Flexbox for layout
- CSS variables for theme colors

### Best Practices
- TypeScript for type safety
- React functional components
- Proper event cleanup
- Performance optimization
- Error boundary implementation

## OSC Communication

### Connection Management
- UDP communication
- Configurable ports and addresses
- Connection status monitoring
- Error handling and recovery

### Message Format
- Standard OSC message structure
- JSON serialization for complex data
- Validation and error checking
- Rate limiting implementation

## Testing

### Component Testing
- Unit tests for components
- Integration tests for OSC
- End-to-end testing
- Performance monitoring

### Error Handling
- Graceful error recovery
- User-friendly error messages
- Logging for debugging
- Connection retry logic

## Building and Deployment

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run make
```

### Environment Setup
- Node.js v22.1.0+
- npm or yarn
- Electron development tools

## Future Enhancements
1. Advanced error handling system
2. Enhanced OSC message queuing
3. Performance optimization
4. Additional behavior templates
5. User preferences storage
6. Multi-language support

## Known Issues & Future Improvements

### Resolved
1. ✅ OSC connection form visibility during loading
2. ✅ Direction arrow colors and visibility
3. ✅ Message layout consistency
4. ✅ Connection state handling
5. ✅ Loading state feedback
6. ✅ OSC message logging system
7. ✅ Bidirectional communication
8. ✅ Message format validation
9. ✅ Basic error reporting

### Pending
1. Add comprehensive error messages
2. Implement connection timeout handling
3. Add connection retry mechanism
4. Enhance message filtering
   - Advanced filter patterns
   - Filter by message type
   - Filter by direction
5. Add message search functionality
   - Full-text search
   - Regular expression support
   - Search history
6. Implement message grouping
   - Group by address pattern
   - Group by time window
   - Collapsible groups
7. Add message export feature
   - Export to JSON
   - Export to CSV
   - Custom format support
8. Improve performance for large message logs
   - Virtual scrolling
   - Message batching
   - Efficient rendering
9. Track System Improvements
   - Keyboard shortcuts
   - Multi-select functionality
   - Track search and filtering
   - Track color persistence
   - Track position visualization
   - Track behavior preview
10. Behavior System
    - Modular behavior architecture
    - Plugin-based system
    - Standard behavior interface
    - Behavior composition
    - Visual behavior editor

## Development Guidelines

### Component Structure
1. Clear separation of concerns
2. Type-safe props and state
3. Proper event handling
4. Consistent error handling
5. Loading state management

### Styling Approach
1. CSS modules for component styles
2. Theme variables for consistency
3. Responsive design considerations
4. Animation for state changes
5. Accessible color contrast

### State Management
1. React hooks for local state
2. Electron IPC for process communication
3. Settings persistence
4. Error state handling
5. Loading state management

## Testing

### Areas to Cover
1. Connection handling
   - Connection establishment
   - Error scenarios
   - Recovery mechanisms
   - Timeout handling
2. Message processing
   - Format validation
   - Rate limiting
   - Batch processing
   - Error handling
3. UI state management
   - Component states
   - Loading states
   - Error states
   - Animation states
4. Track system
   - Track operations
   - Group handling
   - Drag and drop
   - Performance
5. Behavior system
   - Behavior creation
   - Behavior application
   - Behavior composition
   - Plugin system

## Behavior System Implementation 🔄

### Completed Behaviors ✅

1. **Linear Behavior**
   ```typescript
   // Linear oscillation along a single axis
   interface LinearParameters {
     frequency: number;     // Oscillation frequency (Hz)
     amplitude: number;     // Movement range
     offset: number;        // Center position
     axis: 'x' | 'y' | 'z' | 'azimuth' | 'elevation' | 'distance';
   }
   ```
   - Single-axis oscillation
   - Configurable frequency and amplitude
   - Position offset support
   - Axis selection (XYZ/AED)
   - Real-time parameter validation

2. **Sine Wave Behavior**
   ```typescript
   // Smooth sinusoidal motion
   interface SineParameters {
     frequency: number;     // Wave frequency (Hz)
     amplitude: number;     // Wave height
     offset: number;        // Center position
     phase: number;         // Wave phase shift
     axis: 'x' | 'y' | 'z' | 'azimuth' | 'elevation' | 'distance';
   }
   ```
   - Smooth periodic motion
   - Phase control
   - Frequency/amplitude adjustment
   - Position offset
   - Axis selection

3. **Circle Behavior**
   ```typescript
   // Circular motion in a plane
   interface CircleParameters {
     frequency: number;     // Rotation frequency (Hz)
     radius: number;        // Circle radius
     centerX: number;      // Center X position
     centerY: number;      // Center Y position
     plane: 'xy' | 'xz' | 'yz';
   }
   ```
   - Planar circular motion
   - Configurable radius and center
   - Plane selection
   - Rotation frequency control
   - Position validation

### Behavior Base System 🏗

1. **Core Architecture**
   ```typescript
   abstract class BaseBehavior {
     // Core calculation method
     abstract calculate(time: number): Position;
     
     // Parameter definition
     abstract getParameters(): Parameter[];
     
     // Parameter validation
     validate(params: Record<string, number>): ValidationResult;
     
     // Default parameter values
     getDefaults(): Record<string, number>;
   }
   ```

2. **Parameter System**
   ```typescript
   interface Parameter {
     name: string;         // Parameter identifier
     label: string;        // Display name
     min: number;          // Minimum value
     max: number;          // Maximum value
     step: number;         // Value increment
     default: number;      // Default value
     unit?: string;        // Optional unit (Hz, m, etc.)
     description?: string; // Parameter description
   }
   ```

3. **Validation System**
   - Unit-aware validation
   - Step size enforcement
   - Range checking
   - Error messaging
   - Floating-point handling

### In Progress 🚧

1. **Random Walk Behavior**
   ```typescript
   interface RandomWalkParameters {
     stepSize: number;     // Maximum step size
     interval: number;     // Time between steps
     bounds: {            // Movement boundaries
       min: Position;
       max: Position;
     };
   }
   ```
   - Status: Design phase
   - Planned features:
     * Configurable step size
     * Boundary constraints
     * Direction bias
     * Speed control

2. **Spiral Behavior**
   ```typescript
   interface SpiralParameters {
     frequency: number;    // Rotation frequency
     growth: number;       // Radius growth rate
     maxRadius: number;    // Maximum radius
     plane: 'xy' | 'xz' | 'yz';
   }
   ```
   - Status: Design phase
   - Features planned:
     * Configurable growth rate
     * Maximum radius limit
     * Plane selection
     * Direction control

3. **Figure-8 Behavior**
   ```typescript
   interface Figure8Parameters {
     frequency: number;    // Cycle frequency
     width: number;       // Pattern width
     height: number;      // Pattern height
     plane: 'xy' | 'xz' | 'yz';
   }
   ```
   - Status: Planning
   - Features planned:
     * Size control
     * Orientation options
     * Speed adjustment
     * Position offset

### Planned Behaviors 📋

1. **3D Behaviors**
   - Spherical Motion
   - Helix Pattern
   - 3D Lissajous
   - Complex Orbits

2. **Composite Behaviors**
   - Behavior Chaining
   - Parallel Behaviors
   - Behavior Blending
   - Transition Control

3. **Custom Behaviors**
   - Path Recording
   - Custom Function Input
   - Behavior Scripting
   - Parameter Automation

### Implementation Patterns 🎯

1. **Behavior Registration**
   ```typescript
   class BehaviorRegistry {
     private behaviors: Map<string, BehaviorConstructor>;
     
     register(name: string, behavior: BehaviorConstructor) {
       this.behaviors.set(name, behavior);
     }
     
     create(name: string, params: Record<string, number>): BaseBehavior {
       const BehaviorClass = this.behaviors.get(name);
       return new BehaviorClass(params);
     }
   }
   ```

2. **Parameter Updates**
   ```typescript
   class BehaviorManager {
     updateParameter(
       behaviorId: string, 
       param: string, 
       value: number
     ): ValidationResult {
       const behavior = this.behaviors.get(behaviorId);
       const result = behavior.validate({ [param]: value });
       if (result.isValid) {
         behavior.setParameter(param, value);
       }
       return result;
     }
   }
   ```

3. **Position Calculation**
   ```typescript
   interface Position {
     x?: number;
     y?: number;
     z?: number;
     azimuth?: number;
     elevation?: number;
     distance?: number;
   }
   
   class PositionCalculator {
     static toAED(xyz: Position): Position {
       // Convert XYZ to AED coordinates
     }
     
     static toXYZ(aed: Position): Position {
       // Convert AED to XYZ coordinates
     }
   }
   ```

### Testing Strategy 🧪

#### Unit Tests
- [ ] Coordinate conversions
- [ ] Behavior calculations
- [ ] Parameter validation
- [ ] State management

#### Integration Tests
- [ ] OSC message handling
- [ ] Behavior composition
- [ ] Group operations
- [ ] Timeline execution

#### Performance Tests
- [ ] Message throughput
- [ ] UI responsiveness
- [ ] Memory usage
- [ ] CPU utilization

### Advanced Group Modes 🎯

1. **Leader/Followers Mode**
   ```typescript
   interface LeaderFollowerGroup extends GroupBehavior {
     mode: 'leader-follower';
     leaderId: number;
     followers: number[];
     leaderBehavior: BaseBehavior;
     followDistance?: number;    // Optional: maintain specific distance
     followAngle?: number;       // Optional: maintain specific angle
     followConstraints?: {       // Optional: follower constraints
       minDistance?: number;
       maxDistance?: number;
       angleRange?: [number, number];
     };
   }
   ```
   - **Leader Track**
     * Primary motion control
     * Direct behavior application
     * Can use absolute or relative mode
     * Sets the reference for followers

   - **Follower Tracks**
     * Follow leader's motion pattern
     * Maintain relative positions/distances
     * Optional position constraints
     * Automatic path adjustment

   ```typescript
   class LeaderFollowerManager {
     private leader: TrackBehavior;
     private followers: Map<number, FollowerConfig>;
     
     calculatePositions(time: number): Map<number, Position> {
       // Calculate leader position
       const leaderPos = this.leader.behavior.calculate(
         time,
         this.leader.mode,
         this.leader.referencePosition
       );
       
       // Calculate follower positions relative to leader
       const positions = new Map([[this.leader.trackId, leaderPos]]);
       
       this.followers.forEach((config, trackId) => {
         const followerPos = this.calculateFollowerPosition(
           leaderPos,
           config,
           time
         );
         positions.set(trackId, followerPos);
       });
       
       return positions;
     }
     
     private calculateFollowerPosition(
       leaderPos: Position,
       config: FollowerConfig,
       time: number
     ): Position {
       // Apply following rules and constraints
       // Maintain specified distance/angle if configured
       // Apply boundary constraints
       // Return calculated position
     }
   }
   ```

2. **Isobarycentric Mode**
   ```typescript
   interface IsobarycentricGroup extends GroupBehavior {
     mode: 'isobarycentric';
     trackIds: number[];
     behavior: BaseBehavior;
     centerBehavior: BaseBehavior;    // Behavior applied to virtual center
     preserveFormation: boolean;       // Maintain relative positions
     scaling?: {                       // Optional: dynamic scaling
       min: number;
       max: number;
       frequency?: number;
     };
   }
   ```
   - **Virtual Center**
     * Calculated as group isobarycenter
     * Primary point for behavior application
     * Reference for all track movements
     * Can have its own behavior pattern

   - **Formation Management**
     * Preserve relative track positions
     * Support formation scaling
     * Maintain spatial relationships
     * Optional rotation around center

   ```typescript
   class IsobarycentricManager {
     private tracks: Map<number, Position>;
     private centerBehavior: BaseBehavior;
     private formationBehavior: BaseBehavior;
     
     calculateCenter(): Position {
       // Calculate isobarycenter from all track positions
       return this.calculateIsobarycenter(Array.from(this.tracks.values()));
     }
     
     calculatePositions(time: number): Map<number, Position> {
       // Calculate center movement
       const centerDelta = this.centerBehavior.calculate(
         time,
         'relative'
       );
       
       // Calculate formation transformation
       const formation = this.formationBehavior.calculate(
         time,
         'relative'
       );
       
       // Apply to all tracks
       const positions = new Map();
       this.tracks.forEach((basePos, trackId) => {
         const newPos = this.applyTransformation(
           basePos,
           centerDelta,
           formation
         );
         positions.set(trackId, newPos);
       });
       
       return positions;
     }
     
     private calculateIsobarycenter(positions: Position[]): Position {
       // Calculate geometric center of all positions
       return {
         x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
         y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
         z: positions.reduce((sum, pos) => sum + pos.z, 0) / positions.length
       };
     }
     
     private applyTransformation(
       basePos: Position,
       centerDelta: RelativePosition,
       formation: FormationTransform
     ): Position {
       // Apply center movement and formation changes
       // Handle scaling and rotation
       // Preserve relative positions if configured
       // Return transformed position
     }
   }
   ```

### Group Mode Examples

1. **Leader/Followers Circle**
   ```typescript
   // Leader follows a circle path
   const leaderGroup = new LeaderFollowerManager({
     leaderId: 1,
     followers: [2, 3, 4],
     leaderBehavior: new CircleBehavior({
       radius: 1.0,
       frequency: 0.5
     }),
     followConstraints: {
       minDistance: 0.5,
       maxDistance: 2.0,
       angleRange: [-45, 45] // degrees
     }
   });
   ```

2. **Isobarycentric Expansion**
   ```typescript
   // Group expands/contracts around center
   const isoGroup = new IsobarycentricManager({
     trackIds: [1, 2, 3, 4],
     centerBehavior: new CircleBehavior({
       radius: 0.5,
       frequency: 0.25
     }),
     scaling: {
       min: 0.5,    // Contract to 50%
       max: 2.0,    // Expand to 200%
       frequency: 0.1
     },
     preserveFormation: true
   });
   ```

### Implementation Considerations

1. **Leader/Follower Mode**
   - Smooth follower transitions
   - Path prediction for followers
   - Collision avoidance
   - Formation maintenance
   - Dynamic leader switching

2. **Isobarycentric Mode**
   - Efficient center calculation
   - Formation integrity
   - Scaling precision
   - Rotation handling
   - Boundary management

{{ ... }}

# Code Style Guide

## Overview

This guide outlines the coding standards and style guidelines for the Holophonix Animator project. Following these guidelines ensures consistency and maintainability across the codebase.

## General Guidelines

### 1. Code Formatting
- Use consistent indentation (2 spaces)
- Keep lines under 100 characters
- Use meaningful whitespace
- Follow language-specific conventions

### 2. Naming Conventions

#### TypeScript/JavaScript
```typescript
// Classes: PascalCase
class MotionController {
  // Properties: camelCase
  private currentPosition: Vector3;
  
  // Methods: camelCase
  public updatePosition(newPosition: Vector3): void {
    this.currentPosition = newPosition;
  }
}

// Interfaces: PascalCase with 'I' prefix
interface ITrackState {
  id: string;
  position: Vector3;
  orientation: Quaternion;
}

// Constants: UPPER_SNAKE_CASE
const MAX_TRACKS = 128;
const DEFAULT_TIMEOUT_MS = 5000;
```

#### Rust
```rust
// Structs: PascalCase
struct AnimationCore {
    // Fields: snake_case
    current_state: State,
    update_interval: Duration,
}

// Functions: snake_case
fn update_position(position: Vector3) -> Result<(), Error> {
    // Implementation
}

// Constants: UPPER_SNAKE_CASE
const MAX_BUFFER_SIZE: usize = 1024;
```

### 3. Documentation

#### Function Documentation
```typescript
/**
 * Updates the position of a track in 3D space.
 * 
 * @param trackId - Unique identifier of the track
 * @param position - New position vector
 * @param interpolate - Whether to interpolate to the new position
 * @returns Promise that resolves when the position is updated
 * @throws TrackNotFoundError if the track doesn't exist
 */
async function updateTrackPosition(
  trackId: string,
  position: Vector3,
  interpolate: boolean = true
): Promise<void> {
  // Implementation
}
```

#### Class Documentation
```typescript
/**
 * Manages the state and behavior of a single audio track.
 * 
 * Handles position updates, animation state, and OSC communication
 * for a specific track in the Holophonix system.
 */
class Track {
  // Implementation
}
```

## Language-Specific Guidelines

### TypeScript/JavaScript

1. Type Safety
   - Use explicit types
   - Avoid `any`
   - Use interfaces for objects
   - Enable strict mode

2. Modern Features
   - Use async/await
   - Use optional chaining
   - Use nullish coalescing
   - Use template literals

3. React Components
   - Use functional components
   - Use hooks appropriately
   - Props interface for each component
   - Consistent component structure

### Rust

1. Error Handling
   - Use Result for fallible operations
   - Custom error types
   - Appropriate error propagation
   - Clear error messages

2. Memory Management
   - Clear ownership patterns
   - Appropriate use of references
   - Smart pointer usage
   - Resource cleanup

3. Performance
   - Efficient data structures
   - Avoid unnecessary allocations
   - Use iterators appropriately
   - Profile critical code

## File Organization

### Directory Structure
```
src/
├── components/     # React components
├── core/          # Core business logic
├── types/         # TypeScript types/interfaces
├── utils/         # Utility functions
└── tests/         # Test files
```

### File Naming
- `kebab-case.ts` for source files
- `kebab-case.test.ts` for test files
- `index.ts` for barrel files
- `types.ts` for type definitions

## Best Practices

1. Code Organization
   - One concept per file
   - Clear module boundaries
   - Logical file grouping
   - Consistent import order

2. Performance
   - Optimize hot paths
   - Lazy loading
   - Memory management
   - Efficient algorithms

3. Testing
   - Unit tests for logic
   - Integration tests for flows
   - Clear test names
   - Comprehensive coverage

4. Security
   - Input validation
   - Error handling
   - Safe dependencies
   - Regular updates

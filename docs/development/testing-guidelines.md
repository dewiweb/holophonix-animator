# Testing Guidelines

## Overview

This document outlines testing standards and practices for the Holophonix Animator project. The project uses a comprehensive testing approach combining Rust and TypeScript testing frameworks.

## Testing Levels

### 1. Unit Tests

Test individual components and functions in isolation.

```typescript
// Example unit test for motion model
describe('CircularMotion', () => {
  it('should calculate correct position for given angle', () => {
    const motion = new CircularMotion({
      radius: 1,
      speed: 1,
      center: new Vector3(0, 0, 0)
    });

    const position = motion.getPositionAtTime(Math.PI / 2);
    expect(position.x).toBeCloseTo(1);
    expect(position.y).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(0);
  });
});
```

### 2. Integration Tests

Test interactions between components.

```typescript
describe('OSC Communication', () => {
  it('should update track position via OSC', async () => {
    const track = new Track('test-track');
    const oscHandler = new OSCHandler();
    
    await oscHandler.connect();
    await track.updatePosition(new Vector3(1, 2, 3));
    
    const position = await oscHandler.queryPosition('test-track');
    expect(position).toEqual(new Vector3(1, 2, 3));
  });
});
```

### 3. End-to-End Tests

Test complete features from user perspective.

```typescript
describe('Motion Animation', () => {
  it('should animate track in circular pattern', async () => {
    // Setup
    await page.goto('http://localhost:3000');
    await page.click('#track-1');
    await page.click('#add-motion');
    await page.selectOption('#motion-type', 'circular');
    
    // Configure motion
    await page.fill('#radius', '2');
    await page.fill('#speed', '1');
    await page.click('#start-animation');
    
    // Verify
    const positions = await page.evaluate(() => {
      return new Promise(resolve => {
        const pos = [];
        let count = 0;
        const interval = setInterval(() => {
          pos.push(getTrackPosition());
          count++;
          if (count >= 4) {
            clearInterval(interval);
            resolve(pos);
          }
        }, 1000);
      });
    });
    
    expect(positions).toDescribeCircularMotion();
  });
});
```

## Testing Infrastructure

### 1. Test Utilities (`test_utils`)

The Rust codebase includes a robust testing infrastructure in the `test_utils` module:

```rust
// Test context for managing dependencies
let ctx = TestContext::new().await?;

// Use fixtures for common test data
let start_pos = TestPositions::origin();
let config = TestAnimations::linear_1s();

// Custom assertions for precise comparisons
position.assert_near(&expected, 1e-6);
duration.assert_duration_matches(1.0, 1e-3);

// Generate random test data
let positions = PositionGenerator::random_sequence(5);
```

#### Components:
- `TestContext`: Manages test dependencies and cleanup
- `fixtures`: Provides common test data
- `assertions`: Custom assertion utilities
- `generators`: Random test data generation
- `mocks`: Mock implementations for external dependencies

### 2. Integration Tests

Located in `tests/integration_tests.rs`, these tests verify full system functionality:

```rust
#[tokio::test]
async fn test_full_animation_pipeline() -> anyhow::Result<()> {
    let ctx = TestContext::with_osc().await?;
    
    // Test complete animation flow
    ctx.animation_manager.add_animation("test", config).await?;
    ctx.animation_manager.play().await?;
    
    // Verify results
    let pos = ctx.state_manager.get_position("test").await?;
    pos.unwrap().assert_near(&expected_pos, 1e-6);
    
    ctx.cleanup().await?;
    Ok(())
}
```

### 3. Property-Based Tests

Located in `tests/property_tests.rs`, these tests verify invariants using random inputs:

```rust
proptest! {
    #[test]
    fn test_position_invariants(
        x in -1.0..1.0f64,
        y in -1.0..1.0f64,
        z in -1.0..1.0f64,
    ) {
        let pos = Position::new(x, y, z, 0.0, 0.0, 0.0);
        let normalized = pos.normalize();
        prop_assert!((normalized.magnitude() - 1.0).abs() < 1e-6);
    }
}
```

### 4. Performance Benchmarks

Located in `benches/animation_benchmarks.rs`, these measure system performance:

```rust
fn benchmark_animation_updates(c: &mut Criterion) {
    let mut group = c.benchmark_group("animation_updates");
    
    group.bench_function("update_single_track", |b| {
        let manager = setup_animation_manager();
        b.iter(|| black_box(manager.update(0.016)))
    });
}
```

## Test Organization

### Directory Structure
```
tests/
├── unit/              # Unit tests
│   ├── motion/
│   ├── state/
│   └── utils/
├── integration/       # Integration tests
│   ├── osc/
│   └── animation/
├── e2e/              # End-to-end tests
│   ├── features/
│   └── workflows/
├── integration_tests.rs  # Rust integration tests
├── property_tests.rs     # Rust property-based tests
└── benches/            # Rust performance benchmarks
    └── animation_benchmarks.rs
```

### File Naming
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests
- `*.e2e.ts` for end-to-end tests
- `*.rs` for Rust tests and benchmarks

## Testing Standards

### 1. Test Coverage
- Minimum 80% coverage for core modules
- Critical paths must have 100% coverage
- Edge cases must be tested
- Error conditions must be tested

### 2. Test Organization
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test
    });

    it('should handle edge case', () => {
      // Test
    });

    it('should handle error case', () => {
      // Test
    });
  });
});
```

### 3. Mocking
```typescript
// Mock external dependencies
jest.mock('../osc/handler', () => ({
  OSCHandler: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue(undefined)
  }))
}));
```

## Best Practices

### 1. Test Structure
- Arrange: Set up test conditions
- Act: Execute the code under test
- Assert: Verify the results

```typescript
it('should update track position', () => {
  // Arrange
  const track = new Track('test');
  const newPosition = new Vector3(1, 2, 3);

  // Act
  track.updatePosition(newPosition);

  // Assert
  expect(track.position).toEqual(newPosition);
});
```

### 2. Test Isolation
- Each test should be independent
- Clean up after tests
- Use fresh instances
- Reset mocks between tests

### 3. Testing Async Code
```typescript
it('should handle async operations', async () => {
  // Use async/await
  const result = await asyncOperation();
  expect(result).toBeDefined();

  // Or use done callback
  asyncOperation().then(result => {
    expect(result).toBeDefined();
    done();
  });
});
```

### 4. Performance Testing
```typescript
it('should complete within time limit', async () => {
  const startTime = performance.now();
  
  await performOperation();
  
  const duration = performance.now() - startTime;
  expect(duration).toBeLessThan(100); // 100ms limit
});
```

## CI Integration

### 1. Automated Testing
- Run tests on every PR
- Run tests before merge
- Run tests on deployment

### 2. Test Reports
- Generate coverage reports
- Track metrics over time
- Report test failures

### 3. Performance Monitoring
- Track test execution time
- Monitor resource usage
- Alert on degradation

## Debugging Tests

### 1. Test Logging
```typescript
it('should handle complex scenario', () => {
  const debug = require('debug')('test:scenario');
  
  debug('Setting up test');
  // Test setup
  
  debug('Executing operation');
  // Test execution
  
  debug('Verifying results');
  // Assertions
});
```

### 2. Visual Testing
```typescript
it('should render correctly', async () => {
  const component = render(<MyComponent />);
  
  // Take snapshot
  expect(component).toMatchSnapshot();
  
  // Or use visual regression
  expect(await page.screenshot())
    .toMatchImageSnapshot();
});
```

## Running Tests

### 1. Unit and Integration Tests
```bash
# Run all tests
cargo test

# Run specific test categories
cargo test --test integration_tests
cargo test --test property_tests

# Run with logging
RUST_LOG=debug cargo test
```

### 2. Benchmarks
```bash
# Run all benchmarks
cargo bench

# Run specific benchmark
cargo bench --bench animation_benchmarks
```

## Best Practices

### 1. Use Test Context
```rust
async_test!(test_name, |ctx| async {
    // Test setup is handled automatically
    let result = ctx.animation_manager.do_something().await?;
    assert!(result.is_ok());
    Ok(())
});
```

### 2. Utilize Fixtures
```rust
// Use standard test positions
let origin = TestPositions::origin();
let unit_x = TestPositions::unit_x();

// Use common animations
let config = TestAnimations::linear_1s();
```

### 3. Custom Assertions
```rust
// Position comparisons with tolerance
position.assert_near(&expected, 1e-6);

// Timing validations
duration.assert_duration_matches(expected, 1e-3);
```

### 4. Mock External Dependencies
```rust
let mock_osc = MockOscServer::new();
mock_osc.expect_send_message().times(1).return_const(Ok(()));
```

## Performance Testing

### 1. Benchmark Categories
- Position operations
- Animation updates
- State synchronization
- Track scaling

### 2. Performance Targets
- Position updates: < 1ms
- Animation frame: < 16ms (60 FPS)
- State sync: < 5ms
- Group updates: < 10ms

### 3. Monitoring
- Regular benchmark runs
- Performance regression detection
- Resource usage tracking

# Testing Guidelines

## Overview

This document outlines testing standards and practices for the Holophonix Animator project.

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
└── e2e/              # End-to-end tests
    ├── features/
    └── workflows/
```

### File Naming
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests
- `*.e2e.ts` for end-to-end tests

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

# TDD Principles

## Core TDD Cycle

1. **Write a Test**
   - Start with a failing test
   - Test should be minimal and focused
   - Test should document expected behavior

2. **Make it Pass**
   - Write minimal code to pass
   - Focus on functionality over optimization
   - Keep it simple

3. **Refactor**
   - Improve code quality
   - Maintain test coverage
   - Focus on readability and maintainability

## Project-Specific Guidelines

### Vector Math
- Test edge cases (zero vectors, infinities)
- Use property-based testing for mathematical properties
- Benchmark performance-critical operations

### Motion Engine
- Test interpolation accuracy
- Verify motion patterns
- Ensure deterministic behavior

### State Management
- Test state transitions
- Verify persistence
- Check error handling

## Testing Levels

### Unit Tests
```rust
#[test]
fn test_vector_normalization() {
    let v = Vector3::new(1.0, 2.0, 2.0);
    let normalized = v.normalize();
    assert_approx_eq!(normalized.magnitude(), 1.0);
}
```

### Property Tests
```rust
proptest! {
    #[test]
    fn vector_add_commutative(
        x1 in -1000.0..1000.0f64,
        y1 in -1000.0..1000.0f64,
        z1 in -1000.0..1000.0f64,
        x2 in -1000.0..1000.0f64,
        y2 in -1000.0..1000.0f64,
        z2 in -1000.0..1000.0f64,
    ) {
        let v1 = Vector3::new(x1, y1, z1);
        let v2 = Vector3::new(x2, y2, z2);
        prop_assert_eq!(v1 + v2, v2 + v1);
    }
}
```

### Benchmarks
```rust
fn bench_vector_ops(c: &mut Criterion) {
    c.bench_function("normalize 3d vector", |b| {
        b.iter(|| Vector3::new(1.0, 2.0, 3.0).normalize())
    });
}
```

## Code Coverage Requirements

| Component | Minimum Coverage |
|-----------|-----------------|
| Vector Math | 100% |
| Motion Engine | 95% |
| State Management | 95% |
| Overall | 95% |

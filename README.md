# Holophonix Animator v2

A tool for creating and managing animations for Holophonix systems.

## Project Status

This project is currently undergoing a complete restructuring based on learnings from the v1 implementation. The original implementation is preserved in the `reference/v1/` directory.

## Project Organization

```
.
├── docs/                          # Documentation
│   ├── architecture/             
│   │   ├── current/              # v1 implementation documentation
│   │   └── target/               # v2 target architecture and design
│   └── tools/                    # Documentation tools
├── reference/                     # Reference implementations
│   └── v1/                       # Original implementation
└── src/                          # New implementation (coming soon)
```

## Development Methodology

### 1. Requirements-First Approach
- Clear documentation of core functionalities
- Explicit performance requirements
- Well-defined technical constraints
- Feature acceptance criteria

### 2. Architecture Design
- Modular system design
- Clear component boundaries
- Well-defined interfaces
- Performance-critical parts identification

### 3. Implementation Strategy
- Iterative development
- Test-driven development
- Regular validation
- Performance monitoring

## Documentation

Current project documentation can be found in the `docs` directory:
- Current implementation (v1): `docs/architecture/current/`
- Target architecture (v2): `docs/architecture/target/`
- Architecture diagrams: View using `docs/tools/diagram-viewer.html`

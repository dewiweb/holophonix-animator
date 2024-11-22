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
│   │       └── diagrams/         # Architecture and UI diagrams/mockups
│   └── tools/                    # Documentation tools
│       ├── docs_viewer.html      # Interactive documentation viewer
│       └── docs_server.py        # Local documentation server
├── reference/                     # Reference implementations
│   └── v1/                       # Original implementation
└── src/                          # New implementation (coming soon)
```

## Development Methodology

### 1. Context and Goals
- Project context definition
- Clear project goals identification
- User needs and expectations
- Technical and operational constraints
- Success criteria definition

### 2. Requirements Analysis
- Core functionalities documentation
- Performance requirements
- Technical constraints
- Feature acceptance criteria

### 3. Architecture Design
- Modular system design
- Clear component boundaries
- Well-defined interfaces
- Performance-critical parts identification

### 4. Implementation Strategy
- Iterative development
- Test-driven development
- Regular validation
- Performance monitoring

## Documentation

Current project documentation can be found in the `docs` directory:
- Current implementation (v1): `docs/architecture/current/`
- Target architecture (v2): `docs/architecture/target/`
- Architecture diagrams: View using `docs/tools/docs_viewer.html`
- UI Mockups: Available in `docs/architecture/target/diagrams/ui-mockup.html`

### Documentation Tools

The project includes documentation tools to help navigate and understand the codebase:

1. **Documentation Viewer** (`docs/tools/docs_viewer.html`):
   - Interactive documentation navigation
   - Organized sections for easy access
   - Responsive design for various screen sizes

2. **UI Mockup** (`docs/architecture/target/diagrams/ui-mockup.html`):
   - Interactive visualization of the application interface
   - Detailed component descriptions
   - Visual connections between UI elements

3. **Documentation Server** (`docs/tools/docs_server.py`):
   - Local server for documentation viewing
   - Supports live updates
   - Easy to run and configure

# Holophonix Animator v2

A tool for creating and managing animations for Holophonix systems.

## Project Status

This project is undergoing a complete restructuring for v2, building upon lessons learned from the original v1 implementation. The v1 implementation is preserved for reference.

## Project Organization

```
.
├── docs/                          # Documentation
│   ├── architecture/             
│   │   ├── old/                  # v1 implementation documentation
│   │   │   ├── components/       # v1 component documentation
│   │   │   ├── development/      # v1 development notes
│   │   │   └── diagrams/        # v1 architecture diagrams
│   │   └── target/               # v2 target architecture and design
│   │       ├── diagrams/         # v2 architecture and UI diagrams
│   │       └── ROADMAP.md        # v2 development roadmap
│   └── tools/                    # Documentation tools
│       ├── docs_viewer.html      # Interactive documentation viewer
│       └── docs_server.py        # Local documentation server
├── reference/                     # Reference implementations
│   └── v1/                       # Original v1 implementation code
└── src/                          # v2 implementation (coming soon)
```

## Project Structure Overview

### Documentation (`docs/`)
- **Architecture Documentation**
  - `old/`: Documentation of the v1 implementation, preserved for reference
  - `target/`: Design and architecture documentation for v2
- **Documentation Tools**
  - Interactive documentation viewer
  - Local documentation server

### Reference Implementation (`reference/`)
- Complete v1 codebase preserved for reference
- Includes original implementation patterns and solutions

### Source Code (`src/`)
- Future home of the v2 implementation
- Will be structured according to the target architecture

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

Project documentation is organized into two main sections:

### Old Implementation (v1)
- Component architecture
- Development notes
- Original system diagrams
- Implementation patterns

### Target Implementation (v2)
- New architecture design
- UI/UX mockups
- Development roadmap
- System specifications

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

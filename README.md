# Holophonix Animator

A tool for creating and managing animations for Holophonix systems.

## Project Status

This project is being actively developed, building upon lessons learned from the old project. The old project implementation is preserved for reference while we develop the current project.

## Project Organization

```
.
├── docs/                          # Documentation
│   ├── old-project/              # Old project documentation
│   │   ├── architecture/         # Original architecture docs
│   │   ├── development/          # Original development notes
│   │   └── diagrams/            # Original architecture diagrams
│   ├── current-project/          # Current project documentation
│   │   ├── architecture/         # New architecture design
│   │   │   ├── diagrams/        # Architecture diagrams
│   │   │   └── specs/          # Technical specifications
│   │   ├── development/         # Development docs
│   │   │   ├── roadmap/        # Development roadmap
│   │   │   └── progress/       # Progress tracking
│   │   └── design/             # Design docs
│   │       ├── mockups/        # UI/UX mockups
│   │       └── assets/         # Design assets
│   ├── technical/               # Technical documentation
│   │   ├── protocols/          # Protocol specifications
│   │   │   └── osc.md         # OSC protocol docs
│   │   └── systems/           # System documentation
│   └── tools/                  # Documentation tools
│       ├── viewer/            # Documentation viewer
│       │   ├── docs_viewer.html
│       │   └── assets/
│       └── server/            # Documentation server
│           └── docs_server.py
├── old-code/                    # Original implementation
│   └── old-project/            # Complete old project codebase
└── src/                        # Current project implementation
```

## Project Structure Overview

### Documentation (`docs/`)
- **Old Project Documentation**
  - Original architecture documentation
  - Development history
  - Original diagrams and designs
- **Current Project Documentation**
  - New architecture design
  - Development roadmap and progress
  - UI/UX designs and mockups
- **Technical Documentation**
  - Protocol specifications (OSC, etc.)
  - System documentation
- **Documentation Tools**
  - Interactive documentation viewer
  - Local documentation server

### Original Implementation (`old-code/`)
- Complete old project codebase preserved for reference
- Includes original implementation patterns and solutions

### Source Code (`src/`)
- Current project implementation
- Structured according to the new architecture

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

## Documentation Structure

### Old Project Documentation
Located in `docs/old-project/`, contains:
- Original architecture documentation
- Development history and notes
- Legacy diagrams and designs

### Current Project Documentation
Located in `docs/current-project/`, organized into:
- **Architecture**: System design, components, and interfaces
- **Development**: Roadmap, progress tracking, and milestones
- **Design**: UI/UX mockups and design assets

### Technical Documentation
Located in `docs/technical/`, includes:
- Protocol specifications
- System documentation
- Integration guides

### Documentation Tools
Located in `docs/tools/`, provides:
1. **Documentation Viewer** (`viewer/docs_viewer.html`):
   - Interactive documentation navigation
   - Organized sections for easy access
   - Responsive design for various screen sizes

2. **UI Mockup Viewer** (`current-project/design/mockups/ui-mockup.html`):
   - Interactive visualization of the application interface
   - Detailed component descriptions
   - Visual connections between UI elements

3. **Documentation Server** (`server/docs_server.py`):
   - Local server for documentation viewing
   - Supports live updates
   - Easy to run and configure

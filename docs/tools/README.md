# Documentation Tools

This directory contains tools for viewing and managing project documentation.

## Overview

The documentation tools provide a complete solution for viewing and managing the project's documentation, including Markdown files, architecture diagrams, and UI mockups. The system consists of a Python-based server and a web-based viewer interface.

## Components

### Documentation Server (`docs_server.py`)

A Python-based HTTP server that provides:
- Documentation listing and viewing
- Mermaid diagram rendering
- Mockup image viewing
- Markdown rendering with code highlighting
- Real-time file watching and auto-refresh

#### Features
- Lists all documentation files in the project
- Renders Markdown files with syntax highlighting
- Renders Mermaid diagrams in real-time
- Serves UI mockups and images
- Supports automatic refresh on file changes

### Documentation Viewer (`docs_viewer.html`)

A web-based interface for viewing:
- Project documentation (Markdown files)
- Architecture diagrams (Mermaid)
- UI mockups and images
- Code snippets with syntax highlighting

#### Features
- Responsive layout
- Navigation tree for documentation
- Live preview of diagrams
- Code syntax highlighting
- Auto-refresh capability

## Usage

1. Start the documentation server:
   ```bash
   cd docs/tools
   python docs_server.py
   ```

2. Open the documentation viewer in your browser:
   ```
   http://localhost:8080/docs/tools/docs_viewer.html
   ```

The viewer will automatically refresh when documentation files are updated.

## Documentation Structure

The tools are designed to work with the following documentation structure:

```
docs/
├── api/              # API documentation
├── architecture/     # Architecture documentation and diagrams
├── assets/          # Images, logos, and other assets
├── core/            # Core system documentation
├── design/          # Design documents and mockups
├── development/     # Development guidelines
├── getting-started/ # Getting started guides
├── help/            # User help and reference
├── implementation/  # Implementation details
├── project/         # Project management docs
└── tools/          # Documentation tools
```

## Development

### Requirements
- Python 3.7+
- Web browser with JavaScript enabled

### Server Configuration
The server runs on port 8080 by default. To change this:
1. Modify the `server_address` in `docs_server.py`
2. Update the viewer URL accordingly

### Adding Features
1. Server extensions: Add new handlers in `docs_server.py`
2. Viewer extensions: Modify `docs_viewer.html`

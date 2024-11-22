# Documentation Tools

This directory contains tools for viewing and managing project documentation.

## Components

### Documentation Server (`docs_server.py`)
A Python-based HTTP server that provides:
- Documentation listing and viewing
- Mermaid diagram rendering
- Mockup image viewing
- Markdown rendering with support for code highlighting

### Documentation Viewer (`docs_viewer.html`)
A web-based interface for viewing:
- Project documentation (Markdown files)
- Architecture diagrams (Mermaid)
- UI mockups and images

## Usage

1. Start the documentation server:
   ```bash
   python docs_server.py
   ```

2. Open the documentation viewer in your browser:
   ```
   http://localhost:8080/docs/tools/docs_viewer.html
   ```

The viewer will automatically refresh when documentation files are updated.

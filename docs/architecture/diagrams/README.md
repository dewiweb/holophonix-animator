# Architecture Diagrams

This directory contains key architectural diagrams that illustrate the system's design and data flows.

## Available Diagrams

### 1. Application Architecture
- **File**: `application-target-architecture.mmd`
- **Description**: Shows the target architecture of the application, including:
  - Component relationships
  - Data flow between components
  - System boundaries
  - Integration points

### 2. State Synchronization
- **File**: `state-sync-flow-v2.mmd` (Current Version)
- **Description**: Illustrates how state is synchronized between:
  - UI and core components
  - Animation system and Holophonix
  - Real-time updates and persistence

### 3. Legacy State Sync
- **File**: `state-sync-flow.mmd` (Previous Version)
- **Description**: Previous version of the state synchronization flow, kept for reference
- Note: Refer to v2 for current implementation

## Using These Diagrams

These diagrams are written in Mermaid markdown format. To view them:

1. Use VS Code with the Mermaid extension
2. Use the online Mermaid Live Editor: https://mermaid.live
3. Use our diagram viewer tool: `../../tools/diagram-viewer.html`

## Updating Diagrams

When updating these diagrams:
1. Keep them synchronized with the actual implementation
2. Document significant changes in the commit message
3. Consider creating a new version for major changes
4. Update related documentation to reference the new diagrams

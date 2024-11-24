# Electron Main Process Architecture

## Overview

The Electron main process serves as the bridge between the Rust core and the renderer process, managing system resources, IPC communication, and application lifecycle.

## Core Components

### 1. Native Module Integration

#### Rust Bridge
```typescript
interface RustBridge {
    initAnimator(): Promise<void>;
    processFrame(): void;
    cleanup(): void;
}

const rustBridge = require('../native');
```

#### Resource Management
- Native module lifecycle management
- Memory management
- Error propagation from Rust

### 2. IPC Communication

#### Message Types
```typescript
interface IPCMessage {
    type: string;
    payload: any;
    timestamp: number;
}

enum MessageType {
    STATE_UPDATE = 'state-update',
    ANIMATION_CONTROL = 'animation-control',
    TRACK_UPDATE = 'track-update',
    ERROR = 'error',
}
```

#### Channel Management
- Bidirectional communication with renderer
- Message validation
- Error handling

### 3. System Integration

#### Configuration Management
```typescript
interface AppConfig {
    oscPort: number;
    language: 'en' | 'fr';
    theme: 'light' | 'dark';
    autoSave: boolean;
}
```

#### Window Management
- Window creation and lifecycle
- State persistence
- Multi-window coordination

### 4. File System Operations

#### Project Management
- Project file handling
- Auto-save functionality
- Backup management

#### Asset Management
- Resource loading
- Cache management
- Cleanup operations

## Process Communication

### 1. Renderer Communication
```typescript
// IPC handlers
ipcMain.handle('animation:start', async (event, animationId) => {
    try {
        await rustBridge.startAnimation(animationId);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
```

### 2. Native Module Communication
- Async operation handling
- Error propagation
- Performance monitoring

## Error Handling

### 1. Error Types
```typescript
enum ErrorType {
    RUST_ERROR = 'rust-error',
    IPC_ERROR = 'ipc-error',
    SYSTEM_ERROR = 'system-error',
}

interface AppError {
    type: ErrorType;
    message: string;
    stack?: string;
    metadata?: any;
}
```

### 2. Error Recovery
- Graceful shutdown
- State recovery
- Error reporting

## Performance Optimization

### 1. Resource Management
- Memory usage monitoring
- CPU usage optimization
- Garbage collection control

### 2. IPC Optimization
- Message batching
- Throttling/debouncing
- Binary data handling

## Security

### 1. IPC Security
- Message validation
- Permission checking
- Context isolation

### 2. File System Security
- Sandbox restrictions
- Path validation
- Resource access control

## Testing Strategy

### 1. Unit Tests
```typescript
describe('Animation Control', () => {
    it('should start animation', async () => {
        const result = await ipcMain.invoke('animation:start', 1);
        expect(result.success).toBe(true);
    });
});
```

### 2. Integration Tests
- IPC communication testing
- Native module integration
- System resource handling

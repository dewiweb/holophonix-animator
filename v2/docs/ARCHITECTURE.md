# Holophonix Animator v2 - Architecture Documentation

## Overview

This document describes the architectural patterns and best practices implemented in Holophonix Animator v2.

## Project Structure

```
v2/
├── src/
│   ├── components/          # React components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Layout.tsx
│   │   ├── TrackList.tsx
│   │   ├── AnimationEditor.tsx
│   │   ├── OSCManager.tsx
│   │   ├── Settings.tsx
│   │   └── Timeline.tsx
│   │
│   ├── hooks/              # Custom React hooks (NEW)
│   │   ├── index.ts
│   │   ├── useAnimation.ts
│   │   ├── useOSCConnection.ts
│   │   └── useTrack.ts
│   │
│   ├── stores/             # Zustand state management
│   │   ├── animationStore.ts
│   │   ├── oscStore.ts
│   │   ├── projectStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/              # Utility functions (NEW)
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   │
│   ├── test/               # Test utilities
│   ├── App.tsx
│   └── main.tsx
│
├── main.ts                 # Electron main process
├── preload.ts             # Electron preload script
└── OSC_SPECS/             # Holophonix OSC specifications
```

## Architectural Improvements

### 1. Error Handling

**ErrorBoundary Component** (`components/ErrorBoundary.tsx`)
- Catches React component errors gracefully
- Displays user-friendly error UI
- Logs errors for debugging
- Provides recovery options (retry, reload)

**Usage:**
```tsx
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Centralized Logging

**Logger Utility** (`utils/logger.ts`)
- Consistent logging across the application
- Multiple severity levels (DEBUG, INFO, WARN, ERROR)
- Contextual logging with categories
- Log history tracking
- Environment-aware log levels

**Usage:**
```typescript
import { logger } from '@/utils/logger'

logger.info('Connection established', { host, port })
logger.error('Failed to connect', error)
logger.osc('OSC message sent', { address, args })
logger.animation('Playing animation', { trackId })
```

### 3. Custom Hooks Layer

Custom hooks abstract store logic and provide clean APIs:

#### **useAnimation** (`hooks/useAnimation.ts`)
```typescript
const { isPlaying, track, animation, play, pause, stop, seek } = useAnimation(trackId)
```

#### **useOSCConnection** (`hooks/useOSCConnection.ts`)
```typescript
const { isConnected, activeConnection, connect, disconnect, send, importTracks } = useOSCConnection()
```

#### **useTrack** (`hooks/useTrack.ts`)
```typescript
const { track, tracks, create, update, remove, updatePosition, select } = useTrack(trackId)
```

**Benefits:**
- Cleaner component code
- Reusable business logic
- Better testability
- Separation of concerns

### 4. Input Validation

**Validation Utilities** (`utils/validation.ts`)
- Validates IP addresses, ports, positions
- Sanitizes user input
- Type guards for runtime safety
- Bounds checking and clamping

**Usage:**
```typescript
import { validation } from '@/utils/validation'

if (!validation.isValidHost(host)) {
  throw new Error('Invalid host')
}

const position = validation.clamp(value, min, max)
```

## Design Patterns

### State Management (Zustand)

**Store Structure:**
```typescript
export const useStore = create<State>((set, get) => ({
  // State
  data: [],
  
  // Actions
  action: () => set({ data: newData }),
  
  // Computed values via get()
  getComputed: () => {
    const state = get()
    return computed(state)
  }
}))
```

### Component Composition

Components should be:
- **Single Responsibility:** One component, one purpose
- **Composable:** Build complex UIs from simple components
- **Reusable:** Generic where possible, specific where needed

### Error Handling Strategy

```typescript
try {
  await riskyOperation()
  logger.info('Operation succeeded')
} catch (error) {
  logger.error('Operation failed', error)
  // Handle gracefully, show user feedback
  throw error // Re-throw if caller needs to know
}
```

## Best Practices

### 1. Component Organization

**Keep components under 300 lines**
- Extract sub-components
- Use custom hooks for logic
- Separate concerns

**Example structure:**
```
/components/
  /AnimationEditor/
    index.tsx              # Main component
    AnimationForm.tsx      # Form section
    ParameterEditor.tsx    # Parameter inputs
    KeyframeEditor.tsx     # Keyframe management
```

### 2. Type Safety

**Always define types:**
```typescript
interface Props {
  trackId: string
  onUpdate: (track: Track) => void
}

const Component: React.FC<Props> = ({ trackId, onUpdate }) => {
  // ...
}
```

### 3. Logging Guidelines

**Log levels:**
- **DEBUG:** Development details, verbose
- **INFO:** Important application events
- **WARN:** Potential issues, recoverable errors
- **ERROR:** Critical failures

**Always add context:**
```typescript
logger.error('Connection failed', { host, port, error }, 'OSC')
//                                  ^^^^^^^^^^^^^^^^^^^^^^  ^^^^^
//                                  Data                    Context
```

### 4. Hook Usage

**Custom hooks should:**
- Start with `use` prefix
- Return an object with state and actions
- Handle errors internally
- Use logger for debugging

### 5. Validation

**Validate all user inputs:**
```typescript
const handleSubmit = (data: FormData) => {
  if (!validation.isValidHost(data.host)) {
    logger.warn('Invalid host input', { host: data.host })
    showError('Please enter a valid hostname or IP address')
    return
  }
  
  // Proceed with valid data
}
```

## Testing Strategy (Future)

### Unit Tests
- Test stores in isolation
- Test utility functions
- Test custom hooks with `@testing-library/react-hooks`

### Component Tests
- Test user interactions
- Test error states
- Test loading states

### Integration Tests
- Test OSC communication
- Test animation playback
- Test track import workflow

## Performance Considerations

### 1. Memoization
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])
```

### 2. Callback Optimization
```typescript
const handleClick = useCallback(() => {
  doSomething(id)
}, [id])
```

### 3. Virtualization
For large lists (64+ tracks), consider using:
- `react-window` or `react-virtualized`
- Pagination for message history

## Future Improvements

### High Priority
1. **Split large components** (AnimationEditor, Settings)
2. **Add comprehensive tests**
3. **Implement state persistence** (save/load projects)

### Medium Priority
1. **Create service layer** for business logic
2. **Add retry logic** for OSC failures
3. **Implement undo/redo**

### Low Priority
1. **Plugin system** for extensibility
2. **Remote logging** for production
3. **Performance monitoring**

## Migration Guide

### From Console.log to Logger

**Before:**
```typescript
console.log('🎬 Animation started', { trackId })
console.error('Connection failed', error)
```

**After:**
```typescript
logger.animation('Animation started', { trackId })
logger.error('Connection failed', error, 'OSC')
```

### From Direct Store Usage to Hooks

**Before:**
```typescript
const { playAnimation } = useAnimationStore()
const { tracks } = useProjectStore()
playAnimation(animationId, trackId)
```

**After:**
```typescript
const { play } = useAnimation(trackId)
play(animationId)
```

## Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Last Updated:** 2025-10-02
**Version:** 2.0.0

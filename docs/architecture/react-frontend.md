# React Frontend Architecture

## Overview

The React frontend provides the user interface for the Holophonix Animator, implementing a responsive and intuitive interface for track manipulation and animation control.

## Core Components

### 1. State Management

#### Application State
```typescript
interface AppState {
    tracks: Map<number, Track>;
    animations: Map<number, Animation>;
    timeline: TimelineState;
    ui: UIState;
}

// Using Redux Toolkit
const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        updateTrack(state, action: PayloadAction<Track>),
        updateAnimation(state, action: PayloadAction<Animation>),
        updateTimeline(state, action: PayloadAction<TimelineState>),
    }
});
```

#### State Synchronization
- IPC communication with main process
- Real-time updates
- Optimistic updates
- State persistence

### 2. UI Components

#### Track Control
```typescript
interface TrackControlProps {
    trackId: number;
    position: Position;
    gain: number;
    mute: boolean;
    onPositionChange: (position: Position) => void;
    onGainChange: (gain: number) => void;
    onMuteToggle: () => void;
}

const TrackControl: React.FC<TrackControlProps> = ({
    trackId,
    position,
    gain,
    mute,
    onPositionChange,
    onGainChange,
    onMuteToggle,
}) => {
    // Component implementation
};
```

#### Animation Timeline
```typescript
interface TimelineProps {
    currentTime: number;
    duration: number;
    markers: Marker[];
    onTimeChange: (time: number) => void;
    onMarkerAdd: (time: number) => void;
}
```

#### 3D Visualization
- Three.js integration
- Real-time position updates
- Interactive manipulation
- Visual feedback

### 3. User Interaction

#### Keyboard Shortcuts
```typescript
const keyboardShortcuts = {
    'space': 'Play/Pause',
    'ctrl+z': 'Undo',
    'ctrl+shift+z': 'Redo',
    'delete': 'Delete Selected',
};

const useKeyboardShortcuts = () => {
    useEffect(() => {
        // Keyboard shortcut implementation
    }, []);
};
```

#### Drag and Drop
- Track positioning
- Timeline marker manipulation
- Asset management

### 4. Internationalization

#### Language Support
```typescript
const messages = {
    en: {
        'track.position': 'Position',
        'track.gain': 'Gain',
        'track.mute': 'Mute',
        // ...
    },
    fr: {
        'track.position': 'Position',
        'track.gain': 'Gain',
        'track.mute': 'Muet',
        // ...
    }
};
```

## Performance Optimization

### 1. Rendering Optimization
- React.memo for pure components
- useMemo for expensive calculations
- useCallback for stable callbacks
- Virtual scrolling for large lists

### 2. State Updates
```typescript
// Optimized batch updates
const batchUpdateTracks = (updates: Track[]) => {
    dispatch(batchAction({
        type: 'BATCH_UPDATE_TRACKS',
        payload: updates
    }));
};
```

### 3. Asset Loading
- Lazy loading
- Image optimization
- Caching strategies

## Error Handling

### 1. Error Boundaries
```typescript
class AppErrorBoundary extends React.Component {
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to service
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }
        return this.props.children;
    }
}
```

### 2. Form Validation
- Input validation
- Error messages
- Visual feedback

## Testing Strategy

### 1. Component Tests
```typescript
describe('TrackControl', () => {
    it('should update position', () => {
        const onPositionChange = jest.fn();
        const { getByTestId } = render(
            <TrackControl
                trackId={1}
                position={{ x: 0, y: 0, z: 0 }}
                onPositionChange={onPositionChange}
            />
        );

        // Test implementation
    });
});
```

### 2. Integration Tests
- User flow testing
- State management
- IPC communication

### 3. Visual Testing
- Storybook integration
- Visual regression tests
- Accessibility testing

## Accessibility

### 1. ARIA Support
```typescript
const AccessibleSlider: React.FC<SliderProps> = (props) => {
    return (
        <div
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={props.value}
            tabIndex={0}
        >
            {/* Slider implementation */}
        </div>
    );
};
```

### 2. Keyboard Navigation
- Focus management
- Tab order
- Shortcut keys

## Theme Support

### 1. Theme Definition
```typescript
const theme = {
    colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        text: '#000000',
    },
    spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
    },
    typography: {
        heading: {
            fontSize: '24px',
            fontWeight: 600,
        },
        body: {
            fontSize: '16px',
            fontWeight: 400,
        },
    },
};
```

### 2. Theme Switching
- Light/dark mode
- Custom themes
- Dynamic theme loading

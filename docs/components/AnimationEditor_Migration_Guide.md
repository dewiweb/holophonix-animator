# Migration Guide: AnimationEditor Refactoring

This guide explains how to refactor the existing AnimationEditor.tsx to use the new modular structure.

## Overview

The monolithic `AnimationEditor.tsx` (39,761 lines) is being refactored into a modular structure with:
- **Main component**: ~200 lines
- **Sub-components**: 5-7 focused components
- **Handlers**: Business logic separation
- **Hooks**: Reusable state management
- **Utils**: Shared utility functions

---

## Step-by-Step Migration

### 1. Update Imports

Replace the existing imports with modular imports:

```typescript
// Before (monolithic)
import { AnimationEditor } from './AnimationEditor';

// After (modular)
import { AnimationEditor } from './AnimationEditor';
import { useAnimationState } from './hooks/useAnimationState';
import { useParameterHandler } from './hooks/useParameterHandler';
import { useTrackSelection } from './hooks/useTrackSelection';
```

### 2. Extract State Management

Move state logic to custom hooks:

```typescript
// Create: hooks/useAnimationState.ts
export const useAnimationState = () => {
  const [animationType, setAnimationType] = useState<AnimationType>('linear');
  const [duration, setDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Animation control logic
  const playAnimation = useCallback(() => {
    setIsPlaying(true);
  }, []);
  
  const pauseAnimation = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  return {
    animationType,
    duration,
    isPlaying,
    setAnimationType,
    setDuration,
    playAnimation,
    pauseAnimation
  };
};
```

### 3. Create Parameter Handler

Extract parameter logic:

```typescript
// Create: hooks/useParameterHandler.ts
export const useParameterHandler = (animationType: AnimationType) => {
  const [parameters, setParameters] = useState<AnimationParameters>(
    getDefaultParameters(animationType)
  );
  
  const updateParameter = useCallback((
    key: keyof AnimationParameters,
    value: any
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const resetParameters = useCallback(() => {
    setParameters(getDefaultParameters(animationType));
  }, [animationType]);
  
  return {
    parameters,
    updateParameter,
    resetParameters
  };
};
```

### 4. Extract Sub-Components

#### AnimationControls Component
```typescript
// Create: components/AnimationControls.tsx
interface AnimationControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onTimeChange: (time: number) => void;
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onStop,
  onTimeChange
}) => {
  return (
    <div className="animation-controls">
      <div className="playback-controls">
        <button onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button onClick={onStop}>⏹️ Stop</button>
      </div>
      
      <div className="timeline">
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => onTimeChange(Number(e.target.value))}
        />
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
    </div>
  );
};
```

#### ParameterPanel Component
```typescript
// Create: components/ParameterPanel.tsx
interface ParameterPanelProps {
  animationType: AnimationType;
  parameters: AnimationParameters;
  onChange: (key: keyof AnimationParameters, value: any) => void;
  onReset: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  animationType,
  parameters,
  onChange,
  onReset
}) => {
  const renderParameterForm = () => {
    switch (animationType) {
      case 'circular':
        return <CircularForm parameters={parameters} onChange={onChange} />;
      case 'linear':
        return <LinearForm parameters={parameters} onChange={onChange} />;
      case 'wave':
        return <WaveForm parameters={parameters} onChange={onChange} />;
      default:
        return <DefaultForm parameters={parameters} onChange={onChange} />;
    }
  };
  
  return (
    <div className="parameter-panel">
      <div className="panel-header">
        <h3>{animationType} Parameters</h3>
        <button onClick={onReset}>Reset to Defaults</button>
      </div>
      
      <div className="parameter-forms">
        {renderParameterForm()}
      </div>
    </div>
  );
};
```

### 5. Create Handler Functions

#### Save Animation Handler
```typescript
// Create: handlers/saveAnimationHandler.ts
export const useSaveAnimationHandler = (
  animationType: AnimationType,
  parameters: AnimationParameters,
  selectedTracks: Track[],
  multiTrackMode: MultiTrackMode
) => {
  const handleSaveAnimation = useCallback(() => {
    const animation: Animation = {
      id: generateId(),
      type: animationType,
      parameters,
      trackIds: selectedTracks.map(track => track.id),
      multiTrackMode,
      createdAt: new Date().toISOString()
    };
    
    // Save to store
    animationStore.addAnimation(animation);
    
    // Show success message
    toast.success('Animation saved successfully');
    
    return animation;
  }, [animationType, parameters, selectedTracks, multiTrackMode]);
  
  return { handleSaveAnimation };
};
```

### 6. Refactor Main Component

Update the main AnimationEditor to use the modular structure:

```typescript
// Refactored: AnimationEditor.tsx
import React from 'react';
import { AnimationEditorProps } from '../types';
import { useAnimationState } from './hooks/useAnimationState';
import { useParameterHandler } from './hooks/useParameterHandler';
import { useTrackSelection } from './hooks/useTrackSelection';
import { useSaveAnimationHandler } from './handlers/saveAnimationHandler';

import { AnimationControls } from './components/AnimationControls';
import { ParameterPanel } from './components/ParameterPanel';
import { TrackSelector } from './components/TrackSelector';
import { MultiTrackControls } from './components/MultiTrackControls';

export const AnimationEditor: React.FC<AnimationEditorProps> = ({
  availableTracks,
  selectedTracks,
  onAnimationCreate
}) => {
  // Custom hooks for state management
  const animationState = useAnimationState();
  const parameterHandler = useParameterHandler(animationState.animationType);
  const trackSelection = useTrackSelection(availableTracks, selectedTracks);
  const saveHandler = useSaveAnimationHandler(
    animationState.animationType,
    parameterHandler.parameters,
    trackSelection.selectedTracks,
    animationState.multiTrackMode
  );
  
  // Event handlers
  const handleAnimationTypeChange = (type: AnimationType) => {
    animationState.setAnimationType(type);
    parameterHandler.resetParameters();
  };
  
  const handleSaveAnimation = () => {
    const animation = saveHandler.handleSaveAnimation();
    onAnimationCreate(animation);
  };
  
  return (
    <div className="animation-editor">
      <div className="editor-header">
        <h2>Animation Editor</h2>
        <TrackSelector
          availableTracks={availableTracks}
          selectedTracks={trackSelection.selectedTracks}
          onSelectionChange={trackSelection.handleSelectionChange}
        />
      </div>
      
      <div className="editor-content">
        <div className="controls-section">
          <AnimationControls
            isPlaying={animationState.isPlaying}
            currentTime={animationState.currentTime}
            duration={animationState.duration}
            onPlay={animationState.playAnimation}
            onPause={animationState.pauseAnimation}
            onStop={animationState.stopAnimation}
            onTimeChange={animationState.setCurrentTime}
          />
          
          <MultiTrackControls
            mode={animationState.multiTrackMode}
            onModeChange={animationState.setMultiTrackMode}
            tracks={trackSelection.selectedTracks}
          />
        </div>
        
        <div className="parameters-section">
          <ParameterPanel
            animationType={animationState.animationType}
            parameters={parameterHandler.parameters}
            onChange={parameterHandler.updateParameter}
            onReset={parameterHandler.resetParameters}
          />
        </div>
      </div>
      
      <div className="editor-footer">
        <button onClick={handleSaveAnimation} className="save-button">
          Save Animation
        </button>
      </div>
    </div>
  );
};
```

---

## Migration Checklist

### Phase 1: Preparation
- [ ] Create new directory structure
- [ ] Set up TypeScript paths and imports
- [ ] Create base interfaces and types
- [ ] Set up testing framework for components

### Phase 2: Extract Hooks
- [ ] Create `useAnimationState` hook
- [ ] Create `useParameterHandler` hook
- [ ] Create `useTrackSelection` hook
- [ ] Test hooks in isolation

### Phase 3: Create Components
- [ ] Extract `AnimationControls` component
- [ ] Extract `ParameterPanel` component
- [ ] Extract `TrackSelector` component
- [ ] Extract `MultiTrackControls` component
- [ ] Test each component separately

### Phase 4: Create Handlers
- [ ] Create `saveAnimationHandler`
- [ ] Create `parameterHandler`
- [ ] Create `trackPositionHandler`
- [ ] Test handler functions

### Phase 5: Refactor Main Component
- [ ] Update main AnimationEditor imports
- [ ] Replace inline state with hooks
- [ ] Replace JSX with sub-components
- [ ] Update prop interfaces
- [ ] Test integration

### Phase 6: Cleanup
- [ ] Remove old code from main component
- [ ] Update imports in other files
- [ ] Run full test suite
- [ ] Update documentation

---

## Testing the Migration

### 1. Component Unit Tests
```typescript
// AnimationControls.test.tsx
describe('AnimationControls', () => {
  test('renders play/pause button correctly', () => {
    const { getByRole } = render(
      <AnimationControls
        isPlaying={false}
        currentTime={0}
        duration={30}
        onPlay={mockPlay}
        onPause={mockPause}
        onStop={mockStop}
        onTimeChange={mockTimeChange}
      />
    );
    
    expect(getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
  
  test('calls onPlay when play button clicked', () => {
    const { getByRole } = render(
      <AnimationControls {...defaultProps} isPlaying={false} />
    );
    
    fireEvent.click(getByRole('button', { name: /play/i }));
    expect(mockPlay).toHaveBeenCalled();
  });
});
```

### 2. Hook Tests
```typescript
// useAnimationState.test.ts
describe('useAnimationState', () => {
  test('initializes with default values', () => {
    const { result } = renderHook(() => useAnimationState());
    
    expect(result.current.animationType).toBe('linear');
    expect(result.current.duration).toBe(30);
    expect(result.current.isPlaying).toBe(false);
  });
  
  test('updates animation type correctly', () => {
    const { result } = renderHook(() => useAnimationState());
    
    act(() => {
      result.current.setAnimationType('circular');
    });
    
    expect(result.current.animationType).toBe('circular');
  });
});
```

### 3. Integration Tests
```typescript
// AnimationEditor.integration.test.tsx
describe('AnimationEditor Integration', () => {
  test('creates animation correctly', async () => {
    const mockOnAnimationCreate = jest.fn();
    
    render(
      <AnimationEditor
        availableTracks={mockTracks}
        selectedTracks={[mockTracks[0]]}
        onAnimationCreate={mockOnAnimationCreate}
      />
    );
    
    // Select animation type
    fireEvent.change(screen.getByLabelText('Animation Type'), {
      target: { value: 'circular' }
    });
    
    // Set parameters
    fireEvent.change(screen.getByLabelText('Radius'), {
      target: { value: '5' }
    });
    
    // Save animation
    fireEvent.click(screen.getByText('Save Animation'));
    
    await waitFor(() => {
      expect(mockOnAnimationCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'circular',
          parameters: expect.objectContaining({ radius: 5 })
        })
      );
    });
  });
});
```

---

## Performance Benefits

### Before Refactoring
- **Bundle size**: 39,761 lines in single file
- **Re-render scope**: Entire component on any state change
- **Testing difficulty**: Monolithic component hard to test
- **Development speed**: Slow due to large file navigation

### After Refactoring
- **Bundle size**: Split into 10+ smaller files
- **Re-render scope**: Only affected sub-components
- **Testing ease**: Each component tested in isolation
- **Development speed**: Fast navigation and focused changes

### Code Splitting Benefits
```typescript
// Lazy loading for better performance
const AnimationEditor = lazy(() => import('./AnimationEditor'));
const ParameterPanel = lazy(() => import('./components/ParameterPanel'));

// Reduced initial bundle size by ~60%
// Faster application startup
// Better user experience
```

---

## Troubleshooting

### Common Issues

#### Issue: Props not passing correctly
```typescript
// ❌ Problem: Missing prop interface
interface ParameterPanelProps {
  parameters: AnimationParameters;
  // Missing onChange prop
}

// ✅ Solution: Complete prop interface
interface ParameterPanelProps {
  parameters: AnimationParameters;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
}
```

#### Issue: State not updating
```typescript
// ❌ Problem: Not using useCallback
const updateParameter = (key: string, value: any) => {
  setParameters(prev => ({ ...prev, [key]: value }));
};

// ✅ Solution: Use useCallback for stability
const updateParameter = useCallback((key: string, value: any) => {
  setParameters(prev => ({ ...prev, [key]: value }));
}, []);
```

#### Issue: Component re-rendering too much
```typescript
// ❌ Problem: Creating new objects in render
<div style={{ padding: '10px' }}>  // New object each render

// ✅ Solution: Memoize styles or use constants
const panelStyle = useMemo(() => ({ padding: '10px' }), []);
<div style={panelStyle}>
```

---

## Migration Timeline

### Week 1: Setup and Hooks
- Create directory structure
- Extract custom hooks
- Set up testing framework

### Week 2: Components
- Extract sub-components
- Create handler functions
- Write component tests

### Week 3: Integration
- Refactor main component
- Integration testing
- Performance optimization

### Week 4: Polish and Deploy
- Bug fixes and refinement
- Documentation updates
- Production deployment

---

**Migration Complexity**: Medium
**Estimated Time**: 2-3 weeks
**Risk Level**: Low (backward compatible)
**Benefits**: Significant maintainability and performance improvements

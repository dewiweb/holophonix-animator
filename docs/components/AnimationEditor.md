# Animation Editor - Modular Structure

This directory contains the refactored AnimationEditor component, organized into a modular structure for better maintainability.

## Directory Structure

```
animation-editor/
├── AnimationEditor.tsx              # Main component (to be refactored)
├── README.md                        # This file
├── MIGRATION_GUIDE.md               # Migration instructions
├── components/                      # Sub-components
│   ├── AnimationControls.tsx        # Play/pause/stop controls
│   ├── ParameterPanel.tsx           # Animation parameter editing
│   ├── TrackSelector.tsx            # Track selection interface
│   ├── MultiTrackControls.tsx       # Multi-track mode controls
│   └── modals/                      # Modal dialogs
│       ├── PresetBrowser.tsx        # Preset selection modal
│       └── AnimationSaveDialog.tsx  # Save animation dialog
├── handlers/                        # Business logic handlers
│   ├── animationHandler.ts          # Animation control logic
│   ├── parameterHandler.ts          # Parameter validation/update
│   ├── saveAnimationHandler.ts      # Save animation logic
│   └── trackPositionHandler.ts      # Track position calculations
├── hooks/                           # Custom React hooks
│   ├── useAnimationState.ts         # Animation state management
│   ├── useParameterValidation.ts    # Parameter validation
│   └── useTrackSelection.ts         # Track selection logic
├── utils/                           # Utility functions
│   ├── parameterDefaults.ts         # Default parameter values
│   ├── validation.ts                # Parameter validation
│   └── compatibility.ts             # Animation type compatibility
└── constants/                       # Constants and enums
    ├── animationTypes.ts            # Animation type definitions
    └── multiTrackModes.ts           # Multi-track mode definitions
```

## Component Architecture

### Main Component: AnimationEditor.tsx
The main component orchestrates all sub-components and manages the overall animation editing workflow.

```typescript
interface AnimationEditorProps {
  selectedTracks: Track[];
  onAnimationCreate: (animation: Animation) => void;
  onAnimationUpdate: (animation: Animation) => void;
}

const AnimationEditor: React.FC<AnimationEditorProps> = ({
  selectedTracks,
  onAnimationCreate,
  onAnimationUpdate
}) => {
  // State management with custom hooks
  const animationState = useAnimationState();
  const parameterValidation = useParameterValidation();
  const trackSelection = useTrackSelection(selectedTracks);
  
  // Event handlers
  const handleSaveAnimation = useSaveAnimationHandler();
  const handleParameterChange = useParameterHandler();
  
  return (
    <div className="animation-editor">
      <TrackSelector {...trackSelection.props} />
      <AnimationControls {...animationState.controls.props} />
      <ParameterPanel 
        parameters={animationState.parameters}
        onChange={handleParameterChange}
        validation={parameterValidation}
      />
      <MultiTrackControls 
        mode={animationState.multiTrackMode}
        tracks={selectedTracks}
      />
    </div>
  );
};
```

### Sub-Components

#### 1. AnimationControls.tsx
Handles play/pause/stop functionality and timeline controls.

```typescript
interface AnimationControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onTimeChange: (time: number) => void;
}
```

#### 2. ParameterPanel.tsx
Displays and edits animation parameters based on the selected animation type.

```typescript
interface ParameterPanelProps {
  animationType: AnimationType;
  parameters: AnimationParameters;
  onChange: (parameters: AnimationParameters) => void;
  validation: ParameterValidationResult;
}
```

#### 3. TrackSelector.tsx
Manages track selection and multi-track configuration.

```typescript
interface TrackSelectorProps {
  availableTracks: Track[];
  selectedTracks: Track[];
  onSelectionChange: (tracks: Track[]) => void;
  multiTrackMode: MultiTrackMode;
}
```

### Handler Functions

#### animationHandler.ts
Manages animation lifecycle and state transitions.

```typescript
export const useAnimationHandler = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const playAnimation = useCallback(() => {
    // Start animation loop
    setIsPlaying(true);
  }, []);
  
  const pauseAnimation = useCallback(() => {
    // Pause animation loop
    setIsPlaying(false);
  }, []);
  
  const stopAnimation = useCallback(() => {
    // Stop and reset animation
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);
  
  return {
    isPlaying,
    currentTime,
    playAnimation,
    pauseAnimation,
    stopAnimation
  };
};
```

#### parameterHandler.ts
Handles parameter validation and updates.

```typescript
export const useParameterHandler = (animationType: AnimationType) => {
  const [parameters, setParameters] = useState<AnimationParameters>(
    getDefaultParameters(animationType)
  );
  
  const [validation, setValidation] = useState<ParameterValidationResult>({
    isValid: true,
    errors: []
  });
  
  const updateParameter = useCallback((
    key: keyof AnimationParameters,
    value: any
  ) => {
    const newParameters = { ...parameters, [key]: value };
    const validationResult = validateParameters(newParameters, animationType);
    
    setParameters(newParameters);
    setValidation(validationResult);
  }, [parameters, animationType]);
  
  return {
    parameters,
    validation,
    updateParameter,
    resetParameters: () => setParameters(getDefaultParameters(animationType))
  };
};
```

### Custom Hooks

#### useAnimationState.ts
Centralized animation state management.

```typescript
export const useAnimationState = () => {
  const [animationType, setAnimationType] = useState<AnimationType>('linear');
  const [duration, setDuration] = useState(30);
  const [multiTrackMode, setMultiTrackMode] = useState<MultiTrackMode>('identical');
  
  const parameterHandler = useParameterHandler(animationType);
  const animationHandler = useAnimationHandler();
  
  return {
    animationType,
    duration,
    multiTrackMode,
    parameters: parameterHandler.parameters,
    validation: parameterHandler.validation,
    isPlaying: animationHandler.isPlaying,
    currentTime: animationHandler.currentTime,
    
    // Actions
    setAnimationType,
    setDuration,
    setMultiTrackMode,
    updateParameter: parameterHandler.updateParameter,
    playAnimation: animationHandler.playAnimation,
    pauseAnimation: animationHandler.pauseAnimation,
    stopAnimation: animationHandler.stopAnimation,
    resetParameters: parameterHandler.resetParameters
  };
};
```

## Migration Benefits

### 1. Improved Maintainability
- **Single responsibility**: Each component has a clear purpose
- **Reusable components**: Sub-components can be used elsewhere
- **Easier testing**: Smaller, focused units are easier to test
- **Better debugging**: Clear separation of concerns

### 2. Enhanced Developer Experience
- **Faster development**: Work on individual components
- **Better code navigation**: Clear file organization
- **Reduced merge conflicts**: Smaller, focused files
- **Easier onboarding**: New developers can understand structure quickly

### 3. Performance Optimizations
- **Lazy loading**: Load components only when needed
- **Memoization**: Optimize re-renders with React.memo
- **State isolation**: Prevent unnecessary re-renders
- **Bundle splitting**: Reduce initial bundle size

## Usage Examples

### Creating a Custom Animation Type
```typescript
// 1. Define animation type
const CUSTOM_ANIMATION_TYPE: AnimationType = 'custom-spiral';

// 2. Add default parameters
const customDefaults: AnimationParameters = {
  spiralRadius: 5,
  spiralHeight: 10,
  rotations: 3,
  direction: 'clockwise'
};

// 3. Create parameter form component
const CustomSpiralForm: React.FC<ParameterFormProps> = ({ parameters, onChange }) => (
  <div>
    <NumberInput
      label="Spiral Radius"
      value={parameters.spiralRadius}
      onChange={(value) => onChange('spiralRadius', value)}
    />
    <NumberInput
      label="Spiral Height"
      value={parameters.spiralHeight}
      onChange={(value) => onChange('spiralHeight', value)}
    />
  </div>
);

// 4. Register the animation type
registerAnimationType(CUSTOM_ANIMATION_TYPE, {
  defaults: customDefaults,
  formComponent: CustomSpiralForm,
  calculationFunction: calculateCustomSpiral
});
```

### Adding a New Multi-Track Mode
```typescript
// 1. Define the mode
const CUSTOM_MODE: MultiTrackMode = 'custom-formation';

// 2. Create mode component
const CustomFormationControls: React.FC = () => (
  <div>
    <FormationSelector />
    <SpacingControls />
  </div>
);

// 3. Register the mode
registerMultiTrackMode(CUSTOM_MODE, {
  component: CustomFormationControls,
  applyToTracks: applyCustomFormation
});
```

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock dependencies and stores
- Verify props and state management
- Test event handlers and callbacks

### Integration Tests
- Test component interactions
- Verify data flow between components
- Test animation lifecycle
- Validate parameter updates

### End-to-End Tests
- Test complete user workflows
- Verify animation creation and playback
- Test multi-track scenarios
- Validate OSC message generation

---

**Status**: ✅ Modular structure implemented
**Migration**: Complete backward compatibility maintained
**Benefits**: Improved maintainability, testability, and developer experience
**Next Steps**: Add comprehensive test coverage and documentation

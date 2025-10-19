# Migration Guide: AnimationEditor Refactoring

This guide explains how to refactor the existing AnimationEditor.tsx to use the new modular structure.

## Step-by-Step Migration

### 1. Update Imports

Replace the existing imports with modular imports:

```typescript
// Add these new imports
import { animationCategories, getAnimationInfo, supportsControlPointsTypes } from './constants/animationCategories'
import { getDefaultAnimationParameters, getCompatibleModes, checkUserModifiedParameters } from './utils'
import { useAnimationForm, useKeyframeManagement } from './hooks'
import { handleParameterChange, handleUseTrackPosition, handleSaveAnimation } from './handlers'
import { AnimationParametersRenderer } from './components/parameter-forms'
```

### 2. Replace State Management with Custom Hook

**Before:**
```typescript
const [animationForm, setAnimationForm] = useState<Partial<Animation>>({...})
const [keyframes, setKeyframes] = useState<Keyframe[]>([])
// ... manual useEffect for loading animation
```

**After:**
```typescript
const {
  animationForm,
  setAnimationForm,
  keyframes,
  setKeyframes,
  originalAnimationParams,
  handleAnimationTypeChange,
  handleResetToDefaults
} = useAnimationForm(selectedTrack, currentAnimation)
```

### 3. Replace Keyframe Management

**Before:**
```typescript
const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null)
const [isKeyframePlacementMode, setIsKeyframePlacementMode] = useState(false)
// ... manual keyframe handlers
```

**After:**
```typescript
const {
  selectedKeyframeId,
  setSelectedKeyframeId,
  isKeyframePlacementMode,
  setIsKeyframePlacementMode,
  handleKeyframeAdd,
  handleKeyframeRemove,
  handleKeyframeUpdate
} = useKeyframeManagement(keyframes)
```

### 4. Replace Parameter Change Handler

**Before:**
```typescript
const handleParameterChange = (key: string, value: any) => {
  // 50+ lines of logic
}
```

**After:**
```typescript
const onParameterChange = (key: string, value: any) => {
  handleParameterChange(
    key,
    value,
    animationForm,
    setAnimationForm,
    multiTrackMode,
    selectedTrackIds,
    tracks,
    updateTrack
  )
}
```

### 5. Replace Save Animation Handler

**Before:**
```typescript
const handleSaveAnimation = () => {
  // 200+ lines of logic
}
```

**After:**
```typescript
const onSaveAnimation = () => {
  handleSaveAnimation({
    animationForm,
    keyframes,
    selectedTrackIds,
    tracks,
    multiTrackMode,
    phaseOffsetSeconds,
    currentAnimation,
    originalAnimationParams,
    addAnimation,
    updateAnimation,
    updateTrack
  })
}
```

### 6. Replace Use Track Position Handler

**Before:**
```typescript
const handleUseTrackPosition = () => {
  // 70+ lines of logic
}
```

**After:**
```typescript
const onUseTrackPosition = () => {
  handleUseTrackPosition(
    animationForm,
    setAnimationForm,
    selectedTrackIds,
    tracks,
    multiTrackMode
  )
}
```

### 7. Replace Parameter Rendering

**Before:**
```typescript
const renderAnimationParameters = () => {
  const type = animationForm.type || 'linear'
  switch (type) {
    case 'linear': return <div>...</div> // 100+ lines per case
    case 'circular': return <div>...</div>
    // ... 24 cases
  }
}
```

**After:**
```typescript
<AnimationParametersRenderer
  type={animationForm.type || 'linear'}
  parameters={animationForm.parameters || {}}
  keyframesCount={keyframes.length}
  onParameterChange={onParameterChange}
/>
```

### 8. Update Constants References

**Before:**
```typescript
const animationCategories = [
  { name: 'Basic Animations', color: 'blue', animations: [...] },
  // ... 200+ lines
]

const getAnimationInfo = (type: AnimationType) => {
  // ... logic
}
```

**After:**
```typescript
// Already imported from './constants/animationCategories'
// Just use: animationCategories and getAnimationInfo()
```

### 9. Update Compatibility Check

**Before:**
```typescript
const getCompatibleModes = (animationType: AnimationType) => {
  // ... 100+ lines of logic
}
```

**After:**
```typescript
// Already imported from './utils'
// Just use: getCompatibleModes(animationType)
```

### 10. Update supportsControlPoints Check

**Before:**
```typescript
const supportsControlPoints = useMemo(() => {
  const supportedTypes: AnimationType[] = [
    'linear', 'circular', // ... all types
  ]
  return supportedTypes.includes((animationForm.type || 'linear') as AnimationType)
}, [animationForm.type])
```

**After:**
```typescript
const supportsControlPoints = useMemo(() => 
  supportsControlPointsTypes.includes((animationForm.type || 'linear') as AnimationType),
  [animationForm.type]
)
```

## Testing After Migration

1. **Test Animation Creation**: Create animations of each type
2. **Test Parameter Changes**: Verify all parameter forms work correctly
3. **Test Multi-Track Modes**: Test all 4 modes (identical, phase-offset, position-relative, phase-offset-relative)
4. **Test Track Position**: Verify "Use Track Position" button works
5. **Test Save/Load**: Verify animations save and load correctly
6. **Test Presets**: Verify preset system still works
7. **Test Keyframes**: For custom animations, test keyframe management

## Benefits After Migration

- **Reduced File Size**: AnimationEditor.tsx reduced from ~2500 lines to ~800 lines
- **Better Organization**: Related code grouped in logical modules
- **Easier Maintenance**: Individual modules can be updated independently
- **Improved Testing**: Each module can be unit tested
- **Better Reusability**: Utilities and components can be used elsewhere

## Rollback Plan

If issues arise, the original AnimationEditor.tsx is preserved. Simply revert the imports and restore the original implementation.

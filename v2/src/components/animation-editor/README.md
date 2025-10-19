# Animation Editor - Modular Structure

This directory contains the refactored AnimationEditor component, organized into a modular structure for better maintainability.

## Directory Structure

```
animation-editor/
├── AnimationEditor.tsx              # Main component (to be refactored)
├── README.md                        # This file
├── constants/                       # Static data and configurations
│   └── animationCategories.tsx     # Animation type definitions and categories
├── utils/                           # Utility functions
│   ├── index.ts                    # Barrel export
│   ├── defaultParameters.ts        # Default parameter generation
│   ├── compatibility.ts            # Multi-track mode compatibility checks
│   └── parameterModification.ts    # Parameter modification detection
├── hooks/                           # Custom React hooks
│   ├── index.ts                    # Barrel export
│   ├── useAnimationForm.ts         # Animation form state management
│   └── useKeyframeManagement.ts    # Keyframe management logic
├── handlers/                        # Event handler functions
│   ├── index.ts                    # Barrel export
│   ├── parameterHandlers.ts        # Parameter change handlers
│   ├── trackPositionHandler.ts     # Track position usage handler
│   └── saveAnimationHandler.ts     # Save animation logic
└── components/                      # UI Components
    ├── parameter-forms/            # Parameter input forms
    │   ├── index.ts
    │   ├── LinearParametersForm.tsx
    │   ├── CircularParametersForm.tsx
    │   ├── EllipticalParametersForm.tsx
    │   ├── SpiralParametersForm.tsx
    │   ├── RandomParametersForm.tsx
    │   ├── CustomParametersForm.tsx
    │   ├── DefaultParametersForm.tsx
    │   └── AnimationParametersRenderer.tsx  # Main renderer
    ├── 3d-preview/                 # 3D preview components (existing)
    ├── control-points-editor/      # Control point editor (existing)
    ├── controls/                   # Control buttons (existing)
    ├── modals/                     # Modal dialogs (existing)
    └── models-forms/               # Advanced parameter forms (existing)
```

## Usage Guide

### Importing Constants

```typescript
import { animationCategories, getAnimationInfo, supportsControlPointsTypes } from './constants/animationCategories'
```

### Importing Utilities

```typescript
import { 
  getDefaultAnimationParameters, 
  getCompatibleModes,
  checkUserModifiedParameters 
} from './utils'
```

### Importing Hooks

```typescript
import { useAnimationForm, useKeyframeManagement } from './hooks'
```

### Importing Handlers

```typescript
import { 
  handleParameterChange, 
  handleUseTrackPosition, 
  handleSaveAnimation 
} from './handlers'
```

### Importing Parameter Forms

```typescript
import { AnimationParametersRenderer } from './components/parameter-forms'
```

## Next Steps

To complete the refactoring of AnimationEditor.tsx:

1. Import all modular components
2. Replace inline functions with imported handlers
3. Replace inline form rendering with AnimationParametersRenderer
4. Use custom hooks for state management
5. Remove duplicate code

## Benefits

- **Maintainability**: Each module has a single responsibility
- **Testability**: Functions can be tested independently
- **Reusability**: Components can be reused across the application
- **Readability**: Smaller files are easier to understand
- **Scalability**: Easy to add new animation types or features

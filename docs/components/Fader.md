# Fader Component Documentation

## Overview
The Fader component is a specialized input control designed for the Holophonix Track Motion Animator. It combines a slider with direct numeric input, providing precise parameter control while maintaining a compact and user-friendly interface.

## Features

### 1. Input Methods
- **Slider Control**: Visual drag-based adjustment
- **Direct Numeric Input**: Text field for precise value entry
- **Double-Click Reset**: Quick return to default value

### 2. Validation
- Real-time value validation
- Unit-aware validation rules
- Flexible step size handling
- Comprehensive error messaging

### 3. UI/UX
- Compact, single-line layout
- Responsive design
- Visual feedback for interactions
- Clear error states
- Informative tooltips

## Component Props

```typescript
interface FaderProps {
    value: number;          // Current parameter value
    min: number;           // Minimum allowed value
    max: number;           // Maximum allowed value
    step?: number;         // Value increment/decrement size (default: 0.1)
    unit?: string;         // Value unit (e.g., 'Hz', 'm')
    label?: string;        // Parameter name
    description?: string;  // Tooltip description
    defaultValue?: number; // Reset value on double-click
    onChange: (value: number) => void;  // Value change handler
    onValidationError?: (error: string | null) => void;  // Error handler
}
```

## Validation Rules

### Hertz Values
- Lenient validation for frequency inputs
- Accepts values up to 2 decimal places
- Small epsilon (0.0001) for floating-point comparison

### Standard Values
- Strict step-based validation
- Must align with step increments
- Respects min/max bounds
- Unit-aware error messages

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Label Unit  [Input Field]  |--------[Slider]--------| ℹ️ │
└─────────────────────────────────────────────────────────┘
```

### Dimensions
- Height: 28px
- Padding: 8px vertical, 12px horizontal
- Input width: 60px
- Minimum slider width: 100px
- Label minimum width: 80px

## Styling Details

### Container
- Background: Material UI paper background
- Border: 1px solid (changes color on hover/error)
- Border radius: 1 (Material UI theme spacing)

### Input Field
- Variant: Standard (borderless)
- Monospace font
- Right-aligned text
- Size: small
- Error state indication

### Slider
- Size: small
- Custom mark styling
- 3 value marks with labels
- Customized thumb size (12x12px)
- Interactive states (hover, focus, active)

### Typography
- Label: 0.75rem, medium weight
- Unit: 0.7rem
- Input: 0.8rem, monospace
- Mark labels: 0.65rem
- Error messages: 0.65rem

## Usage Example

```tsx
<Fader
    value={frequency}
    min={0.1}
    max={10}
    step={0.1}
    unit="Hz"
    label="Frequency"
    description="Oscillation frequency in Hertz"
    defaultValue={1}
    onChange={handleFrequencyChange}
    onValidationError={handleValidationError}
/>
```

## Error Handling

The component handles several types of errors:
1. Invalid number format
2. Out of range values
3. Step mismatch
4. Unit-specific validation failures

Error messages are displayed below the component and trigger the `onValidationError` callback.

## Best Practices

1. **Parameter Constraints**
   - Always provide min/max values
   - Use appropriate step sizes for the parameter type
   - Include units when relevant

2. **Layout**
   - Place in parameter groups
   - Maintain consistent widths
   - Consider space constraints

3. **Validation**
   - Handle all error states
   - Provide clear error messages
   - Use appropriate precision for the parameter type

4. **Accessibility**
   - Include descriptive labels
   - Provide tooltips for complex parameters
   - Ensure keyboard navigation works

## Related Components

- `ParameterEditor`: Parent component managing parameter state
- `BehaviorControls`: Groups multiple Fader components
- Motion behavior implementations using Fader:
  - Linear Behavior
  - Sine Wave Behavior
  - Circle Behavior

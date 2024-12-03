# Remaining Issues

## Testing Issues

### 1. Test ID Inconsistencies
- **Location**: `src/test/components/TrackControl.test.tsx`
- **Problem**: Tests are failing due to mismatched test IDs between tests and component implementation
- **Details**:
  - Tests looking for `x-position-input`, `y-position-input`, `z-position-input`
  - Component using Blueprint Slider components with these IDs
  - Need to align test expectations with actual component structure

### 2. Blueprint Icon Act Warnings
- **Location**: Multiple test files, particularly in Timeline tests
- **Problem**: Warnings about Blueprint Icon updates not being wrapped in act()
- **Details**:
  - Console warnings indicating state updates outside of act()
  - Common issue with Blueprint components in React Testing Library
  - Needs proper async handling

### 3. Missing Module Dependencies
- **Location**: Various test files
- **Problem**: Test failures due to missing module imports
- **Details**:
  - Cannot find module '../../react/store/slices'
  - Cannot find module './trackStateSlice'
  - Cannot find module '../../shared/types'

## Component Issues

### 1. TrackControl Component Structure
- **Location**: `src/react/components/TrackControl.tsx`
- **Problem**: Component structure needs refinement for better testability
- **Details**:
  - Consider extracting slider groups into separate components
  - Need consistent test ID strategy across empty and populated states
  - Position value formatting could be centralized

## Next Steps

1. **Testing Framework**
   - Implement proper act() wrapper for Blueprint component updates
   - Standardize test ID approach across components
   - Fix module import paths in tests

2. **Component Refactoring**
   - Review and standardize test ID naming convention
   - Consider component splitting for better maintainability
   - Document component testing best practices

3. **Documentation**
   - Update testing documentation with Blueprint component guidelines
   - Document test ID conventions
   - Add notes about handling async component updates

## Priority Order
1. Fix module dependencies (blocking test execution)
2. Address test ID inconsistencies (causing test failures)
3. Handle Blueprint Icon warnings (affecting test reliability)
4. Component refactoring (improving maintainability)
5. Documentation updates (ensuring consistent practices)

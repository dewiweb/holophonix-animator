# UI/UX Interface Guide

## Main Interface Components

### 1. Connection Panel
- Location: Top of the interface
- Components:
  - Remote IP input field
  - Remote Port input field
  - Local IP input field
  - Connect/Disconnect button
  - Connection status indicator
  - Health monitoring display

### 2. Track List Panel
- Location: Left sidebar
- Components:
  - Track list with hierarchical view
  - Add Track/Group button
  - Track creation form:
    - Name input
    - Type selector (Track/Group)
  - Group creation:
    - Pattern syntax support:
      - Range: `[start-end]`
      - Set: `{track1,track2,...}`
    - Formation templates
    - Leader-follower configuration:
      - Leader selection
      - Time offset settings
      - Formation preservation options
  - Selection highlighting for active track/group

### 3. Animation Models Panel
- Location: Center main content area
- Components:
  - Animation model selector dropdown
  - Coordinate system selector (AED/XYZ)
  - Available models list:
    - Linear Movement
    - Circular Movement
    - Pattern Movement
    - Random Walk
    - Path Following
    - Formation-based Movement
  - Add animation button
  - Applied animations list for selected track/group
  - Validation feedback display

### 4. Animation Parameters Panel
- Location: Right sidebar
- Components:
  - Model-specific parameter panels with appropriate input controls:
    
    #### Linear Movement
    - Start Position (numerical inputs or faders)
      - AED: [Azimuth, Elevation, Distance]
      - XYZ: [X, Y, Z]
    - End Position (numerical inputs or faders)
    - Duration (fader or input field)
    - Easing function selector
    - Loop Mode (checkbox)
    - Validation indicators
    
    #### Circular Movement
    - Center Point (numerical inputs)
    - Radius (fader or input field)
    - Speed (fader or input field)
    - Direction (toggle button)
    - Elevation control (when in 3D mode)
    - Coordinate system specific controls

    #### Pattern Movement
    - Pattern type selector
    - Scale controls
    - Rotation settings
    - Speed control
    - Pattern parameters

    #### Random Walk
    - Step size control
    - Frequency adjustment
    - Boundary constraints
    - Bias direction
    - Seed value (for reproducibility)

    #### Path Following
    - Path editor
    - Speed profile
    - Loop settings
    - Interpolation method
    - Path smoothing

    #### Formation-based Movement
    - Formation template
    - Scale control
    - Rotation settings
    - Group center controls
    - Member offset adjustments

### 5. Performance Monitor
- Location: Bottom panel
- Components:
  - Frame rate display
  - State sync status
  - Network latency
  - Resource usage
  - Error indicators
  - Recovery status

### 6. Input Methods
- Numerical inputs support:
  - Direct text entry
  - Horizontal faders
  - Mouse wheel adjustment
  - Keyboard shortcuts
  - Relative/absolute mode toggle

### 7. Validation Feedback
- Real-time parameter validation
- Coordinate system constraints
- Dimensional limits
- Group relationship rules
- Visual indicators:
  - Valid range highlighting
  - Error markers
  - Warning tooltips
  - Constraint visualization

## Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Connection Panel: IP, Port, Status, Health                      │
├───────────────┬───────────────────────┬─────────────────────────┤
│               │                       │                         │
│ Track List    │  Animation Models     │  Parameters Panel      │
│               │                       │                         │
│ [+ Track]     │  [Select Model ▼]     │  Parameter Controls    │
│ [+ Group]     │                       │  • Faders              │
│               │  • Linear             │  • Input Fields        │
│ • Track 1     │  • Circular          │  • Checkboxes          │
│ ▼ Group 1     │  • Random            │  • Dropdowns           │
│   • Track 2   │  • Custom            │                         │
│   • Track 3   │                       │                         │
│               │  [Add Animation]      │                         │
│               │                       │                         │
│               │  Applied Animations   │                         │
│               │  • Linear Move [▶]    │                         │
│               │  • Circular [▶]       │                         │
│               │                       │                         │
└───────────────┴───────────────────────┴─────────────────────────┘
```

## User Workflow

### 1. Connection Setup
```
┌─ Connection Panel ─────────────────────┐
│ Remote IP: [192.168.1.100          ]  │
│ Remote Port: [8000  ]                 │
│ Local IP: [192.168.1.10           ]   │
│ [Connect] Status: Disconnected        │
│ Health: [OK]                          │
└─────────────────────────────────────────┘
```

### 2. Track Management
```
┌─ Tracks ──────────┐
│ [+ Add Track    ] │
│ [+ Add Group    ] │
│                   │
│ • Track 1        │
│ ▼ Group 1        │
│   • Track 2      │
│   • Track 3      │
└───────────────────┘
```

### 3. Animation Selection
```
┌─ Animation Model ─┐
│ [Select Model ▼] │
│                  │
│ • Linear        │
│ • Circular      │
│ • Random        │
│ • Custom Path   │
│ • Pattern       │
│ • Formation     │
└──────────────────┘
```

### 4. Parameter Configuration
```
┌─ Linear Movement Parameters ─┐
│ Start Position              │
│ X: [   0.5   ] or [──○──]  │
│ Y: [  -0.3   ] or [──○──]  │
│ Z: [   0.0   ] or [──○──]  │
│                            │
│ End Position               │
│ X: [  -0.5   ] or [──○──]  │
│ Y: [   0.3   ] or [──○──]  │
│ Z: [   0.0   ] or [──○──]  │
│                            │
│ Duration: [5.0] or [──○──] │
│ [✓] Loop Mode              │
│ Easing: [Linear]          │
└────────────────────────────┘
```

### 5. Applied Animations
```
┌─ Applied Animations ────────────────┐
│ Track 1                            │
│ • Linear Move [▶] [⚙] [✕]         │
│   Duration: 5.0s                   │
│                                    │
│ Group 1                            │
│ • Circular [▶] [⚙] [✕]            │
│   Speed: 0.5 rad/s                 │
└────────────────────────────────────┘
```

## Interaction Guidelines

### 1. Track Selection
- Single click to select track/group
- Double click to rename
- Drag and drop for group organization

### 2. Parameter Adjustment
- Multiple input methods based on parameter type:
  - Numerical values: Input fields and/or faders
  - Boolean values: Checkboxes or toggle buttons
  - Options: Dropdown menus
  - Coordinates: Input fields with optional fader control
- Real-time updates for all input methods
- Parameter validation and bounds checking
- Visual feedback for changes

### 3. Animation Control
- Play/Pause individual animations
- Quick access to common parameters
- Visual feedback for active animations
- Parameter presets support

### 4. Error Handling
- Clear error messages in status bar
- Visual indicators for invalid values
- Connection status feedback
- Parameter validation feedback

### 5. Internationalization
- Language selector in settings
- Localized UI elements and labels
- RTL/LTR layout support
- Localized number formats

## Keyboard Shortcuts
- `Ctrl+N`: New Track
- `Ctrl+G`: New Group
- `Delete`: Remove selected track/animation
- `Space`: Play/Pause selected animation
- `Esc`: Cancel current operation

## Visual Feedback
- Connection status colors:
  - Green: Connected
  - Red: Disconnected
  - Yellow: Connecting
- Parameter validation:
  - Red outline for invalid values
  - Yellow for warnings
  - Green for confirmed changes
- Animation status:
  - Blue: Playing
  - Gray: Paused
  - Red: Error
- Parameter input:
  - Bounds indication where applicable
  - Unit display where applicable
  - Visual feedback for changes
  - Clear indication of current value

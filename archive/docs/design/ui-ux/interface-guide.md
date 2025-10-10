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

### 2. Left Sidebar
- Location: Left sidebar
- Components:
  - Track list panel
  - Add Track/Group button
  - Track creation form:
    - Name input
    - Type selector (Track/Group)
  - Selection highlighting for active track/group

### 3. Main Content Area
- Location: Center main content area
- Components:
  - Animation model selector dropdown
  - Available models list:
    - Linear Movement
    - Circular Movement
    - Random Movement
    - Custom Path
  - Add animation button
  - Applied animations list for selected track/group

### 4. Right Sidebar
- Location: Right sidebar
- Components:
  - Model-specific parameter panels:
    
    #### Linear Movement
    - Start Position (X, Y, Z)
    - End Position (X, Y, Z)
    - Duration slider
    
    #### Circular Movement
    - Center Point (X, Y, Z)
    - Radius slider
    - Speed control
    - Direction toggle (CW/CCW)
    
    #### Random Movement
    - Boundary limits (X, Y, Z ranges)
    - Speed range slider
    - Update interval control
    
    #### Custom Path
    - Path point list
    - Speed control
    - Loop behavior selector

## Interface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Connection Panel: IP, Port, Status                              │
├───────────────┬───────────────────────┬─────────────────────────┤
│               │                       │                         │
│ Left Sidebar  │  Main Content Area    │  Right Sidebar         │
│               │                       │                         │
│ [+ Track]     │  [Select Model ▼]     │  Model Parameters      │
│ [+ Group]     │                       │                         │
│               │  • Linear             │  X: [-1.0 ──○── 1.0]   │
│ • Track 1     │  • Circular          │  Y: [-1.0 ──○── 1.0]   │
│ ▼ Group 1     │  • Random            │  Z: [-1.0 ──○── 1.0]   │
│   • Track 2   │  • Custom            │                         │
│   • Track 3   │                       │  Speed: [──○──]        │
│               │  [Add Animation]      │                         │
│               │                       │  Duration: [──○──]      │
│               │                       │                         │
│               │  Applied Animations   │                         │
│               │  • Linear Move [▶]    │                         │
│               │  • Circular [▶]       │                         │
│               │                       │                         │
└───────────────┴───────────────────────┴─────────────────────────┘

## User Workflow

### 1. Connection Setup
```
┌─ Connection Panel ─────────────────────┐
│ Remote IP: [192.168.1.100          ]  │
│ Remote Port: [8000  ]                 │
│ Local IP: [192.168.1.10           ]   │
│ [Connect] Status: Disconnected        │
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
└──────────────────┘
```

### 4. Parameter Configuration
```
┌─ Linear Movement Parameters ─┐
│ Start Position              │
│ X: [-1.0 ──○── 1.0]        │
│ Y: [-1.0 ──○── 1.0]        │
│ Z: [-1.0 ──○── 1.0]        │
│                            │
│ End Position               │
│ X: [-1.0 ──○── 1.0]        │
│ Y: [-1.0 ──○── 1.0]        │
│ Z: [-1.0 ──○── 1.0]        │
│                            │
│ Duration: [──○──] 5.0s     │
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
- All parameters update in real-time
- Sliders for continuous values
- Input fields for precise values
- Immediate OSC updates on change

### 3. Animation Control
- Play/Pause individual animations
- Quick access to common parameters
- Visual feedback for active animations

### 4. Error Handling
- Clear error messages in status bar
- Visual indicators for invalid values
- Connection status feedback
- Parameter validation feedback

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

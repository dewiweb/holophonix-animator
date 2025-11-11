# Barycentric Center Position UI

## Enhancement
Added UI display and editing controls for barycentric center coordinates in the `MultiTrackModeSelector` component, similar to how control points display their positions.

## Features

### 1. **User-Defined Center Position Editor**
For variants: `custom`, `centered`, `shared`

**Display:**
- Purple panel with "Center Position" heading
- 3-column grid showing X, Y, Z coordinates
- Editable input fields with 0.1 step increment
- Tooltip: "Drag center in 3D view or edit coordinates here"

**Functionality:**
- Users can type coordinates directly
- Changes immediately update the center position
- Syncs with 3D view dragging
- Uses `onCustomCenterChange` callback

**Code:**
```tsx
<input
  type="number"
  step="0.1"
  value={customCenter.x.toFixed(2)}
  onChange={(e) => {
    const newCenter = { ...customCenter, x: parseFloat(e.target.value) || 0 }
    onCustomCenterChange?.(newCenter)
  }}
  className="w-full px-2 py-1 text-xs bg-gray-800..."
/>
```

### 2. **Auto-Calculated Center Display (Read-Only)**
For variant: `isobarycentric`

**Display:**
- Orange panel with "Auto-Calculated Center (Read-Only)" heading
- 3-column grid showing X, Y, Z coordinates
- Non-editable display (font-mono for clarity)
- Info note: "Automatically calculated from track positions"

**Calculation:**
```tsx
const center = {
  x: tracks.reduce((sum, t) => sum + (t.initialPosition?.x ?? t.position.x), 0) / tracks.length,
  y: tracks.reduce((sum, t) => sum + (t.initialPosition?.y ?? t.position.y), 0) / tracks.length,
  z: tracks.reduce((sum, t) => sum + (t.initialPosition?.z ?? t.position.z), 0) / tracks.length,
}
```

## User Experience

### **Before:**
- ❌ No way to see barycentric center coordinates
- ❌ Users only knew center existed visually in 3D
- ❌ No way to type precise coordinates

### **After:**
- ✅ Clear display of center coordinates
- ✅ Can edit coordinates directly (for custom/centered/shared)
- ✅ See auto-calculated center (for isobarycentric)
- ✅ Consistent with control point UI pattern

## Visual Design

### Color Coding:
- **Purple panels**: User-defined centers (editable)
- **Orange panels**: Auto-calculated centers (read-only)

### Layout:
```
┌─────────────────────────────────────┐
│ Center Position                     │
│ ┌─────┬─────┬─────┐                │
│ │  X  │  Y  │  Z  │                │
│ │ 0.00│ 5.00│10.00│ (editable)     │
│ └─────┴─────┴─────┘                │
│ 💡 Drag in 3D or edit here         │
└─────────────────────────────────────┘
```

## Integration

The center position UI:
1. **Reads** from `customCenter` prop
2. **Writes** via `onCustomCenterChange` callback
3. **Syncs** with 3D gizmo dragging
4. **Updates** animation parameters immediately

## Technical Details

### Props Used:
- `customCenter?: Position` - Current center position
- `onCustomCenterChange?: (center: Position) => void` - Update callback
- `tracks: Track[]` - For isobarycentric calculation

### Conditional Display:
```tsx
// Editable for user-defined variants
{(variant === 'custom' || variant === 'centered' || variant === 'shared') && customCenter && (
  <div className="...">
    {/* Editable inputs */}
  </div>
)}

// Read-only for auto-calculated
{variant === 'isobarycentric' && tracks.length > 0 && (
  <div className="...">
    {/* Display only */}
  </div>
)}
```

## Benefits

1. **Discoverability**: Users can see the center exists and has coordinates
2. **Precision**: Can type exact values instead of dragging
3. **Consistency**: Matches control point editing pattern
4. **Feedback**: Always shows current position
5. **Documentation**: Tooltips explain the feature

## Testing Checklist

- [ ] Select `custom` variant → see editable purple panel
- [ ] Edit X/Y/Z values → verify 3D view updates
- [ ] Drag center in 3D → verify panel updates
- [ ] Select `isobarycentric` → see read-only orange panel
- [ ] Add/remove tracks → verify isobarycentric center recalculates
- [ ] Switch variants → verify correct panel appears/disappears

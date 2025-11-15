# Position Presets - Offline UI/UX Design

## 🎨 User-Friendly Offline Preset Creation

### The UX Challenge
**Problem**: Users can't create meaningful presets when offline because track positions come from OSC.

**Solution**: Add intuitive position editing UI to the Tracks page.

---

## 🎯 Recommended UI Integration

### **Tracks Page** - Add Position Controls

```
┌─────────────────────────────────────────────────────────────┐
│ Tracks                              [📍 Arrange] [📸 Capture]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ☑️ Track 1: Actor A          (2.5, 3.0, 1.5)  [Edit] [Move]│
│ ☑️ Track 2: Actor B          (-1.0, 3.0, 1.2) [Edit] [Move]│
│ ☑️ Track 3: Actor C          (0.0, -3.0, 1.5) [Edit] [Move]│
│ □  Track 4: Prop              (0.0, 0.0, 0.0)  [Edit] [Move]│
│                                                               │
│ ─────────────────────────────────────────────────────────── │
│ With selected tracks (3):                                    │
│ [Circle] [Line] [Grid] [Custom...]                          │
└─────────────────────────────────────────────────────────────┘
```

### Key UI Elements:

1. **Position Display** - Show current x,y,z for each track
2. **Edit Button** - Opens manual position editor
3. **Move Button** - Drag in 3D view (if available)
4. **Batch Actions Bar** - Quick formation buttons for selected tracks
5. **Arrange Button** - Opens formation wizard
6. **Capture Button** - Quick capture from Tracks page

---

## 📱 User Workflows

### Workflow 1: Quick Formation (Most Common)

```
User Flow:
1. Go to Tracks page
2. Select tracks (checkboxes)
3. Click "Circle" button in batch actions
   → Opens quick dialog with radius/height
4. Click Apply
   → All tracks positioned in circle
5. Click "Capture" button (top right)
   → Opens capture dialog with tracks pre-selected
6. Fill name → Save
   ✅ Preset created!
```

**Time**: ~30 seconds  
**Clicks**: 6  
**No console needed!**

### Workflow 2: Individual Positioning

```
User Flow:
1. Go to Tracks page
2. Click "Edit" button next to Track 1
   → Opens position editor dialog
3. Enter X: 2.5, Y: 3.0, Z: 1.5
4. Click "Set Position"
5. Repeat for other tracks
6. Click "Capture" button
7. Save preset
   ✅ Done!
```

### Workflow 3: Formation Wizard (Advanced)

```
User Flow:
1. Go to Tracks page
2. Select all tracks
3. Click "Arrange" button
   → Opens formation wizard
4. Choose formation type (dropdown)
5. Adjust parameters with sliders
6. See live preview
7. Click Apply
8. Click Capture
   ✅ Preset ready!
```

---

## 🎨 Component Design

### 1. Enhanced TrackList Component

**Add to existing TrackList.tsx**:

```tsx
// In TrackList header
<div className="flex justify-between items-center mb-4">
  <h2>Tracks ({tracks.length})</h2>
  
  <div className="flex gap-2">
    {/* Arrange button - opens formation wizard */}
    <Button 
      icon={Layout}
      size="sm"
      onClick={() => setShowFormationWizard(true)}
      disabled={selectedTracks.length === 0}
    >
      Arrange
    </Button>
    
    {/* Quick capture */}
    <Button 
      icon={Camera}
      size="sm"
      onClick={() => setShowCapture(true)}
    >
      Capture
    </Button>
  </div>
</div>

{/* Track rows */}
{tracks.map(track => (
  <div className="track-row">
    <Checkbox checked={isSelected(track.id)} />
    <span>{track.name}</span>
    
    {/* Position display */}
    <span className="text-xs text-gray-600">
      ({track.position.x.toFixed(1)}, 
       {track.position.y.toFixed(1)}, 
       {track.position.z.toFixed(1)})
    </span>
    
    {/* Edit button */}
    <Button 
      size="xs" 
      variant="ghost"
      icon={Edit}
      onClick={() => openPositionEditor(track.id)}
    >
      Edit
    </Button>
  </div>
))}

{/* Batch actions bar (shows when tracks selected) */}
{selectedTracks.length > 0 && (
  <div className="batch-actions">
    <span>With {selectedTracks.length} tracks:</span>
    <Button size="sm" onClick={() => applyCircle()}>
      Circle
    </Button>
    <Button size="sm" onClick={() => applyLine()}>
      Line
    </Button>
    <Button size="sm" onClick={() => applyGrid()}>
      Grid
    </Button>
  </div>
)}
```

---

### 2. Formation Wizard Component

**Visual, guided experience**:

```
┌────────────────────────────────────────────────┐
│ Arrange Tracks                            [X]  │
├────────────────────────────────────────────────┤
│                                                │
│ Formation Type: [Circle ▾]                    │
│                                                │
│ ┌──────────────────────────────────────────┐ │
│ │                                          │ │
│ │         ●                                │ │
│ │     ●       ●    ← Live Preview         │ │
│ │   ●           ●                          │ │
│ │     ●       ●                            │ │
│ │         ●                                │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│                                                │
│ Radius:  [━━━●━━━━━━] 4.0m                   │
│ Height:  [━━━━●━━━━━] 1.5m                   │
│                                                │
│ Tracks: 6 selected                            │
│                                                │
│           [Cancel]  [Apply & Capture]         │
└────────────────────────────────────────────────┘
```

**Features**:
- Live preview of formation
- Interactive sliders
- Instant feedback
- "Apply & Capture" shortcut

---

### 3. Quick Position Edit (Inline)

**For minor adjustments**:

```tsx
// Add inline editing to track row
<div className="track-row">
  <span>{track.name}</span>
  
  {/* Editable position fields */}
  <div className="position-fields">
    <input 
      type="number" 
      value={x} 
      onChange={e => updateX(e.target.value)}
      className="w-16 text-xs"
      step={0.1}
    />
    <input type="number" value={y} ... />
    <input type="number" value={z} ... />
    
    {/* Quick save */}
    {hasChanges && (
      <Button size="xs" icon={Check} onClick={save}>
        ✓
      </Button>
    )}
  </div>
</div>
```

---

## 🎭 3D View Integration (If Available)

**Visual positioning in 3D space**:

```
┌────────────────────────────────────────────────┐
│ 3D View                   [Top] [Side] [Front] │
├────────────────────────────────────────────────┤
│                                                │
│         ┌─────────────────────────┐           │
│         │                         │           │
│         │    ●Track1              │           │
│         │         ●Track2         │           │
│         │              ●Track3    │           │
│         │                         │           │
│         └─────────────────────────┘           │
│                                                │
│ Click & drag to move • Shift+drag for height  │
│                                                │
│               [Snap to Grid] [Capture]        │
└────────────────────────────────────────────────┘
```

**UX Features**:
- Click and drag tracks
- Snap to grid
- View from different angles
- Quick capture button

---

## 💡 UX Best Practices

### 1. **Discoverability**
- Position controls visible in Tracks page
- Clear buttons: "Edit", "Arrange", "Capture"
- Tooltips explain offline workflow

### 2. **Progressive Disclosure**
- Simple: Quick formation buttons (Circle, Line)
- Advanced: Formation wizard with full control
- Expert: Manual coordinate entry

### 3. **Feedback**
- Show position changes immediately
- Live preview in formation wizard
- Clear success messages

### 4. **Context Awareness**
- Disable position editing when OSC connected (positions come from device)
- Enable when offline (manual control available)
- Badge showing "Offline Mode" or "Manual Control"

### 5. **Quick Actions**
- One-click formations for common layouts
- "Apply & Capture" shortcut
- Pre-select tracks in capture dialog

---

## 📊 Information Architecture

```
Tracks Page
├── Track List (always visible)
│   ├── Position display (x, y, z)
│   ├── Edit button → Position Editor Dialog
│   └── Inline edit (advanced users)
│
├── Header Actions
│   ├── Arrange button → Formation Wizard
│   └── Capture button → Capture Dialog
│
└── Batch Actions Bar (when tracks selected)
    ├── Quick formations (Circle, Line, Grid)
    └── Custom formation → Wizard
```

---

## 🚀 Implementation Priority

### Phase 1: Minimum Viable (Essential)
1. ✅ Add position display to TrackList
2. ✅ Add "Edit Position" button per track
3. ✅ Create ManualPositionEditor dialog (done!)
4. ✅ Add "Capture" button to Tracks page header

**Result**: Users can manually position tracks and capture presets offline!

### Phase 2: Batch Operations (High Value)
5. Add track selection (checkboxes)
6. Add batch actions bar with quick formations
7. Create BatchPositionEditor (done!)

**Result**: Quick formations for multiple tracks!

### Phase 3: Enhanced (Nice to Have)
8. Formation wizard with live preview
9. 3D view integration (if available)
10. Inline position editing

**Result**: Professional offline workflow!

---

## 🎯 Recommended Minimal Implementation

**Add to TrackList.tsx** (10 minutes):

```tsx
import { ManualPositionEditor } from '@/components/tracks/ManualPositionEditor'
import { CapturePresetDialog } from '@/components/presets'
import { Edit, Camera } from 'lucide-react'

function TrackList() {
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [showCapture, setShowCapture] = useState(false)
  
  return (
    <div>
      {/* Header with Capture button */}
      <div className="flex justify-between mb-4">
        <h2>Tracks</h2>
        <Button icon={Camera} onClick={() => setShowCapture(true)}>
          Capture Preset
        </Button>
      </div>
      
      {/* Track list */}
      {tracks.map(track => (
        <div key={track.id} className="flex items-center gap-4 p-2">
          <span>{track.name}</span>
          
          {/* Position display */}
          <span className="text-sm text-gray-600">
            ({track.position.x.toFixed(1)}, 
             {track.position.y.toFixed(1)}, 
             {track.position.z.toFixed(1)})
          </span>
          
          {/* Edit button */}
          <Button 
            size="sm" 
            variant="ghost"
            icon={Edit}
            onClick={() => setEditingTrackId(track.id)}
          >
            Edit
          </Button>
        </div>
      ))}
      
      {/* Dialogs */}
      {editingTrackId && (
        <ManualPositionEditor
          trackId={editingTrackId}
          onClose={() => setEditingTrackId(null)}
        />
      )}
      
      {showCapture && (
        <CapturePresetDialog
          onClose={() => setShowCapture(false)}
        />
      )}
    </div>
  )
}
```

**Result**: Full offline preset workflow in existing UI! ✅

---

## 🎉 Summary

### From UX Perspective:

| Approach | User-Friendly | Time | Implementation |
|----------|---------------|------|----------------|
| Console commands | ❌ No | Fast | Already done |
| Manual editor dialog | ✅ Yes | Medium | Done! |
| Enhanced TrackList | ✅✅ Very | Medium | 10 minutes |
| Formation wizard | ✅✅✅ Best | Slow | 2-3 hours |

### Recommendation:
**Add position editing to TrackList** (Phase 1) - gives users everything they need with minimal implementation!

Users can then:
1. See current positions
2. Edit individual tracks
3. Capture presets
4. All without leaving the Tracks page!

No console needed, fully discoverable UI/UX! 🎨

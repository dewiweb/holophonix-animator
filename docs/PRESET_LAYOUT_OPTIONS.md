# Position Presets - Layout Options

## Current Integration: Top Bar ✅

Preset actions are now in the **top bar**, right before the status indicators:

```
┌─────────────────────────────────────────────────────────────┐
│ [Page Title]  [Capture] [Apply] [Manage]  │  [OSC] [Engine] │
└─────────────────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Always visible on every page
- ✅ Easy to reach
- ✅ Clean integration with status indicators
- ✅ Doesn't clutter sidebar

---

## Alternative 1: Left Sidebar Navigation

Add a "Presets" navigation item:

```tsx
// In Layout.tsx, update navigation array (line 64):
const navigation = [
  { name: 'Tracks', href: '/', icon: Home },
  { name: 'Animations', href: '/animations', icon: Play },
  { name: 'Timeline', href: '/timeline', icon: Clock },
  { name: 'Cue Grid', href: '/cues', icon: Grid3x3 },
  { name: 'Presets', href: '/presets', icon: Box },  // ← Add this
  { name: 'OSC Manager', href: '/osc', icon: Radio },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// In App.tsx, add route:
<Route path="/presets" element={<PresetManager />} />
```

**Pros**:
- ✅ Dedicated preset page
- ✅ Full screen for preset management
- ✅ Fits navigation pattern

**Cons**:
- ❌ Extra click to access
- ❌ Can't capture from other pages easily

---

## Alternative 2: Sidebar Toolbar Section

Add preset buttons in sidebar's bottom toolbar:

```tsx
// In Layout.tsx, in toolbar section (after line 161):
<div className="p-1.5 border-t border-gray-200 dark:border-gray-700">
  {/* Existing buttons */}
  <div className="grid gap-2 grid-cols-2">
    <button>New</button>
    <button>Save</button>
    <button>Open</button>
    {/* Add preset button */}
    <button onClick={() => setShowCaptureDialog(true)}>
      <Camera size={14} />
      {sidebarOpen && <span>Capture</span>}
    </button>
  </div>
</div>
```

**Pros**:
- ✅ Easy access
- ✅ Near project actions

**Cons**:
- ❌ Limited space
- ❌ Hard to fit 3 buttons

---

## Alternative 3: Page-Specific Integration

Add preset actions only on relevant pages:

### In Cue Grid Page
```tsx
// In CueGrid.tsx toolbar:
<div className="toolbar">
  <PresetQuickActions layout="horizontal" showLabels={true} />
</div>
```

### In Tracks Page
```tsx
// In TrackList.tsx toolbar:
<PresetQuickActions layout="horizontal" showLabels={true} />
```

**Pros**:
- ✅ Context-specific
- ✅ Only where needed

**Cons**:
- ❌ Not available everywhere
- ❌ Inconsistent location

---

## Recommendation: Keep Current (Top Bar)

The **top bar integration** (current) is the best because:

1. ✅ **Always visible** - Available on every page
2. ✅ **Consistent location** - Same place everywhere
3. ✅ **Easy access** - Quick capture from any page
4. ✅ **Clean** - Doesn't clutter sidebar
5. ✅ **Scalable** - Room for all 3 buttons

Layout:
```
┌─────────────────────────────────────────────────────────────────┐
│ Holophonix Animator                                              │
│                                                                   │
│ [Tracks ✓] [Page Title]  [📸 Capture] [▶️ Apply] [📁 Manage]   │
│ [Anims  ]                              │ [● OSC] [● Engine]      │
│ [Timeline]                                                       │
│ [Cues    ]                                                       │
│ [Presets ]  ← OR add nav item + dedicated page                  │
│ [OSC     ]                                                       │
│ [Settings]                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## If You Want to Change

### To move to sidebar nav:

1. Add navigation item
2. Create `/presets` route
3. Use `<PresetManager />` as full page
4. Remove from top bar

### To add as sidebar button:

1. Keep top bar version
2. Also add small capture button in sidebar toolbar
3. Best of both worlds

---

## Current Implementation

```tsx
// Layout.tsx - Top bar (line 178)
<PresetQuickActions layout="horizontal" showLabels={true} />
```

**Buttons shown**:
- 📸 Capture
- ▶️ Apply  
- 📁 Manage
- Badge: "3 presets"

**Location**: Top-right, before status indicators

---

**Recommendation**: Keep it as-is in the top bar! It's the most accessible and consistent location.

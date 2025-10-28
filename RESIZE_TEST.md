# Window Resize Diagnostic Test

## Changes Made

### 1. Main Window Configuration (`main.ts`)
- ✅ Changed from `h-screen` (100vh) to `h-full` (100%) in Layout
- ✅ Dynamic minimum height calculation based on screen
- ✅ For 1366x768: minHeight = 400px (was 500px)
- ✅ Reduced ControlPointEditor min-h from 320px to 200px

### 2. Ultra-Compact UI
- ✅ All padding reduced to 1.5 (6px) on small screens
- ✅ All margins reduced to 1.5 (6px) on small screens
- ✅ Icons reduced to 14-18px
- ✅ Gaps reduced to 1.5 (6px)

## Test Procedure

### Step 1: Check Console Output
Run the app in dev mode:
```bash
npm run electron:dev
```

**Look for these console messages:**
```
🖥️  Screen work area: 1366x720
📐 Window size: 1093x576
📏 Minimum size: 800x400
```

**Questions:**
1. What are the actual values shown?
2. What is your screen resolution? (Run: `xrandr | grep '*'`)

### Step 2: Test Window Resizing

1. **Start the app**
2. **Go to Settings page** (simplest page, least content)
3. **Try to resize window smaller** by dragging corners
4. **Note the smallest size you can achieve**

**Record:**
- Minimum width achieved: ____px
- Minimum height achieved: ____px
- Does content scroll or is it cut off?

### Step 3: Test Each Page

Visit each page and record minimum height:

| Page | Can Resize? | Min Height | Content Scrolls? | Bottom Visible? |
|------|-------------|------------|------------------|-----------------|
| Tracks | ? | ?px | ? | ? |
| Animations | ? | ?px | ? | ? |
| Timeline | ? | ?px | ? | ? |
| OSC | ? | ?px | ? | ? |
| Settings | ? | ?px | ? | ? |

### Step 4: Check for Conflicting CSS

Open DevTools (F12) and:
1. Inspect the root `<div id="root">` element
2. Check computed styles for:
   - `height`: should be `100%` or actual px value
   - `min-height`: should NOT have a large fixed value
3. Inspect the main layout div (first child of root)
4. Check if any element has `min-height` > 400px

### Step 5: Window Manager Check

Your OS window manager might be enforcing minimums:

```bash
# Check if there are window manager restrictions
gsettings list-recursively | grep -i "min.*size"
```

## Expected Results

**On 1366x768 screen:**
- Window should start at ~1093x576
- Should resize down to ~800x400
- All content should scroll within the window
- No horizontal overflow

## Current Status

Please fill in:
- Screen resolution: ______
- Window starts at: ______
- Minimum achievable: ______
- Which page has the issue: ______
- Error messages (if any): ______

## If Still Not Working

Try this emergency minimal config:

Edit `main.ts` and change:
```typescript
minWidth: 600,   // Very small test
minHeight: 300,  // Very small test
```

Then run `npm run electron:dev` again.

If the window STILL won't go below 930px, it's likely:
1. Window manager restriction
2. Chromium minimum for your system
3. Monitor scaling factor issue

Check your display scaling:
```bash
gsettings get org.gnome.desktop.interface scaling-factor
```

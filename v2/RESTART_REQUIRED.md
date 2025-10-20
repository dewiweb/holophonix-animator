# ⚠️ Restart Required After Preload Changes

## What Happened

The `preload.ts` file was modified to add the main process animation timer API, but **Electron doesn't hot-reload the preload script**.

## Why You Got the Error

```
TypeError: window.electronAPI.onAnimationTick is not a function
```

The **old** `preload.cjs` (compiled) didn't have this function, but the **new** code tried to call it.

## Solution

### 1. **Stop the current Electron app** (Ctrl+C)

### 2. **Restart it**:
```bash
npm run electron:dev
```

The new `preload.cjs` (now compiled) includes:
- ✅ `startAnimationTimer()`
- ✅ `stopAnimationTimer()`
- ✅ `onAnimationTick()`

### What Was Fixed

1. **Compiled preload**: `npm run compile:electron` ✅
2. **Fixed TypeScript errors** in main.ts:
   - Removed invalid `socket` property
   - Fixed `osc.timeTag()` usage

## For Future Reference

**When you modify these files, you must restart Electron**:
- `preload.ts` → requires `npm run compile:electron` + restart
- `main.ts` → requires `npm run compile:electron` + restart
- `src/**/*.tsx` → hot-reloads automatically (no restart needed)

## Quick Reference

```bash
# If you change preload.ts or main.ts:
npm run compile:electron  # Compile TypeScript
# Then Ctrl+C and restart:
npm run electron:dev
```

---

**Now restart the app and the animation timer will work!** 🚀

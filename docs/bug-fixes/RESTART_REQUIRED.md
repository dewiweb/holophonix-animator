# Development Restart Required

## Issue

After modifying the Electron preload script, new APIs may not be available until the application is restarted.

## Why Restart is Required

Electron loads the preload script only when the application starts. Changes to the preload script are not hot-reloaded during development, unlike renderer process code.

## Quick Fix

### 1. Stop Development Servers
```bash
# Press Ctrl+C in both terminals to stop:
# - Vite dev server (npm run dev)
# - Electron app (npm run electron:dev)
```

### 2. Restart Application
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron app (wait for Vite to finish)
npm run electron:dev
```

### 3. Verify New APIs
```javascript
// Test in browser console
console.log(window.electronAPI.newFunctionName);
// Should output: [Function: newFunctionName]
```

## Files That Require Restart

- ✅ **`preload.ts`** - Main preload script (requires restart)
- ✅ **`main.ts`** - Main process IPC handlers (requires restart)
- ❌ **`src/` files** - Renderer code (hot reloads fine)
- ❌ **`index.html`** - HTML file (hot reloads fine)

## Common Error Messages

```
TypeError: window.electronAPI.functionName is not a function
```

**Solution**: Restart the Electron application after modifying preload script.

## Development Tips

- When modifying preload script, always restart the full application
- Test new APIs in browser console after restart
- Use version checking to detect stale preload during development

---

**Note**: This is normal Electron behavior, not a bug. Preload scripts run in a privileged context and cannot be hot-reloaded for security reasons.

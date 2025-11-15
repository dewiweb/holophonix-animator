import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // File operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showMessageBox: (options: any) => ipcRenderer.invoke('show-message-box', options),

  // Menu actions
  onMenuAction: (callback: (action: string, ...args: any[]) => void) => {
    ipcRenderer.on('menu-action', (_event: IpcRendererEvent, action: string, ...args: any[]) => {
      callback(action, ...args)
    })

    // Return cleanup function
    return () => {
      ipcRenderer.removeAllListeners('menu-action')
    }
  },

  // OSC communication
  oscConnect: (host: string, port: number) => ipcRenderer.invoke('osc-connect', host, port),
  oscDisconnect: () => ipcRenderer.invoke('osc-disconnect'),
  oscSendMessage: (host: string, port: number, address: string, args: any[]) =>
    ipcRenderer.invoke('osc-send-message', host, port, address, args),
  oscStartServer: (port: number) => ipcRenderer.invoke('osc-start-server', port),

  // Device connections (outgoing)
  oscConnectDevice: (deviceId: string, host: string, port: number) =>
    ipcRenderer.invoke('osc-connect-device', deviceId, host, port),
  oscDisconnectDevice: (deviceId: string) =>
    ipcRenderer.invoke('osc-disconnect-device', deviceId),
  oscClearDeviceBuffer: (deviceId: string) =>
    ipcRenderer.invoke('osc-clear-device-buffer', deviceId),
  oscSendToDevice: (deviceId: string, address: string, args: any[]) =>
    ipcRenderer.invoke('osc-send-to-device', deviceId, address, args),
  oscSendBatch: (deviceId: string, batch: any) =>
    ipcRenderer.invoke('osc-send-batch', deviceId, batch),

  // Animation timer (runs in main process, never throttled)
  startAnimationTimer: (intervalMs: number) =>
    ipcRenderer.send('start-animation-timer', intervalMs),
  stopAnimationTimer: () =>
    ipcRenderer.send('stop-animation-timer'),
  onAnimationTick: (callback: (data: { timestamp: number; deltaTime: number }) => void) => {
    const listener = (_event: any, data: { timestamp: number; deltaTime: number }) => callback(data)
    ipcRenderer.on('animation-tick', listener)
    return () => ipcRenderer.removeListener('animation-tick', listener)
  },

  // Main Process Animation Engine (never throttled, runs in background)
  animationEngineSetConfig: (config: any) =>
    ipcRenderer.invoke('animation-engine-set-config', config),
  animationEnginePlay: (snapshot: any) =>
    ipcRenderer.invoke('animation-engine-play', snapshot),
  animationEnginePause: (animationId: string, currentTime: number) =>
    ipcRenderer.invoke('animation-engine-pause', animationId, currentTime),
  animationEngineResume: (animationId: string, currentTime: number) =>
    ipcRenderer.invoke('animation-engine-resume', animationId, currentTime),
  animationEngineStop: (animationId: string) =>
    ipcRenderer.invoke('animation-engine-stop', animationId),
  animationEngineStopAll: () =>
    ipcRenderer.invoke('animation-engine-stop-all'),
  animationEngineStatus: () =>
    ipcRenderer.invoke('animation-engine-status'),
  
  // Listen for position updates from main engine
  onAnimationPositionUpdate: (callback: (updates: any[]) => void) => {
    const handler = (_event: IpcRendererEvent, updates: any[]) => {
      callback(updates)
    }
    ipcRenderer.on('animation-position-update', handler)
    return () => {
      ipcRenderer.removeListener('animation-position-update', handler)
    }
  },
  
  // Listen for animation stopped events
  onAnimationEngineStopped: (callback: (data: { animationId: string }) => void) => {
    const handler = (_event: IpcRendererEvent, data: { animationId: string }) => {
      callback(data)
    }
    ipcRenderer.on('animation-stopped', handler)
    return () => {
      ipcRenderer.removeListener('animation-stopped', handler)
    }
  },

  // Position calculation request/response (for main process to request calculations from renderer)
  onPositionCalculationRequest: (callback: (request: any) => any) => {
    ipcRenderer.on('position-calculation-request', async (_event, request) => {
      const response = await callback(request)
      ipcRenderer.send('position-calculation-response', response)
    })
    return () => {
      ipcRenderer.removeAllListeners('position-calculation-request')
    }
  },

  // OSC settings synchronization
  oscUpdateSettings: (settings: any) =>
    ipcRenderer.invoke('osc-update-settings', settings),

  // OSC settings response
  onOSCSettingsRequest: (callback: (message: any) => void) => {
    ipcRenderer.on('request-osc-settings', (event) => {
      callback(event)
    })

    // Return cleanup function
    return () => {
      ipcRenderer.removeAllListeners('request-osc-settings')
    }
  },

  // Send OSC settings to backend
  oscSettingsResponse: (settings: any) =>
    ipcRenderer.invoke('osc-settings-response', settings),

  // Listen for incoming OSC messages
  onOSCMessageReceived: (callback: (message: any) => void) => {
    const handler = (_event: IpcRendererEvent, message: any) => {
      callback(message)
    }
    ipcRenderer.on('osc-message-received', handler)
    // Return cleanup function that removes only this specific handler
    return () => {
      ipcRenderer.removeListener('osc-message-received', handler)
    }
  },

  // Project file operations
  projectShowSaveDialog: () => ipcRenderer.invoke('project-show-save-dialog'),
  projectShowOpenDialog: () => ipcRenderer.invoke('project-show-open-dialog'),
  projectWriteFile: (filePath: string, projectData: string) => 
    ipcRenderer.invoke('project-write-file', filePath, projectData),
  projectReadFile: (filePath: string) => 
    ipcRenderer.invoke('project-read-file', filePath),
})

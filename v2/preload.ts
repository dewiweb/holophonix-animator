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
  oscSendToDevice: (deviceId: string, address: string, args: any[]) =>
    ipcRenderer.invoke('osc-send-to-device', deviceId, address, args),

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
    console.log('🔧 PRELOAD: Setting up onOSCMessageReceived listener')
    const handler = (_event: IpcRendererEvent, message: any) => {
      console.log('📨 PRELOAD: Received osc-message-received event:', message)
      callback(message)
    }
    ipcRenderer.on('osc-message-received', handler)
    // Return cleanup function that removes only this specific handler
    return () => {
      console.log('🧹 PRELOAD: Cleaning up specific listener')
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

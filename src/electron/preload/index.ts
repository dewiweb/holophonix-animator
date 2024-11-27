import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // OSC Configuration
    getOscConfig: () => ipcRenderer.invoke('get-osc-config'),
    setOscConfig: (config: any) => ipcRenderer.invoke('set-osc-config', config),

    // Track State
    getTrackState: (trackId: string) => ipcRenderer.invoke('get-track-state', trackId),
    updateTrackState: (trackId: string, state: any) => 
      ipcRenderer.invoke('update-track-state', trackId, state),
  }
);

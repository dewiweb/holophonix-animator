// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script running');

// Helper function to forward events to the renderer
const forwardEvent = (channel: string) => {
  ipcRenderer.on(channel, (_, ...args) => {
    console.log(`Preload: forwarding ${channel} event with args:`, args);
    const handler = (window as any)._oscEventHandlers?.[channel];
    if (handler) {
      handler(...args);
    }
  });
};

// Setup event handling
contextBridge.exposeInMainWorld('electron', {
  // IPC invoke functions
  invoke: (channel: string, ...args: any[]) => {
    console.log(`Preload: invoking ${channel} with args:`, args);
    return ipcRenderer.invoke(channel, ...args);
  },

  // Event handling
  on: (channel: string, callback: (...args: any[]) => void) => {
    console.log(`Preload: registering handler for ${channel}`);
    if (!(window as any)._oscEventHandlers) {
      (window as any)._oscEventHandlers = {};
    }
    (window as any)._oscEventHandlers[channel] = callback;

    // Ensure we're listening for this event
    forwardEvent(channel);
  },

  removeAllListeners: (channel: string) => {
    console.log(`Preload: removing all listeners for ${channel}`);
    if ((window as any)._oscEventHandlers) {
      delete (window as any)._oscEventHandlers[channel];
    }
    ipcRenderer.removeAllListeners(channel);
  }
});

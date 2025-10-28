"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // File operations
    showSaveDialog: () => electron_1.ipcRenderer.invoke('show-save-dialog'),
    showMessageBox: (options) => electron_1.ipcRenderer.invoke('show-message-box', options),
    // Menu actions
    onMenuAction: (callback) => {
        electron_1.ipcRenderer.on('menu-action', (_event, action, ...args) => {
            callback(action, ...args);
        });
        // Return cleanup function
        return () => {
            electron_1.ipcRenderer.removeAllListeners('menu-action');
        };
    },
    // OSC communication
    oscConnect: (host, port) => electron_1.ipcRenderer.invoke('osc-connect', host, port),
    oscDisconnect: () => electron_1.ipcRenderer.invoke('osc-disconnect'),
    oscSendMessage: (host, port, address, args) => electron_1.ipcRenderer.invoke('osc-send-message', host, port, address, args),
    oscStartServer: (port) => electron_1.ipcRenderer.invoke('osc-start-server', port),
    // Device connections (outgoing)
    oscConnectDevice: (deviceId, host, port) => electron_1.ipcRenderer.invoke('osc-connect-device', deviceId, host, port),
    oscDisconnectDevice: (deviceId) => electron_1.ipcRenderer.invoke('osc-disconnect-device', deviceId),
    oscClearDeviceBuffer: (deviceId) => electron_1.ipcRenderer.invoke('osc-clear-device-buffer', deviceId),
    oscSendToDevice: (deviceId, address, args) => electron_1.ipcRenderer.invoke('osc-send-to-device', deviceId, address, args),
    oscSendBatch: (deviceId, batch) => electron_1.ipcRenderer.invoke('osc-send-batch', deviceId, batch),
    // Animation timer (runs in main process, never throttled)
    startAnimationTimer: (intervalMs) => electron_1.ipcRenderer.send('start-animation-timer', intervalMs),
    stopAnimationTimer: () => electron_1.ipcRenderer.send('stop-animation-timer'),
    onAnimationTick: (callback) => {
        const listener = (_event, data) => callback(data);
        electron_1.ipcRenderer.on('animation-tick', listener);
        return () => electron_1.ipcRenderer.removeListener('animation-tick', listener);
    },
    // OSC settings synchronization
    oscUpdateSettings: (settings) => electron_1.ipcRenderer.invoke('osc-update-settings', settings),
    // OSC settings response
    onOSCSettingsRequest: (callback) => {
        electron_1.ipcRenderer.on('request-osc-settings', (event) => {
            callback(event);
        });
        // Return cleanup function
        return () => {
            electron_1.ipcRenderer.removeAllListeners('request-osc-settings');
        };
    },
    // Send OSC settings to backend
    oscSettingsResponse: (settings) => electron_1.ipcRenderer.invoke('osc-settings-response', settings),
    // Listen for incoming OSC messages
    onOSCMessageReceived: (callback) => {
        const handler = (_event, message) => {
            callback(message);
        };
        electron_1.ipcRenderer.on('osc-message-received', handler);
        // Return cleanup function that removes only this specific handler
        return () => {
            electron_1.ipcRenderer.removeListener('osc-message-received', handler);
        };
    },
    // Project file operations
    projectShowSaveDialog: () => electron_1.ipcRenderer.invoke('project-show-save-dialog'),
    projectShowOpenDialog: () => electron_1.ipcRenderer.invoke('project-show-open-dialog'),
    projectWriteFile: (filePath, projectData) => electron_1.ipcRenderer.invoke('project-write-file', filePath, projectData),
    projectReadFile: (filePath) => electron_1.ipcRenderer.invoke('project-read-file', filePath),
});
//# sourceMappingURL=preload.js.map
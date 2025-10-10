"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: function () { return electron_1.ipcRenderer.invoke('get-app-version'); },
    // File operations
    showSaveDialog: function () { return electron_1.ipcRenderer.invoke('show-save-dialog'); },
    showMessageBox: function (options) { return electron_1.ipcRenderer.invoke('show-message-box', options); },
    // Menu actions
    onMenuAction: function (callback) {
        electron_1.ipcRenderer.on('menu-action', function (_event, action) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            callback.apply(void 0, __spreadArray([action], args, false));
        });
        // Return cleanup function
        return function () {
            electron_1.ipcRenderer.removeAllListeners('menu-action');
        };
    },
    // OSC communication
    oscConnect: function (host, port) { return electron_1.ipcRenderer.invoke('osc-connect', host, port); },
    oscDisconnect: function () { return electron_1.ipcRenderer.invoke('osc-disconnect'); },
    oscSendMessage: function (host, port, address, args) {
        return electron_1.ipcRenderer.invoke('osc-send-message', host, port, address, args);
    },
    oscStartServer: function (port) { return electron_1.ipcRenderer.invoke('osc-start-server', port); },
    // Device connections (outgoing)
    oscConnectDevice: function (deviceId, host, port) {
        return electron_1.ipcRenderer.invoke('osc-connect-device', deviceId, host, port);
    },
    oscDisconnectDevice: function (deviceId) {
        return electron_1.ipcRenderer.invoke('osc-disconnect-device', deviceId);
    },
    oscSendToDevice: function (deviceId, address, args) {
        return electron_1.ipcRenderer.invoke('osc-send-to-device', deviceId, address, args);
    },
    // OSC settings synchronization
    oscUpdateSettings: function (settings) {
        return electron_1.ipcRenderer.invoke('osc-update-settings', settings);
    },
    // OSC settings response
    onOSCSettingsRequest: function (callback) {
        electron_1.ipcRenderer.on('request-osc-settings', function (event) {
            callback(event);
        });
        // Return cleanup function
        return function () {
            electron_1.ipcRenderer.removeAllListeners('request-osc-settings');
        };
    },
    // Send OSC settings to backend
    oscSettingsResponse: function (settings) {
        return electron_1.ipcRenderer.invoke('osc-settings-response', settings);
    },
    // Listen for incoming OSC messages
    onOSCMessageReceived: function (callback) {
        console.log('🔧 PRELOAD: Setting up onOSCMessageReceived listener');
        var handler = function (_event, message) {
            console.log('📨 PRELOAD: Received osc-message-received event:', message);
            callback(message);
        };
        electron_1.ipcRenderer.on('osc-message-received', handler);
        // Return cleanup function that removes only this specific handler
        return function () {
            console.log('🧹 PRELOAD: Cleaning up specific listener');
            electron_1.ipcRenderer.removeListener('osc-message-received', handler);
        };
    },
    // Project file operations
    projectShowSaveDialog: function () { return electron_1.ipcRenderer.invoke('project-show-save-dialog'); },
    projectShowOpenDialog: function () { return electron_1.ipcRenderer.invoke('project-show-open-dialog'); },
    projectWriteFile: function (filePath, projectData) {
        return electron_1.ipcRenderer.invoke('project-write-file', filePath, projectData);
    },
    projectReadFile: function (filePath) {
        return electron_1.ipcRenderer.invoke('project-read-file', filePath);
    },
});

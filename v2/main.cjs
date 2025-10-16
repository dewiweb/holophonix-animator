"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const osc = __importStar(require("osc"));
const dgram = __importStar(require("dgram"));
// For Electron main process, use app.getAppPath() for absolute paths
const appPath = electron_1.app.getAppPath();
const preloadPath = (0, path_1.join)(appPath, 'preload.cjs');
console.log('🔍 Debug info:', {
    appPath,
    currentDir: process.cwd(),
    preloadPath,
    distPath: (0, path_1.join)(appPath, '../dist/index.html')
});
const isDev = process.env.NODE_ENV === 'development';
console.log('🔍 App mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
// OSC Communication setup
let oscServer = null;
let oscClient = null;
// OSC Server setup for development
function startOSCServer(port) {
    try {
        console.log(`Starting OSC server on port ${port}...`);
        // Close existing server if any
        if (oscServer) {
            oscServer.close();
            oscServer = null;
        }
        oscServer = dgram.createSocket('udp4');
        oscServer.on('listening', () => {
            const address = oscServer.address();
            console.log(`✅ OSC Server listening on ${address.address}:${address.port}`);
        });
        oscServer.on('message', (rawMessage, remote) => {
            try {
                console.log('📨 Raw OSC message received:', rawMessage.length, 'bytes from', remote.address + ':' + remote.port);
                // Parse OSC message
                const oscMessage = osc.readMessage(rawMessage);
                if (oscMessage) {
                    console.log('📨 Parsed OSC message:', oscMessage.address, oscMessage.args);
                    console.log('🔍 Args structure:', {
                        args: oscMessage.args,
                        argsType: typeof oscMessage.args,
                        argsIsArray: Array.isArray(oscMessage.args),
                        argsLength: oscMessage.args?.length
                    });
                    // Send to renderer process
                    if (mainWindow && mainWindow.webContents) {
                        const messageToSend = {
                            address: oscMessage.address,
                            args: oscMessage.args,
                            timestamp: Date.now(),
                        };
                        console.log('📨 Forwarding to renderer process:', JSON.stringify(messageToSend));
                        mainWindow.webContents.send('osc-message-received', messageToSend);
                    }
                }
                else {
                    console.log('❌ Failed to parse OSC message');
                }
            }
            catch (error) {
                console.error('❌ Error parsing OSC message:', error);
            }
        });
        oscServer.on('error', (err) => {
            console.error('❌ OSC Server error:', err);
        });
        oscServer.bind(port, '0.0.0.0', () => {
            console.log(`✅ OSC Server bound to port ${port}`);
        });
        return { success: true, message: `OSC Server started on port ${port}` };
    }
    catch (error) {
        console.error('❌ Failed to start OSC server:', error);
        return { success: false, error: error.message };
    }
}
// OSC Client for sending messages
const sendOSCMessage = (host, port, address, args) => {
    try {
        console.log(`📤 Sending OSC message to ${host}:${port}:`, address, args);
        if (!oscClient) {
            console.log('🔌 Creating new OSC client...');
            oscClient = dgram.createSocket('udp4');
        }
        const message = osc.writeMessage({
            address,
            args,
        });
        console.log(`📦 OSC message buffer: ${message.length} bytes`);
        oscClient.send(message, 0, message.length, port, host, (err) => {
            if (err) {
                console.error('❌ Error sending OSC message:', err);
            }
            else {
                console.log('✅ OSC message sent successfully');
            }
        });
        return { success: true, message: `OSC message sent to ${host}:${port}` };
    }
    catch (error) {
        console.error('❌ Error creating/sending OSC message:', error);
        return { success: false, error: error.message };
    }
};
let mainWindow = null;
const createWindow = () => {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
        },
        title: 'Holophonix Animator v2',
        icon: (0, path_1.join)(appPath, '../assets/icon.png'), // Add icon later
    });
    // Load the app
    if (isDev) {
        // Development: try Vite dev server
        console.log('🔧 Development mode: Loading from Vite dev server');
        mainWindow.loadURL('http://localhost:5173').then(() => {
            console.log('✅ Successfully loaded from Vite dev server');
            if (mainWindow) {
                mainWindow.webContents.openDevTools();
            }
        }).catch((error) => {
            console.log('❌ Vite dev server not available, trying filesystem fallback:', error.message);
            try {
                if (mainWindow) {
                    mainWindow.loadFile((0, path_1.join)(appPath, 'dist/index.html'));
                }
            }
            catch (fileError) {
                console.error('❌ Filesystem loading also failed:', fileError);
            }
        });
    }
    else {
        // Production: load from bundled files (inside app.asar)
        const indexPath = (0, path_1.join)(appPath, 'dist/index.html');
        console.log('🔧 Production mode: Loading from', indexPath);
        mainWindow.loadFile(indexPath).catch((error) => {
            console.error('❌ Failed to load index.html:', error);
        });
    }
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        // Clean up OSC connections
        if (oscServer) {
            oscServer.close();
            oscServer = null;
        }
        if (oscClient) {
            oscClient.close();
            oscClient = null;
        }
    });
    // Set up OSC message forwarding from main to renderer
    if (mainWindow) {
        console.log('🔧 Setting up OSC server on window load...');
        mainWindow.webContents.on('did-finish-load', () => {
            console.log('🔧 Window finished loading, OSC server will start when settings are received...');
            // OSC server will start when frontend sends settings via IPC
        });
    }
};
// App event listeners
electron_1.app.whenReady().then(() => {
    createWindow();
    // Create application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'new-project');
                    },
                },
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile'],
                            filters: [
                                { name: 'Holophonix Projects', extensions: ['holophonix'] },
                                { name: 'All Files', extensions: ['*'] },
                            ],
                        });
                        if (!result.canceled && result.filePaths.length > 0) {
                            mainWindow?.webContents.send('menu-action', 'open-project', result.filePaths[0]);
                        }
                    },
                },
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow?.webContents.send('menu-action', 'save-project');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Holophonix Animator',
                    click: () => {
                        electron_1.dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Holophonix Animator v2',
                            detail: 'Modern 3D sound animation system for Holophonix processors\nVersion 2.0.0',
                        });
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for communication with renderer process
electron_1.ipcMain.handle('get-app-version', () => {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('show-save-dialog', async () => {
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        filters: [
            { name: 'Holophonix Projects', extensions: ['holophonix'] },
        ],
    });
    return result;
});
// OSC Client setup for outgoing connections
let oscClients = new Map(); // Map<deviceId, oscClient>
function createOSCClient(host, port) {
    try {
        const client = new osc.UDPPort({
            localAddress: '0.0.0.0',
            localPort: 0, // Let OS assign local port
            remoteAddress: host,
            remotePort: port,
            metadata: true
        });
        client.open();
        return client;
    }
    catch (error) {
        console.error('❌ Failed to create OSC client:', error);
        return null;
    }
}
function sendOSCMessageToDevice(deviceId, address, args) {
    const client = oscClients.get(deviceId);
    if (client) {
        client.send({
            address: address,
            args: args
        });
        console.log(`📤 Sent OSC message to device ${deviceId}: ${address}`, args);
    }
    else {
        console.error(`❌ No OSC client found for device ${deviceId}`);
    }
}
electron_1.ipcMain.handle('osc-send-message', async (event, host, port, address, args) => {
    try {
        console.log('🔗 IPC: osc-send-message called with:', host, port, address, args);
        sendOSCMessage(host, port, address, args);
        return { success: true, message: `OSC message sent to ${host}:${port}` };
    }
    catch (error) {
        console.error('❌ IPC osc-send-message error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('osc-update-settings', async (event, settings) => {
    try {
        console.log('🔗 IPC: osc-update-settings called with:', settings);
        // If the incoming port changed, restart the OSC server
        if (settings.defaultIncomingPort) {
            const newPort = settings.defaultIncomingPort;
            const currentPort = oscServer?.port;
            if (currentPort !== newPort) {
                console.log(`🔄 Restarting OSC server from port ${currentPort || 'none'} to ${newPort}`);
                // Close existing server if any
                if (oscServer) {
                    try {
                        oscServer.close();
                    }
                    catch (closeError) {
                        console.warn('⚠️ Error closing existing OSC server:', closeError);
                    }
                    oscServer = null;
                }
                // Start new server with updated port
                const result = startOSCServer(newPort);
                if (result && result.success) {
                    console.log('✅ OSC server restarted on port:', newPort);
                    return { success: true, message: `OSC server restarted on port ${newPort}` };
                }
                else {
                    const errorMsg = result?.error || 'Failed to restart OSC server';
                    console.error('❌ Failed to restart OSC server:', errorMsg);
                    return { success: false, error: errorMsg };
                }
            }
            else {
                console.log('ℹ️ OSC server already running on port:', newPort);
            }
        }
        return { success: true, message: 'OSC settings updated' };
    }
    catch (error) {
        console.error('❌ IPC osc-update-settings error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('osc-start-server', async (event, port) => {
    try {
        console.log('🔗 IPC: osc-start-server called with port:', port);
        // Close existing server if any
        if (oscServer) {
            oscServer.close();
            oscServer = null;
        }
        // Start new server with specified port
        const result = startOSCServer(port);
        console.log('🔧 OSC server started on port:', port);
        return { success: true, message: `OSC Server started on port ${port}` };
    }
    catch (error) {
        console.error('❌ IPC osc-start-server error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('osc-connect-device', async (event, deviceId, host, port) => {
    try {
        console.log('🔗 IPC: osc-connect-device called with:', deviceId, host, port);
        // Close existing client if any
        const existingClient = oscClients.get(deviceId);
        if (existingClient) {
            existingClient.close();
        }
        // Create new client for this device
        const client = createOSCClient(host, port);
        if (client) {
            oscClients.set(deviceId, client);
            return { success: true, message: `Connected to device ${deviceId} at ${host}:${port}` };
        }
        else {
            return { success: false, error: 'Failed to create OSC client' };
        }
    }
    catch (error) {
        console.error('❌ IPC osc-connect-device error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('osc-disconnect-device', async (event, deviceId) => {
    try {
        console.log('🔗 IPC: osc-disconnect-device called for:', deviceId);
        const client = oscClients.get(deviceId);
        if (client) {
            client.close();
            oscClients.delete(deviceId);
            return { success: true, message: `Disconnected from device ${deviceId}` };
        }
        else {
            return { success: false, error: 'Device not found' };
        }
    }
    catch (error) {
        console.error('❌ IPC osc-disconnect-device error:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('osc-send-to-device', async (event, deviceId, address, args) => {
    try {
        console.log('🔗 IPC: osc-send-to-device called for device:', deviceId, 'address:', address, 'args:', args);
        // Send OSC message to specific device
        const client = oscClients.get(deviceId);
        if (client) {
            // Format args for OSC library - ensure they have type and value
            const formattedArgs = args ? args.map((arg) => {
                // If already formatted with type/value, return as is
                if (arg && typeof arg === 'object' && 'type' in arg && 'value' in arg) {
                    return arg;
                }
                // Otherwise, infer type and format
                if (typeof arg === 'number') {
                    // Check if it's an integer or float
                    return { type: Number.isInteger(arg) ? 'i' : 'f', value: arg };
                }
                else if (typeof arg === 'string') {
                    return { type: 's', value: arg };
                }
                else if (typeof arg === 'boolean') {
                    return { type: arg ? 'T' : 'F' };
                }
                else {
                    // Default to string
                    return { type: 's', value: String(arg) };
                }
            }) : [];
            client.send({
                address: address,
                args: formattedArgs
            });
            console.log(`📤 Sent OSC message to device ${deviceId}: ${address}`, formattedArgs);
            return { success: true, message: `OSC message sent to device ${deviceId}` };
        }
        else {
            console.error(`❌ No OSC client found for device ${deviceId}`);
            return { success: false, error: `Device ${deviceId} not connected` };
        }
    }
    catch (error) {
        console.error('❌ IPC osc-send-to-device error:', error);
        return { success: false, error: error.message };
    }
});
// ========================================
// PROJECT FILE OPERATIONS
// ========================================
// Show save dialog and return file path
electron_1.ipcMain.handle('project-show-save-dialog', async () => {
    try {
        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
            title: 'Save Holophonix Project',
            defaultPath: 'Untitled.hpx',
            filters: [
                { name: 'Holophonix Projects', extensions: ['hpx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result;
    }
    catch (error) {
        console.error('❌ Error showing save dialog:', error);
        return { canceled: true, filePath: undefined };
    }
});
// Show open dialog and return file path
electron_1.ipcMain.handle('project-show-open-dialog', async () => {
    try {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            title: 'Open Holophonix Project',
            properties: ['openFile'],
            filters: [
                { name: 'Holophonix Projects', extensions: ['hpx'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result;
    }
    catch (error) {
        console.error('❌ Error showing open dialog:', error);
        return { canceled: true, filePaths: [] };
    }
});
// Write project data to file
electron_1.ipcMain.handle('project-write-file', async (event, filePath, projectData) => {
    try {
        console.log('💾 Writing project file:', filePath);
        fs.writeFileSync(filePath, projectData, 'utf-8');
        console.log('✅ Project file saved successfully');
        return { success: true };
    }
    catch (error) {
        console.error('❌ Error writing project file:', error);
        return { success: false, error: error.message };
    }
});
// Read project data from file
electron_1.ipcMain.handle('project-read-file', async (event, filePath) => {
    try {
        console.log('📖 Reading project file:', filePath);
        const data = fs.readFileSync(filePath, 'utf-8');
        console.log('✅ Project file read successfully');
        return { success: true, data };
    }
    catch (error) {
        console.error('❌ Error reading project file:', error);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=main.js.map
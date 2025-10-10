"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path_1 = require("path");
var fs = require("fs");
var osc = require("osc");
var dgram = require("dgram");
// For Electron main process, use app.getAppPath() for absolute paths
var appPath = electron_1.app.getAppPath();
var preloadPath = (0, path_1.join)(appPath, 'preload.js');
console.log('🔍 Debug info:', {
    appPath: appPath,
    currentDir: process.cwd(),
    preloadPath: preloadPath,
    distPath: (0, path_1.join)(appPath, '../dist/index.html')
});
var isDev = process.env.NODE_ENV === 'development';
console.log('🔍 App mode:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
// OSC Communication setup
var oscServer = null;
var oscClient = null;
// OSC Server setup for development
function startOSCServer(port) {
    try {
        console.log("Starting OSC server on port ".concat(port, "..."));
        // Close existing server if any
        if (oscServer) {
            oscServer.close();
            oscServer = null;
        }
        oscServer = dgram.createSocket('udp4');
        oscServer.on('listening', function () {
            var address = oscServer.address();
            console.log("\u2705 OSC Server listening on ".concat(address.address, ":").concat(address.port));
        });
        oscServer.on('message', function (rawMessage, remote) {
            var _a;
            try {
                console.log('📨 Raw OSC message received:', rawMessage.length, 'bytes from', remote.address + ':' + remote.port);
                // Parse OSC message
                var oscMessage = osc.readMessage(rawMessage);
                if (oscMessage) {
                    console.log('📨 Parsed OSC message:', oscMessage.address, oscMessage.args);
                    console.log('🔍 Args structure:', {
                        args: oscMessage.args,
                        argsType: typeof oscMessage.args,
                        argsIsArray: Array.isArray(oscMessage.args),
                        argsLength: (_a = oscMessage.args) === null || _a === void 0 ? void 0 : _a.length
                    });
                    // Send to renderer process
                    if (mainWindow && mainWindow.webContents) {
                        var messageToSend = {
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
        oscServer.on('error', function (err) {
            console.error('❌ OSC Server error:', err);
        });
        oscServer.bind(port, '0.0.0.0', function () {
            console.log("\u2705 OSC Server bound to port ".concat(port));
        });
        return { success: true, message: "OSC Server started on port ".concat(port) };
    }
    catch (error) {
        console.error('❌ Failed to start OSC server:', error);
        return { success: false, error: error.message };
    }
}
// OSC Client for sending messages
var sendOSCMessage = function (host, port, address, args) {
    try {
        console.log("\uD83D\uDCE4 Sending OSC message to ".concat(host, ":").concat(port, ":"), address, args);
        if (!oscClient) {
            console.log('🔌 Creating new OSC client...');
            oscClient = dgram.createSocket('udp4');
        }
        var message = osc.writeMessage({
            address: address,
            args: args,
        });
        console.log("\uD83D\uDCE6 OSC message buffer: ".concat(message.length, " bytes"));
        oscClient.send(message, 0, message.length, port, host, function (err) {
            if (err) {
                console.error('❌ Error sending OSC message:', err);
            }
            else {
                console.log('✅ OSC message sent successfully');
            }
        });
        return { success: true, message: "OSC message sent to ".concat(host, ":").concat(port) };
    }
    catch (error) {
        console.error('❌ Error creating/sending OSC message:', error);
        return { success: false, error: error.message };
    }
};
var mainWindow = null;
var createWindow = function () {
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
    // Load the app - always try dev server first for electron:dev
    console.log('🔧 Loading Electron app - trying dev server first');
    mainWindow.loadURL('http://localhost:5173').then(function () {
        console.log('✅ Successfully loaded from Vite dev server');
        if (mainWindow) {
            mainWindow.webContents.openDevTools();
        }
    }).catch(function (error) {
        console.log('❌ Vite dev server not available, trying filesystem fallback:', error.message);
        try {
            if (mainWindow) {
                mainWindow.loadFile((0, path_1.join)(appPath, '../dist/index.html'));
            }
        }
        catch (fileError) {
            console.error('❌ Filesystem loading also failed:', fileError);
        }
    });
    // Handle window closed
    mainWindow.on('closed', function () {
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
        mainWindow.webContents.on('did-finish-load', function () {
            console.log('🔧 Window finished loading, OSC server will start when settings are received...');
            // OSC server will start when frontend sends settings via IPC
        });
    }
};
// App event listeners
electron_1.app.whenReady().then(function () {
    createWindow();
    // Create application menu
    var template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    accelerator: 'CmdOrCtrl+N',
                    click: function () {
                        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('menu-action', 'new-project');
                    },
                },
                {
                    label: 'Open Project',
                    accelerator: 'CmdOrCtrl+O',
                    click: function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                                        properties: ['openFile'],
                                        filters: [
                                            { name: 'Holophonix Projects', extensions: ['holophonix'] },
                                            { name: 'All Files', extensions: ['*'] },
                                        ],
                                    })];
                                case 1:
                                    result = _a.sent();
                                    if (!result.canceled && result.filePaths.length > 0) {
                                        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('menu-action', 'open-project', result.filePaths[0]);
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); },
                },
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: function () {
                        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('menu-action', 'save-project');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: function () {
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
                    click: function () {
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
    var menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for communication with renderer process
electron_1.ipcMain.handle('get-app-version', function () {
    return electron_1.app.getVersion();
});
electron_1.ipcMain.handle('show-save-dialog', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, electron_1.dialog.showSaveDialog(mainWindow, {
                    filters: [
                        { name: 'Holophonix Projects', extensions: ['holophonix'] },
                    ],
                })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result];
        }
    });
}); });
// OSC Client setup for outgoing connections
var oscClients = new Map(); // Map<deviceId, oscClient>
function createOSCClient(host, port) {
    try {
        var client = new osc.UDPPort({
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
    var client = oscClients.get(deviceId);
    if (client) {
        client.send({
            address: address,
            args: args
        });
        console.log("\uD83D\uDCE4 Sent OSC message to device ".concat(deviceId, ": ").concat(address), args);
    }
    else {
        console.error("\u274C No OSC client found for device ".concat(deviceId));
    }
}
electron_1.ipcMain.handle('osc-send-message', function (event, host, port, address, args) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-send-message called with:', host, port, address, args);
            sendOSCMessage(host, port, address, args);
            return [2 /*return*/, { success: true, message: "OSC message sent to ".concat(host, ":").concat(port) }];
        }
        catch (error) {
            console.error('❌ IPC osc-send-message error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('osc-update-settings', function (event, settings) { return __awaiter(void 0, void 0, void 0, function () {
    var newPort, currentPort, result, errorMsg;
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-update-settings called with:', settings);
            // If the incoming port changed, restart the OSC server
            if (settings.defaultIncomingPort) {
                newPort = settings.defaultIncomingPort;
                currentPort = oscServer === null || oscServer === void 0 ? void 0 : oscServer.port;
                if (currentPort !== newPort) {
                    console.log("\uD83D\uDD04 Restarting OSC server from port ".concat(currentPort || 'none', " to ").concat(newPort));
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
                    result = startOSCServer(newPort);
                    if (result && result.success) {
                        console.log('✅ OSC server restarted on port:', newPort);
                        return [2 /*return*/, { success: true, message: "OSC server restarted on port ".concat(newPort) }];
                    }
                    else {
                        errorMsg = (result === null || result === void 0 ? void 0 : result.error) || 'Failed to restart OSC server';
                        console.error('❌ Failed to restart OSC server:', errorMsg);
                        return [2 /*return*/, { success: false, error: errorMsg }];
                    }
                }
                else {
                    console.log('ℹ️ OSC server already running on port:', newPort);
                }
            }
            return [2 /*return*/, { success: true, message: 'OSC settings updated' }];
        }
        catch (error) {
            console.error('❌ IPC osc-update-settings error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('osc-start-server', function (event, port) { return __awaiter(void 0, void 0, void 0, function () {
    var result;
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-start-server called with port:', port);
            // Close existing server if any
            if (oscServer) {
                oscServer.close();
                oscServer = null;
            }
            result = startOSCServer(port);
            console.log('🔧 OSC server started on port:', port);
            return [2 /*return*/, { success: true, message: "OSC Server started on port ".concat(port) }];
        }
        catch (error) {
            console.error('❌ IPC osc-start-server error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('osc-connect-device', function (event, deviceId, host, port) { return __awaiter(void 0, void 0, void 0, function () {
    var existingClient, client;
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-connect-device called with:', deviceId, host, port);
            existingClient = oscClients.get(deviceId);
            if (existingClient) {
                existingClient.close();
            }
            client = createOSCClient(host, port);
            if (client) {
                oscClients.set(deviceId, client);
                return [2 /*return*/, { success: true, message: "Connected to device ".concat(deviceId, " at ").concat(host, ":").concat(port) }];
            }
            else {
                return [2 /*return*/, { success: false, error: 'Failed to create OSC client' }];
            }
        }
        catch (error) {
            console.error('❌ IPC osc-connect-device error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('osc-disconnect-device', function (event, deviceId) { return __awaiter(void 0, void 0, void 0, function () {
    var client;
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-disconnect-device called for:', deviceId);
            client = oscClients.get(deviceId);
            if (client) {
                client.close();
                oscClients.delete(deviceId);
                return [2 /*return*/, { success: true, message: "Disconnected from device ".concat(deviceId) }];
            }
            else {
                return [2 /*return*/, { success: false, error: 'Device not found' }];
            }
        }
        catch (error) {
            console.error('❌ IPC osc-disconnect-device error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('osc-send-to-device', function (event, deviceId, address, args) { return __awaiter(void 0, void 0, void 0, function () {
    var client, formattedArgs;
    return __generator(this, function (_a) {
        try {
            console.log('🔗 IPC: osc-send-to-device called for device:', deviceId, 'address:', address, 'args:', args);
            client = oscClients.get(deviceId);
            if (client) {
                formattedArgs = args.map(function (arg) {
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
                });
                client.send({
                    address: address,
                    args: formattedArgs
                });
                console.log("\uD83D\uDCE4 Sent OSC message to device ".concat(deviceId, ": ").concat(address), formattedArgs);
                return [2 /*return*/, { success: true, message: "OSC message sent to device ".concat(deviceId) }];
            }
            else {
                console.error("\u274C No OSC client found for device ".concat(deviceId));
                return [2 /*return*/, { success: false, error: "Device ".concat(deviceId, " not connected") }];
            }
        }
        catch (error) {
            console.error('❌ IPC osc-send-to-device error:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
// ========================================
// PROJECT FILE OPERATIONS
// ========================================
// Show save dialog and return file path
electron_1.ipcMain.handle('project-show-save-dialog', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, electron_1.dialog.showSaveDialog(mainWindow, {
                        title: 'Save Holophonix Project',
                        defaultPath: 'Untitled.hpx',
                        filters: [
                            { name: 'Holophonix Projects', extensions: ['hpx'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result];
            case 2:
                error_1 = _a.sent();
                console.error('❌ Error showing save dialog:', error_1);
                return [2 /*return*/, { canceled: true, filePath: undefined }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Show open dialog and return file path
electron_1.ipcMain.handle('project-show-open-dialog', function () { return __awaiter(void 0, void 0, void 0, function () {
    var result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, {
                        title: 'Open Holophonix Project',
                        properties: ['openFile'],
                        filters: [
                            { name: 'Holophonix Projects', extensions: ['hpx'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    })];
            case 1:
                result = _a.sent();
                return [2 /*return*/, result];
            case 2:
                error_2 = _a.sent();
                console.error('❌ Error showing open dialog:', error_2);
                return [2 /*return*/, { canceled: true, filePaths: [] }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Write project data to file
electron_1.ipcMain.handle('project-write-file', function (event, filePath, projectData) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            console.log('💾 Writing project file:', filePath);
            fs.writeFileSync(filePath, projectData, 'utf-8');
            console.log('✅ Project file saved successfully');
            return [2 /*return*/, { success: true }];
        }
        catch (error) {
            console.error('❌ Error writing project file:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });
// Read project data from file
electron_1.ipcMain.handle('project-read-file', function (event, filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        try {
            console.log('📖 Reading project file:', filePath);
            data = fs.readFileSync(filePath, 'utf-8');
            console.log('✅ Project file read successfully');
            return [2 /*return*/, { success: true, data: data }];
        }
        catch (error) {
            console.error('❌ Error reading project file:', error);
            return [2 /*return*/, { success: false, error: error.message }];
        }
        return [2 /*return*/];
    });
}); });

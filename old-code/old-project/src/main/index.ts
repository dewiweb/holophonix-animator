import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import { setupOSCHandlers, initializeOSC } from './osc';
import { setupSettingsHandlers, settingsManager } from './settings';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

async function createMainWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  setupSettingsHandlers(window);
  setupOSCHandlers(window);

  if (isDevelopment) {
    // Load from webpack dev server
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    window.webContents.openDevTools();
  } else {
    // Load the index.html from a URL
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }));
  }

  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    try {
      // Ensure settings are initialized before creating window
      await settingsManager.initialize();
      mainWindow = await createMainWindow();
    } catch (error) {
      console.error('Failed to create window:', error);
      app.quit();
    }
  }
});

// Create main window when app is ready
app.on('ready', async () => {
  try {
    console.log('Initializing application...');
    
    // Initialize settings first
    console.log('Initializing settings...');
    await settingsManager.initialize();
    console.log('Settings initialized successfully');

    // Initialize OSC after settings
    console.log('Initializing OSC...');
    await initializeOSC();
    console.log('OSC initialized successfully');

    // Create window after all initializations
    console.log('Creating main window...');
    mainWindow = await createMainWindow();
    console.log('Main window created successfully');

  } catch (error) {
    console.error('Initialization error:', error);
    app.quit();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

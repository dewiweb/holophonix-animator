import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { Settings } from '../types/settings';
import { defaultSettings } from '../types/settings';

class SettingsManager {
  private static instance: SettingsManager;
  private settings: Settings;
  private settingsPath: string;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = { ...defaultSettings };
    console.log('SettingsManager constructed with path:', this.settingsPath);
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      console.log('Settings already initialized');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      console.log('Waiting for existing initialization to complete');
      return this.initializationPromise;
    }

    console.log('Starting settings initialization');
    this.initializationPromise = this._initialize();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('Checking for settings file:', this.settingsPath);
      
      if (fs.existsSync(this.settingsPath)) {
        console.log('Loading existing settings file');
        const data = await fs.promises.readFile(this.settingsPath, 'utf8');
        const savedSettings = JSON.parse(data);
        
        // Deep merge the saved settings with defaults
        this.settings = {
          ...defaultSettings,
          ...savedSettings,
          oscConnection: {
            ...defaultSettings.oscConnection,
            ...savedSettings.oscConnection
          }
        };
        
        console.log('Loaded settings:', this.settings);
      } else {
        console.log('No settings file found, using defaults:', this.settings);
        // Ensure the settings directory exists
        await fs.promises.mkdir(path.dirname(this.settingsPath), { recursive: true });
        // Save default settings
        await this.saveSettings();
      }
      
      this.initialized = true;
      console.log('Settings initialization complete');
      
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      this.initialized = false;
      throw error;
    }
  }

  getSettings(): Settings {
    if (!this.initialized) {
      console.warn('Getting settings before initialization complete');
      return { ...defaultSettings };
    }
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<Settings>): Promise<void> {
    if (!this.initialized) {
      console.warn('Attempting to update settings before initialization');
      await this.initialize();
    }

    // Deep merge the new settings
    this.settings = {
      ...this.settings,
      ...newSettings,
      oscConnection: {
        ...this.settings.oscConnection,
        ...(newSettings.oscConnection || {})
      }
    };
    
    console.log('Updating settings to:', this.settings);
    await this.saveSettings();
    this.broadcastSettingsChange();
  }

  private async saveSettings(): Promise<void> {
    try {
      await fs.promises.mkdir(path.dirname(this.settingsPath), { recursive: true });
      await fs.promises.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2)
      );
      console.log('Settings saved to:', this.settingsPath);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  private broadcastSettingsChange(): void {
    const settings = this.getSettings();
    console.log('Broadcasting settings change:', settings);
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('settings:changed', settings);
    });
  }
}

const settingsManager = SettingsManager.getInstance();

function setupSettingsHandlers(mainWindow: BrowserWindow) {
  // Remove any existing handlers
  ipcMain.removeHandler('settings:get');
  ipcMain.removeHandler('settings:save');

  ipcMain.handle('settings:get', async () => {
    // Ensure settings are initialized before returning
    if (!settingsManager['initialized']) {
      await settingsManager.initialize();
    }
    return settingsManager.getSettings();
  });

  ipcMain.handle('settings:save', async (_, newSettings: Partial<Settings>) => {
    await settingsManager.updateSettings(newSettings);
    return settingsManager.getSettings();
  });
}

export { settingsManager, setupSettingsHandlers };

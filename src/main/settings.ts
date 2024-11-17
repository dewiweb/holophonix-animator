import { app, ipcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface AppSettings {
  oscRateLimit: number;
  showMessageLog: boolean;
}

const defaultSettings: AppSettings = {
  oscRateLimit: 50, // 50ms = 20 messages per second
  showMessageLog: true
};

class SettingsManager {
  private static instance: SettingsManager;
  private settings: AppSettings;
  private settingsPath: string;

  private constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(data);
        return { ...defaultSettings, ...loadedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return { ...defaultSettings };
  }

  async saveSettings(newSettings: Partial<AppSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await fs.promises.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf8'
      );
      console.log('Settings saved successfully');
      // Emit settings changed event to all windows
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('settings:changed', this.settings);
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }
}

const settingsManager = SettingsManager.getInstance();

export function setupSettingsHandlers(): void {
  // Handle settings load request
  ipcMain.handle('settings:load', async () => {
    try {
      const settings = settingsManager.getSettings();
      return { success: true, settings };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Handle settings save request
  ipcMain.handle('settings:save', async (_event, newSettings: Partial<AppSettings>) => {
    try {
      await settingsManager.saveSettings(newSettings);
      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
}

export { settingsManager };

import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../main/settings';
import './Settings.css';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    oscRateLimit: 50 // Default 50ms = 20 messages per second
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load settings when component mounts
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electron.invoke('settings:load');
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await window.electron.invoke('settings:save', settings);
      if (result.success) {
        // Notify user of success
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Application Settings</h2>
      </div>

      <div className="settings-section">
        <h3>OSC Communication</h3>
        <div className="setting-item">
          <label htmlFor="oscRateLimit">Message Rate Limit (ms)</label>
          <div className="setting-input-group">
            <input
              id="oscRateLimit"
              type="number"
              min="10"
              max="1000"
              step="10"
              value={settings.oscRateLimit}
              onChange={(e) => setSettings({
                ...settings,
                oscRateLimit: Number(e.target.value)
              })}
            />
            <span className="setting-hint">
              {Math.round(1000 / settings.oscRateLimit)} messages per second
            </span>
          </div>
          <p className="setting-description">
            Minimum time between OSC messages. Lower values mean faster updates but higher network load.
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="save-button"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

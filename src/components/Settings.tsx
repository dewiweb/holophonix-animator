import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../main/settings';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AppSettings>({
    oscRateLimit: 50,
    showMessageLog: true
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
        console.log('Settings saved successfully');
        onClose();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShowMessageLogChange = (checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      showMessageLog: checked
    }));
    // Save immediately when checkbox changes
    window.electron.invoke('settings:save', {
      ...settings,
      showMessageLog: checked
    });
  };

  return (
    <div className="settings-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
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

          <div className="settings-section">
            <h3>Interface</h3>
            <div className="setting-item">
              <label htmlFor="showMessageLog">Show Message Log</label>
              <div className="setting-input-group">
                <input
                  id="showMessageLog"
                  type="checkbox"
                  checked={settings.showMessageLog}
                  onChange={(e) => handleShowMessageLogChange(e.target.checked)}
                />
              </div>
              <p className="setting-description">
                Show or hide the OSC message log at the bottom of the screen.
              </p>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

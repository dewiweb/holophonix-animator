import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsProps {
  onClose: () => void;
  onSettingsChanged: (settings: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose, onSettingsChanged }) => {
  const [settings, setSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial settings
    window.electron.ipcRenderer.invoke('settings:get').then(savedSettings => {
      setSettings(savedSettings);
    });
  }, []);

  if (!settings) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.electron.ipcRenderer.invoke('settings:save', settings);
      onSettingsChanged(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-modal" onClick={handleBackdropClick}>
      <div className="settings-content" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <h3>OSC Settings</h3>
            <div className="settings-row">
              <label>
                <span>Rate Limit (ms)</span>
                <input
                  type="number"
                  min="0"
                  value={settings.oscRateLimit}
                  onChange={(e) => setSettings({
                    ...settings,
                    oscRateLimit: parseInt(e.target.value) || 0
                  })}
                />
              </label>
            </div>
            <div className="settings-row">
              <label>
                <span>Local Port</span>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  value={settings.oscConnection.localPort}
                  onChange={(e) => setSettings({
                    ...settings,
                    oscConnection: {
                      ...settings.oscConnection,
                      localPort: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </label>
            </div>
            <div className="settings-row">
              <label>
                <span>Remote Port</span>
                <input
                  type="number"
                  min="0"
                  max="65535"
                  value={settings.oscConnection.remotePort}
                  onChange={(e) => setSettings({
                    ...settings,
                    oscConnection: {
                      ...settings.oscConnection,
                      remotePort: parseInt(e.target.value) || 0
                    }
                  })}
                />
              </label>
            </div>
            <div className="settings-row">
              <label>
                <span>Remote Address</span>
                <input
                  type="text"
                  value={settings.oscConnection.remoteAddress}
                  onChange={(e) => setSettings({
                    ...settings,
                    oscConnection: {
                      ...settings.oscConnection,
                      remoteAddress: e.target.value
                    }
                  })}
                />
              </label>
            </div>
            <div className="settings-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.oscConnection.autoConnect}
                  onChange={(e) => setSettings({
                    ...settings,
                    oscConnection: {
                      ...settings.oscConnection,
                      autoConnect: e.target.checked
                    }
                  })}
                />
                <span>Auto Connect</span>
              </label>
            </div>
          </div>
        </div>
        <div className="settings-footer">
          <button onClick={onClose}>Cancel</button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="primary"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

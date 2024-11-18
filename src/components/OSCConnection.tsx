import React, { useState, useEffect } from 'react';
import './OSCConnection.css';

export const OSCConnection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    remoteAddress: '',
    remotePort: '',
    localPort: ''
  });

  useEffect(() => {
    // Load initial settings and connection status
    Promise.all([
      window.electron.ipcRenderer.invoke('settings:get'),
      window.electron.ipcRenderer.invoke('osc:is-connected')
    ]).then(([settings, connected]) => {
      setSettings({
        remoteAddress: settings.oscConnection.remoteAddress,
        remotePort: settings.oscConnection.remotePort.toString(),
        localPort: settings.oscConnection.localPort.toString()
      });
      setIsConnected(connected);
    });

    // Listen for connection status changes
    window.electron.ipcRenderer.on('osc:connected', () => {
      setIsConnected(true);
      setIsLoading(false);
    });

    window.electron.ipcRenderer.on('osc:disconnected', () => {
      setIsConnected(false);
      setIsLoading(false);
    });

    window.electron.ipcRenderer.on('osc:error', (error: Error) => {
      console.error('OSC connection error:', error);
      setIsConnected(false);
      setIsLoading(false);
    });

    return () => {
      window.electron.removeAllListeners('osc:connected');
      window.electron.removeAllListeners('osc:disconnected');
      window.electron.removeAllListeners('osc:error');
    };
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const config = {
        remoteAddress: settings.remoteAddress,
        remotePort: parseInt(settings.remotePort),
        localPort: parseInt(settings.localPort)
      };
      console.log('Connecting with config:', config);
      await window.electron.ipcRenderer.invoke('osc:connect', config);
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await window.electron.ipcRenderer.invoke('osc:disconnect');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, [key]: e.target.value }));
  };

  return (
    <div className="osc-connection">
      <div className="connection-form">
        <div className="form-group">
          <label>Remote Address</label>
          <input
            type="text"
            value={settings.remoteAddress}
            onChange={handleSettingChange('remoteAddress')}
            disabled={isConnected || isLoading}
            placeholder="127.0.0.1"
          />
        </div>
        <div className="form-group">
          <label>Remote Port</label>
          <input
            type="number"
            value={settings.remotePort}
            onChange={handleSettingChange('remotePort')}
            disabled={isConnected || isLoading}
            placeholder="8000"
          />
        </div>
        <div className="form-group">
          <label>Local Port</label>
          <input
            type="number"
            value={settings.localPort}
            onChange={handleSettingChange('localPort')}
            disabled={isConnected || isLoading}
            placeholder="9000"
          />
        </div>
        <div className="connection-status">
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          )}
          <span className="status-text">
            {isLoading ? 'Connecting...' : (isConnected ? 'Connected' : 'Disconnected')}
          </span>
          <button
            className={`connect-button ${isConnected ? 'disconnect' : ''}`}
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isLoading}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

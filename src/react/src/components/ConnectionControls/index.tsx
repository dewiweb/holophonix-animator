import React, { useState, useCallback } from 'react';
import './ConnectionControls.css';

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: Error | null;
  connectionDetails: { ip: string; port: number; reconnectCount: number; } | null;
  onConnect: (ip: string, port: number) => void;
  onDisconnect: () => void;
}

const isValidIp = (ip: string): boolean => {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;
  return ip.split('.').every(num => {
    const n = parseInt(num, 10);
    return n >= 0 && n <= 255;
  });
};

const isValidPort = (port: number): boolean => {
  return port > 0 && port <= 65535;
};

export const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  isConnected,
  isConnecting,
  isReconnecting,
  error,
  connectionDetails,
  onConnect,
  onDisconnect,
}) => {
  const [ip, setIp] = useState(connectionDetails?.ip || '127.0.0.1');
  const [port, setPort] = useState<string>((connectionDetails?.port ?? 8000).toString());
  const [ipError, setIpError] = useState('');
  const [portError, setPortError] = useState('');

  const validateIp = useCallback((value: string) => {
    if (!isValidIp(value)) {
      setIpError('Invalid IP address');
      return false;
    }
    setIpError('');
    return true;
  }, []);

  const validatePort = useCallback((value: string) => {
    const portNum = parseInt(value, 10);
    if (isNaN(portNum) || !isValidPort(portNum)) {
      setPortError('Port must be between 1 and 65535');
      return false;
    }
    setPortError('');
    return true;
  }, []);

  const getConnectionStatusClass = () => {
    if (isConnected) return 'connected';
    if (isReconnecting) return 'reconnecting';
    if (isConnecting) return 'connecting';
    return 'disconnected';
  };

  const getConnectionStatusText = () => {
    if (isConnected) return 'Connected';
    if (isReconnecting) return `Reconnecting (Attempt ${connectionDetails?.reconnectCount})`;
    if (isConnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const handleConnect = useCallback(() => {
    if (validateIp(ip) && validatePort(port)) {
      onConnect(ip, parseInt(port, 10));
    }
  }, [ip, port, onConnect, validateIp, validatePort]);

  const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIp(e.target.value);
    if (ipError) validateIp(e.target.value);
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPort(e.target.value);
    if (portError) validatePort(e.target.value);
  };

  return (
    <div className="connection-controls">
      <div className="connection-form">
        <div className="form-group">
          <label htmlFor="ip-address">IP Address:</label>
          <input
            id="ip-address"
            type="text"
            value={ip}
            onChange={handleIpChange}
            onBlur={() => validateIp(ip)}
            disabled={isConnected || isConnecting || isReconnecting}
            placeholder="127.0.0.1"
          />
          {ipError && <span className="error-message">{ipError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="port">Port:</label>
          <input
            id="port"
            type="number"
            value={port}
            onChange={handlePortChange}
            onBlur={() => validatePort(port)}
            disabled={isConnected || isConnecting || isReconnecting}
            placeholder="8000"
          />
          {portError && <span className="error-message">{portError}</span>}
        </div>

        {isConnected ? (
          <button
            className="disconnect-button"
            onClick={onDisconnect}
            title="Disconnect from Holophonix"
          >
            Disconnect
          </button>
        ) : (
          <button
            className="connect-button"
            onClick={handleConnect}
            disabled={!!ipError || !!portError}
            title="Connect to Holophonix"
          >
            Connect
          </button>
        )}
      </div>

      <div 
        className={`connection-status ${getConnectionStatusClass()}`}
        data-testid="connection-status"
      >
        {getConnectionStatusText()}
      </div>
      {error && (
        <div className="error-tooltip" data-testid="connection-error">
          {error.message}
        </div>
      )}
    </div>
  );
};

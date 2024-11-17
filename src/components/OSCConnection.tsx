import React, { useState, useEffect } from 'react';
import './OSCConnection.css';

interface ConnectionStatus {
  isConnected: boolean;
  error: string | null;
}

interface OSCConfig {
  localPort: number;
  remotePort: number;
  remoteAddress: string;
}

interface OSCConnectionProps {
  onMessage: (message: string) => void;
}

export const OSCConnection: React.FC<OSCConnectionProps> = ({ onMessage }) => {
  const [status, setStatus] = useState<ConnectionStatus>({ isConnected: false, error: null });
  const [localPort, setLocalPort] = useState(9000);  // Port to receive messages
  const [remotePort, setRemotePort] = useState(12000);  // Port to send messages
  const [remoteAddress, setRemoteAddress] = useState('127.0.0.1');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handleConnected = () => {
      console.log('Connected event received');
      setStatus({ isConnected: true, error: null });
      setIsConnecting(false);
    };

    const handleDisconnected = () => {
      console.log('Disconnected event received');
      setStatus({ isConnected: false, error: null });
      setIsConnecting(false);
    };

    const handleError = (error: string) => {
      console.error('OSC error received:', error);
      setStatus({ isConnected: false, error });
      setIsConnecting(false);
    };

    const handleMessage = (message: any) => {
      console.log('OSC message received in OSCConnection:', message);
      onMessage(JSON.stringify(message, null, 2));
    };

    window.electron.on('osc:connected', handleConnected);
    window.electron.on('osc:disconnected', handleDisconnected);
    window.electron.on('osc:error', handleError);
    window.electron.on('osc:message', handleMessage);

    return () => {
      window.electron.removeAllListeners('osc:connected');
      window.electron.removeAllListeners('osc:disconnected');
      window.electron.removeAllListeners('osc:error');
      window.electron.removeAllListeners('osc:message');
    };
  }, [onMessage]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setStatus({ isConnected: false, error: null });

    try {
      const config: OSCConfig = {
        localPort,
        remotePort,
        remoteAddress
      };

      const result = await window.electron.invoke('osc:connect', config);
      if (!result.success) {
        setStatus({ isConnected: false, error: result.error || 'Failed to connect' });
        setIsConnecting(false);
      }
    } catch (error) {
      setStatus({ isConnected: false, error: String(error) });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await window.electron.invoke('osc:disconnect');
      if (!result.success && result.error) {
        setStatus({ isConnected: false, error: result.error });
      }
    } catch (error) {
      setStatus({ isConnected: false, error: String(error) });
    }
  };

  const handleTestMessage = async () => {
    try {
      await window.electron.invoke('osc:test');
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  return (
    <div className="osc-connection">
      <div className="connection-form">
        <div className="form-groups">
          <div className="form-group">
            <label>Local:</label>
            <input
              type="number"
              value={localPort}
              onChange={(e) => setLocalPort(Number(e.target.value))}
              disabled={status.isConnected || isConnecting}
              min="1024"
              max="65535"
            />
          </div>

          <div className="form-group">
            <label>Remote:</label>
            <input
              type="number"
              value={remotePort}
              onChange={(e) => setRemotePort(Number(e.target.value))}
              disabled={status.isConnected || isConnecting}
              min="1024"
              max="65535"
            />
          </div>

          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              value={remoteAddress}
              onChange={(e) => setRemoteAddress(e.target.value)}
              disabled={status.isConnected || isConnecting}
            />
          </div>
        </div>

        <div className="form-actions">
          {!status.isConnected ? (
            <button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="connect-btn"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <>
              <button 
                onClick={handleDisconnect}
                className="disconnect-btn"
              >
                Disconnect
              </button>
              <button 
                onClick={handleTestMessage}
                className="test-btn"
              >
                Test
              </button>
            </>
          )}
        </div>

        {status.error && (
          <div className="error-message">
            {status.error}
          </div>
        )}
      </div>
    </div>
  );
};

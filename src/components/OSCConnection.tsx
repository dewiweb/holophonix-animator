import React, { useState, useEffect } from 'react';

interface ConnectionStatus {
  isConnected: boolean;
  error: string | null;
}

interface OSCConfig {
  localPort: number;
  remotePort: number;
  remoteAddress: string;
}

export const OSCConnection: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({ isConnected: false, error: null });
  const [localPort, setLocalPort] = useState(9000);  // Port to receive messages
  const [remotePort, setRemotePort] = useState(12000);  // Port to send messages
  const [remoteAddress, setRemoteAddress] = useState('127.0.0.1');
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

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
      console.log('OSC message received:', message);
      setLastMessage(JSON.stringify(message, null, 2));
    };

    // Set up event listeners
    window.electron.on('osc:connected', handleConnected);
    window.electron.on('osc:disconnected', handleDisconnected);
    window.electron.on('osc:error', handleError);
    window.electron.on('osc:message', handleMessage);

    // Cleanup event listeners
    return () => {
      window.electron.removeAllListeners('osc:connected');
      window.electron.removeAllListeners('osc:disconnected');
      window.electron.removeAllListeners('osc:error');
      window.electron.removeAllListeners('osc:message');
    };
  }, []);

  const handleConnect = async () => {
    try {
      console.log('Attempting to connect...');
      setIsConnecting(true);
      setStatus({ isConnected: false, error: null });
      
      const config: OSCConfig = {
        localPort,
        remotePort,
        remoteAddress
      };

      console.log('Sending connect request with config:', config);
      const result = await window.electron.invoke('osc:connect', config);

      if (!result.success) {
        throw new Error(result.error || 'Failed to connect');
      }
      console.log('Connect request successful');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus({ 
        isConnected: false, 
        error: error instanceof Error ? error.message : 'Failed to connect' 
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      console.log('Attempting to disconnect...');
      const result = await window.electron.invoke('osc:disconnect');
      if (!result.success) {
        throw new Error(result.error || 'Failed to disconnect');
      }
      console.log('Disconnect request successful');
    } catch (error) {
      console.error('Disconnect error:', error);
      setStatus({ 
        isConnected: false, 
        error: error instanceof Error ? error.message : 'Failed to disconnect' 
      });
    }
  };

  const handleTestMessage = async () => {
    try {
      console.log('Sending test message...');
      const result = await window.electron.invoke('osc:trackControl', {
        trackId: '1',
        type: 'azim',
        value: 45
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send test message');
      }
      console.log('Test message sent successfully');
    } catch (error) {
      console.error('Test message error:', error);
      setStatus({
        isConnected: true,
        error: error instanceof Error ? error.message : 'Failed to send test message'
      });
    }
  };

  return (
    <div className="osc-connection">
      <div className="connection-status">
        <div className={`status-indicator ${status.isConnected ? 'connected' : ''}`} />
        <span>
          {isConnecting ? 'Connecting...' : 
           status.isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {status.error && (
        <div className="error-message">
          {status.error}
        </div>
      )}

      <div className="connection-settings">
        <div className="setting">
          <label>Local Port (Receive):</label>
          <input
            type="number"
            value={localPort}
            onChange={(e) => setLocalPort(Number(e.target.value))}
            disabled={status.isConnected || isConnecting}
            min="1024"
            max="65535"
          />
        </div>

        <div className="setting">
          <label>Remote Port (Send):</label>
          <input
            type="number"
            value={remotePort}
            onChange={(e) => setRemotePort(Number(e.target.value))}
            disabled={status.isConnected || isConnecting}
            min="1024"
            max="65535"
          />
        </div>

        <div className="setting">
          <label>Remote Address:</label>
          <input
            type="text"
            value={remoteAddress}
            onChange={(e) => setRemoteAddress(e.target.value)}
            disabled={status.isConnected || isConnecting}
            pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
            title="Please enter a valid IP address"
          />
        </div>

        <button
          onClick={status.isConnected ? handleDisconnect : handleConnect}
          className={status.isConnected ? 'disconnect' : 'connect'}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 
           status.isConnected ? 'Disconnect' : 'Connect'}
        </button>

        {status.isConnected && (
          <button
            onClick={handleTestMessage}
            className="test-message"
          >
            Send Test Message
          </button>
        )}
      </div>

      {lastMessage && (
        <div className="last-message">
          <h4>Last Received Message:</h4>
          <pre>{lastMessage}</pre>
        </div>
      )}
    </div>
  );
};

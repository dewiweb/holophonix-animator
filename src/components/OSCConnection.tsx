import React, { useState, useEffect } from 'react';

export const OSCConnection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [localPort, setLocalPort] = useState(9000);
  const [remotePort, setRemotePort] = useState(9001);
  const [remoteAddress, setRemoteAddress] = useState('127.0.0.1');

  const handleConnect = () => {
    console.log('Connecting to OSC...', {
      localPort,
      remotePort,
      remoteAddress
    });
    // TODO: Implement OSC connection
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    console.log('Disconnecting from OSC...');
    // TODO: Implement OSC disconnection
    setIsConnected(false);
  };

  return (
    <div className="osc-connection">
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : ''}`} />
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>

      <div className="connection-settings">
        <div className="setting">
          <label>Local Port:</label>
          <input
            type="number"
            value={localPort}
            onChange={(e) => setLocalPort(Number(e.target.value))}
            disabled={isConnected}
          />
        </div>

        <div className="setting">
          <label>Remote Port:</label>
          <input
            type="number"
            value={remotePort}
            onChange={(e) => setRemotePort(Number(e.target.value))}
            disabled={isConnected}
          />
        </div>

        <div className="setting">
          <label>Remote Address:</label>
          <input
            type="text"
            value={remoteAddress}
            onChange={(e) => setRemoteAddress(e.target.value)}
            disabled={isConnected}
          />
        </div>

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          className={isConnected ? 'disconnect' : 'connect'}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
};

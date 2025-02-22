import React, { useState } from 'react';

interface ConnectionControlsProps {
  onConnect: (config: { ip: string; remotePort: number; localPort: number }) => void;
  onSettingsClick: () => void;
}

export const ConnectionControls: React.FC<ConnectionControlsProps> = ({ onConnect, onSettingsClick }) => {
  const [ip, setIp] = useState('127.0.0.1');
  const [remotePort, setRemotePort] = useState('3000');
  const [localPort, setLocalPort] = useState('8000');

  const handleConnect = () => {
    onConnect({
      ip,
      remotePort: parseInt(remotePort),
      localPort: parseInt(localPort)
    });
  };

  return (
    <div className="controls">
      <input
        type="text"
        className="input-field"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="IP Address"
      />
      <input
        type="text"
        className="input-field"
        value={remotePort}
        onChange={(e) => setRemotePort(e.target.value)}
        placeholder="Remote Port"
      />
      <input
        type="text"
        className="input-field"
        value={localPort}
        onChange={(e) => setLocalPort(e.target.value)}
        placeholder="Local Port"
      />
      <button className="button connect" onClick={handleConnect}>
        Connect
      </button>
      <button className="button">▼</button>
      <button className="button settings" onClick={onSettingsClick}>
        ⚙
      </button>
    </div>
  );
};

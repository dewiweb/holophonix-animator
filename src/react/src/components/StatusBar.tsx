import React from 'react';

interface StatusBarProps {
  message: string;
  connectionStatus: 'connected' | 'disconnected';
}

export const StatusBar: React.FC<StatusBarProps> = ({ message, connectionStatus }) => {
  return (
    <div className="status-bar">
      <div className="status-message">{message}</div>
      <div className="connection-status">
        {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
};

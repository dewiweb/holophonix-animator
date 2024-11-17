import React from 'react';
import './MessageLog.css';

interface MessageLogProps {
  message: string | null;
}

export const MessageLog: React.FC<MessageLogProps> = ({ message }) => {
  return (
    <div className="message-log">
      <div className="message-log-header">
        <h3>Message Log</h3>
      </div>
      <div className="message-content">
        {message ? (
          <pre>{message}</pre>
        ) : (
          <div className="no-messages">No messages</div>
        )}
      </div>
    </div>
  );
};

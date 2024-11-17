import React from 'react';
import { EraserIcon } from './icons/Eraser';
import './MessageLog.css';

interface Message {
  id: string;
  content: string;
  timestamp: number;
  direction: 'in' | 'out';
}

interface MessageLogProps {
  messages: Message[];
  maxMessages?: number;
  onClear?: () => void;
}

export const MessageLog: React.FC<MessageLogProps> = ({ 
  messages, 
  maxMessages = 100,
  onClear 
}) => {
  const displayMessages = messages.slice(0, maxMessages);

  return (
    <div className="message-log">
      <div className="message-header">
        <span className="message-title">OSC Messages</span>
        <button className="clear-button" onClick={onClear} title="Clear messages">
          <EraserIcon />
        </button>
      </div>
      <div className="message-content">
        <div className="messages">
          {displayMessages.map((msg) => (
            <div key={msg.id} className="message-item">
              <span className="message-time">
                <span className="direction-arrow">
                  {msg.direction === 'in' ? '→' : '←'}
                </span>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span className="message-text" title={msg.content}>
                {msg.content}
              </span>
            </div>
          ))}
          {displayMessages.length === 0 && (
            <div className="no-messages">
              No messages yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import type { OSCMessage } from '../types/osc';
import './OSCLogger.css';

interface OSCLoggerProps {
  messages: OSCMessage[];
}

export const OSCLogger: React.FC<OSCLoggerProps> = ({ messages }) => {
  return (
    <div className="osc-logger">
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className="message">
              <div className="message-row">
                <div className="timestamp-group">
                  <span className={`direction-arrow direction-${message.direction}`}>
                    {message.direction === 'in' ? '→' : '←'}
                  </span>
                  <span className="timestamp" title={new Date(message.timestamp).toLocaleString()}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="address" title={message.address}>
                  {message.address}
                </span>
                <div className="args">
                  {message.args.map((arg: string | number | boolean, i: number) => (
                    <span key={i} className="arg" title={String(arg)}>
                      {typeof arg === 'object' ? JSON.stringify(arg) : String(arg)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-message">
            No OSC messages yet
          </div>
        )}
      </div>
    </div>
  );
};

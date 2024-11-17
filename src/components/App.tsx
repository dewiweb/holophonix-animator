import React, { useState, useEffect } from 'react';
import { OSCConnection } from './OSCConnection';
import { TrackList } from './TrackList';
import { Settings } from './Settings';
import { GearIcon } from './icons/Gear';
import { MessageLog } from './MessageLog';
import { BehaviorList } from './BehaviorList';
import type { Track, Behavior } from '../types/behaviors';

// Import component styles
import '../styles/scrollbars.css';
import './Layout.css';
import './Tracks.css';
import './Behaviors.css';
import './SettingsButton.css';

interface Message {
  id: string;
  content: string;
  timestamp: number;
  direction: 'in' | 'out';
}

interface AppSettings {
  oscRateLimit: number;
  showMessageLog: boolean;
}

export const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOSC, setShowOSC] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const maxMessages = 100;
  const [settings, setSettings] = useState<AppSettings>({
    oscRateLimit: 50,
    showMessageLog: true
  });

  const handleOSCMessage = (rawMessage: any) => {
    // Ensure we have a proper object
    const message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
    
    console.log('App: Processing OSC message:', {
      address: message?.address,
      args: message?.args,
      timestamp: message?.timestamp,
      direction: message?.direction
    });
    
    // Ensure message exists
    if (!message) {
      console.warn('App: Received null or undefined message');
      return;
    }

    let formattedContent: string;
    
    try {
      // Check if it's a raw OSC message
      if (message.address && Array.isArray(message.args)) {
        formattedContent = `${message.address} ${message.args.join(' ')}`;
        console.log('App: Formatted OSC message:', formattedContent);
      }
      // Check if it's a track control message
      else if (message.trackId && message.type && typeof message.value !== 'undefined') {
        formattedContent = `/track/${message.trackId}/${message.type} ${message.value}`;
        console.log('App: Formatted track control message:', formattedContent);
      }
      else {
        console.warn('App: Message missing required properties:', {
          address: message.address,
          args: message.args,
          trackId: message.trackId,
          type: message.type,
          value: message.value
        });
        return;
      }

      // Add the message to the log
      setMessages(prevMessages => {
        const newMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: formattedContent,
          timestamp: message.timestamp || Date.now(),
          direction: message.direction || 'in' as const
        };
        
        console.log('App: Adding new message:', {
          content: newMessage.content,
          timestamp: newMessage.timestamp,
          direction: newMessage.direction
        });
        return [newMessage, ...prevMessages.slice(0, maxMessages - 1)];
      });
    } catch (error) {
      console.error('App: Error processing message:', error);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    const messageHandler = (message: any) => {
      console.log('App: OSC message event received:', {
        address: message?.address,
        args: message?.args,
        timestamp: message?.timestamp
      });
      handleOSCMessage(message);
    };

    console.log('App: Setting up OSC message listener');
    window.electron.on('osc:message', messageHandler);

    return () => {
      console.log('App: Removing OSC message listener');
      window.electron.removeAllListeners('osc:message');
    };
  }, []);

  useEffect(() => {
    // Load settings when component mounts
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electron.invoke('settings:load');
      if (result.success && result.settings) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = (newSettings: AppSettings) => {
      console.log('Settings changed:', newSettings);
      setSettings(newSettings);
    };
    window.electron.on('settings:changed', handleSettingsChange);
    return () => {
      window.electron.removeAllListeners('settings:changed');
    };
  }, []);

  const handleAddBehavior = (behavior: Behavior) => {
    if (!selectedTrack) return;
    
    const updatedTrack = {
      ...selectedTrack,
      behaviors: [...selectedTrack.behaviors, behavior]
    };
    
    // TODO: Update track in track list
    setSelectedTrack(updatedTrack);
  };

  const handleRemoveBehavior = (behaviorId: string) => {
    if (!selectedTrack) return;
    
    const updatedTrack = {
      ...selectedTrack,
      behaviors: selectedTrack.behaviors.filter(b => b.id !== behaviorId)
    };
    
    // TODO: Update track in track list
    setSelectedTrack(updatedTrack);
    if (selectedBehavior?.id === behaviorId) {
      setSelectedBehavior(null);
    }
  };

  return (
    <div className="app-container">
      <div className="app">
        <header>
          <h1>Track Animator</h1>
          <div className="header-controls">
            <button 
              className="toggle-button"
              onClick={() => setShowOSC(!showOSC)}
              title={showOSC ? 'Hide OSC Settings' : 'Show OSC Settings'}
              aria-label="Toggle OSC Settings"
            />
            <button 
              className="settings-button"
              onClick={() => setShowSettings(true)}
              title="Open Settings"
            >
              <GearIcon />
            </button>
          </div>
        </header>

        <div className={`osc-section ${showOSC ? '' : 'hidden'}`}>
          <OSCConnection onMessage={handleOSCMessage} />
        </div>

        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}

        <main>
          <div className="tracks-section">
            <div className="section-header">
              <h2>Tracks</h2>
            </div>
            <div className="content">
              <TrackList 
                selectedTrack={selectedTrack}
                onSelectionChange={setSelectedTrack}
              />
            </div>
          </div>

          <div className="behaviors-section">
            <div className="section-header">
              <h2>Behaviors</h2>
            </div>
            <div className="content">
              <BehaviorList
                selectedTrack={selectedTrack}
                selectedBehavior={selectedBehavior}
                onAddBehavior={handleAddBehavior}
                onRemoveBehavior={handleRemoveBehavior}
                onSelectBehavior={setSelectedBehavior}
              />
            </div>
          </div>

          <div className="parameters-section">
            <div className="section-header">
              <h2>Parameters</h2>
            </div>
            <div className="content">
              {selectedBehavior ? (
                <div className="behavior-parameters">
                  <h3>{selectedBehavior.name}</h3>
                  <div className="parameters">
                    {Object.entries(selectedBehavior.parameters).map(([key, value]) => (
                      <div key={key} className="parameter">
                        <label>{key}:</label>
                        <input
                          type="number"
                          value={value}
                          onChange={() => {/* TODO */}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  Select a behavior to edit parameters
                </div>
              )}
            </div>
          </div>
        </main>

        {settings.showMessageLog && (
          <footer>
            <MessageLog 
              messages={messages} 
              maxMessages={maxMessages} 
              onClear={handleClearMessages}
            />
          </footer>
        )}
      </div>
    </div>
  );
};

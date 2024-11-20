import React, { useState, useEffect } from 'react';
import { TrackList } from './TrackList';
import { OSCConnection } from './OSCConnection';
import { Settings } from './Settings';
import { GearIcon } from './icons/Gear';
import { EraserIcon } from './icons/Eraser';
import { OSCLogger } from './OSCLogger';
import { BehaviorList } from './BehaviorList';
import { ParameterSection } from './ParameterSection';
import type { Track, Behavior } from '../types/behaviors';
import type { Settings as AppSettings } from '../types/settings';
import type { OSCMessage } from '../types/osc';
import type { ParameterValidationError } from '../types/parameters';
import { defaultSettings } from '../types/settings';
import '../types/electron'; // Import electron types

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

export function App() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);
  const [validationErrors, setValidationErrors] = useState<ParameterValidationError[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [messages, setMessages] = useState<OSCMessage[]>([]);

  useEffect(() => {
    // Load settings
    window.electron.invoke('settings:get').then(setSettings);

    // Listen for OSC messages
    const messageHandler = (message: OSCMessage) => {
      console.log('App: OSC message event received:', {
        address: message?.address,
        args: message?.args,
        timestamp: message?.timestamp
      });
      handleOSCMessage(message);
    };

    window.electron.on('osc:message', messageHandler);

    return () => {
      window.electron.removeAllListeners('osc:message');
    };
  }, []);

  const handleSettingsChanged = async (newSettings: any) => {
    // If connected, reconnect with new settings
    const isConnected = await window.electron.invoke('osc:is-connected');
    if (isConnected) {
      await window.electron.invoke('osc:disconnect');
      if (newSettings.oscConnection.autoConnect) {
        await window.electron.invoke('osc:connect', {
          remoteAddress: newSettings.oscConnection.remoteAddress,
          localPort: newSettings.oscConnection.localPort,
          remotePort: newSettings.oscConnection.remotePort
        });
      }
    }
  };

  const handleOSCMessage = (message: any) => {
    try {
      console.log('App: OSC message event received:', {
        address: message?.address,
        args: message?.args,
        timestamp: message?.timestamp,
        direction: message?.direction
      });

      // Format the message content
      const formattedContent = message.args 
        ? `${message.address} ${message.args.join(' ')}`
        : message.address;

      // Add the message to the log
      setMessages(prevMessages => {
        const newMessage: OSCMessage = {
          address: message.address,
          args: message.args || [],
          timestamp: message.timestamp || Date.now(),
          direction: message.direction || 'in'
        };
        return [newMessage, ...prevMessages.slice(0, 99)]; // Keep last 100 messages
      });
    } catch (error) {
      console.error('App: Error processing message:', error);
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    // Load settings when component mounts
    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = (newSettings: AppSettings) => {
      console.log('Settings changed:', newSettings);
      setSettings(newSettings);
    };

    window.electron.on('settings:changed', handleSettingsChange);
    return () => {
      window.electron.removeAllListeners('settings:changed');
    };
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await window.electron.invoke('settings:get');
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleTrackSelection = (track: Track | null) => {
    setSelectedTrack(track);
    setSelectedBehavior(null);
  };

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
      behaviors: selectedTrack.behaviors.filter((behavior: Behavior) => behavior.id !== behaviorId)
    };
    
    // TODO: Update track in track list
    console.log('Removing behavior:', behaviorId, 'from track:', updatedTrack);
    setSelectedTrack(updatedTrack);
    if (selectedBehavior?.id === behaviorId) {
      setSelectedBehavior(null);
    }
  };

  return (
    <div className="app-container">
      <header className={isHeaderCollapsed ? 'collapsed' : ''}>
        <div className="title-bar">
          <h3>OSC Connection</h3>
          <div className="controls">
            <button className="settings-button" onClick={() => setIsSettingsOpen(true)}>
              <GearIcon />
            </button>
            <button 
              className="collapse-button"
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              title={isHeaderCollapsed ? "Show OSC controls" : "Hide OSC controls"}
            >
              {isHeaderCollapsed ? '◂' : '▾'}
            </button>
          </div>
        </div>
        <div className="content">
          <OSCConnection />
        </div>
      </header>

      {isSettingsOpen && (
        <Settings 
          onClose={() => setIsSettingsOpen(false)} 
          onSettingsChanged={handleSettingsChanged}
        />
      )}

      <main className={`${isHeaderCollapsed ? 'header-collapsed' : ''} ${isFooterCollapsed ? 'footer-collapsed' : ''}`}>
        <div className="tracks-section">
          <TrackList
            selectedTrack={selectedTrack}
            onSelectionChange={handleTrackSelection}
          />
        </div>
        <div className="behaviors-section">
          <BehaviorList
            selectedTrack={selectedTrack}
            onAddBehavior={handleAddBehavior}
            onRemoveBehavior={handleRemoveBehavior}
            onSelectBehavior={setSelectedBehavior}
            selectedBehavior={selectedBehavior}
          />
        </div>
        <div className="parameters-section">
          <ParameterSection
            selectedBehavior={selectedBehavior}
            onValidationErrors={setValidationErrors}
          />
        </div>
      </main>

      <footer className={isFooterCollapsed ? 'collapsed' : ''}>
        <div className="footer-header">
          <h3>OSC Logger</h3>
          <div className="footer-controls">
            <button 
              className="clear-button"
              onClick={() => setMessages([])}
              title="Clear log"
            >
              <EraserIcon />
            </button>
            <button 
              className="collapse-button"
              onClick={() => setIsFooterCollapsed(!isFooterCollapsed)}
              title={isFooterCollapsed ? "Show OSC logger" : "Hide OSC logger"}
            >
              {isFooterCollapsed ? '◂' : '▾'}
            </button>
          </div>
        </div>
        <div className="footer-content">
          <OSCLogger messages={messages} />
        </div>
      </footer>
    </div>
  );
};

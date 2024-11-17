import React, { useState, useEffect } from 'react';
import { OSCConnection } from './OSCConnection';
import { TrackList } from './TrackList';
import { Settings } from './Settings';
import { GearIcon } from './icons/Gear';
import type { Track, Behavior } from '../types/behaviors';

// Import component styles
import '../styles/scrollbars.css';
import './Layout.css';
import './Tracks.css';
import './Behaviors.css';
import './SettingsButton.css';

export const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showOSC, setShowOSC] = useState(true);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('OSC message received:', message);
      setLastMessage(JSON.stringify(message, null, 2));
    };

    window.electron.on('osc:message', handleMessage);

    return () => {
      window.electron.removeAllListeners('osc:message');
    };
  }, []);

  return (
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
            onClick={() => setShowSettings(!showSettings)}
            title={showSettings ? 'Close Settings' : 'Open Settings'}
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <div className={`osc-section ${showOSC ? '' : 'hidden'}`}>
        <OSCConnection onMessage={setLastMessage} />
      </div>

      {showSettings ? (
        <div className="settings-page">
          <Settings />
        </div>
      ) : (
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
              {selectedTrack ? (
                <div className="behaviors-content">
                  <div className="add-behaviors">
                    <div className="section-header">
                      <h3>Available Behaviors</h3>
                    </div>
                    <div className="behavior-categories">
                      <div className="behavior-category">
                        <h4>1D</h4>
                        <div className="behavior-items">
                          <div className="behavior-item">Linear</div>
                          <div className="behavior-item">Sine</div>
                          <div className="behavior-item">Random</div>
                        </div>
                      </div>
                      <div className="behavior-category">
                        <h4>2D</h4>
                        <div className="behavior-items">
                          <div className="behavior-item">Circular</div>
                          <div className="behavior-item">Figure-8</div>
                          <div className="behavior-item">Spiral</div>
                        </div>
                      </div>
                      <div className="behavior-category">
                        <h4>3D</h4>
                        <div className="behavior-items">
                          <div className="behavior-item">Orbit</div>
                          <div className="behavior-item">Helix</div>
                          <div className="behavior-item">Random Walk</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="behaviors-divider" />
                  <div className="applied-behaviors">
                    <div className="section-header">
                      <h3>Applied Behaviors</h3>
                    </div>
                    <div className="behavior-list">
                      {selectedTrack.behaviors.length === 0 ? (
                        <div className="no-behaviors">
                          No behaviors applied
                        </div>
                      ) : (
                        selectedTrack.behaviors.map(behavior => (
                          <div
                            key={behavior.id}
                            className={`behavior-item ${selectedBehavior?.id === behavior.id ? 'selected' : ''}`}
                            onClick={() => setSelectedBehavior(behavior)}
                          >
                            <div className="behavior-info">
                              <button
                                className={`active-toggle ${behavior.active ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Toggle behavior active state
                                }}
                              >
                                ●
                              </button>
                              <span>{behavior.name}</span>
                            </div>
                            <button
                              className="delete-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Delete behavior
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  Select a track to manage behaviors
                </div>
              )}
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
      )}

      <footer>
        <div className="message-log">
          <h4>OSC Message Log:</h4>
          <div className="message-content">
            {lastMessage ? (
              <pre>{lastMessage}</pre>
            ) : (
              <div className="no-messages">No messages received</div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

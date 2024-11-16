import React, { useState } from 'react';
import { OSCConnection } from './OSCConnection';
import { TrackList } from './TrackList';
import type { Track, Behavior } from '../types/behaviors';

export const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedBehavior, setSelectedBehavior] = useState<Behavior | null>(null);

  return (
    <div className="app">
      <header>
        <h1>Track Animator</h1>
        <OSCConnection />
      </header>

      <main>
        {/* Left Column: Tracks */}
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

        {/* Middle Column: Behaviors */}
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

        {/* Right Column: Parameters */}
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
    </div>
  );
};

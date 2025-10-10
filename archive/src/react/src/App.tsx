import React, { useState } from 'react';
import './App.css';
import { PreviewWindow } from './components/PreviewWindow';
import { ConnectionControls } from './components/ConnectionControls';
import { Panel } from './components/Panel';
import { Timeline } from './components/Timeline';
import { StatusBar } from './components/StatusBar';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready');

  const handleConnect = (config: { ip: string; remotePort: number; localPort: number }) => {
    // TODO: Implement connection logic
    setIsConnected(true);
    setStatusMessage(`Connected to ${config.ip}:${config.remotePort}`);
  };

  const handleSettingsClick = () => {
    // TODO: Implement settings dialog
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="app-layout">
      <PreviewWindow
        onMinimize={() => {}}
        onClose={() => {}}
      />

      <div className="app-window">
        <div className="title-bar">
          <div></div>
          <div className="window-title">Holophonix Animator</div>
          <div className="window-controls">_ □ ×</div>
        </div>

        <ConnectionControls
          onConnect={handleConnect}
          onSettingsClick={handleSettingsClick}
        />

        <div className="main-content">
          <Panel title="Tracks">
            <div className="interactive">▶ Track 1</div>
            <div className="interactive">▶ Track 2</div>
            <div className="interactive">▶ Track 3</div>
            <div className="interactive">+ Add Track</div>
          </Panel>

          <Panel title="Animation Models">
            <div className="section">
              <h3>Available Models</h3>
              <div className="interactive">⬡ Linear Move</div>
              <div className="interactive">⬡ Circular Path</div>
              <div className="interactive">⬡ Random Walk</div>
              <div className="interactive">⬡ Follow Path</div>
            </div>
            <div className="section">
              <h3>Active Models</h3>
              <div className="model-item">
                <span>Linear Move 1</span>
                <div className="model-controls">
                  <button>⏮</button>
                  <button>⏯</button>
                  <button>⏭</button>
                  <button>✕</button>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Parameters">
            <div className="section">
              <h3>Model Parameters</h3>
              <div className="parameter-group">
                <label>Start Position</label>
                <div className="position-inputs">
                  <input type="number" placeholder="X" />
                  <input type="number" placeholder="Y" />
                  <input type="number" placeholder="Z" />
                </div>
              </div>
            </div>
          </Panel>

        <Timeline
          onPlayPause={handlePlayPause}
          isPlaying={isPlaying}
        />

        <StatusBar
          message={statusMessage}
          connectionStatus={isConnected ? 'connected' : 'disconnected'}
        />
            <button className="button">⏹</button>
            <button className="button">⏮</button>
            <span className="time-display">00:00.000</span>
          </div>
          <div className="timeline-track">
            <div className="timeline-grid"></div>
            <div className="timeline-marker"></div>
          </div>
        </div>

        {/* Status bar */}
        <div className="status-bar-container">
          <div className="status-bar-header">
            <span className="status-bar-title">OSC Messages</span>
            <span className="status-bar-toggle">▼</span>
          </div>
          <div className="status-bar">
            <div className="osc-message incoming">
              <span className="direction">→</span>
              <span className="timestamp">14:32:45.234</span>
              <span className="address">/track/1/xy</span>
              <span className="value">x: 0.5, y: 0.3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  const handleTrackAdd = () => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      position: { x: 0.5, y: 0.5, z: 0 }
    };
    setTracks([...tracks, newTrack]);
  };

  const handleTrackRemove = (id: string) => {
    setTracks(tracks.filter(track => track.id !== id));
    if (selectedTrackId === id) {
      setSelectedTrackId(null);
    }
  };

  const handleTrackUpdate = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const handleModelAdd = (type: 'linear' | 'circular' | 'random') => {
    const newModel: Animation = {
      id: `model-${Date.now()}`,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${activeModels.length + 1}`,
      isPlaying: false,
      duration: 5000,
      currentTime: 0,
      tracks: [],
      parameters: {},
      keyframes: [],
    };
    setActiveModels([...activeModels, newModel]);
  };

  const handleModelRemove = (id: string) => {
    setActiveModels(activeModels.filter(model => model.id !== id));
    if (selectedModelId === id) {
      setSelectedModelId(null);
    }
  };

  const handleModelUpdate = (id: string, updates: Partial<Animation>) => {
    setActiveModels(activeModels.map(model => 
      model.id === id ? { ...model, ...updates } : model
    ));
  };

  const handleTimeChange = (time: number) => {
    if (selectedModelId) {
      handleModelUpdate(selectedModelId, { currentTime: time });
    }
  };

  const handlePlayPause = (isPlaying: boolean) => {
    if (selectedModelId) {
      handleModelUpdate(selectedModelId, { isPlaying });
    }
  };

  const handleKeyframeChange = (id: string, time: number) => {
    if (selectedModelId) {
      const model = activeModels.find(m => m.id === selectedModelId);
      if (model) {
        handleModelUpdate(selectedModelId, {
          keyframes: model.keyframes.map(kf => 
            kf.id === id ? { ...kf, time } : kf
          )
        });
      }
    }
  };

  const handleMarkerChange = (index: number, time: number) => {
    setCustomMarkers(prev => 
      prev.map((marker, i) => 
        i === index ? { ...marker, time } : marker
      )
    );
  };

  const handleConnect = () => {
    // TODO: Implement actual connection logic
    setIsConnected(!isConnected);
  };

  const selectedModel = selectedModelId ? activeModels.find(m => m.id === selectedModelId) : null;

  return (
    <AppLayout
      onConnectionChange={setIsConnected}
      children={{
        controls: (
          <div className="controls">
            <input
              type="text"
              className="input-field"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
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
            <button
              className={`button connect ${isConnected ? 'connected' : ''}`}
              onClick={handleConnect}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
            <button className="button">▼</button>
            <button className="button">⚙</button>
          </div>
        ),
        tracksPanel: (
          <TrackPanel
            tracks={tracks}
            selectedTrackId={selectedTrackId}
            onTrackSelect={setSelectedTrackId}
            onTrackAdd={handleTrackAdd}
            onTrackRemove={handleTrackRemove}
            onTrackUpdate={handleTrackUpdate}
            width={250}
            onResize={() => {}}
          />
        ),
        animationModelsPanel: (
          <AnimationPanel
            availableModels={['Linear Move', 'Circular Path', 'Random Walk']}
            activeModels={activeModels}
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
            onModelAdd={handleModelAdd}
            onModelRemove={handleModelRemove}
            onModelUpdate={handleModelUpdate}
            onModelPlay={(id) => handleModelUpdate(id, { isPlaying: true })}
            onModelStop={(id) => handleModelUpdate(id, { isPlaying: false })}
          />
        ),
        parametersPanel: (
          <Panel title="Parameters">
            <div className="parameters-content">
              {selectedModel && (
                <div className="parameter-controls">
                  {/* TODO: Add parameter controls based on model type */}
                  {selectedModel.type === 'linear' && (
                    <>
                      <div className="parameter-group">
                        <label>Start Position</label>
                        <div className="position-inputs">
                          <input type="number" value={selectedModel.parameters.startPosition?.x || 0} />
                          <input type="number" value={selectedModel.parameters.startPosition?.y || 0} />
                          <input type="number" value={selectedModel.parameters.startPosition?.z || 0} />
                        </div>
                      </div>
                      <div className="parameter-group">
                        <label>End Position</label>
                        <div className="position-inputs">
                          <input type="number" value={selectedModel.parameters.endPosition?.x || 0} />
                          <input type="number" value={selectedModel.parameters.endPosition?.y || 0} />
                          <input type="number" value={selectedModel.parameters.endPosition?.z || 0} />
                        </div>
                      </div>
                    </>
                  )}
                  {selectedModel.type === 'circular' && (
                    <>
                      <div className="parameter-group">
                        <label>Center Position</label>
                        <div className="position-inputs">
                          <input type="number" />
                          <input type="number" />
                          <input type="number" />
                        </div>
                      </div>
                      <div className="parameter-group">
                        <label>Radius</label>
                        <input type="number" />
                      </div>
                      <div className="parameter-group">
                        <label>Speed (deg/s)</label>
                        <input type="number" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Panel>
        ),
        previewPanel: (
          <Panel title="2D Preview">
            <div className="preview-canvas">
              {/* TODO: Add 2D preview canvas */}
              <div className="preview-grid" />
              {tracks.map(track => (
                <div
                  key={track.id}
                  className={`track-point ${selectedTrackId === track.id ? 'selected' : ''}`}
                  style={{
                    left: `${track.position.x * 100}%`,
                    top: `${track.position.y * 100}%`
                  }}
                />
              ))}
            </div>
          </Panel>
        ),
        timelinePanel: selectedModel && (
          <div className="timeline-panel">
            <div className="timeline-controls">
              <button className="button" onClick={() => handlePlayPause(!selectedModel.isPlaying)}>
                {selectedModel.isPlaying ? '⏸' : '▶'}
              </button>
              <button className="button" onClick={() => handleModelUpdate(selectedModel.id, { isPlaying: false, currentTime: 0 })}>
                ⏹
              </button>
              <button className="button" onClick={() => handleModelUpdate(selectedModel.id, { currentTime: 0 })}>
                ⏮
              </button>
              <span className="time-display">
                {(selectedModel.currentTime / 1000).toFixed(3)}
              </span>
            </div>
            <div className="timeline-track">
              <AnimationTimeline
                animation={selectedModel}
                customMarkers={customMarkers}
                onTimeChange={handleTimeChange}
                onPlayPause={handlePlayPause}
                onKeyframeChange={handleKeyframeChange}
                onMarkerChange={handleMarkerChange}
                snapToKeyframes={true}
              />
            </div>
          </div>
        ),
        statusBar: (
          <div className="status-bar-container">
            <div className="status-bar-header">
              <span className="status-bar-title">OSC Messages</span>
              <span className="status-bar-toggle">▼</span>
            </div>
            <div className="status-bar">
              {/* Example OSC messages */}
              <div className="osc-message incoming">
                <span className="direction">→</span>
                <span className="timestamp">14:32:45.234</span>
                <span className="address">/track/1/xy</span>
                <span className="value">x: 0.5, y: 0.3</span>
              </div>
              <div className="osc-message outgoing">
                <span className="direction">←</span>
                <span className="timestamp">14:32:45.235</span>
                <span className="address">/track/1/z</span>
                <span className="value">0.0</span>
              </div>
            </div>
          </div>
        ),
      }}
    />
  );
}

export default App;

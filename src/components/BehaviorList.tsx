import React, { useState } from 'react';
import type { Behavior, BehaviorCategory } from '../types/behaviors';
import { getAllBehaviors, getBehaviorsByCategory, createBehavior } from '../behaviors/registry';
import './BehaviorList.css';

interface BehaviorListProps {
  selectedTrack: {
    id: string;
    behaviors: Behavior[];
  } | null;
  onAddBehavior?: (behavior: Behavior) => void;
  onRemoveBehavior?: (behaviorId: string) => void;
  onSelectBehavior?: (behavior: Behavior | null) => void;
  selectedBehavior: Behavior | null;
}

export const BehaviorList: React.FC<BehaviorListProps> = ({
  selectedTrack,
  onAddBehavior,
  onRemoveBehavior,
  onSelectBehavior,
  selectedBehavior
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BehaviorCategory | null>(null);
  const [previewBehavior, setPreviewBehavior] = useState<Behavior | null>(null);

  const handleAddBehavior = (type: string) => {
    if (!selectedTrack || !onAddBehavior) return;
    
    const newBehavior = createBehavior(type, `${Date.now()}`);
    if (newBehavior) {
      onAddBehavior(newBehavior);
      setIsDropdownOpen(false);
      setSelectedCategory(null);
      setPreviewBehavior(null);
      // Automatically select the newly added behavior
      onSelectBehavior?.(newBehavior);
    }
  };

  const handlePreviewBehavior = (type: string) => {
    const behavior = createBehavior(type, 'preview');
    setPreviewBehavior(behavior);
    onSelectBehavior?.(behavior);
  };

  const handleRemoveBehavior = (behaviorId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onRemoveBehavior?.(behaviorId);
    if (selectedBehavior?.id === behaviorId) {
      onSelectBehavior?.(null);
    }
  };

  const categories: BehaviorCategory[] = ['1D', '2D', '3D'];

  return (
    <div className="behavior-list">
      {/* Add Behaviors Section */}
      <div className="add-behaviors">
        <div className="compact-header">
          <h3>Add Behaviors</h3>
          <button
            className={`add-behavior-button ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              if (!isDropdownOpen) {
                setPreviewBehavior(null);
                onSelectBehavior?.(selectedBehavior);
              }
            }}
            disabled={!selectedTrack}
            title={!selectedTrack ? 'Select a track first' : 'Add behavior'}
          >
            <span className="plus-icon">+</span>
          </button>
          
          {isDropdownOpen && (
            <div className="behavior-dropdown">
              {selectedCategory ? (
                <>
                  <div className="dropdown-header" onClick={() => {
                    setSelectedCategory(null);
                    setPreviewBehavior(null);
                    onSelectBehavior?.(selectedBehavior);
                  }}>
                    <span className="back-arrow">←</span>
                    {selectedCategory} Behaviors
                  </div>
                  <div className="dropdown-items">
                    {getBehaviorsByCategory(selectedCategory).map(behavior => (
                      <div
                        key={behavior.type}
                        className={`dropdown-item ${previewBehavior?.type === behavior.type ? 'selected' : ''}`}
                      >
                        <div 
                          className="behavior-item-content"
                          onClick={() => handlePreviewBehavior(behavior.type)}
                        >
                          {behavior.name}
                        </div>
                        <button
                          className="add-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddBehavior(behavior.type);
                          }}
                          title={`Add ${behavior.name}`}
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="dropdown-items">
                  {categories.map(category => (
                    <div
                      key={category}
                      className="dropdown-item with-arrow"
                      onClick={() => {
                        setSelectedCategory(category);
                        setPreviewBehavior(null);
                        onSelectBehavior?.(selectedBehavior);
                      }}
                    >
                      {category}
                      <span className="forward-arrow">→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applied Behaviors Section */}
      <div className="applied-behaviors">
        <div className="section-header">
          <h3>Applied Behaviors</h3>
          <div className="behavior-controls">
            <button
              className="play-all-button"
              disabled={!selectedTrack || selectedTrack.behaviors.length === 0}
              title={!selectedTrack ? 'Select a track first' : 'Play all behaviors'}
              onClick={() => {/* TODO: Implement play all */}}
            >
              ▶
            </button>
            <button
              className="pause-all-button"
              disabled={!selectedTrack || selectedTrack.behaviors.length === 0}
              title={!selectedTrack ? 'Select a track first' : 'Pause all behaviors'}
              onClick={() => {/* TODO: Implement pause all */}}
            >
              ⏸
            </button>
            <button
              className="stop-all-button"
              disabled={!selectedTrack || selectedTrack.behaviors.length === 0}
              title={!selectedTrack ? 'Select a track first' : 'Stop all behaviors'}
              onClick={() => {/* TODO: Implement stop all */}}
            >
              ⏹
            </button>
          </div>
        </div>

        <div className="behaviors-list">
          {selectedTrack ? (
            selectedTrack.behaviors.length > 0 ? (
              <div className="behavior-items">
                {selectedTrack.behaviors.map(behavior => (
                  <div
                    key={behavior.id}
                    className={`applied-behavior ${selectedBehavior?.id === behavior.id ? 'selected' : ''}`}
                    onClick={() => onSelectBehavior?.(behavior)}
                  >
                    <div className="behavior-info">
                      <span className="behavior-name">{behavior.name}</span>
                      <div className="behavior-actions">
                        <button
                          className="play-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            /* TODO: Implement play */
                          }}
                          title="Play behavior"
                        >
                          ▶
                        </button>
                        <button
                          className="pause-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            /* TODO: Implement pause */
                          }}
                          title="Pause behavior"
                        >
                          ⏸
                        </button>
                        <button
                          className="stop-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            /* TODO: Implement stop */
                          }}
                          title="Stop behavior"
                        >
                          ⏹
                        </button>
                        <button
                          className="remove-button"
                          onClick={(e) => handleRemoveBehavior(behavior.id, e)}
                          title="Remove behavior"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-behaviors">
                No behaviors added yet
              </div>
            )
          ) : (
            <div className="no-track-selected">
              Select a track to view behaviors
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

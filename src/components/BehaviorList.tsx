import React, { useState } from 'react';
import type { Behavior, BehaviorCategory } from '../types/behaviors';
import type { BehaviorType } from '../behaviors/factory';
import { getAllBehaviors, getBehaviorsByCategory, createBehavior } from '../behaviors/registry';
import './BehaviorList.css';

interface BehaviorListProps {
  selectedTrack: { id: string; behaviors: Behavior[] } | null;
  onAddBehavior?: (behavior: Behavior) => void;
  onRemoveBehavior?: (behaviorId: string) => void;
  onSelectBehavior?: (behavior: Behavior | null) => void;
  selectedBehavior: Behavior | null;
}

export function BehaviorList({
  selectedTrack,
  onAddBehavior,
  onRemoveBehavior,
  onSelectBehavior,
  selectedBehavior,
}: BehaviorListProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BehaviorCategory>('1D');
  const [previewBehavior, setPreviewBehavior] = useState<Behavior | null>(null);

  const behaviors = getAllBehaviors();
  const behaviorsByCategory = getBehaviorsByCategory(selectedCategory);

  const handleCategoryChange = (category: BehaviorCategory) => {
    setSelectedCategory(category);
    setPreviewBehavior(null);
    onSelectBehavior?.(null);
  };

  const handleAddBehavior = (type: BehaviorType) => {
    if (!selectedTrack || !onAddBehavior) return;

    const newBehavior = createBehavior(type, `${Date.now()}`);
    if (newBehavior) {
      onAddBehavior(newBehavior);
      setIsDropdownOpen(false);
      setPreviewBehavior(null);
      onSelectBehavior?.(null);
    }
  };

  const handlePreviewBehavior = (type: BehaviorType) => {
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
              <div className="category-tabs">
                <button
                  className={selectedCategory === '1D' ? 'active' : ''}
                  onClick={() => handleCategoryChange('1D')}
                >
                  1D
                </button>
                <button
                  className={selectedCategory === '2D' ? 'active' : ''}
                  onClick={() => handleCategoryChange('2D')}
                >
                  2D
                </button>
                <button
                  className={selectedCategory === '3D' ? 'active' : ''}
                  onClick={() => handleCategoryChange('3D')}
                >
                  3D
                </button>
              </div>

              <div className="behavior-grid">
                {behaviorsByCategory.map(behavior => (
                  <div
                    key={behavior.type}
                    className={`behavior-card ${previewBehavior?.type === behavior.type ? 'selected' : ''}`}
                    onMouseEnter={() => handlePreviewBehavior(behavior.type)}
                    onMouseLeave={() => {
                      setPreviewBehavior(null);
                      onSelectBehavior?.(null);
                    }}
                    onClick={() => handleAddBehavior(behavior.type)}
                  >
                    <div className="behavior-info">
                      <span className="behavior-name">{behavior.name}</span>
                      <div className="behavior-actions">
                        <button
                          className="play-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddBehavior(behavior.type);
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
}

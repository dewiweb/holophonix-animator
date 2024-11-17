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

  const handleAddBehavior = (type: string) => {
    if (!selectedTrack) return;
    
    const newBehavior = createBehavior(type, `${Date.now()}`);
    if (newBehavior && onAddBehavior) {
      onAddBehavior(newBehavior);
      setIsDropdownOpen(false);
      setSelectedCategory(null);
    }
  };

  const categories: BehaviorCategory[] = ['1D', '2D', '3D'];

  return (
    <div className="behavior-list">
      <div className="behavior-controls">
        <div className="dropdown-container">
          <button
            className={`add-behavior-button ${isDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={!selectedTrack}
            title={!selectedTrack ? 'Select a track first' : 'Add behavior'}
          >
            Add Behavior
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {isDropdownOpen && (
            <div className="behavior-dropdown">
              {selectedCategory ? (
                <>
                  <div className="dropdown-header" onClick={() => setSelectedCategory(null)}>
                    <span className="back-arrow">←</span>
                    {selectedCategory} Behaviors
                  </div>
                  <div className="dropdown-items">
                    {getBehaviorsByCategory(selectedCategory).map(behavior => (
                      <div
                        key={behavior.name}
                        className="dropdown-item"
                        onClick={() => handleAddBehavior(behavior.name)}
                      >
                        {behavior.name}
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
                      onClick={() => setSelectedCategory(category)}
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

      <div className="applied-behaviors">
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
                    <button
                      className="remove-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBehavior?.(behavior.id);
                      }}
                      title="Remove behavior"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-behaviors">
              No behaviors applied. Click "Add Behavior" to start.
            </div>
          )
        ) : (
          <div className="no-track">
            Select a track to manage behaviors
          </div>
        )}
      </div>
    </div>
  );
};

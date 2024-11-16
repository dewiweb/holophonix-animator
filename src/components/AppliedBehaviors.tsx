import React from 'react';
import type { Track, Behavior } from '../types/behaviors';

interface AppliedBehaviorsProps {
  track: Track;
}

export const AppliedBehaviors: React.FC<AppliedBehaviorsProps> = ({ track }) => {
  const handleToggleBehavior = (behaviorId: string) => {
    // TODO: Toggle behavior active state
    console.log('Toggling behavior:', behaviorId);
  };

  const handleDeleteBehavior = (behaviorId: string) => {
    // TODO: Delete behavior from track
    console.log('Deleting behavior:', behaviorId);
  };

  const handleEditBehavior = (behavior: Behavior) => {
    // TODO: Open behavior editor
    console.log('Editing behavior:', behavior);
  };

  return (
    <div className="applied-behaviors">
      <h4>Applied Behaviors</h4>
      
      {track.behaviors.length === 0 ? (
        <div className="no-behaviors">
          No behaviors applied
        </div>
      ) : (
        <div className="behavior-items">
          {track.behaviors.map(behavior => (
            <div key={behavior.id} className="behavior-item">
              <div className="behavior-header">
                <button
                  className={`active-toggle ${behavior.active ? 'active' : ''}`}
                  onClick={() => handleToggleBehavior(behavior.id)}
                >
                  {behavior.active ? '●' : '○'}
                </button>
                <span className="behavior-name">{behavior.name}</span>
                <div className="behavior-actions">
                  <button
                    className="edit-behavior"
                    onClick={() => handleEditBehavior(behavior)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-behavior"
                    onClick={() => handleDeleteBehavior(behavior.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="behavior-parameters">
                {Object.entries(behavior.parameters).map(([key, value]) => (
                  <div key={key} className="parameter">
                    <span className="parameter-name">{key}:</span>
                    <span className="parameter-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

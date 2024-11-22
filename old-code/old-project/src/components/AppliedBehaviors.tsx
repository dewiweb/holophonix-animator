import React from 'react';
import type { Track, Behavior } from '../types/behaviors';

interface AppliedBehaviorsProps {
  track: Track;
  onRemoveBehavior: (behaviorId: string) => void;
}

export function AppliedBehaviors({ track, onRemoveBehavior }: AppliedBehaviorsProps) {
  if (!track) {
    return null;
  }

  return (
    <div className="applied-behaviors">
      <h3>Applied Behaviors</h3>
      {track.behaviors.length === 0 ? (
        <div className="no-behaviors">
          <p>No behaviors applied</p>
          <p>Add a behavior from the list below</p>
        </div>
      ) : (
        <div className="behavior-items">
          {track.behaviors.map((behavior: Behavior) => (
            <div key={behavior.id} className="behavior-item">
              <div className="behavior-header">
                <button
                  className="remove-behavior"
                  onClick={() => onRemoveBehavior(behavior.id)}
                  title="Remove behavior"
                >
                  ×
                </button>
                <h4>{behavior.type}</h4>
              </div>
              <div className="behavior-parameters">
                {Object.entries(behavior.parameters).map(([key, value]) => (
                  <div key={key} className="parameter">
                    <span className="parameter-name">{key}:</span>
                    <span className="parameter-value">{value.toString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

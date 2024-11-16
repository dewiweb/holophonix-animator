import React from 'react';
import type { Track } from '../types/behaviors';
import { getBehaviorsByCategory, createBehavior } from '../behaviors/registry';

interface BehaviorListProps {
  track: Track;
}

const CATEGORIES = ['1D', '2D', '3D'] as const;

export const BehaviorList: React.FC<BehaviorListProps> = ({ track }) => {
  const handleAddBehavior = (type: string) => {
    const newBehavior = createBehavior(type, `behavior-${Date.now()}`);
    if (newBehavior) {
      // TODO: Add behavior to track
      console.log('Adding behavior:', newBehavior, 'to track:', track.id);
    }
  };

  return (
    <div className="behavior-list">
      {CATEGORIES.map(category => {
        const behaviors = getBehaviorsByCategory(category);
        return (
          <div key={category} className="behavior-category">
            <h4>{category} Behaviors</h4>
            <div className="behavior-items">
              {behaviors.map(behavior => (
                <button
                  key={behavior.name}
                  className="behavior-item"
                  onClick={() => handleAddBehavior(behavior.name)}
                >
                  {behavior.name}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

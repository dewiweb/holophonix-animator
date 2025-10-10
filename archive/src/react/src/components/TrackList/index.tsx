import React, { useCallback, useRef } from 'react';
import { Track, Group, LinearAnimation, CircularAnimation, Position, Animation } from '../../types';
import { AnimationPreview } from './AnimationPreview';
import './TrackList.css';

interface TrackListProps {
  tracks: Track[];
  groups: Group[];
  onTrackSelect?: (trackId: string) => void;
  onTrackMute?: (trackId: string) => void;
  onTrackSolo?: (trackId: string) => void;
  onGroupExpand?: (groupId: string) => void;
  onTrackReorder?: (sourceId: string, targetId: string) => void;
}

const getEffectiveAnimationState = (track: Track, group?: Group) => {
  // Track animation takes precedence over group animation
  if (track.animationState?.animation && track.animationState.isPlaying) {
    return track.animationState;
  }
  
  // If no track animation or track animation not playing, use group animation
  if (group?.animationState?.animation && group.animationState.isPlaying) {
    return group.animationState;
  }
  
  return track.animationState;
};

const interpolatePosition = (track: Track, group?: Group): Position => {
  const animationState = getEffectiveAnimationState(track, group);
  if (!animationState?.animation) {
    return track.position || { x: 0, y: 0, z: 0 };
  }

  const { animation, currentTime } = animationState;
  const progress = currentTime / animation.duration;

  if (animation.type === 'linear') {
    const { startPosition, endPosition } = animation.parameters;
    return {
      x: startPosition.x + Math.round((endPosition.x - startPosition.x) * progress),
      y: startPosition.y + Math.round((endPosition.y - startPosition.y) * progress),
      z: startPosition.z + Math.round((endPosition.z - startPosition.z) * progress)
    };
  }

  if (animation.type === 'circular') {
    const { center, radius, plane } = animation.parameters;
    const angleInRadians = progress * Math.PI * 2;

    switch (plane) {
      case 'xy':
        return {
          x: center.x + Math.round(radius * Math.cos(angleInRadians)),
          y: center.y + Math.round(radius * Math.sin(angleInRadians)),
          z: center.z
        };
      case 'xz':
        return {
          x: center.x + Math.round(radius * Math.cos(angleInRadians)),
          y: center.y,
          z: center.z + Math.round(radius * Math.sin(angleInRadians))
        };
      case 'yz':
        return {
          x: center.x,
          y: center.y + Math.round(radius * Math.cos(angleInRadians)),
          z: center.z + Math.round(radius * Math.sin(angleInRadians))
        };
      default:
        return center;
    }
  }

  return track.position || { x: 0, y: 0, z: 0 };
};

const renderTrack = (track: Track, index: number, group?: Group) => {
  const effectiveAnimationState = getEffectiveAnimationState(track, group);
  const position = interpolatePosition(track, group);
  
  const isPlaying = effectiveAnimationState?.isPlaying || track.animationState?.isPlaying;
  
  return (
    <div
      key={track.id}
      className={`track-item${isPlaying ? ' playing' : ''}`}
      data-testid={`track-item-${track.id}`}
      onClick={() => onTrackSelect?.(track.id)}
      draggable
      onDragStart={() => handleDragStart(track.id)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(track.id)}
      tabIndex={0}
      onKeyDown={(e) => handleKeyDown(e, index)}
      role="listitem"
      aria-selected={track.isSelected}
    >
      <div className="track-info">
        <span 
          className={`track-type-icon ${track.type || ''}`}
          data-testid={`track-type-${track.id}`}
          title={`${track.type || 'Source'} Track`}
        />
        <span 
          className="track-name"
          data-testid={`track-name-${track.id}`}
        >
          {track.name}
        </span>
        {effectiveAnimationState?.animation && (
          <div className="animation-preview-container">
            <AnimationPreview
              animation={effectiveAnimationState.animation}
              trackId={track.id}
            />
          </div>
        )}
        <span
          className="track-position"
          data-testid={`track-position-${track.id}`}
        >
          {`${position.x}, ${position.y}, ${position.z}`}
        </span>
      </div>
    </div>
  );
};

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  groups,
  onTrackSelect,
  onTrackMute,
  onTrackSolo,
  onGroupExpand,
  onTrackReorder
}) => {
  const dragItem = useRef<string | null>(null);

  const handleDragStart = (trackId: string) => {
    dragItem.current = trackId;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (dragItem.current && onTrackReorder) {
      onTrackReorder(dragItem.current, targetId);
    }
    dragItem.current = null;
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const trackElements = document.querySelectorAll('[data-testid^="track-item-"]');
    
    if (e.key === 'ArrowDown' && currentIndex < trackElements.length - 1) {
      (trackElements[currentIndex + 1] as HTMLElement).focus();
    } else if (e.key === 'ArrowUp' && currentIndex > 0) {
      (trackElements[currentIndex - 1] as HTMLElement).focus();
    }
  }, []);

  const renderGroup = (group: Group) => {
    const groupTracks = tracks.filter(track => track.groupId === group.id);
    
    return (
      <div key={group.id} className="track-group">
        <div
          className={`group-header ${group.isExpanded ? 'expanded' : ''} ${
            group.animationState?.isPlaying ? 'playing' : ''
          } ${group.animationState?.animation ? 'has-animation' : ''}`}
          onClick={() => onGroupExpand?.(group.id)}
          data-testid={`group-header-${group.id}`}
        >
          <span className="group-name" data-testid={`group-name-${group.id}`}>
            {group.name}
          </span>
          {group.animationState?.animation && (
            <div className="animation-preview-container">
              <AnimationPreview
                animation={group.animationState.animation}
                trackId={`group-${group.id}`}
              />
            </div>
          )}
        </div>
        {group.isExpanded && (
          <div className="group-tracks">
            {groupTracks.map((track, index) => renderTrack(track, index, group))}
          </div>
        )}
      </div>
    );
  };

  const renderTrack = (track: Track, index: number, group?: Group) => {
    const effectiveAnimationState = getEffectiveAnimationState(track, group);
    
    return (
      <div
        key={track.id}
        className={`track-item${track.isSelected ? ' selected' : ''}${effectiveAnimationState?.isPlaying ? ' playing' : ''}`}
        data-testid={`track-item-${track.id}`}
        onClick={() => onTrackSelect?.(track.id)}
        draggable
        onDragStart={() => handleDragStart(track.id)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(track.id)}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, index)}
        role="listitem"
        aria-selected={track.isSelected}
      >
        <div className="track-info">
          <span 
            className={`track-type-icon ${track.type || ''}`}
            data-testid={`track-type-${track.id}`}
            title={`${track.type || 'Source'} Track`}
          />
          <span 
            className="track-name"
            data-testid={`track-name-${track.id}`}
          >
            {track.name}
          </span>
          {effectiveAnimationState?.animation && (
            <div className="animation-preview-container">
              <AnimationPreview
                animation={effectiveAnimationState.animation}
                trackId={track.id}
              />
            </div>
          )}
          <span
            className="track-position"
            data-testid={`track-position-${track.id}`}
          >
            {Object.values(interpolatePosition(track, group)).map(v => Math.round(v)).join(', ')}
          </span>
        </div>
        <div className="track-controls">
          <button
            className={`track-control mute muted`}
            onClick={(e) => {
              e.stopPropagation();
              onTrackMute?.(track.id);
            }}
            data-testid={`mute-button-${track.id}`}
            aria-label={`${track.isMuted ? 'Unmute' : 'Mute'} track ${track.name}`}
          >
            M
          </button>
          <button
            className={`track-control solo ${track.isSolo ? 'soloed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onTrackSolo?.(track.id);
            }}
            data-testid={`solo-button-${track.id}`}
            aria-label={`${track.isSolo ? 'Unsolo' : 'Solo'} track ${track.name}`}
          >
            S
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="track-list" data-testid="track-list">
      {groups.map(group => renderGroup(group))}
      {tracks
        .filter(track => !track.groupId)
        .map((track, index) => renderTrack(track, index))}
    </div>
  );
};

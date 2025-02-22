import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import classNames from 'classnames';
import './Panel.css';

export interface PanelProps {
  title: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  resizable?: boolean;
  width?: number;
  minWidth?: number;
  defaultWidth?: number;
  controls?: ReactNode;
  onResize?: (width: number) => void;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className,
  collapsible = false,
  resizable = false,
  width = 300,
  minWidth = 200,
  defaultWidth = 300,
  controls,
  onResize,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(width);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onResize) return;
      const delta = e.clientX - startX;
      const newWidth = Math.max(minWidth, startWidth + delta);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, onResize, startWidth, startX]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(width);
  }, [width]);

  const handleResizeReset = useCallback(() => {
    onResize?.(defaultWidth);
  }, [defaultWidth, onResize]);

  return (
    <div 
      className={classNames('panel', className, {
        'panel--collapsed': isCollapsed,
        'panel--resizable': resizable,
      })}
      style={{ width }}
      data-testid="panel"
    >
      <div className="panel__header">
        <div className="panel__title">
          {collapsible && (
            <button
              className="panel__collapse-button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="toggle panel"
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
          <span>{title}</span>
        </div>
        {controls && <div className="panel__controls">{controls}</div>}
      </div>
      <div 
        className="panel__content" 
        aria-hidden={isCollapsed}
        style={{ display: isCollapsed ? 'none' : 'block' }}
      >
        {children}
      </div>
      {resizable && (
        <div
          className="panel__resize-handle"
          onMouseDown={handleResizeStart}
          onDoubleClick={handleResizeReset}
          data-testid="resize-handle"
        />
      )}
    </div>
  );
};

import React from 'react';
import { useParameterHistory } from '../hooks/useParameterHistory';
import { cn } from '../utils/styles';

interface ParameterHistoryProps {
  history: ReturnType<typeof useParameterHistory>;
  className?: string;
}

export function ParameterHistory({
  history,
  className
}: ParameterHistoryProps) {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    getUndoDescription,
    getRedoDescription
  } = history;

  const undoDescription = getUndoDescription();
  const redoDescription = getRedoDescription();

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'inline-flex items-center px-2 py-1 text-sm font-medium rounded',
            canUndo
              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              : 'text-gray-400 bg-gray-50 cursor-not-allowed'
          )}
          title={undoDescription ? `Undo: ${undoDescription}` : 'Undo'}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
          Undo
          {undoDescription && (
            <span className="ml-1 text-xs text-gray-500">
              ({undoDescription})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'inline-flex items-center px-2 py-1 text-sm font-medium rounded',
            canRedo
              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              : 'text-gray-400 bg-gray-50 cursor-not-allowed'
          )}
          title={redoDescription ? `Redo: ${redoDescription}` : 'Redo'}
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
          Redo
          {redoDescription && (
            <span className="ml-1 text-xs text-gray-500">
              ({redoDescription})
            </span>
          )}
        </button>
      </div>
      <div className="text-xs text-gray-500">
        {canUndo && (
          <kbd className="px-1 py-0.5 text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded">
            {navigator.platform.includes('Mac') ? '⌘Z' : 'Ctrl+Z'}
          </kbd>
        )}
        {canRedo && (
          <>
            <span className="mx-1">|</span>
            <kbd className="px-1 py-0.5 text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded">
              {navigator.platform.includes('Mac') ? '⌘⇧Z' : 'Ctrl+Shift+Z'}
            </kbd>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { ParameterValue } from '../types/parameters';

interface ParameterHistoryEntry {
  groupId: string;
  values: Record<string, ParameterValue>;
  timestamp: number;
  description?: string;
}

interface ParameterHistoryBatch {
  entries: ParameterHistoryEntry[];
  timestamp: number;
  description?: string;
}

interface UseParameterHistoryResult {
  addToHistory: (groupId: string, values: Record<string, ParameterValue>, description?: string) => void;
  startBatch: (description?: string) => void;
  endBatch: () => void;
  undo: () => ParameterHistoryEntry[] | null;
  redo: () => ParameterHistoryEntry[] | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  getCurrentState: () => Record<string, Record<string, ParameterValue>>;
  getUndoDescription: () => string | undefined;
  getRedoDescription: () => string | undefined;
}

const MAX_HISTORY_SIZE = 50;
const BATCH_TIMEOUT = 1000; // 1 second timeout for batching

export function useParameterHistory(
  initialState: Record<string, Record<string, ParameterValue>> = {}
): UseParameterHistoryResult {
  // History stacks
  const [undoStack, setUndoStack] = useState<ParameterHistoryBatch[]>([]);
  const [redoStack, setRedoStack] = useState<ParameterHistoryBatch[]>([]);

  // Current state reference
  const currentState = useRef<Record<string, Record<string, ParameterValue>>>(initialState);

  // Batching state
  const batchRef = useRef<{
    active: boolean;
    entries: ParameterHistoryEntry[];
    description?: string;
    timeout: NodeJS.Timeout | null;
  }>({
    active: false,
    entries: [],
    timeout: null
  });

  // Cleanup batch timeout on unmount
  useEffect(() => {
    return () => {
      if (batchRef.current.timeout) {
        clearTimeout(batchRef.current.timeout);
      }
    };
  }, []);

  // Start a new batch
  const startBatch = useCallback((description?: string) => {
    if (batchRef.current.timeout) {
      clearTimeout(batchRef.current.timeout);
    }
    batchRef.current = {
      active: true,
      entries: [],
      description,
      timeout: null
    };
  }, []);

  // End current batch
  const endBatch = useCallback(() => {
    if (!batchRef.current.active || batchRef.current.entries.length === 0) return;

    const batch: ParameterHistoryBatch = {
      entries: [...batchRef.current.entries],
      timestamp: Date.now(),
      description: batchRef.current.description
    };

    setUndoStack(prev => {
      const newStack = [...prev, batch];
      if (newStack.length > MAX_HISTORY_SIZE) {
        newStack.shift();
      }
      return newStack;
    });
    setRedoStack([]);

    batchRef.current = {
      active: false,
      entries: [],
      timeout: null
    };
  }, []);

  // Add new state to history
  const addToHistory = useCallback((
    groupId: string,
    values: Record<string, ParameterValue>,
    description?: string
  ) => {
    const entry: ParameterHistoryEntry = {
      groupId,
      values,
      timestamp: Date.now(),
      description
    };

    if (batchRef.current.active) {
      batchRef.current.entries.push(entry);
      
      // Reset batch timeout
      if (batchRef.current.timeout) {
        clearTimeout(batchRef.current.timeout);
      }
      batchRef.current.timeout = setTimeout(endBatch, BATCH_TIMEOUT);
    } else {
      const batch: ParameterHistoryBatch = {
        entries: [entry],
        timestamp: Date.now(),
        description
      };

      setUndoStack(prev => {
        const newStack = [...prev, batch];
        if (newStack.length > MAX_HISTORY_SIZE) {
          newStack.shift();
        }
        return newStack;
      });
      setRedoStack([]);
    }

    // Update current state
    currentState.current = {
      ...currentState.current,
      [groupId]: values
    };
  }, [endBatch]);

  // Undo last change
  const undo = useCallback((): ParameterHistoryEntry[] | null => {
    if (undoStack.length === 0) return null;

    const lastBatch = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    
    setUndoStack(newUndoStack);
    setRedoStack(prev => [...prev, lastBatch]);

    // Update current state
    if (newUndoStack.length > 0) {
      const previousBatch = newUndoStack[newUndoStack.length - 1];
      previousBatch.entries.forEach(entry => {
        currentState.current = {
          ...currentState.current,
          [entry.groupId]: entry.values
        };
      });
      return previousBatch.entries;
    }

    // If no more undo entries, return to initial state
    lastBatch.entries.forEach(entry => {
      currentState.current = {
        ...currentState.current,
        [entry.groupId]: {}
      };
    });
    return null;
  }, [undoStack]);

  // Redo last undone change
  const redo = useCallback((): ParameterHistoryEntry[] | null => {
    if (redoStack.length === 0) return null;

    const nextBatch = redoStack[redoStack.length - 1];
    
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextBatch]);

    // Update current state
    nextBatch.entries.forEach(entry => {
      currentState.current = {
        ...currentState.current,
        [entry.groupId]: entry.values
      };
    });

    return nextBatch.entries;
  }, [redoStack]);

  // Clear history
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    batchRef.current = {
      active: false,
      entries: [],
      timeout: null
    };
  }, []);

  // Get descriptions for undo/redo operations
  const getUndoDescription = useCallback(() => {
    if (undoStack.length === 0) return undefined;
    return undoStack[undoStack.length - 1].description;
  }, [undoStack]);

  const getRedoDescription = useCallback(() => {
    if (redoStack.length === 0) return undefined;
    return redoStack[redoStack.length - 1].description;
  }, [redoStack]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if target is an input element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    addToHistory,
    startBatch,
    endBatch,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clearHistory,
    getCurrentState: useCallback(() => ({ ...currentState.current }), []),
    getUndoDescription,
    getRedoDescription
  };
}

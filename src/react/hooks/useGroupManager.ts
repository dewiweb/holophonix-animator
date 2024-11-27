import { useContext } from 'react';
import { GroupManager } from '../../bindings';
import { AppContext } from '../context/AppContext';

export const useGroupManager = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useGroupManager must be used within an AppContext Provider');
  }

  return context.groupManager as GroupManager;
};

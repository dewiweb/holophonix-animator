import React, { createContext } from 'react';
import { GroupManager } from '../../bindings';

interface AppContextType {
  groupManager: GroupManager;
}

export const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: React.ReactNode;
  groupManager: GroupManager;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, groupManager }) => {
  return (
    <AppContext.Provider value={{ groupManager }}>
      {children}
    </AppContext.Provider>
  );
};

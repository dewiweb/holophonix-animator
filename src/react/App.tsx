import React from 'react';
import { Provider } from 'react-redux';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { Home } from './pages/Home';
import { Settings } from './pages/Settings';
import { store } from './store';
import { AppProvider } from './context/AppContext';
import { GroupManager } from '../bindings';
import { GroupTreeView } from './components/groups/GroupTreeView';
import '@blueprintjs/core/lib/css/blueprint.css';
import './styles/global.css';
import './App.css';

export const App: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const groupManager = new GroupManager();

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route
              index
              element={
                <AppProvider groupManager={groupManager}>
                  <div className="app-container">
                    <div className="sidebar">
                      <GroupTreeView
                        selectedGroupId={selectedGroupId}
                        onGroupSelect={setSelectedGroupId}
                      />
                    </div>
                    <div className="main-content">
                      <Home />
                    </div>
                  </div>
                </AppProvider>
              }
            />
            <Route
              path="settings"
              element={
                <AppProvider groupManager={groupManager}>
                  <Settings />
                </AppProvider>
              }
            />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
};

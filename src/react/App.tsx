import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import MainLayout from './components/layouts/MainLayout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import { GroupManager } from '../bindings';
import { AppProvider } from './context/AppContext';
import { GroupTreeView } from './components/groups/GroupTreeView';
import '@blueprintjs/core/lib/css/blueprint.css';
import './styles/global.css';
import './App.css';

const App: React.FC = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const groupManager = new GroupManager();

  return (
    <Provider store={store}>
      <Router>
        <MainLayout>
          <AppProvider groupManager={groupManager}>
            <div className="app-container">
              <div className="sidebar">
                <GroupTreeView 
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={setSelectedGroupId}
                />
              </div>
              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </div>
            </div>
          </AppProvider>
        </MainLayout>
      </Router>
    </Provider>
  );
};

export default App;

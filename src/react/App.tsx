import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import MainLayout from './components/layouts/MainLayout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </Router>
    </Provider>
  );
};

export default App;

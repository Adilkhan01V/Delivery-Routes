import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import DeliveriesPage from './pages/Deliveries';
import RoutesPage from './pages/Routes';
import SettingsPage from './pages/Settings';
import './styles.css';

const pageTitles = {
  '/': 'Dashboard',
  '/deliveries': 'Deliveries',
  '/routes': 'Route Optimization',
  '/settings': 'Settings'
};

function AppContent() {
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);
  const [dataVersion, setDataVersion] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const notifyDataRefresh = () => {
    setDataVersion(prev => prev + 1);
  };

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-layout">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <Header title={title} theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          <Route path="/" element={<Dashboard theme={theme} addToast={addToast} dataVersion={dataVersion} />} />
          <Route path="/deliveries" element={<DeliveriesPage addToast={addToast} dataVersion={dataVersion} />} />
          <Route path="/routes" element={<RoutesPage addToast={addToast} dataVersion={dataVersion} />} />
          <Route path="/settings" element={<SettingsPage addToast={addToast} onLocationUpdated={notifyDataRefresh} />} />
        </Routes>
      </main>
      <Toast toasts={toasts} removeToast={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

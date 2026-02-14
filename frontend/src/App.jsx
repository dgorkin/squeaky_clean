import React from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import AddTask from './pages/AddTask';
import AIHelper from './pages/AIHelper';
import Settings from './pages/Settings';
import Toast from './components/Toast';
import MilestoneModal from './components/MilestoneModal';
import KonamiDetector from './components/KonamiDetector';

function AppContent() {
  const { activeTab, initialized, konamiActive } = useApp();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">🏠✨</div>
          <div className="text-lg font-medium text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'calendar': return <Calendar />;
      case 'add': return <AddTask />;
      case 'ai': return <AIHelper />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen pb-20 safe-top ${konamiActive ? 'comic-sans-mode' : ''}`}>
      <KonamiDetector />
      {renderPage()}
      <BottomNav />
      <Toast />
      <MilestoneModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

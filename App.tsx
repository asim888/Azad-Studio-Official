import React, { useEffect, useState } from 'react';
import { TelegramService } from './services/telegram';
import { ApiService } from './services/api';
import { Tab } from './types';
import BottomNav from './components/BottomNav';
import MessageList from './components/MessageList';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.MESSAGES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    TelegramService.ready();
    TelegramService.expand();
    
    // Set Header Color to black for consistency
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.setHeaderColor('#000000');
        window.Telegram.WebApp.setBackgroundColor('#000000');
    }

    // Authenticate with backend
    const initAuth = async () => {
      const auth = await ApiService.authenticateUser();
      setIsAuthenticated(auth);
      // Add a slight artificial delay for a smoother loading transition effect
      setTimeout(() => setIsReady(true), 500);
    };

    initAuth();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.MESSAGES:
        return <MessageList />;
      case Tab.ANALYTICS:
        return <Dashboard />;
      case Tab.PROFILE:
        return <Profile />;
      default:
        return <MessageList />;
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-amber-500/80 animate-pulse text-sm font-medium tracking-widest">INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-200">
      <main className="w-full min-h-screen relative bg-black shadow-2xl shadow-amber-900/10 border-neutral-900">
        {isAuthenticated ? (
            renderContent()
        ) : (
            <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">Authentication Failed</h2>
                <p className="text-gray-400">Could not verify Telegram credentials with the server.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Retry
                </button>
            </div>
        )}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
};

export default App;
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// ========== MAIN APP INTEGRATION ==========
// CONFIGURATION - UPDATE THESE VALUES!
const MAIN_APP_CONFIG = {
  API_URL: 'https://api.your-main-app.com', // ← YOUR MAIN APP API
  API_KEY: 'your-api-key-here',            // ← FROM YOUR MAIN APP
  SYNC_ENDPOINTS: {
    AUTH: '/auth/telegram',    // ← Your main app auth endpoint
    SYNC: '/sync/data',        // ← Your main app sync endpoint
    PROFILE: '/users/profile'  // ← Your main app profile endpoint
  }
};

// Telegram Mini App SDK
declare global {
  interface Window {
    Telegram: {
      WebApp: any;
    };
  }
}

// Function to connect to your main app
async function connectToMainApp() {
  try {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.error('Telegram WebApp not found');
      return;
    }
    
    // Get Telegram user data
    const user = tg.initDataUnsafe?.user;
    if (!user) {
      console.error('No Telegram user data');
      return;
    }
    
    console.log('Telegram User:', user);
    
    // Prepare data for your main app
    const userData = {
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode: user.language_code,
      isPremium: user.is_premium || false,
      miniAppUrl: window.location.href
    };
    
    // Connect to YOUR main app API
    const response = await fetch(`${MAIN_APP_CONFIG.API_URL}${MAIN_APP_CONFIG.SYNC_ENDPOINTS.AUTH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAIN_APP_CONFIG.API_KEY}`,
        'Telegram-Init-Data': tg.initData || ''
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    console.log('Connected to main app:', result);
    
    // Save connection status
    localStorage.setItem('mainAppConnected', 'true');
    localStorage.setItem('mainAppToken', result.token || '');
    
    return result;
    
  } catch (error) {
    console.error('Failed to connect to main app:', error);
    return null;
  }
}

// Function to sync data with main app
async function syncDataWithMainApp(data: any) {
  try {
    const token = localStorage.getItem('mainAppToken');
    
    const response = await fetch(`${MAIN_APP_CONFIG.API_URL}${MAIN_APP_CONFIG.SYNC_ENDPOINTS.SYNC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Sync failed:', error);
    return null;
  }
}

// Initialize connection when app starts
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      connectToMainApp();
    }, 1000); // Wait 1 second for Telegram SDK
  });
}
// ========== END MAIN APP INTEGRATION ==========

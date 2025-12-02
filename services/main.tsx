import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  MessageSquare, BarChart3, Users, Zap, Globe, 
  Database, Rocket, Activity, ArrowUpDown, RefreshCw,
  Sparkles, Shield, Cloud, Bot, Smartphone, Target
} from 'lucide-react';

// ========== SUPABASE CONFIGURATION ==========
// ⚠️ REPLACE THESE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_CONFIG = {
  URL: 'https://YOUR-PROJECT-ID.supabase.co',      // Your Supabase URL
  ANON_KEY: 'YOUR-ANON-KEY-HERE'                   // Your anon key
};
// ============================================

// Types
interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface ChannelMessage {
  id: number;
  text: string;
  date: string;
  views: number;
  engagement: number;
}

function App() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [messages, setMessages] = useState<ChannelMessage[]>([
    { id: 1, text: "🚀 Welcome to AzadStudio! Telegram Mini App is live.", date: new Date().toISOString(), views: 1250, engagement: 85 },
    { id: 2, text: "📊 Connect your Supabase database to start syncing data.", date: new Date(Date.now() - 3600000).toISOString(), views: 890, engagement: 78 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.enableClosingConfirmation();
        
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setTelegramUser({
            id: user.id,
            first_name: user.first_name,
            username: user.username
          });
          console.log('Telegram user:', user);
        }
      } else {
        console.log('Running in browser mode');
        setTelegramUser({
          id: 123456789,
          first_name: 'Demo User',
          username: 'demo'
        });
      }
    };

    window.addEventListener('load', initTelegram);
    return () => window.removeEventListener('load', initTelegram);
  }, []);

  const connectToSupabase = async () => {
    setLoading(true);
    try {
      // Test Supabase connection
      const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/telegram_users?select=count`, {
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
        }
      });
      
      if (response.ok) {
        setSupabaseConnected(true);
        alert('✅ Connected to Supabase successfully!');
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('Supabase error:', error);
      alert('❌ Failed to connect. Check your Supabase URL and API key.');
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (!telegramUser) return;
    
    setLoading(true);
    try {
      const userData = {
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/telegram_users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        alert('✅ Data synced to Supabase!');
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl">
              <Rocket className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                AzadStudio
              </h1>
              <p className="text-gray-400 text-sm">Advanced Telegram Mini App</p>
            </div>
          </div>
          
          {telegramUser && (
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400 font-bold">
                  {telegramUser.first_name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{telegramUser.first_name}</p>
                <p className="text-xs text-gray-400">@{telegramUser.username || 'user'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Supabase Connection Card */}
        <div className={`p-4 rounded-xl mb-6 border ${supabaseConnected 
          ? 'bg-green-900/20 border-green-700' 
          : 'bg-amber-900/20 border-amber-700'}`}>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${supabaseConnected ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                <Database className={`w-5 h-5 ${supabaseConnected ? 'text-green-400' : 'text-amber-400'}`} />
              </div>
              <div>
                <h3 className="font-bold">Supabase Database</h3>
                <p className="text-sm text-gray-400">
                  {supabaseConnected ? '✅ Connected' : '🔗 Connect to save data'}
                </p>
              </div>
            </div>
            
            <button
              onClick={supabaseConnected ? syncData : connectToSupabase}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-bold ${supabaseConnected 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-amber-600 hover:bg-amber-700'} ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {supabaseConnected ? 'Syncing...' : 'Connecting...'}
                </div>
              ) : (
                supabaseConnected ? 'Sync Now' : 'Connect Database'
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Channel Analytics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-green-400 text-sm">+12.5%</span>
              </div>
              <h3 className="text-2xl font-bold">15.4K</h3>
              <p className="text-gray-400 text-sm">Subscribers</p>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm">+8.3%</span>
              </div>
              <h3 className="text-2xl font-bold">{messages.length}</h3>
              <p className="text-gray-400 text-sm">Messages</p>
            </div>
          </div>
        </section>

        {/* Messages */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            Recent Messages
          </h2>
          <div className="space-y-3">
            {messages.map(message => (
              <div key={message.id} className="bg-gray-900/30 p-4 rounded-lg">
                <p className="mb-2">{message.text}</p>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{new Date(message.date).toLocaleDateString()}</span>
                  <span>👁️ {message.views} • ⚡ {message.engagement}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.Telegram?.WebApp?.openLink?.('https://supabase.com')}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Open Supabase
            </button>
            
            <button
              onClick={() => {
                const newMsg = {
                  id: messages.length + 1,
                  text: "New channel update from Mini App!",
                  date: new Date().toISOString(),
                  views: 100,
                  engagement: 75
                };
                setMessages([newMsg, ...messages]);
              }}
              className="bg-amber-600 hover:bg-amber-700 p-3 rounded-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Powered by AzadStudio • Telegram Mini App</p>
        <p className="mt-1 text-xs">User ID: {telegramUser?.id || 'Not connected'}</p>
      </footer>
    </div>
  );
}

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

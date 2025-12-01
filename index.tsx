import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MessageSquare,
  BarChart3,
  Users,
  Zap,
  Globe,
  Bell,
  Settings,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Shield,
  Link as LinkIcon,
  Database,
  Bot,
  Smartphone,
  Cloud,
  Activity,
  Target,
  Rocket,
  Sparkles
} from 'lucide-react';

const MAIN_APP_CONFIG = {
  // Your Supabase Project URL
  API_URL: 'https://your-project-ref.supabase.co',  // ← Your Supabase URL
  API_KEY: 'your-anon-or-service-key-here',         // ← Your Supabase anon key
  ENDPOINTS: {
    // Supabase REST API endpoints
    AUTH: '/rest/v1/telegram_auth',      // Custom function or table
    SYNC: '/rest/v1/telegram_sync',      // Custom function or table  
    PROFILE: '/rest/v1/profiles',        // Your profiles table
    ANALYTICS: '/rest/v1/analytics',
    MESSAGES: '/rest/v1/channel_messages'
  }
};

// ========== TYPES ==========
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface ChannelMessage {
  id: number;
  text: string;
  date: string;
  views: number;
  engagement: number;
  type: 'text' | 'media' | 'poll';
}

interface AnalyticsData {
  subscribers: number;
  growth: number;
  engagement: number;
  topPosts: Array<{ id: number; title: string; views: number }>;
  activeHours: string[];
}

interface MainAppConnection {
  connected: boolean;
  token?: string;
  userId?: string;
  lastSync?: string;
}

// ========== MAIN APP INTEGRATION FUNCTIONS ==========
async function connectToMainApp(telegramUser: TelegramUser): Promise<MainAppConnection> {
  try {
    const response = await fetch(`${MAIN_APP_CONFIG.API_URL}${MAIN_APP_CONFIG.ENDPOINTS.AUTH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAIN_APP_CONFIG.API_KEY}`,
        'Telegram-Init-Data': window.Telegram?.WebApp?.initData || ''
      },
      body: JSON.stringify({
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        isPremium: telegramUser.is_premium || false
      })
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('mainAppToken', data.token);
      localStorage.setItem('mainAppUserId', data.user.id);
      localStorage.setItem('lastConnection', new Date().toISOString());
      
      return {
        connected: true,
        token: data.token,
        userId: data.user.id,
        lastSync: new Date().toISOString()
      };
    }
    
    return { connected: false };
  } catch (error) {
    console.error('Connection failed:', error);
    return { connected: false };
  }
}

async function syncWithMainApp(data: any, token: string) {
  try {
    const response = await fetch(`${MAIN_APP_CONFIG.API_URL}${MAIN_APP_CONFIG.ENDPOINTS.SYNC}`, {
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

// ========== REACT COMPONENTS ==========
function ConnectionStatus({ connected, lastSync }: { connected: boolean; lastSync?: string }) {
  return (
    <div className={`p-3 rounded-lg mb-4 ${connected ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="font-medium">{connected ? 'Connected to Main App' : 'Disconnected from Main App'}</span>
      </div>
      {connected && lastSync && (
        <p className="text-sm text-gray-400 mt-1">Last sync: {new Date(lastSync).toLocaleTimeString()}</p>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, change, color = 'amber' }: any) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-amber-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {change && (
          <span className={`text-xs px-2 py-1 rounded-full ${change > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{title}</p>
    </div>
  );
}

function MessageCard({ message }: { message: ChannelMessage }) {
  return (
    <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4 hover:border-amber-500/20 transition-all">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg">
          <MessageSquare className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-white mb-2 line-clamp-2">{message.text}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(message.date).toLocaleDateString()}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                👁️ {message.views.toLocaleString()}
              </span>
              <span className="text-amber-400">
                ⚡ {message.engagement}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ 
  onClick, 
  text, 
  icon: Icon, 
  variant = 'primary',
  loading = false 
}: { 
  onClick: () => void;
  text: string;
  icon: any;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}) {
  const variants = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-black',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 font-medium py-3 px-4 rounded-lg transition-all ${variants[variant]} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <Icon className="w-5 h-5" />
      )}
      {text}
    </button>
  );
}

// ========== MAIN APP COMPONENT ==========
function AzadStudioApp() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [connection, setConnection] = useState<MainAppConnection>({ connected: false });
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState({
    messages: true,
    analytics: true,
    connection: false
  });

  // Initialize Telegram WebApp
  useEffect(() => {
    const initTelegram = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Expand to full screen
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Set theme colors
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
        
        // Get user data
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setTelegramUser(user);
          connectToMainApp(user).then(setConnection);
        }
        
        console.log('Telegram WebApp initialized:', user);
      } else {
        console.warn('Telegram WebApp SDK not found - running in browser mode');
        // Mock data for browser testing
        setTelegramUser({
          id: 123456789,
          first_name: 'Demo',
          username: 'demo_user',
          language_code: 'en'
        });
      }
    };

    // Try initialization
    if (document.readyState === 'complete') {
      initTelegram();
    } else {
      window.addEventListener('load', initTelegram);
    }

    return () => {
      window.removeEventListener('load', initTelegram);
    };
  }, []);

  // Load channel data
  useEffect(() => {
    if (!telegramUser) return;

    // Load messages
    const loadMessages = async () => {
      setLoading(prev => ({ ...prev, messages: true }));
      try {
        // Mock data - replace with actual API call
        const mockMessages: ChannelMessage[] = Array.from({ length: 8 }, (_, i) => ({
          id: i + 1,
          text: `🚀 Channel Update #${i + 1}: Exciting new features launched today! Check our latest announcement about Telegram Mini Apps integration.`,
          date: new Date(Date.now() - i * 3600000).toISOString(),
          views: Math.floor(Math.random() * 10000) + 1000,
          engagement: Math.floor(Math.random() * 30) + 70,
          type: 'text'
        }));
        setMessages(mockMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(prev => ({ ...prev, messages: false }));
      }
    };

    // Load analytics
    const loadAnalytics = async () => {
      setLoading(prev => ({ ...prev, analytics: true }));
      try {
        // Mock data - replace with actual API call
        const mockAnalytics: AnalyticsData = {
          subscribers: 15420,
          growth: 12.5,
          engagement: 78.3,
          topPosts: [
            { id: 1, title: 'AI Integration Launch', views: 25400 },
            { id: 2, title: 'Channel Monetization', views: 18700 },
            { id: 3, title: 'New Feature Update', views: 13200 }
          ],
          activeHours: ['14:00', '20:00', '09:00']
        };
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(prev => ({ ...prev, analytics: false }));
      }
    };

    loadMessages();
    loadAnalytics();
  }, [telegramUser]);

  // Handle actions
  const handleSync = async () => {
    if (!connection.token || !telegramUser) return;
    
    setLoading(prev => ({ ...prev, connection: true }));
    
    const syncData = {
      messages,
      analytics,
      timestamp: new Date().toISOString(),
      user: telegramUser
    };
    
    const result = await syncWithMainApp(syncData, connection.token);
    
    if (result?.success) {
      setConnection(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));
      
      // Show success message
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('✅ Data synced successfully with main app!');
      } else {
        alert('✅ Data synced successfully with main app!');
      }
    }
    
    setLoading(prev => ({ ...prev, connection: false }));
  };

  const handleGenerateReport = () => {
    // Generate AI-powered report
    const report = {
      title: 'Channel Performance Report',
      insights: [
        'Peak engagement: 2-4 PM UTC',
        'Best content type: Tutorial videos',
        'Growth opportunity: Cross-platform promotion',
        'Recommendation: Increase poll frequency'
      ]
    };
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(`📊 ${report.title}\n\n${report.insights.join('\n• ')}`);
    } else {
      alert(`📊 ${report.title}\n\n${report.insights.join('\n• ')}`);
    }
  };

  const handleAdvancedAnalysis = () => {
    // Trigger advanced AI analysis
    if (connection.connected) {
      // Call main app's AI endpoint
      console.log('Triggering advanced analysis...');
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('🔍 Advanced analysis started... Results will appear in your main app dashboard.');
      }
    } else {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Please connect to main app first');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl">
              <Rocket className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                AzadStudio
              </h1>
              <p className="text-gray-400 text-sm">Advanced Channel Dashboard</p>
            </div>
          </div>
          {telegramUser && (
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-2 rounded-lg">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="text-amber-400 font-bold">
                  {telegramUser.first_name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium">{telegramUser.first_name}</p>
                <p className="text-xs text-gray-400">@{telegramUser.username || 'user'}</p>
              </div>
            </div>
          )}
        </div>

        <ConnectionStatus 
          connected={connection.connected} 
          lastSync={connection.lastSync} 
        />
      </header>

      {/* Main Dashboard */}
      <main className="space-y-6">
        {/* Stats Grid */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Channel Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Subscribers" 
              value={analytics?.subscribers.toLocaleString() || '15.4K'} 
              icon={Users} 
              change={12.5}
              color="amber"
            />
            <StatCard 
              title="Engagement Rate" 
              value={`${analytics?.engagement || 78.3}%`} 
              icon={TrendingUp} 
              change={5.2}
              color="green"
            />
            <StatCard 
              title="Messages Today" 
              value={messages.length.toString()} 
              icon={MessageSquare} 
              change={8.3}
              color="blue"
            />
            <StatCard 
              title="Growth Speed" 
              value={`${analytics?.growth || 12.5}%`} 
              icon={Zap} 
              change={2.1}
              color="purple"
            />
          </div>
        </section>

        {/* Action Buttons */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton
              onClick={handleSync}
              text={connection.connected ? "Sync Now" : "Connect & Sync"}
              icon={ArrowUpDown}
              loading={loading.connection}
              variant={connection.connected ? "primary" : "secondary"}
            />
            <ActionButton
              onClick={handleGenerateReport}
              text="Generate Report"
              icon={BarChart3}
              variant="secondary"
            />
            <ActionButton
              onClick={handleAdvancedAnalysis}
              text="AI Analysis"
              icon={Sparkles}
              variant="secondary"
            />
            <ActionButton
              onClick={() => window.Telegram?.WebApp?.openLink('https://your-main-app.com/dashboard')}
              text="Open Main App"
              icon={Globe}
              variant="secondary"
            />
          </div>
        </section>

        {/* Recent Messages */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Recent Channel Messages
            </h2>
            <span className="text-sm text-gray-400">
              {loading.messages ? 'Loading...' : `${messages.length} messages`}
            </span>
          </div>
          
          <div className="space-y-3">
            {loading.messages ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-900/30 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              messages.slice(0, 5).map(message => (
                <MessageCard key={message.id} message={message} />
              ))
            )}
          </div>
        </section>

        {/* Advanced Features */}
        <section className="bg-gradient-to-r from-gray-900/50 to-black border border-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Beyond Telegram Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold">Cross-Platform Sync</h3>
                  <p className="text-sm text-gray-400">Real-time data across all platforms</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-400">Predictive analytics & recommendations</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold">Unified Dashboard</h3>
                  <p className="text-sm text-gray-400">Single view across all channels</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold">Advanced Security</h3>
                  <p className="text-sm text-gray-400">Enterprise-grade data protection</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Cloud className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold">Cloud Integration</h3>
                  <p className="text-sm text-gray-400">Seamless cloud storage sync</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold">API Ecosystem</h3>
                  <p className="text-sm text-gray-400">Connect with 100+ services</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Settings & Connection */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Configuration
          </h2>
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Main App Connection</h3>
                  <p className="text-sm text-gray-400">
                    {connection.connected 
                      ? `Connected as user: ${connection.userId?.substring(0, 8)}...` 
                      : 'Not connected to main application'}
                  </p>
                </div>
                <button
                  onClick={() => connection.connected ? handleSync() : connectToMainApp(telegramUser!).then(setConnection)}
                  className={`px-4 py-2 rounded-lg font-medium ${connection.connected ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                >
                  {connection.connected ? 'Reconnect' : 'Connect'}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Telegram Channel</h3>
                  <p className="text-sm text-gray-400">Connected to @yourchannel</p>
                </div>
                <span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">
                  Live
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-gray-400">Real-time updates enabled</p>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <div className="relative">
                    <div className="w-10 h-6 bg-amber-600 rounded-full"></div>
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">
              Powered by <span className="text-amber-400 font-medium">AzadStudio</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Advanced Telegram Mini App with Main App Integration
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink('https://t.me/yourchannel')}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              Visit Channel
            </button>
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink('https://your-main-app.com')}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              Main App
            </button>
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink('https://docs.your-main-app.com')}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              Documentation
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            {connection.connected 
              ? '🟢 All systems operational • Connected to main app' 
              : '🟡 Limited mode • Connect to main app for full features'}
          </p>
        </div>
      </footer>
    </div>
  );
}

// ========== RENDER APPLICATION ==========
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <AzadStudioApp />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}

// ========== TELEGRAM WEB APP UTILITIES ==========
// Make sure Telegram WebApp SDK is loaded
if (typeof window !== 'undefined') {
  // Add global error handler
  window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    
    // Send error to main app if connected
    const token = localStorage.getItem('mainAppToken');
    if (token && navigator.onLine) {
      fetch(`${MAIN_APP_CONFIG.API_URL}/errors`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          error: event.error?.message,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  });

  // Handle offline/online status
  window.addEventListener('online', () => {
    console.log('App is online');
    // Try to reconnect if disconnected
    const token = localStorage.getItem('mainAppToken');
    if (token && !window.Telegram?.WebApp?.initDataUnsafe?.user) {
      // Try to re-authenticate
      const userData = localStorage.getItem('telegramUser');
      if (userData) {
        connectToMainApp(JSON.parse(userData)).then(console.log);
      }
    }
  });

  window.addEventListener('offline', () => {
    console.log('App is offline - using cached data');
  });
}

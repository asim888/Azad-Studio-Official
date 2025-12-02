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
  Sparkles,
  RefreshCw  // ← ADD THIS LINE (with comma after Sparkles)
} from 'lucide-react';
function AzadStudioApp() {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [supabaseConnection, setSupabaseConnection] = useState<MainAppConnection>({ 
    connected: false 
  });
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState({
    messages: true,
    analytics: true,
    connection: false,
    sync: false
  });

  // Initialize Telegram and connect to Supabase
  useEffect(() => {
    const initApp = async () => {
      console.log('Initializing AzadStudio App...');
      
      // Initialize Telegram WebApp
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Expand to full screen
        tg.expand();
        tg.enableClosingConfirmation();
        
        // Apply Telegram theme
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#F59E0B');
        
        // Get user data
        const user = tg.initDataUnsafe?.user;
        if (user) {
          console.log('Telegram user detected:', user);
          setTelegramUser(user);
          
          // Connect to Supabase
          setLoading(prev => ({ ...prev, connection: true }));
          const connection = await connectToSupabase(user);
          setSupabaseConnection(connection);
          setLoading(prev => ({ ...prev, connection: false }));
          
          // Load user data from Supabase
          if (connection.connected) {
            const supabaseUser = await getSupabaseUser(user.id);
            if (supabaseUser) {
              console.log('User loaded from Supabase:', supabaseUser);
            }
          }
          
          // Load initial data
          await loadMessages();
          await loadAnalytics();
          
        } else {
          console.warn('No Telegram user data available');
          // Fallback to demo mode
          setTelegramUser({
            id: 123456789,
            first_name: 'Demo User',
            username: 'demo_user',
            language_code: 'en'
          });
          await loadDemoData();
        }
      } else {
        console.warn('Telegram WebApp SDK not found - running in demo mode');
        // Demo mode for browser testing
        setTelegramUser({
          id: 123456789,
          first_name: 'Demo User',
          username: 'demo_user',
          language_code: 'en'
        });
        await loadDemoData();
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    setTimeout(initApp, 100);
  }, []);

  // Load messages from Supabase or use mock data
  const loadMessages = async () => {
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      // If connected to Supabase, try to load real data
      if (supabaseConnection.connected && telegramUser) {
        // Try to load messages from Supabase
        const response = await fetch(
          `${SUPABASE_CONFIG.URL}/rest/v1/channel_messages?order=created_at.desc&limit=10`,
          {
            headers: {
              'apikey': SUPABASE_CONFIG.ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
            }
          }
        );
        
        if (response.ok) {
          const supabaseMessages = await response.json();
          if (supabaseMessages.length > 0) {
            const formattedMessages = supabaseMessages.map((msg: any) => ({
              id: msg.telegram_message_id || msg.id,
              text: msg.message_text || 'No content',
              date: msg.created_at || new Date().toISOString(),
              views: msg.views || 0,
              engagement: msg.engagement_score || 0,
              type: msg.message_type || 'text'
            }));
            setMessages(formattedMessages);
            console.log('Loaded messages from Supabase:', formattedMessages.length);
            setLoading(prev => ({ ...prev, messages: false }));
            return;
          }
        }
      }
      
      // Fallback to mock data
      const mockMessages: ChannelMessage[] = [
        {
          id: 1,
          text: "🚀 Welcome to AzadStudio! We've just launched our new Telegram Mini App with Supabase integration.",
          date: new Date(Date.now() - 2 * 3600000).toISOString(),
          views: 1250,
          engagement: 85,
          type: 'text'
        },
        {
          id: 2,
          text: "📊 Analytics Update: Channel growth is up by 23% this week! Check your dashboard for detailed insights.",
          date: new Date(Date.now() - 5 * 3600000).toISOString(),
          views: 890,
          engagement: 78,
          type: 'text'
        },
        {
          id: 3,
          text: "🔗 New Feature: Your Mini App is now connected to Supabase database. All data is securely stored!",
          date: new Date(Date.now() - 8 * 3600000).toISOString(),
          views: 1560,
          engagement: 92,
          type: 'text'
        },
        {
          id: 4,
          text: "💡 Tip: Use the 'Sync Now' button to save your analytics data to Supabase for future analysis.",
          date: new Date(Date.now() - 12 * 3600000).toISOString(),
          views: 720,
          engagement: 65,
          type: 'text'
        },
        {
          id: 5,
          text: "🎯 Coming Soon: AI-powered content recommendations and automated reporting features.",
          date: new Date(Date.now() - 24 * 3600000).toISOString(),
          views: 2100,
          engagement: 88,
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
      
      // Save mock messages to Supabase if connected
      if (telegramUser && supabaseConnection.connected) {
        await saveMessagesToSupabase(mockMessages, telegramUser.id);
      }
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Use minimal mock data as fallback
      setMessages([{
        id: 1,
        text: "Welcome to AzadStudio Mini App!",
        date: new Date().toISOString(),
        views: 100,
        engagement: 75,
        type: 'text'
      }]);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(prev => ({ ...prev, analytics: true }));
    try {
      const mockAnalytics: AnalyticsData = {
        subscribers: supabaseConnection.connected ? 15420 : 0,
        growth: 12.5,
        engagement: 78.3,
        topPosts: [
          { id: 1, title: 'Supabase Integration', views: 25400 },
          { id: 2, title: 'Telegram Mini App Launch', views: 18700 },
          { id: 3, title: 'Channel Analytics', views: 13200 }
        ],
        activeHours: ['14:00', '20:00', '09:00']
      };
      setAnalytics(mockAnalytics);
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalytics({
        subscribers: 0,
        growth: 0,
        engagement: 0,
        topPosts: [],
        activeHours: []
      });
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  };

  // Load demo data for testing
  const loadDemoData = async () => {
    const mockMessages: ChannelMessage[] = [
      {
        id: 1,
        text: "This is demo mode. Connect to Telegram to see your real channel data.",
        date: new Date().toISOString(),
        views: 999,
        engagement: 90,
        type: 'text'
      }
    ];
    
    const mockAnalytics: AnalyticsData = {
      subscribers: 9999,
      growth: 25.5,
      engagement: 85.5,
      topPosts: [
        { id: 1, title: 'Demo Post 1', views: 10000 },
        { id: 2, title: 'Demo Post 2', views: 8000 }
      ],
      activeHours: ['10:00', '15:00', '21:00']
    };
    
    setMessages(mockMessages);
    setAnalytics(mockAnalytics);
    setLoading({ messages: false, analytics: false, connection: false, sync: false });
  };

  // Handle sync to Supabase
  const handleSyncToSupabase = async () => {
    if (!telegramUser) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('❌ No Telegram user found. Please open this app from Telegram.');
      } else {
        alert('❌ No Telegram user found.');
      }
      return;
    }
    
    setLoading(prev => ({ ...prev, sync: true }));
    
    try {
      const syncData = {
        messages_count: messages.length,
        analytics: analytics,
        app_version: '1.0.0',
        timestamp: new Date().toISOString(),
        user_data: {
          id: telegramUser.id,
          name: telegramUser.first_name
        }
      };
      
      const result = await syncDataToSupabase(syncData, telegramUser.id);
      
      if (result.success) {
        setSupabaseConnection(prev => ({
          ...prev,
          connected: true,
          lastSync: new Date().toISOString()
        }));
        
        // Show success message
        const successMsg = '✅ Data synced to Supabase successfully!\n\n' +
          `• Messages: ${messages.length}\n` +
          `• User: ${telegramUser.first_name}\n` +
          `• Time: ${new Date().toLocaleTimeString()}`;
        
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert(successMsg);
        } else {
          alert(successMsg);
        }
        
        // Update UI state
        localStorage.setItem('last_supabase_sync', new Date().toISOString());
        
      } else {
        throw new Error(result.error || 'Sync failed');
      }
      
    } catch (error: any) {
      console.error('Sync error:', error);
      
      const errorMsg = '❌ Sync failed:\n' + 
        (error.message || 'Unknown error') +
        '\n\nCheck your Supabase configuration.';
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMsg);
      } else {
        alert(errorMsg);
      }
      
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  };

  // Handle manual Supabase connection
  const handleConnectToSupabase = async () => {
    if (!telegramUser) {
      alert('Please wait for Telegram initialization...');
      return;
    }
    
    setLoading(prev => ({ ...prev, connection: true }));
    
    try {
      const connection = await connectToSupabase(telegramUser);
      setSupabaseConnection(connection);
      
      if (connection.connected) {
        alert(`✅ Connected to Supabase!\nUser ID: ${telegramUser.id}`);
      } else {
        alert('❌ Failed to connect to Supabase. Check your configuration.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Connection error: ' + error);
    } finally {
      setLoading(prev => ({ ...prev, connection: false }));
    }
  };

  // Supabase Connection Status Component
  function SupabaseConnectionCard() {
    return (
      <div className={`p-4 rounded-xl mb-6 border ${supabaseConnection.connected 
        ? 'bg-gradient-to-r from-green-900/20 to-green-900/5 border-green-700/30' 
        : 'bg-gradient-to-r from-amber-900/20 to-amber-900/5 border-amber-700/30'}`}>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${supabaseConnection.connected 
              ? 'bg-green-500/20' 
              : 'bg-amber-500/20'}`}>
              {supabaseConnection.connected ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Database className="w-5 h-5 text-green-400" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <Database className="w-5 h-5 text-amber-400" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">Supabase Database</h3>
              <p className="text-sm text-gray-400">
                {supabaseConnection.connected 
                  ? '✅ Live connection to your cloud database' 
                  : '🔗 Connect to save and sync your data'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={supabaseConnection.connected ? handleSyncToSupabase : handleConnectToSupabase}
              disabled={loading.connection || loading.sync}
              className={`px-4 py-3 rounded-lg font-bold flex items-center gap-2 ${supabaseConnection.connected 
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'} 
                ${(loading.connection || loading.sync) ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}
            >
              {loading.connection ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Connecting...
                </>
              ) : loading.sync ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Syncing...
                </>
              ) : (
                <>
                  {supabaseConnection.connected ? (
                    <>
                      <ArrowUpDown className="w-4 h-4" />
                      Sync Now
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Connect Database
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
        
        {supabaseConnection.lastSync && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Last Sync</p>
                <p className="text-green-400 font-medium">
                  {new Date(supabaseConnection.lastSync).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Database</p>
                <p className="text-gray-300 font-mono text-sm truncate">
                  {SUPABASE_CONFIG.URL.replace('https://', '').split('.')[0]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              <p className="text-gray-400 text-sm">Advanced Telegram Mini App</p>
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

        {/* Supabase Connection Status */}
        <SupabaseConnectionCard />
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

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton
              onClick={handleSyncToSupabase}
              text={supabaseConnection.connected ? "Sync to Supabase" : "Connect First"}
              icon={ArrowUpDown}
              loading={loading.sync}
              variant={supabaseConnection.connected ? "primary" : "secondary"}
            />
            <ActionButton
              onClick={() => {
                const report = `📊 Channel Report:\n\n` +
                  `• Subscribers: ${analytics?.subscribers || 0}\n` +
                  `• Engagement: ${analytics?.engagement || 0}%\n` +
                  `• Messages: ${messages.length}\n` +
                  `• Last Sync: ${supabaseConnection.lastSync ? new Date(supabaseConnection.lastSync).toLocaleTimeString() : 'Never'}`;
                
                if (window.Telegram?.WebApp) {
                  window.Telegram.WebApp.showAlert(report);
                } else {
                  alert(report);
                }
              }}
              text="Generate Report"
              icon={BarChart3}
              variant="secondary"
            />
            <ActionButton
              onClick={loadMessages}
              text="Refresh Data"
              icon={RefreshCw}
              loading={loading.messages}
              variant="secondary"
            />
            <ActionButton
              onClick={() => {
                if (window.Telegram?.WebApp?.openLink) {
                  window.Telegram.WebApp.openLink('https://supabase.com/dashboard/project/' + SUPABASE_CONFIG.URL.split('/')[2]);
                } else {
                  window.open('https://supabase.com', '_blank');
                }
              }}
              text="Open Supabase"
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

        {/* Database Status */}
        <section className="bg-gradient-to-r from-gray-900/50 to-black border border-gray-800 rounded-xl p-5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Database Status
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${supabaseConnection.connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className={`w-2 h-2 rounded-full ${supabaseConnection.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm text-gray-400">
                      {supabaseConnection.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${supabaseConnection.connected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {supabaseConnection.connected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              
              <div className="p-3 bg-gray-900/30 rounded-lg">
                <p className="font-medium mb-2">Supabase Project</p>
                <p className="text-sm text-gray-400 font-mono break-all">
                  {SUPABASE_CONFIG.URL}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-900/30 rounded-lg">
                <p className="font-medium mb-2">Data Storage</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Telegram Users</span>
                    <span className="text-amber-400">{supabaseConnection.connected ? '✓ Table Ready' : 'Not Connected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Channel Messages</span>
                    <span className="text-amber-400">{supabaseConnection.connected ? '✓ Table Ready' : 'Not Connected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">User Activity</span>
                    <span className="text-amber-400">{supabaseConnection.connected ? '✓ Table Ready' : 'Not Connected'}</span>
                  </div>
                </div>
              </div>
              
              {supabaseConnection.lastSync && (
                <div className="p-3 bg-gray-900/30 rounded-lg">
                  <p className="font-medium mb-2">Last Data Sync</p>
                  <p className="text-green-400">
                    {new Date(supabaseConnection.lastSync).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    All data is securely stored in your Supabase database
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-6 border-t border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-gray-400 text-sm">
              Powered by <span className="text-amber-400 font-medium">AzadStudio</span> + <span className="text-green-400 font-medium">Supabase</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Advanced Telegram Mini App with Cloud Database
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink?.(SUPABASE_CONFIG.URL)}
              className="text-sm text-gray-400 hover:text-green-400 transition-colors"
            >
              Supabase Dashboard
            </button>
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink?.('https://vercel.com')}
              className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              Vercel Hosting
            </button>
            <button 
              onClick={() => window.Telegram?.WebApp?.openLink?.('https://t.me')}
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
            >
              Telegram
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            {supabaseConnection.connected 
              ? '🟢 All systems operational • Connected to Supabase • Data syncing enabled' 
              : '🟡 Limited mode • Connect to Supabase for full features'}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            User ID: {telegramUser?.id || 'Not signed in'} • App Version: 1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

// Add RefreshCw icon import at the top with other imports
import { RefreshCw } from 'lucide-react';

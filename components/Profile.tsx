import React, { useState } from 'react';
import { TelegramService } from '../services/telegram';
import { ApiService } from '../services/api';
import { Shield, Settings, CreditCard, LogOut, User as UserIcon, CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';

function MainAppConnection() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    TelegramService.haptic.impact('light');
    try {
      const result = await ApiService.connectToMainApp();
      if (result?.success) {
        setConnected(true);
        TelegramService.haptic.success();
      }
    } catch (error) {
      TelegramService.haptic.error();
      alert('❌ Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-amber-500/30 rounded-xl p-4 mb-6 shadow-lg shadow-amber-900/10">
      <div className="flex items-center gap-2 mb-3">
         <LinkIcon size={18} className="text-amber-500" />
         <h3 className="text-amber-500 font-bold text-sm uppercase tracking-wider">Main App Connection</h3>
      </div>
      
      {connected ? (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/20">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Connected to main application</span>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? (
             <>
               <Loader2 size={18} className="animate-spin" />
               <span>Connecting...</span>
             </>
          ) : (
             'Connect to Main App'
          )}
        </button>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const user = TelegramService.getUser();

  return (
    <div className="pb-24 pt-8 px-4 bg-black min-h-screen">
      <div className="flex flex-col items-center mb-8 relative">
        {/* Glow effect */}
        <div className="absolute top-0 w-32 h-32 bg-amber-500/20 blur-3xl rounded-full"></div>
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 p-[3px] mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)] relative z-10">
          {user?.photo_url ? (
            <img 
              src={user.photo_url} 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover border-4 border-black"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-neutral-900 border-4 border-black flex items-center justify-center">
                <UserIcon size={40} className="text-amber-500" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">
            {user?.first_name} {user?.last_name}
            </h1>
            <CheckCircle2 size={20} className="text-amber-500 fill-amber-500/20" />
        </div>
        {user?.username && (
          <p className="text-neutral-400 font-medium mt-1">@{user.username}</p>
        )}
        <div className="mt-3 px-4 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
          Premium Member
        </div>
      </div>

      <div className="space-y-4">
        {/* Main App Connection Component */}
        <MainAppConnection />

        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-2 mb-2">Account Settings</h3>
        
        <div className="bg-neutral-900 rounded-xl overflow-hidden shadow-sm border border-neutral-800">
            <button className="w-full flex items-center p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-0 group">
                <Shield size={20} className="text-neutral-500 mr-4 group-hover:text-amber-500 transition-colors" />
                <span className="flex-1 text-left text-gray-200 font-medium">Privacy & Security</span>
            </button>
            <button className="w-full flex items-center p-4 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-0 group">
                <CreditCard size={20} className="text-neutral-500 mr-4 group-hover:text-amber-500 transition-colors" />
                <span className="flex-1 text-left text-gray-200 font-medium">Subscription Status</span>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">Gold Tier</span>
            </button>
            <button className="w-full flex items-center p-4 hover:bg-neutral-800 transition-colors group">
                <Settings size={20} className="text-neutral-500 mr-4 group-hover:text-amber-500 transition-colors" />
                <span className="flex-1 text-left text-gray-200 font-medium">App Settings</span>
            </button>
        </div>

        <button 
            onClick={() => TelegramService.close()}
            className="w-full flex items-center justify-center gap-2 p-4 mt-8 text-red-500 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-xl transition-all font-medium"
        >
            <LogOut size={20} />
            Close Mini App
        </button>
      </div>

      <div className="mt-12 text-center opacity-40">
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">ID: {user?.id || 'Unknown'}</p>
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">AzadStudio v1.2.0</p>
      </div>
    </div>
  );
};

export default Profile;
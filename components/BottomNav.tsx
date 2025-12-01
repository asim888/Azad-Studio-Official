import React from 'react';
import { MessageSquare, BarChart2, User } from 'lucide-react';
import { Tab } from '../types';
import { TelegramService } from '../services/telegram';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const handleTabClick = (tab: Tab) => {
    TelegramService.haptic.impact('light');
    onTabChange(tab);
  };

  const getButtonClass = (tab: Tab) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${
      isActive 
        ? 'text-amber-500 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
        : 'text-neutral-500 hover:text-neutral-300'
    }`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-neutral-800 pb-[env(safe-area-inset-bottom)] z-50">
      <div className="flex justify-around items-center h-16 w-full px-6">
        <button className={getButtonClass(Tab.MESSAGES)} onClick={() => handleTabClick(Tab.MESSAGES)}>
          <MessageSquare size={24} strokeWidth={activeTab === Tab.MESSAGES ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-semibold tracking-wider uppercase">Messages</span>
        </button>
        <button className={getButtonClass(Tab.ANALYTICS)} onClick={() => handleTabClick(Tab.ANALYTICS)}>
          <BarChart2 size={24} strokeWidth={activeTab === Tab.ANALYTICS ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-semibold tracking-wider uppercase">Analytics</span>
        </button>
        <button className={getButtonClass(Tab.PROFILE)} onClick={() => handleTabClick(Tab.PROFILE)}>
          <User size={24} strokeWidth={activeTab === Tab.PROFILE ? 2.5 : 2} />
          <span className="text-[10px] mt-1 font-semibold tracking-wider uppercase">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
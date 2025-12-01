import { User, TelegramWebApp } from '../types';

const webApp = window.Telegram?.WebApp;

export const TelegramService = {
  getWebApp: (): TelegramWebApp | undefined => {
    return webApp;
  },

  ready: () => {
    webApp?.ready();
  },

  expand: () => {
    webApp?.expand();
  },

  getUser: (): User | undefined => {
    return webApp?.initDataUnsafe?.user;
  },

  getInitData: (): string => {
    return webApp?.initData || '';
  },

  close: () => {
    webApp?.close();
  },

  openLink: (url: string) => {
    webApp?.openLink(url);
  },

  openTelegramLink: (url: string) => {
    webApp?.openTelegramLink(url);
  },

  share: (url: string, text?: string) => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text || '')}`;
    webApp?.openTelegramLink(shareUrl);
  },

  haptic: {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    success: () => {
      webApp?.HapticFeedback.notificationOccurred('success');
    },
    error: () => {
      webApp?.HapticFeedback.notificationOccurred('error');
    },
    selectionChanged: () => {
      webApp?.HapticFeedback.selectionChanged();
    }
  },
  
  // Helpers for theming
  isDarkMode: (): boolean => {
    return webApp?.colorScheme === 'dark';
  }
};
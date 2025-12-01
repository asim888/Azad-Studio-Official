export interface User {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: User;
    auth_date?: string;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
  
  // Augment NodeJS namespace to include API_KEY in ProcessEnv
  // This avoids redeclaring 'process' which causes conflicts with @types/node
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

export interface MediaAttachment {
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string; // For video posters or low-res previews
  aspectRatio?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface ChannelMessage {
  id: string;
  content: string;
  date: string;
  views: number;
  author: string;
  media?: MediaAttachment;
  reactions?: Reaction[];
}

export interface AnalyticsData {
  name: string;
  value: number;
}

export interface TranscriptionResult {
  original: string;
  hindi: string;
  urdu: string;
  telugu: string;
}

export enum Tab {
  MESSAGES = 'MESSAGES',
  ANALYTICS = 'ANALYTICS',
  PROFILE = 'PROFILE'
}
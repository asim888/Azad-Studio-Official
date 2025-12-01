import { API_BASE_URL, MOCK_MESSAGES, MOCK_ANALYTICS_VIEWS, MOCK_ANALYTICS_SUBS } from '../constants';
import { ChannelMessage, AnalyticsData } from '../types';
import { TelegramService } from './telegram';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to strip HTML tags for preview text
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Helper to check if URL is a direct video file
const isDirectVideo = (url: string) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url) || url.includes('commondatastorage');
};

export const ApiService = {
  fetchMessages: async (): Promise<ChannelMessage[]> => {
    // List of public RSS bridges to try in order
    const BRIDGE_URLS = [
        `https://api.rss2json.com/v1/api.json?rss_url=https://tg.i-c-a.su/rss/AzadStudioOfficial`,
        `https://api.rss2json.com/v1/api.json?rss_url=https://rsshub.app/telegram/channel/AzadStudioOfficial`,
    ];

    for (const url of BRIDGE_URLS) {
        try {
            console.log(`Attempting to fetch from bridge: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!response.ok) continue;

            const data = await response.json();
            
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                // Transform RSS items to ChannelMessage
                return data.items.map((item: any, index: number) => {
                    // Extract image from description or enclosure
                    let media = undefined;
                    
                    if (item.enclosure && item.enclosure.link) {
                        const isVideoType = item.enclosure.type.includes('video');
                        // Strict check for playable video formats
                        if (isVideoType && isDirectVideo(item.enclosure.link)) {
                            media = { type: 'video' as const, url: item.enclosure.link };
                        } else if (isVideoType) {
                             // Fallback for non-playable videos: try to use as photo if thumbnail exists
                             if (item.thumbnail) {
                                media = { type: 'photo' as const, url: item.thumbnail };
                             }
                        } else if (item.enclosure.type.includes('image')) {
                            media = { type: 'photo' as const, url: item.enclosure.link };
                        }
                    } else if (item.thumbnail) {
                        media = { type: 'photo' as const, url: item.thumbnail };
                    }

                    // Generate random reactions for liveliness
                    const reactionTypes = ['👍', '❤️', '🔥', '🎉', '👏', '😂'];
                    const reactions = [];
                    // Deterministic random based on index to keep consistent across re-renders
                    if ((index + item.title.length) % 3 !== 0) {
                        const count = ((index * 7) % 3) + 1;
                        for (let i = 0; i < count; i++) {
                            const emoji = reactionTypes[(index + i) % reactionTypes.length];
                            if (!reactions.find(r => r.emoji === emoji)) {
                                reactions.push({
                                    emoji,
                                    count: ((index * 13 + i * 5) % 100) + 5,
                                    userReacted: ((index + i) % 5 === 0)
                                });
                            }
                        }
                    }

                    // Random views 
                    const views = 1000 + (index * 253) % 4000;

                    return {
                        id: item.guid || `rss-${index}`,
                        content: stripHtml(item.description || item.title),
                        date: item.pubDate,
                        views: views,
                        author: 'AzadStudioOfficial',
                        media: media,
                        reactions: reactions
                    };
                });
            }
        } catch (error) {
            console.warn(`Bridge ${url} failed`, error);
        }
    }

    console.warn('All RSS bridges failed, falling back to static studio data');
    return MOCK_MESSAGES;
  },

  fetchAnalytics: async (type: 'views' | 'subs'): Promise<AnalyticsData[]> => {
    try {
      await delay(600);
      return type === 'views' ? MOCK_ANALYTICS_VIEWS : MOCK_ANALYTICS_SUBS;
    } catch (error) {
      return type === 'views' ? MOCK_ANALYTICS_VIEWS : MOCK_ANALYTICS_SUBS;
    }
  },

  authenticateUser: async (): Promise<boolean> => {
    return true; 
  }
};
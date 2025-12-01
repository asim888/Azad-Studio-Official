import { ChannelMessage } from './types';

export const API_BASE_URL = 'https://api.myapp.com';

// Realistic fallback data for AzadStudioOfficial if live fetch fails
export const MOCK_MESSAGES: ChannelMessage[] = [
  {
    id: '101',
    content: '📢 NEW TUTORIAL: Building a Telegram Mini App with React & Node.js!\n\nIn this video, I break down the entire process of setting up the bot, configuring the web app, and deploying it.\n\n👇 Watch now on YouTube!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    views: 3420,
    author: 'AzadStudioOfficial',
    media: {
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80'
    },
    reactions: [
      { emoji: '🔥', count: 245, userReacted: true },
      { emoji: '❤️', count: 180, userReacted: false }
    ]
  },
  {
    id: '102',
    content: 'Code Snippet of the Day: Python Asyncio 🐍\n\nWhen writing Telegram bots, mastering async/await is crucial for handling multiple user requests concurrently without blocking. Here is a pattern I use for high-performance polling.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    views: 5100,
    author: 'AzadStudioOfficial',
    reactions: [
      { emoji: '👍', count: 500, userReacted: true },
      { emoji: '🎉', count: 120, userReacted: false }
    ]
  },
  {
    id: '103',
    content: 'We are LIVE! 🔴\n\nJoin the stream where we are reviewing your portfolio websites. Drop your links in the comments section!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    views: 8900,
    author: 'AzadStudioOfficial',
    media: {
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
    },
    reactions: [
      { emoji: '🤩', count: 800, userReacted: true }
    ]
  },
  {
    id: '104',
    content: 'Setting up the Golden/Black theme for our new client app. Aesthetics matter just as much as functionality. #UIUX #Design',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    views: 2100,
    author: 'AzadStudioOfficial',
    media: {
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
    },
    reactions: []
  },
  {
    id: '105',
    content: 'Should we do a series on Gemini AI integration? 🤖\n\nLet me know by reacting to this post!',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    views: 4500,
    author: 'AzadStudioOfficial',
    reactions: [
      { emoji: '🔥', count: 1000, userReacted: true }
    ]
  }
];

export const MOCK_ANALYTICS_VIEWS = [
  { name: 'Mon', value: 4500 },
  { name: 'Tue', value: 5200 },
  { name: 'Wed', value: 4800 },
  { name: 'Thu', value: 6100 },
  { name: 'Fri', value: 5900 },
  { name: 'Sat', value: 7200 },
  { name: 'Sun', value: 8100 },
];

export const MOCK_ANALYTICS_SUBS = [
  { name: 'Mon', value: 120 },
  { name: 'Tue', value: 150 },
  { name: 'Wed', value: 180 },
  { name: 'Thu', value: 220 },
  { name: 'Fri', value: 200 },
  { name: 'Sat', value: 310 },
  { name: 'Sun', value: 290 },
];
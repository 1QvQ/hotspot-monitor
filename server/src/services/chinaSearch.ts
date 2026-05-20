import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import type { SearchResult } from '../types.js';

// User Agent list
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

// Rate Limiter
class RateLimiter {
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(minIntervalMs: number = 5000) {
    this.minInterval = minIntervalMs;
  }

  async wait(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}

const sogouLimiter = new RateLimiter(3000);
const bilibiliLimiter = new RateLimiter(2000);
const weiboLimiter = new RateLimiter(3000);

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ============================================================
// Sogou Search (alternative to Baidu, more lenient anti-scraping, no API Key required)
// ============================================================
export async function searchSogou(query: string): Promise<SearchResult[]> {
  await sogouLimiter.wait();

  try {
    const response = await axios.get('https://www.sogou.com/web', {
      params: {
        query,
        ie: 'utf-8'
      },
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    // Parse Sogou search results
    $('.vrwrap, .rb').each((_, element) => {
      const titleElement = $(element).find('h3 a, .vr-title a, .vrTitle a').first();
      const title = titleElement.text().trim();
      let url = titleElement.attr('href') || '';

      // Convert Sogou relative path to absolute path
      if (url.startsWith('/link?url=')) {
        url = `https://www.sogou.com${url}`;
      }

      const snippet = $(element).find('.space-txt, .str-text-info, .str_info, .text-layout').text().trim()
        || $(element).find('p').first().text().trim();

      // Exclude ads and irrelevant results
      if (title && url && !title.includes('大家还在搜')) {
        results.push({
          title,
          content: snippet || title,
          url,
          source: 'sogou' as const
        });
      }
    });

    console.log(`Sogou search for "${query}": found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Sogou search error:', error instanceof Error ? error.message : error);
    return [];
  }
}

// ============================================================
// Bilibili Search (public API, no API Key required)
// ============================================================

interface BilibiliSearchResponse {
  code: number;
  data?: {
    result?: BilibiliVideoResult[];
  };
}

interface BilibiliVideoResult {
  aid: number;
  bvid: string;
  title: string;
  description: string;
  author: string;
  mid: number;
  pic: string;
  play: number;
  favorites: number;
  review: number; // Comment count
  danmaku: number;
  like: number;
  pubdate: number;
  tag: string;
}

interface BilibiliUserSearchResponse {
  code: number;
  data?: {
    result?: BilibiliUserResult[];
  };
}

interface BilibiliUserResult {
  mid: number;
  uname: string;
  usign: string;
  fans: number;
  videos: number;
  upic: string;
  official_verify: {
    type: number; // -1=No verification, 0=Personal verification, 1=Organization verification
    desc: string;
  };
}

interface BilibiliSpaceResponse {
  code: number;
  data?: {
    list?: {
      vlist?: BilibiliSpaceVideo[];
    };
  };
}

interface BilibiliSpaceVideo {
  aid: number;
  bvid: string;
  title: string;
  description: string;
  author: string;
  mid: number;
  pic: string;
  play: number;
  favorites: number;
  review: number;
  comment: number;
  danmaku: number;
  created: number;
}

// Search Bilibili videos
export async function searchBilibili(query: string): Promise<SearchResult[]> {
  await bilibiliLimiter.wait();

  try {
    // Generate buvid3 cookie to avoid 412 error
    const buvid3 = `${crypto.randomUUID()}infoc`;

    const response = await axios.get<BilibiliSearchResponse>(
      'https://api.bilibili.com/x/web-interface/search/type',
      {
        params: {
          keyword: query,
          search_type: 'video',
          order: 'pubdate', // Sort by publish date to ensure latest content
          page: 1,
          pagesize: 20
        },
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://search.bilibili.com/',
          'Accept': 'application/json',
          'Cookie': `buvid3=${buvid3}`
        },
        timeout: 15000
      }
    );

    if (response.data.code !== 0 || !response.data.data?.result) {
      console.log(`Bilibili search: no results or API error (code: ${response.data.code})`);
      return [];
    }

    const results: SearchResult[] = response.data.data.result.map(video => ({
      title: video.title.replace(/<\/?em[^>]*>/g, ''), // Strip highlight tags
      content: video.description || video.title.replace(/<\/?em[^>]*>/g, ''),
      url: `https://www.bilibili.com/video/${video.bvid}`,
      source: 'bilibili' as const,
      sourceId: video.bvid,
      publishedAt: new Date(video.pubdate * 1000),
      viewCount: video.play,
      likeCount: video.like,
      commentCount: video.review,
      danmakuCount: video.danmaku,
      author: {
        name: video.author,
        username: String(video.mid)
      }
    }));

    console.log(`Bilibili search for "${query}": found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Bilibili search error:', error instanceof Error ? error.message : error);
    return [];
  }
}

// Search Bilibili user (for account detection)
export async function searchBilibiliUser(keyword: string): Promise<BilibiliUserResult | null> {
  await bilibiliLimiter.wait();

  try {
    const response = await axios.get<BilibiliUserSearchResponse>(
      'https://api.bilibili.com/x/web-interface/search/type',
      {
        params: {
          keyword,
          search_type: 'bili_user',
          page: 1,
          pagesize: 5
        },
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': 'https://search.bilibili.com/',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.code !== 0 || !response.data.data?.result?.length) {
      return null;
    }

    // Find user with exact or highly matching name
    const exactMatch = response.data.data.result.find(
      user => user.uname === keyword || user.uname.toLowerCase() === keyword.toLowerCase()
    );

    if (exactMatch) {
      return exactMatch;
    }

    // If top result has high follower count and name contains keyword, consider it a match
    const topResult = response.data.data.result[0];
    if (topResult.fans > 1000 && topResult.uname.includes(keyword)) {
      return topResult;
    }

    return null;
  } catch (error) {
    console.error('Bilibili user search error:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Get latest videos of Bilibili user
export async function getBilibiliUserVideos(mid: number): Promise<SearchResult[]> {
  await bilibiliLimiter.wait();

  try {
    const response = await axios.get<BilibiliSpaceResponse>(
      'https://api.bilibili.com/x/space/arc/search',
      {
        params: {
          mid,
          pn: 1,
          ps: 10,
          order: 'pubdate' // Sort by publish date
        },
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Referer': `https://space.bilibili.com/${mid}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    if (response.data.code !== 0 || !response.data.data?.list?.vlist) {
      return [];
    }

    const results: SearchResult[] = response.data.data.list.vlist.map(video => ({
      title: video.title,
      content: video.description || video.title,
      url: `https://www.bilibili.com/video/${video.bvid}`,
      source: 'bilibili' as const,
      sourceId: video.bvid,
      publishedAt: new Date(video.created * 1000),
      viewCount: video.play,
      commentCount: video.comment || video.review,
      danmakuCount: video.danmaku,
      author: {
        name: video.author,
        username: String(video.mid)
      }
    }));

    console.log(`Bilibili user ${mid} videos: found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('Bilibili user videos error:', error instanceof Error ? error.message : error);
    return [];
  }
}

// ============================================================
// Weibo Hot Search (public API, no login required, no API Key required)
// Match keywords via trending topics to see if the topic is trending on Weibo
// ============================================================

interface WeiboHotItem {
  word: string;
  note?: string;
  num: number;
  category?: string;
  mid?: string;
  raw_hot?: number;
}

export async function searchWeibo(query: string): Promise<SearchResult[]> {
  await weiboLimiter.wait();

  try {
    // Use Weibo hot search public API (no login required)
    const response = await axios.get('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json',
        'Referer': 'https://weibo.com/'
      },
      timeout: 15000
    });

    if (response.data?.ok !== 1 || !response.data?.data?.realtime) {
      console.log('Weibo hot search: no data or API error');
      return [];
    }

    const hotItems: WeiboHotItem[] = response.data.data.realtime;
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

    for (const item of hotItems) {
      const word = (item.note || item.word || '').toLowerCase();
      
      // Check if keyword matches hot search topic (either search word is in topic, or topic is in search word)
      const isMatch = queryWords.some(qw => word.includes(qw) || qw.includes(word))
        || word.includes(queryLower)
        || queryLower.includes(word);

      if (isMatch) {
        const topicName = item.note || item.word;
        const url = `https://s.weibo.com/weibo?q=${encodeURIComponent('#' + topicName + '#')}`;

        results.push({
          title: `🔥 Weibo Hot Search: ${topicName}`,
          content: `Weibo hot search topic "${topicName}", heat ${item.num?.toLocaleString() || 'unknown'}`,
          url,
          source: 'weibo' as const,
          viewCount: item.num || 0
        });
      }
    }

    // If no matching hot search, return the top trends as reference (valuable for hotspot monitoring)
    if (results.length === 0) {
      console.log(`Weibo hot search: no match for "${query}", returning top trends`);
    } else {
      console.log(`Weibo hot search: ${results.length} matches for "${query}"`);
    }

    return results;
  } catch (error) {
    console.error('Weibo hot search error:', error instanceof Error ? error.message : error);
    return [];
  }
}

// ============================================================
// Account detection and info fetching
// ============================================================

export interface AccountInfo {
  platform: 'bilibili' | 'weibo';
  name: string;
  id: string;
  followers: number;
  verified: boolean;
  description: string;
  avatar?: string;
}

// Detect if keyword is a platform account, and fetch the account's latest content
export async function detectAndFetchAccount(keyword: string): Promise<{
  accounts: AccountInfo[];
  results: SearchResult[];
}> {
  const accounts: AccountInfo[] = [];
  const results: SearchResult[] = [];

  // Parallel detection of Bilibili user
  try {
    const biliUser = await searchBilibiliUser(keyword);
    if (biliUser) {
      accounts.push({
        platform: 'bilibili',
        name: biliUser.uname,
        id: String(biliUser.mid),
        followers: biliUser.fans,
        verified: biliUser.official_verify?.type >= 0,
        description: biliUser.usign,
        avatar: biliUser.upic
      });

      console.log(`🎯 Detected Bilibili account: ${biliUser.uname} (${biliUser.fans} fans)`);

      // Get the user's latest videos
      const userVideos = await getBilibiliUserVideos(biliUser.mid);
      results.push(...userVideos);
    }
  } catch (error) {
    console.error('Bilibili account detection error:', error instanceof Error ? error.message : error);
  }

  return { accounts, results };
}

// ============================================================
// Domestic Aggregated Search
// ============================================================
export async function searchAllChina(query: string): Promise<SearchResult[]> {
  const results = await Promise.allSettled([
    searchSogou(query),
    searchBilibili(query),
    searchWeibo(query)
  ]);

  const allResults: SearchResult[] = [];
  const sourceNames = ['Sogou', 'Bilibili', 'Weibo'];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
      console.log(`  ${sourceNames[index]}: ${result.value.length} results`);
    } else {
      console.warn(`  ${sourceNames[index]} search failed:`, result.reason);
    }
  });

  return allResults;
}

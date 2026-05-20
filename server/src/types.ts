export interface SearchResult {
  title: string;
  content: string;
  url: string;
  source: 'twitter' | 'bing' | 'google' | 'duckduckgo' | 'hackernews' | 'sogou' | 'bilibili' | 'weibo';
  sourceId?: string;
  publishedAt?: Date;
  viewCount?: number;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number; // Twitter reply count
  quoteCount?: number; // Twitter quote count
  score?: number; // Hacker News score
  commentCount?: number; // Hacker News / Bilibili comments
  danmakuCount?: number; // Bilibili danmaku count
  author?: {
    name: string;
    username?: string;
    avatar?: string;
    followers?: number;
    verified?: boolean;
  };
}

// Twitter quality filter configuration
export interface TwitterFilterConfig {
  minLikes: number;
  minRetweets: number;
  minViews: number;
  minFollowers: number;
  onlyOriginalTweets: boolean; // Filter out replies and quotes
}

export interface AIAnalysis {
  isReal: boolean;
  relevance: number;
  relevanceReason: string; // AI judgment reason for relevance
  keywordMentioned: boolean; // Whether the keyword or its core concept is directly mentioned in the content
  importance: 'low' | 'medium' | 'high' | 'urgent';
  summary: string; // Association description with the keyword (not just content description)
}

export interface HotspotWithKeyword {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  sourceId: string | null;
  isReal: boolean;
  relevance: number;
  relevanceReason: string | null;
  keywordMentioned: boolean | null;
  importance: string;
  summary: string | null;
  viewCount: number | null;
  likeCount: number | null;
  retweetCount: number | null;
  replyCount: number | null;
  commentCount: number | null;
  quoteCount: number | null;
  danmakuCount: number | null;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatar: string | null;
  authorFollowers: number | null;
  authorVerified: boolean | null;
  publishedAt: Date | null;
  createdAt: Date;
  keywordId: string | null;
  keyword: {
    id: string;
    text: string;
    category: string | null;
  } | null;
}

export interface Tweet {
  type: string;
  id: string;
  url: string;
  text: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  author: {
    userName: string;
    name: string;
    isBlueVerified: boolean;
    profilePicture: string;
    followers: number;
  };
}

export interface TwitterSearchResponse {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
}

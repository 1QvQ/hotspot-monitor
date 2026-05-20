/**
 * Hotspot sorting utility functions
 * Shared by backend routing and frontend client sorting
 */

export interface SortableHotspot {
  likeCount: number | null;
  retweetCount: number | null;
  viewCount: number | null;
  importance: string;
  relevance: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
}

/** Importance level value mapping, smaller value means more important */
export const IMPORTANCE_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Calculate comprehensive hot score
 *
 * Formula design details:
 * - Likes serve as the primary sorting indicator, with the highest weight
 * - Retweets have the second highest weight
 * - View counts are scaled using log10 as an auxiliary signal
 *
 * The frontend uses the lightning icon (⚡) to display likeCount. Users intuitively
 * judge hotness by this, so likeCount must be the dominant factor.
 */
export function calcHotScore(item: SortableHotspot): number {
  const likes = item.likeCount || 0;
  const retweets = item.retweetCount || 0;
  const views = item.viewCount || 0;

  return likes * 10 + retweets * 5 + Math.log10(Math.max(views, 1)) * 2;
}

/**
 * Compare importance of two hotspots
 * Returns negative = a is more important, positive = b is more important, 0 = same
 */
export function compareImportance(a: SortableHotspot, b: SortableHotspot): number {
  return (IMPORTANCE_ORDER[a.importance] ?? 4) - (IMPORTANCE_ORDER[b.importance] ?? 4);
}

/**
 * Get timestamp (ms), compatible with Date objects and ISO strings
 */
function toTimestamp(d: Date | string | null): number {
  if (!d) return 0;
  return typeof d === 'string' ? new Date(d).getTime() : d.getTime();
}

/**
 * General sorting function
 * @param items - Hotspot array (will be copied, original array not modified)
 * @param sortBy - Sort field
 * @param sortOrder - Sort direction 'asc' | 'desc'
 * @returns Sorted new array
 */
export function sortHotspots<T extends SortableHotspot>(
  items: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): T[] {
  const sorted = [...items];
  const desc = sortOrder === 'desc';

  sorted.sort((a, b) => {
    let result: number;

    switch (sortBy) {
      case 'publishedAt': {
        const ta = toTimestamp(a.publishedAt);
        const tb = toTimestamp(b.publishedAt);
        result = ta - tb;
        // If publication times are the same or both null, fallback to creation time in descending order
        if (result === 0) {
          result = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
        }
        break;
      }

      case 'importance': {
        result = compareImportance(a, b);
        // If importance is the same, fallback to creation time in descending order as fallback
        if (result === 0) {
          result = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
          // 对兜底时间也应用 desc
          return desc ? -(result) : result;
        }
        // "desc" for importance means "most important first"
        // IMPORTANCE_ORDER is already urgent=0 < low=3
        // So result < 0 means a is more important
        // For desc we want a first, which returns negative -> return result directly
        // For asc we want a last, which returns positive -> return -result
        return desc ? result : -result;
      }

      case 'relevance':
        result = a.relevance - b.relevance;
        break;

      case 'hot':
        result = calcHotScore(a) - calcHotScore(b);
        break;

      default: // createdAt
        result = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
        break;
    }

    return desc ? -(result) : result;
  });

  return sorted;
}

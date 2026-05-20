import { describe, it, expect } from 'vitest';
import { sortHotspots, calcHotScore, compareImportance, IMPORTANCE_ORDER } from '../utils/sortHotspots.js';
import type { SortableHotspot } from '../utils/sortHotspots.js';

// ========== Test Data Factory ==========

function makeHotspot(overrides: Partial<SortableHotspot> = {}): SortableHotspot {
  return {
    likeCount: 0,
    retweetCount: 0,
    viewCount: 0,
    importance: 'medium',
    relevance: 50,
    publishedAt: '2026-02-25T10:00:00Z',
    createdAt: '2026-02-25T12:00:00Z',
    ...overrides,
  };
}

// ========== calcHotScore Unit Tests ==========

describe('calcHotScore', () => {
  it('pure likes scoring: likeCount * 10', () => {
    const item = makeHotspot({ likeCount: 100, retweetCount: 0, viewCount: 0 });
    // views=0 -> log10(max(0,1))=0, so hot score = 100 * 10 = 1000
    expect(calcHotScore(item)).toBeCloseTo(1000, 0);
  });

  it('pure retweets scoring: retweetCount * 5', () => {
    const item = makeHotspot({ likeCount: 0, retweetCount: 100, viewCount: 0 });
    expect(calcHotScore(item)).toBeCloseTo(500, 0);
  });

  it('viewCount scales with log10, does not overwhelm engagement metrics', () => {
    // Scenario: 561 likes + 10M views vs 11611 likes + 100K views
    // Old formula (viewCount * 0.01): 561*3 + 10000000*0.01 = 101683 vs 11611*3 + 100000*0.01 = 35833
    // Old formula incorrectly placed 561 likes before 11611 likes
    const lowLikesHighViews = makeHotspot({ likeCount: 561, retweetCount: 0, viewCount: 10_000_000 });
    const highLikesLowViews = makeHotspot({ likeCount: 11611, retweetCount: 0, viewCount: 100_000 });

    const scoreLow = calcHotScore(lowLikesHighViews);
    const scoreHigh = calcHotScore(highLikesLowViews);

    // 11611 likes post should have higher score
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('handles null viewCount safely', () => {
    const item = makeHotspot({ likeCount: 100, viewCount: null });
    expect(calcHotScore(item)).toBeCloseTo(1000, 0);
  });

  it('returns 0 when all metrics are null', () => {
    const item = makeHotspot({ likeCount: null, retweetCount: null, viewCount: null });
    expect(calcHotScore(item)).toBeCloseTo(0, 0);
  });

  it('comprehensive score: likes + retweets + views correctly weighted', () => {
    const item = makeHotspot({ likeCount: 1000, retweetCount: 200, viewCount: 1_000_000 });
    // 1000*10 + 200*5 + log10(1000000)*2 = 10000 + 1000 + 12 = 11012
    expect(calcHotScore(item)).toBeCloseTo(11012, 0);
  });
});

// ========== compareImportance Unit Tests ==========

describe('compareImportance', () => {
  it('urgent < high < medium < low (values increasing)', () => {
    expect(IMPORTANCE_ORDER['urgent']).toBeLessThan(IMPORTANCE_ORDER['high']);
    expect(IMPORTANCE_ORDER['high']).toBeLessThan(IMPORTANCE_ORDER['medium']);
    expect(IMPORTANCE_ORDER['medium']).toBeLessThan(IMPORTANCE_ORDER['low']);
  });

  it('urgent vs low returns negative (urgent is more important)', () => {
    const a = makeHotspot({ importance: 'urgent' });
    const b = makeHotspot({ importance: 'low' });
    expect(compareImportance(a, b)).toBeLessThan(0);
  });

  it('same importance level returns 0', () => {
    const a = makeHotspot({ importance: 'high' });
    const b = makeHotspot({ importance: 'high' });
    expect(compareImportance(a, b)).toBe(0);
  });

  it('fallback value for unknown importance is 4', () => {
    const a = makeHotspot({ importance: 'unknown' as any });
    const b = makeHotspot({ importance: 'low' }); // low = 3
    expect(compareImportance(a, b)).toBeGreaterThan(0);
  });
});

// ========== sortHotspots Sorting Rules Tests ==========

describe('sortHotspots', () => {
  // ---------- 1. createdAt Sorting ----------
  describe('Sort by creation time (createdAt)', () => {
    const items = [
      makeHotspot({ createdAt: '2026-02-25T10:00:00Z' }),
      makeHotspot({ createdAt: '2026-02-25T14:00:00Z' }),
      makeHotspot({ createdAt: '2026-02-25T08:00:00Z' }),
      makeHotspot({ createdAt: '2026-02-25T12:00:00Z' }),
    ];

    it('desc: newest first', () => {
      const sorted = sortHotspots(items, 'createdAt', 'desc');
      const times = sorted.map(h => h.createdAt);
      expect(times).toEqual([
        '2026-02-25T14:00:00Z',
        '2026-02-25T12:00:00Z',
        '2026-02-25T10:00:00Z',
        '2026-02-25T08:00:00Z',
      ]);
    });

    it('asc: oldest first', () => {
      const sorted = sortHotspots(items, 'createdAt', 'asc');
      const times = sorted.map(h => h.createdAt);
      expect(times).toEqual([
        '2026-02-25T08:00:00Z',
        '2026-02-25T10:00:00Z',
        '2026-02-25T12:00:00Z',
        '2026-02-25T14:00:00Z',
      ]);
    });

    it('does not modify original array', () => {
      const original = [...items];
      sortHotspots(items, 'createdAt', 'desc');
      expect(items).toEqual(original);
    });
  });

  // ---------- 2. publishedAt Sorting ----------
  describe('Sort by publish time (publishedAt)', () => {
    it('desc: newest published first', () => {
      const items = [
        makeHotspot({ publishedAt: '2026-02-24T06:00:00Z', createdAt: '2026-02-25T10:00:00Z' }),
        makeHotspot({ publishedAt: '2026-02-25T12:00:00Z', createdAt: '2026-02-25T08:00:00Z' }),
        makeHotspot({ publishedAt: '2026-02-23T18:00:00Z', createdAt: '2026-02-25T06:00:00Z' }),
      ];
      const sorted = sortHotspots(items, 'publishedAt', 'desc');
      expect(sorted.map(h => h.publishedAt)).toEqual([
        '2026-02-25T12:00:00Z',
        '2026-02-24T06:00:00Z',
        '2026-02-23T18:00:00Z',
      ]);
    });

    it('null publishedAt is placed last (desc)', () => {
      const items = [
        makeHotspot({ publishedAt: null, createdAt: '2026-02-25T15:00:00Z' }),
        makeHotspot({ publishedAt: '2026-02-25T12:00:00Z', createdAt: '2026-02-25T10:00:00Z' }),
        makeHotspot({ publishedAt: null, createdAt: '2026-02-25T08:00:00Z' }),
      ];
      const sorted = sortHotspots(items, 'publishedAt', 'desc');
      // Has publishedAt first, null fallbacks to createdAt
      expect(sorted[0].publishedAt).toBe('2026-02-25T12:00:00Z');
      // The two nulls are sorted by createdAt
      expect(sorted[1].createdAt).toBe('2026-02-25T15:00:00Z');
      expect(sorted[2].createdAt).toBe('2026-02-25T08:00:00Z');
    });
  });

  // ---------- 3. importance Sorting ----------
  describe('Sort by importance level (importance)', () => {
    const items = [
      makeHotspot({ importance: 'low', createdAt: '2026-02-25T10:00:00Z' }),
      makeHotspot({ importance: 'urgent', createdAt: '2026-02-25T09:00:00Z' }),
      makeHotspot({ importance: 'medium', createdAt: '2026-02-25T11:00:00Z' }),
      makeHotspot({ importance: 'high', createdAt: '2026-02-25T08:00:00Z' }),
      makeHotspot({ importance: 'urgent', createdAt: '2026-02-25T12:00:00Z' }),
    ];

    it('desc: most important first (urgent → high → medium → low)', () => {
      const sorted = sortHotspots(items, 'importance', 'desc');
      const importances = sorted.map(h => h.importance);
      expect(importances).toEqual(['urgent', 'urgent', 'high', 'medium', 'low']);
    });

    it('asc: least important first (low → medium → high → urgent)', () => {
      const sorted = sortHotspots(items, 'importance', 'asc');
      const importances = sorted.map(h => h.importance);
      expect(importances).toEqual(['low', 'medium', 'high', 'urgent', 'urgent']);
    });

    it('when importance is same, sort by creation time in descending order (desc)', () => {
      const sorted = sortHotspots(items, 'importance', 'desc');
      // Two urgents should be sorted by createdAt desc
      const urgents = sorted.filter(h => h.importance === 'urgent');
      expect(urgents[0].createdAt).toBe('2026-02-25T12:00:00Z');
      expect(urgents[1].createdAt).toBe('2026-02-25T09:00:00Z');
    });

    it('when importance is same, sort by creation time in ascending order (asc)', () => {
      const sorted = sortHotspots(items, 'importance', 'asc');
      const urgents = sorted.filter(h => h.importance === 'urgent');
      expect(urgents[0].createdAt).toBe('2026-02-25T09:00:00Z');
      expect(urgents[1].createdAt).toBe('2026-02-25T12:00:00Z');
    });
  });

  // ---------- 4. relevance Sorting ----------
  describe('Sort by relevance (relevance)', () => {
    const items = [
      makeHotspot({ relevance: 50 }),
      makeHotspot({ relevance: 95 }),
      makeHotspot({ relevance: 30 }),
      makeHotspot({ relevance: 85 }),
      makeHotspot({ relevance: 70 }),
    ];

    it('desc: highest relevance first', () => {
      const sorted = sortHotspots(items, 'relevance', 'desc');
      expect(sorted.map(h => h.relevance)).toEqual([95, 85, 70, 50, 30]);
    });

    it('asc: lowest relevance first', () => {
      const sorted = sortHotspots(items, 'relevance', 'asc');
      expect(sorted.map(h => h.relevance)).toEqual([30, 50, 70, 85, 95]);
    });
  });

  // ---------- 5. hot Sorting ----------
  describe('Sort by hotness (hot)', () => {
    it('desc: highest hot score first', () => {
      const items = [
        makeHotspot({ likeCount: 100, retweetCount: 10, viewCount: 1000 }),   // 100*3+10*5+30=380
        makeHotspot({ likeCount: 5000, retweetCount: 500, viewCount: 50000 }), // 5000*3+500*5+47=17547
        makeHotspot({ likeCount: 10, retweetCount: 0, viewCount: 100 }),       // 10*3+0+20=50
      ];
      const sorted = sortHotspots(items, 'hot', 'desc');
      expect(sorted[0].likeCount).toBe(5000);
      expect(sorted[1].likeCount).toBe(100);
      expect(sorted[2].likeCount).toBe(10);
    });

    it('asc: lowest hot score first', () => {
      const items = [
        makeHotspot({ likeCount: 5000, retweetCount: 200, viewCount: 100000 }),
        makeHotspot({ likeCount: 10, retweetCount: 0, viewCount: 100 }),
        makeHotspot({ likeCount: 500, retweetCount: 50, viewCount: 10000 }),
      ];
      const sorted = sortHotspots(items, 'hot', 'asc');
      expect(sorted[0].likeCount).toBe(10);
      expect(sorted[1].likeCount).toBe(500);
      expect(sorted[2].likeCount).toBe(5000);
    });

    it('[Core Bugfix Verification] high likes low views > low likes high views', () => {
      // Bug exposed in screenshot: 561 likes + 10M views should not be ranked before 11611 likes + 100K views
      const items = [
        makeHotspot({ likeCount: 561, retweetCount: 0, viewCount: 10_000_000 }),   // Low likes high views
        makeHotspot({ likeCount: 11611, retweetCount: 0, viewCount: 100_000 }),     // High likes low views
        makeHotspot({ likeCount: 39796, retweetCount: 0, viewCount: 5_000_000 }),   // Highest likes
      ];

      const sorted = sortHotspots(items, 'hot', 'desc');

      // 39796 likes should rank first
      expect(sorted[0].likeCount).toBe(39796);
      // 11611 likes should rank second (not 561)
      expect(sorted[1].likeCount).toBe(11611);
      // 561 likes should rank third
      expect(sorted[2].likeCount).toBe(561);
    });

    it('null engagement metrics are treated as 0', () => {
      const items = [
        makeHotspot({ likeCount: null, retweetCount: null, viewCount: null }),
        makeHotspot({ likeCount: 100, retweetCount: 0, viewCount: 0 }),
      ];
      const sorted = sortHotspots(items, 'hot', 'desc');
      expect(sorted[0].likeCount).toBe(100);
      expect(sorted[1].likeCount).toBe(null);
    });

    it('likes weight is higher than retweets', () => {
      // Pure retweets 100 vs pure likes 100: retweets score 500 vs likes score 1000
      // Under the new formula, likes weight > retweets weight
      const likes = makeHotspot({ likeCount: 100, retweetCount: 0, viewCount: 0 });
      const retweets = makeHotspot({ likeCount: 0, retweetCount: 100, viewCount: 0 });
      const sorted = sortHotspots([likes, retweets], 'hot', 'desc');
      expect(sorted[0].likeCount).toBe(100); // Likes weight 10 > retweets weight 5, likes first
    });

    it('[Screenshot Scenario Verification] 11774 likes should rank before 11611 likes', () => {
      // In user screenshot: 11,611 likes was placed before 11,774 likes, which is incorrect
      const items = [
        makeHotspot({ likeCount: 11611, retweetCount: 0, viewCount: 500_000 }),
        makeHotspot({ likeCount: 11774, retweetCount: 0, viewCount: 200_000 }),
      ];
      const sorted = sortHotspots(items, 'hot', 'desc');
      // 11774 likes > 11611 likes, even with fewer views, likes should dominate the ranking
      expect(sorted[0].likeCount).toBe(11774);
      expect(sorted[1].likeCount).toBe(11611);
    });

    it('likes are the dominating factor, view differences will not flip rankings', () => {
      // Even if one's views is 100x another, as long as likes difference is 200, the ranking will not flip
      const moreLikes = makeHotspot({ likeCount: 1200, retweetCount: 0, viewCount: 10_000 });
      const moreViews = makeHotspot({ likeCount: 1000, retweetCount: 0, viewCount: 1_000_000 });
      const sorted = sortHotspots([moreViews, moreLikes], 'hot', 'desc');
      expect(sorted[0].likeCount).toBe(1200);
    });
  });

  // ---------- Boundary Cases ----------
  describe('Boundary cases', () => {
    it('empty array returns empty array', () => {
      expect(sortHotspots([], 'createdAt', 'desc')).toEqual([]);
    });

    it('single element array remains unchanged', () => {
      const items = [makeHotspot({ relevance: 42 })];
      const sorted = sortHotspots(items, 'relevance', 'desc');
      expect(sorted.length).toBe(1);
      expect(sorted[0].relevance).toBe(42);
    });

    it('unknown sorting field falls back to createdAt', () => {
      const items = [
        makeHotspot({ createdAt: '2026-02-25T14:00:00Z' }),
        makeHotspot({ createdAt: '2026-02-25T10:00:00Z' }),
      ];
      const sorted = sortHotspots(items, 'unknownField', 'desc');
      expect(sorted[0].createdAt).toBe('2026-02-25T14:00:00Z');
    });

    it('supports mix of Date objects and ISO strings', () => {
      const items = [
        makeHotspot({ createdAt: new Date('2026-02-25T14:00:00Z') }),
        makeHotspot({ createdAt: '2026-02-25T10:00:00Z' }),
        makeHotspot({ createdAt: new Date('2026-02-25T16:00:00Z') }),
      ];
      const sorted = sortHotspots(items, 'createdAt', 'desc');
      // 16:00 > 14:00 > 10:00
      expect(new Date(sorted[0].createdAt).getTime()).toBeGreaterThan(new Date(sorted[1].createdAt).getTime());
      expect(new Date(sorted[1].createdAt).getTime()).toBeGreaterThan(new Date(sorted[2].createdAt).getTime());
    });

    it('default sorting direction is desc', () => {
      const items = [
        makeHotspot({ createdAt: '2026-02-25T10:00:00Z' }),
        makeHotspot({ createdAt: '2026-02-25T14:00:00Z' }),
      ];
      const sorted = sortHotspots(items, 'createdAt');
      expect(sorted[0].createdAt).toBe('2026-02-25T14:00:00Z');
    });
  });
});

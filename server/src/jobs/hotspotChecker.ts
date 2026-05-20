import { Server } from 'socket.io';
import { prisma } from '../db.js';
import { searchTwitter } from '../services/twitter.js';
import { searchBing, searchHackerNews, deduplicateResults } from '../services/search.js';
import { searchSogou, searchBilibili, searchWeibo, detectAndFetchAccount } from '../services/chinaSearch.js';
import { analyzeContent, expandKeyword, preMatchKeyword } from '../services/ai.js';
import { sendHotspotEmail } from '../services/email.js';
import type { SearchResult } from '../types.js';

// Freshness filter: discard content older than specified hours
// Twitter has limited time range via since: parameter, this is a fallback
const MAX_AGE_HOURS = 7 * 24; // 7 days

function filterByFreshness(results: SearchResult[]): SearchResult[] {
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 3600 * 1000);
  return results.filter(item => {
    // Retain items without a publish time for now (search engine results often lack time)
    if (!item.publishedAt) return true;
    return item.publishedAt >= cutoff;
  });
}

// Prioritize by source: Twitter > Weibo > Bilibili/Account Content > Search Engines
function prioritizeResults(results: SearchResult[]): SearchResult[] {
  const priorityMap: Record<string, number> = {
    twitter: 1,
    weibo: 2,
    bilibili: 3,
    hackernews: 4,
    sogou: 5,
    bing: 6,
    google: 7,
    duckduckgo: 8
  };
  return [...results].sort((a, b) => {
    return (priorityMap[a.source] || 99) - (priorityMap[b.source] || 99);
  });
}

export async function runHotspotCheck(io: Server): Promise<void> {
  console.log('🔍 Starting hotspot check...');

  // Get all active keywords
  const keywords = await prisma.keyword.findMany({
    where: { isActive: true }
  });

  if (keywords.length === 0) {
    console.log('No active keywords to monitor');
    return;
  }

  console.log(`Checking ${keywords.length} keywords...`);

  let newHotspotsCount = 0;

  for (const keyword of keywords) {
    console.log(`\n📎 Checking keyword: "${keyword.text}"`);

    try {
      // Step 1: Detect if the keyword is a platform account
      console.log(`  🎯 Detecting account for "${keyword.text}"...`);
      const accountResult = await detectAndFetchAccount(keyword.text);
      
      if (accountResult.accounts.length > 0) {
        for (const acc of accountResult.accounts) {
          console.log(`  ✅ Found ${acc.platform} account: ${acc.name} (${acc.followers} followers)`);
        }
      }

      // Step 1.5: Query Expansion
      console.log(`  🔍 Expanding keyword "${keyword.text}"...`);
      const expandedKeywords = await expandKeyword(keyword.text);
      console.log(`  📋 Expanded to ${expandedKeywords.length} variants: ${expandedKeywords.slice(0, 5).join(', ')}${expandedKeywords.length > 5 ? '...' : ''}`);

      // Step 2: Fetch data from multiple sources (International + Domestic parallel requests)
      const [
        twitterResults,
        bingResults,
        hackernewsResults,
        sogouResults,
        bilibiliResults,
        weiboResults
      ] = await Promise.allSettled([
        searchTwitter(keyword.text),
        searchBing(keyword.text),
        searchHackerNews(keyword.text),
        searchSogou(keyword.text),
        searchBilibili(keyword.text),
        searchWeibo(keyword.text)
      ]);

      const allResults: SearchResult[] = [];
      
      // Prioritize content from detected accounts
      if (accountResult.results.length > 0) {
        allResults.push(...accountResult.results);
        console.log(`  AccountFetch: ${accountResult.results.length} results`);
      }

      const sources = [
        { name: 'Twitter', result: twitterResults },
        { name: 'Bing', result: bingResults },
        { name: 'HackerNews', result: hackernewsResults },
        { name: 'Sogou', result: sogouResults },
        { name: 'Bilibili', result: bilibiliResults },
        { name: 'Weibo', result: weiboResults }
      ];

      for (const source of sources) {
        if (source.result.status === 'fulfilled') {
          allResults.push(...source.result.value);
          console.log(`  ${source.name}: ${source.result.value.length} results`);
        } else {
          console.log(`  ${source.name}: failed - ${source.result.reason}`);
        }
      }

      // Deduplication → Freshness filter → Prioritize by source
      const uniqueResults = deduplicateResults(allResults);
      const freshResults = filterByFreshness(uniqueResults);
      const sortedResults = prioritizeResults(freshResults);
      console.log(`  Total: ${allResults.length} raw → ${uniqueResults.length} unique → ${freshResults.length} fresh (within ${MAX_AGE_HOURS}h)`);

      // Handle results: Give Twitter more quota
      // Max 15 items for Twitter, 10 items for others
      let twitterProcessed = 0;
      let otherProcessed = 0;
      const TWITTER_QUOTA = 15;
      const OTHER_QUOTA = 10;

      for (const item of sortedResults) {
        // Check quotas
        if (item.source === 'twitter' && twitterProcessed >= TWITTER_QUOTA) continue;
        if (item.source !== 'twitter' && otherProcessed >= OTHER_QUOTA) continue;
        if (twitterProcessed + otherProcessed >= TWITTER_QUOTA + OTHER_QUOTA) break;
        try {
          // Check if already exists
          const existing = await prisma.hotspot.findFirst({
            where: {
              url: item.url,
              source: item.source
            }
          });

          if (existing) {
            continue;
          }

          // AI analysis (passing keyword and pre-match results)
          const fullText = item.title + '\n' + item.content;
          const preMatch = preMatchKeyword(fullText, expandedKeywords);
          const analysis = await analyzeContent(fullText, keyword.text, preMatch);

          // Save only real and relevant hotspots
          if (!analysis.isReal) {
            console.log(`  ❌ Filtered fake/spam: ${item.title.slice(0, 30)}...`);
            continue;
          }

          // Relevance threshold: filter below 50
          if (analysis.relevance < 50) {
            console.log(`  ⏭ Low relevance (${analysis.relevance}): ${item.title.slice(0, 30)}...`);
            continue;
          }

          // Extra rule: keyword not mentioned and relevance < 65 → filter
          if (!analysis.keywordMentioned && analysis.relevance < 65) {
            console.log(`  ⏭ Keyword not mentioned & relevance < 65 (${analysis.relevance}): ${item.title.slice(0, 30)}...`);
            continue;
          }

          // Save hotspot
          const hotspot = await prisma.hotspot.create({
            data: {
              title: item.title,
              content: item.content,
              url: item.url,
              source: item.source,
              sourceId: item.sourceId || null,
              isReal: analysis.isReal,
              relevance: analysis.relevance,
              relevanceReason: analysis.relevanceReason || null,
              keywordMentioned: analysis.keywordMentioned ?? null,
              importance: analysis.importance,
              summary: analysis.summary,
              viewCount: item.viewCount || null,
              likeCount: item.likeCount || null,
              retweetCount: item.retweetCount || null,
              replyCount: item.replyCount || null,
              commentCount: item.commentCount || null,
              quoteCount: item.quoteCount || null,
              danmakuCount: item.danmakuCount || null,
              authorName: item.author?.name || null,
              authorUsername: item.author?.username || null,
              authorAvatar: item.author?.avatar || null,
              authorFollowers: item.author?.followers || null,
              authorVerified: item.author?.verified ?? null,
              publishedAt: item.publishedAt || null,
              keywordId: keyword.id
            },
            include: {
              keyword: true
            }
          });

          newHotspotsCount++;
          if (item.source === 'twitter') twitterProcessed++;
          else otherProcessed++;
          console.log(`  ✅ New hotspot [${item.source}]: ${hotspot.title.slice(0, 40)}... (${analysis.importance})`);

          // Create notification
          await prisma.notification.create({
            data: {
              type: 'hotspot',
              title: `Found new hotspot: ${hotspot.title.slice(0, 50)}`,
              content: analysis.summary || hotspot.content.slice(0, 100),
              hotspotId: hotspot.id
            }
          });

          // WebSocket notification
          io.to(`keyword:${keyword.text}`).emit('hotspot:new', hotspot);
          io.emit('notification', {
            type: 'hotspot',
            title: 'New Hotspot Discovered',
            content: hotspot.title,
            hotspotId: hotspot.id,
            importance: hotspot.importance
          });

          // Email notification (only for high importance levels)
          if (['high', 'urgent'].includes(analysis.importance)) {
            await sendHotspotEmail(hotspot);
          }

        } catch (error) {
          console.error(`  Error processing result:`, error);
        }
      }

      // Avoid sending requests too quickly
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`Error checking keyword "${keyword.text}":`, error);
    }
  }

  console.log(`\n✨ Hotspot check completed. Found ${newHotspotsCount} new hotspots.`);
}

import { OpenRouter } from '@openrouter/sdk';
import type { AIAnalysis } from '../types.js';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? ''
});

// ========== Query Expansion ==========

/**
 * Use AI to expand keyword into multiple variations for text pre-filtering.
 * Returns expanded keyword list (including original keyword).
 * Results are cached so the same keyword does not trigger repeated AI calls.
 */
const expansionCache = new Map<string, string[]>();

export async function expandKeyword(keyword: string): Promise<string[]> {
  // 缓存命中
  if (expansionCache.has(keyword)) {
    return expansionCache.get(keyword)!;
  }

  // 不管 AI 是否可用，先提取基础核心词
  const coreTerms = extractCoreTerms(keyword);

  if (!process.env.OPENROUTER_API_KEY) {
    const result = [keyword, ...coreTerms];
    expansionCache.set(keyword, result);
    return result;
  }

  try {
    const result = await openRouter.chat.send({
      model: 'deepseek/deepseek-v3.2',
      messages: [
        {
          role: 'system',
          content: `You are a search query expansion expert. Given a monitored keyword, generate variants and relevant search terms for text matching.

Rules:
1. Include various spellings of the original keyword (casing, spaces, hyphenated variants).
2. Include core components of the keyword (split-up meaningful subwords).
3. Include common aliases, abbreviations, and bilingual translations.
4. Do NOT add generalized terms (e.g., if the keyword is "Claude Sonnet 4.6", do not add generic terms like "AI model").
5. The total number of variants should be between 5-15.

Output a JSON array only. Output nothing but the raw JSON array.
Example Input: "Claude Sonnet 4.6"
Example Output: ["Claude Sonnet 4.6", "Claude Sonnet", "Sonnet 4.6", "claude-sonnet-4.6", "Claude 4.6", "Anthropic Sonnet"]`
        },
        {
          role: 'user',
          content: keyword
        }
      ],
      temperature: 0.2,
      maxTokens: 300
    });

    const rawContent = result.choices[0]?.message?.content || '';
    const responseContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed: string[] = JSON.parse(jsonMatch[0]);
      // 确保原始关键词和核心词都在列表中
      const expanded = [...new Set([keyword, ...coreTerms, ...parsed.map(s => s.trim()).filter(Boolean)])];
      expansionCache.set(keyword, expanded);
      console.log(`  🔍 Query expansion for "${keyword}": ${expanded.length} variants`);
      return expanded;
    }
  } catch (error) {
    console.error('Query expansion failed:', error);
  }

  // Fallback：使用基础核心词
  const fallback = [keyword, ...coreTerms];
  expansionCache.set(keyword, fallback);
  return fallback;
}

/**
 * Extract core terms from keyword (pure text parsing, does not rely on AI)
 */
function extractCoreTerms(keyword: string): string[] {
  const terms: string[] = [];
  // 按空格、连字符、下划线分割
  const parts = keyword.split(/[\s\-_\/\\·]+/).filter(p => p.length >= 2);
  if (parts.length > 1) {
    terms.push(...parts);
    // 两两组合
    for (let i = 0; i < parts.length - 1; i++) {
      terms.push(parts[i] + ' ' + parts[i + 1]);
    }
  }
  // 去重，排除原始关键词本身
  return [...new Set(terms)].filter(t => t.toLowerCase() !== keyword.toLowerCase());
}

// ========== Keyword Pre-matching ==========

/**
 * Check if the text contains any of the expanded keywords (case-insensitive).
 * Returns whether it matches and the matched terms.
 */
export function preMatchKeyword(text: string, expandedKeywords: string[]): { matched: boolean; matchedTerms: string[] } {
  const lowerText = text.toLowerCase();
  const matchedTerms: string[] = [];
  for (const kw of expandedKeywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      matchedTerms.push(kw);
    }
  }
  return { matched: matchedTerms.length > 0, matchedTerms };
}

// ========== AI Content Analysis (Keyword-Aware) ==========

function buildAnalysisPrompt(keyword: string, preMatchResult: { matched: boolean; matchedTerms: string[] }): string {
  const matchHint = preMatchResult.matched 
    ? `\nNote: Text pre-matching found that the content contains the following keyword variants: ${preMatchResult.matchedTerms.join(', ')}` 
    : `\nNote: Text pre-matching found that the content does not directly mention any variants of the keyword "${keyword}". Please review relevance very strictly.`;

  return `You are a hotspot content relevance matching expert. Your task is to determine whether a given text is directly relevant to the specified monitoring keyword: [${keyword}].

${matchHint}

Analysis Points:
1. Determine if the content is real, high-quality, and valuable information (exclude clickbait, fake news, or marketing promotions).
2. Determine if the content is [directly] related to the keyword "${keyword}". Note:
   - Content that belongs to the same domain but does not mention/relate directly to the keyword should be scored below 40.
   - The content must directly discuss, mention, or have a substantial connection to "${keyword}" to receive a score of 60 or above.
   - Indirectly related content (e.g., similar products, same industry but different topic) should be scored 30-50.
3. Check if "${keyword}" or its equivalent representation is directly mentioned in the content (keywordMentioned).
4. Evaluate the importance of the hotspot (how important it is for someone tracking "${keyword}").
5. Write a one-sentence description explaining the relationship between the content and "${keyword}" (not a summary of the content itself, but a description of "how this content relates to the keyword").
6. Write a one-sentence justification explaining your relevance score.

Please output strictly in JSON format:
{
  "isReal": true/false,
  "relevance": 0-100,
  "relevanceReason": "Relevance scoring reason...",
  "keywordMentioned": true/false,
  "importance": "low/medium/high/urgent",
  "summary": "Relationship of this content with [${keyword}]: ..."
}

Output JSON only. Do not include any other text.`;
}

export async function analyzeContent(content: string, keyword: string, preMatchResult?: { matched: boolean; matchedTerms: string[] }): Promise<AIAnalysis> {
  // 默认预匹配结果
  const matchResult = preMatchResult ?? { matched: false, matchedTerms: [] };

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not configured, using fallback analysis');
    return {
      isReal: true,
      relevance: matchResult.matched ? 50 : 20,
      relevanceReason: 'AI service not configured, using default score',
      keywordMentioned: matchResult.matched,
      importance: 'low',
      summary: content.slice(0, 50) + '...'
    };
  }

  try {
    const prompt = buildAnalysisPrompt(keyword, matchResult);

    const result = await openRouter.chat.send({
      model: 'deepseek/deepseek-v3.2',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: content.slice(0, 2000) // 限制内容长度
        }
      ],
      temperature: 0.2, // 降低温度，提高判断一致性
      maxTokens: 500
    });

    const rawContent = result.choices[0]?.message?.content || '';
    const responseContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    
    // 尝试解析 JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isReal: Boolean(parsed.isReal),
        relevance: Math.min(100, Math.max(0, Number(parsed.relevance) || 0)),
        relevanceReason: String(parsed.relevanceReason || '').slice(0, 200),
        keywordMentioned: Boolean(parsed.keywordMentioned),
        importance: ['low', 'medium', 'high', 'urgent'].includes(parsed.importance) 
          ? parsed.importance 
          : 'low',
        summary: String(parsed.summary || '').slice(0, 150)
      };
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fallback
    return {
      isReal: true,
      relevance: matchResult.matched ? 30 : 10,
      relevanceReason: 'AI analysis failed, using default score',
      keywordMentioned: matchResult.matched,
      importance: 'low',
      summary: content.slice(0, 50) + '...'
    };
  }
}

export async function batchAnalyze(contents: string[], keyword: string, expandedKeywords?: string[]): Promise<AIAnalysis[]> {
  // Batch analysis, but limit concurrency
  const batchSize = 3;
  const results: AIAnalysis[] = [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(content => {
        const preMatch = expandedKeywords 
          ? preMatchKeyword(content, expandedKeywords) 
          : undefined;
        return analyzeContent(content, keyword, preMatch);
      })
    );
    results.push(...batchResults);
  }

  return results;
}

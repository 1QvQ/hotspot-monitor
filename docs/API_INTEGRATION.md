# 🔌 API Integration Technical Documentation

OpenRouter provides a unified interface to access multiple AI models (GPT-4, Claude, Llama, etc.) through a single API.

## 1. OpenRouter API Integration

### 1.1 SDK Installation

```bash
npm install @openrouter/sdk

```bash
npm install @openrouter/sdk
```

### 1.2 Basic Configuration

```typescript
import { OpenRouter } from "@openrouter/sdk";

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY ?? "",
});
```

### 1.3 Chat Completion Call

The primary use case is AI analysis of hotspots for authenticity and relevance:

```typescript
// Non-streaming call for hotspot analysis
async function analyzeHotspot(content: string) {
  const result = await openRouter.chat.send({
    model: "openai/gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: `You are an expert hotspot analyst specializing in AI industry news. 
Analyze the following content and provide:
1. Authenticity assessment (is this real news or clickbait/fake?)
2. Relevance score to AI programming domain (0-100)
3. Importance level (low/medium/high/urgent)
4. Short summary (max 50 words)

Return response as JSON with keys: isReal (boolean), relevance (number), importance (string), summary (string)`
      },
      {
        role: "user",
        content: content
      }
    ],
    temperature: 0.3,
    max_tokens: 500
  });

  const responseText = result.choices[0].message.content;
  return JSON.parse(responseText);
}
```

### 1.4 Response Format

```json
{
  "id": "chatcmpl-xxxxxxxxxxxxxxxxx",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "openai/gpt-4-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"isReal\": true, \"relevance\": 85, \"importance\": \"high\", \"summary\": \"OpenAI releases GPT-5 with multimodal capabilities...\"}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 120,
    "completion_tokens": 45,
    "total_tokens": 165
  }
}
```

### 1.5 Error Handling

```typescript
async function analyzeHotspotWithRetry(content: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await analyzeHotspot(content);
    } catch (error: any) {
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 1.6 Model Selection

OpenRouter supports multiple models with different costs and capabilities:

| Model | Speed | Cost | Recommended For |
|-------|-------|------|-----------------|
| gpt-4-turbo | Medium | High | Complex analysis, high accuracy |
| gpt-3.5-turbo | Fast | Low | Quick screening, volume |
| claude-3-opus | Slow | Medium | Reasoning-heavy tasks |
| mixtral-8x7b | Fast | Low | Budget-conscious usage |

---

## 2. Twitter API (twitterapi.io) Integration

### 2.1 Authentication Setup

```typescript
const TWITTER_API_BASE = 'https://api.twitterapi.io/v1';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;

const headers = {
  'X-API-Key': TWITTER_API_KEY,
  'Content-Type': 'application/json'
};
```

### 2.2 Advanced Search API

**Endpoint:** `GET /tweets/search/recent`

**Parameters:**
- `query` (string, required): Search query with advanced syntax support
- `queryType` (enum): `Latest` or `Top`
- `cursor` (string, optional): Pagination cursor
- `max_results` (integer, optional): 10-100, default 10

**Query Syntax Examples:**
```
"AI" OR "GPT" lang:en since:2024-01-01
from:OpenAI OR from:Anthropic
#AINews min_faves:100
```

**Request Example:**

```typescript
async function searchTwitter(query: string, cursor?: string) {
  const params = new URLSearchParams({
    query: query,
    max_results: '50',
    queryType: 'Latest'
  });
  
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetch(
    `${TWITTER_API_BASE}/tweets/search/recent?${params}`,
    { headers, method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.statusText}`);
  }

  return response.json();
}
```

**Response Format:**

```json
{
  "tweets": [
    {
      "type": "tweet",
      "id": "1234567890",
      "url": "https://twitter.com/user/status/1234567890",
      "text": "Breaking: OpenAI announces GPT-5...",
      "source": "Twitter Web App",
      "retweetCount": 1500,
      "replyCount": 300,
      "likeCount": 5000,
      "quoteCount": 200,
      "viewCount": 150000,
      "createdAt": "2024-01-15T10:30:00Z",
      "lang": "en",
      "author": {
        "userName": "techreporter",
        "name": "Tech Reporter",
        "isBlueVerified": true,
        "followers": 50000,
        "profilePicture": "https://..."
      },
      "entities": {
        "hashtags": [{ "text": "AI" }],
        "urls": [{ "expanded_url": "https://..." }]
      }
    }
  ],
  "has_next_page": true,
  "next_cursor": "xxxx"
}
```

### 2.3 Get Trending Topics

**Endpoint:** `GET /trends/place`

```typescript
async function getTrends(woeid: number = 1) { // 1 = Worldwide
  const params = new URLSearchParams({
    id: woeid.toString()
  });

  const response = await fetch(
    `${TWITTER_API_BASE}/trends/place?${params}`,
    { headers }
  );

  const data = await response.json();
  return data[0].trends;
}
```

---

## 3. Web Search Web Scraper

### 3.1 Bing Search Scraper

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
];

async function searchBing(query: string): Promise<SearchResult[]> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  const response = await axios.get('https://www.bing.com/search', {
    params: { q: query },
    headers: { 'User-Agent': userAgent }
  });

  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];

  $('li.b_algo').each((_, element) => {
    const title = $(element).find('h2 a').text();
    const url = $(element).find('h2 a').attr('href');
    const snippet = $(element).find('.b_caption p').text();
    
    if (title && url) {
      results.push({ title, url, snippet, source: 'bing' });
    }
  });

  return results;
}
```

### 3.2 Google Search Scraper

### 3.3 Rate Limiting for Web Scraping

```typescript
class RateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 5000; // 5 秒间隔

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const elapsed = Date.now() - this.lastRequestTime;
      if (elapsed < this.minInterval) {
        await new Promise(r => setTimeout(r, this.minInterval - elapsed));
      }
      
      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }
    
    this.processing = false;
  }
}
```

---

## 4. Prisma + SQLite Configuration

### 4.1 Schema Definition

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Keyword {
  id        String    @id @default(uuid())
  text      String    @unique
  category  String?
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  hotspots  Hotspot[]
}

model Hotspot {
  id          String   @id @default(uuid())
  title       String
  content     String
  url         String
  source      String   // twitter, bing, google
  sourceId    String?  // 原始推文ID等
  isReal      Boolean  @default(true)
  relevance   Int      @default(0)
  importance  String   @default("low")
  summary     String?
  viewCount   Int?
  likeCount   Int?
  retweetCount Int?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  keywordId   String?
  keyword     Keyword? @relation(fields: [keywordId], references: [id])
  
  @@unique([url, source])
}

model Notification {
  id        String   @id @default(uuid())
  type      String   // hotspot, alert
  title     String
  content   String
  isRead    Boolean  @default(false)
  hotspotId String?
  createdAt DateTime @default(now())
}

model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value String
}
```

### 4.2 Migration Commands

```bash
# Initialize database
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 4.3 Environment Variables

```env
DATABASE_URL="file:./dev.db"
```

---

## 5. Express + WebSocket Configuration

### 5.1 Server Setup

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (keywords: string[]) => {
    keywords.forEach(kw => socket.join(`keyword:${kw}`));
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast new hotspot notifications
function notifyNewHotspot(hotspot: Hotspot) {
  io.to(`keyword:${hotspot.keyword?.text}`).emit('hotspot:new', hotspot);
  io.emit('notification', {
    type: 'hotspot',
    title: 'New hotspot discovered',
    content: hotspot.title,
    timestamp: new Date()
  });
}

export { app, httpServer, io, notifyNewHotspot };
```

### 5.2 Route Structure

```typescript
// routes/keywords.ts
import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const keywords = await prisma.keyword.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(keywords);
});

router.post('/', async (req, res) => {
  const { text, category } = req.body;
  const keyword = await prisma.keyword.create({
    data: { text, category }
  });
  res.status(201).json(keyword);
});

router.delete('/:id', async (req, res) => {
  await prisma.keyword.delete({
    where: { id: req.params.id }
  });
  res.status(204).send();
});

export default router;
```

---

## 6. Scheduled Jobs Configuration

```typescript
import cron from 'node-cron';

// Run hotspot check every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running hotspot check...');
  await checkHotspots();
});

async function checkHotspots() {
  const keywords = await prisma.keyword.findMany({
    where: { isActive: true }
  });

  for (const keyword of keywords) {
    // 1. Search on Twitter
    const tweets = await searchTwitter(keyword.text);
    
    // 2. Search on Bing
    const webResults = await searchBing(keyword.text);
    
    // 3. AI analysis
    for (const item of [...tweets, ...webResults]) {
      const analysis = await analyzeHotspot(item.content);
      
      if (analysis.isReal && analysis.relevance > 60) {
        // 4. Save and notify
        const hotspot = await saveHotspot(item, analysis, keyword);
        notifyNewHotspot(hotspot);
      }
    }
  }
}
```

---

## 7. Email Notification Configuration

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmailNotification(hotspot: Hotspot) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `🔥 New Hotspot: ${hotspot.title}`,
    html: `
      <h2>${hotspot.title}</h2>
      <p>${hotspot.summary}</p>
      <p><strong>Importance:</strong> ${hotspot.importance}</p>
      <p><strong>Relevance:</strong> ${hotspot.relevance}%</p>
      <p><a href="${hotspot.url}">View Original</a></p>
    `
  });
}
```

---

## 8. Error Handling Best Practices

### 8.1 API Error Recovery

```typescript
// Retry strategy with exponential backoff
async function callApiWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Exponential backoff for server errors
      if (i < retries - 1) {
        const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
```

### 8.2 Database Error Handling

```typescript
// Prisma error handling
async function saveHotspotSafely(hotspot: any) {
  try {
    return await prisma.hotspot.create({
      data: hotspot
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      console.warn('Duplicate hotspot URL detected');
      return await prisma.hotspot.findFirst({
        where: { url: hotspot.url }
      });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      console.error('Referenced keyword not found');
      throw new Error('Invalid keyword reference');
    }
    throw error;
  }
}
```

### 8.3 Comprehensive Error Handler

```typescript
// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] Error:`, {
    status,
    message,
    path: req.path,
    method: req.method,
    stack: error.stack
  });

  res.status(status).json({
    error: {
      status,
      message,
      timestamp: new Date(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});
```

---

## Summary

This API Integration Technical Documentation covers:

1. **OpenRouter API**: Unified AI model access with error handling and retry logic
2. **Twitter API**: Authentication, tweet search, advanced queries, and trending topics
3. **Web Scraping**: Bing/Google search with rate limiting and polite crawling
4. **Database**: Prisma ORM configuration with SQLite
5. **Server Setup**: Express with WebSocket (Socket.io) for real-time notifications
6. **Scheduled Tasks**: Cron jobs for periodic hotspot checking and processing
7. **Email Notifications**: Nodemailer configuration for alert distribution
8. **Error Handling**: Comprehensive error recovery strategies and graceful shutdown

### Key Integration Points:

```
User Input (Keywords)
        ↓
     Scheduler
        ↓
  Multi-Source Search
  ├─ Twitter API
  ├─ Web Scraper
  └─ Search APIs
        ↓
   AI Analysis
  (OpenRouter)
        ↓
   Database
  (Prisma/SQLite)
        ↓
   Notifications
  ├─ WebSocket (Real-time)
  ├─ Email (Batch)
  └─ UI Updates
```

### Environment Variables Required:

```env
# OpenRouter AI
OPENROUTER_API_KEY=your_key_here

# Twitter API
TWITTER_API_KEY=your_key_here
TWITTER_API_SECRET=your_secret_here
TWITTER_BEARER_TOKEN=your_token_here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password_here
NOTIFY_EMAIL=recipient@example.com

# Database
DATABASE_URL=file:./dev.db

# Server
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Testing Checklist:

- [ ] API key authentication works correctly
- [ ] Error handling catches all edge cases
- [ ] Database migrations run successfully
- [ ] WebSocket connections establish properly
- [ ] Scheduled jobs execute on time
- [ ] Email notifications deliver correctly
- [ ] Rate limiting prevents API throttling
- [ ] Error logs contain sufficient debugging info
```

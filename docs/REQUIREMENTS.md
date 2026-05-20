# 📋 Requirements Document - AI Hotspot Monitor

## 1. Project Background

- Discover AI industry hotspots (e.g., new model releases) in real-time
- Avoid manual searching for trending topics
- Automatically detect and monitor changes
- Receive timely notifications

## 2. Functional Requirements

### 2.1 Keyword Monitoring

| Requirement | Description | Priority |
|------------|-------------|----------|
| Add Keywords | Users can add multiple monitoring keywords | P0 |
| Edit/Delete Keywords | Manage existing monitored keywords | P0 |
| Real-time Monitoring | Check keywords every 30 minutes | P0 |
| AI Authenticity Check | Use AI to identify fake or misleading content | P0 |
| Duplicate Filtering | Avoid duplicate notifications for the same hotspot | P1 |
| Activate/Pause | Enable or temporarily pause keyword monitoring | P1 |
| Keyword Categories | Organize keywords by category for better management | P2 |

### 2.2 Hotspot Collection

| Requirement | Description | Priority |
|------------|-------------|----------|
| Scheduled Collection | Collect hotspots every 30 minutes | P0 |
| Multiple Sources | Web search + Twitter/X | P0 |
| Domain Filtering | Users can specify collection domain (e.g., "AI Programming") | P0 |
| Hotspot List | Display collected hotspots | P0 |
| AI Analysis | Analyze hotspot credibility and relevance | P1 |
| Historical Records | Save hotspot history for reference | P1 |
| Source Attribution | Credit original source of each hotspot | P1 |
| Time Range Filter | Filter hotspots by publication date | P2 |

### 2.3 Notification System

| Requirement | Description | Priority |
|------------|-------------|----------|
| Browser Push | Real-time WebSocket notifications | P0 |
| Email Notifications | SMTP-based email alerts | P0 |
| Notification Settings | Configure notification methods and frequency | P1 |
| Notification History | View past notifications | P2 |
| Do-Not-Disturb Mode | Option to mute notifications during specified hours | P2 |
| Smart Batching | Batch multiple hotspots into single notification if needed | P3 |

### 2.4 User Interface

| Requirement | Description | Priority |
|------------|-------------|----------|
| Responsive Design | Desktop and mobile compatibility | P0 |
| Cyberpunk Aesthetic | Modern, tech-forward visual design | P0 |
| Real-time Updates | Live refresh of hotspot data | P1 |
| Dark Theme | Eye-friendly dark color scheme | P1 |
| Multi-language | Support for English and Chinese | P2 |
| Search Functionality | Global keyword search across hotspots | P2 |
| Export Data | Export hotspots as CSV/JSON | P3 |

### 2.5 Filtering and Sorting

| Requirement | Description | Priority |
|------------|-------------|----------|
| Filter by Source | Filter hotspots by origin (Twitter, Web, etc.) | P0 |
| Filter by Relevance | Show only high-relevance hotspots | P0 |
| Filter by Time Range | Filter by publication date | P1 |
| Sort by Trending | Sort by engagement/trending score | P0 |
| Sort by Relevance | Sort by AI-calculated relevance score | P0 |
| Sort by Date | Sort by publication or discovery date | P0 |
| Importance Level | Visual indicators for hotspot importance | P1 |

### 2.6 Search Capabilities

| Requirement | Description | Priority |
|------------|-------------|----------|
| Global Search | Search all data sources for keywords | P0 |
| Advanced Search | Support for complex search operators | P1 |
| Search History | Track recent searches | P2 |

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Specification | Priority |
|------------|---------------|----------|
| Page Load Time | < 3 seconds | P0 |
| API Response Time | < 1 second | P0 |
| Database Query Time | < 500ms | P0 |
| WebSocket Latency | < 200ms | P0 |
| Concurrent Users | Support at least 100 concurrent connections | P1 |
| Keyword Limit | Support monitoring 100+ keywords | P0 |

### 3.2 Reliability

| Requirement | Specification | Priority |
|------------|---------------|----------|
| Uptime | 99.5% availability (7x24 hours) | P0 |
| Data Persistence | No data loss on service restart | P0 |
| Error Recovery | Graceful handling of API failures | P1 |
| Retry Logic | Auto-retry failed requests | P1 |
| Backup Strategy | Daily automated database backups | P2 |

### 3.3 Scalability

| Requirement | Specification | Priority |
|------------|---------------|----------|
| Horizontal Scaling | Support multiple server instances | P1 |
| Database Optimization | Indexed queries for performance | P1 |
| Caching Strategy | Cache frequently accessed data | P2 |
| Load Balancing | Distribute requests across servers | P2 |

### 3.4 Security

| Requirement | Specification | Priority |
|------------|---------------|----------|
| API Key Security | Secure storage, never expose in logs | P0 |
| Input Validation | Validate all user inputs | P0 |
| SQL Injection Prevention | Use prepared statements (ORM) | P0 |
| Sensitive Data | Encrypt sensitive configuration | P1 |
| CORS Configuration | Restrict cross-origin requests | P0 |
| Rate Limiting | Prevent API abuse | P1 |
| HTTPS/TLS | Encrypted communication in production | P0 |

### 3.5 Maintainability

| Requirement | Specification | Priority |
|------------|---------------|----------|
| Code Quality | Clear, well-documented code | P1 |
| Testing | Unit tests for critical functions | P1 |
| Logging | Structured logging for debugging | P1 |
| Error Tracking | Monitor and alert on errors | P2 |
| Documentation | API docs and setup guides | P1 |

## 4. Data Source Specifications

### 4.1 Web Search Crawler

**Target Search Engines:**
- Bing Search (Primary)
- Google Search (Backup)

**Scraping Strategy:**
- Request Frequency: 5-10 second interval between requests
- User-Agent Rotation: Vary user agents to avoid detection
- Proxy Support: Optional for large-scale scraping

**Data Extraction:**
- Article Title
- Article Summary/Snippet
- Content URL
- Publication Date (if available)
- Favicon/Source Logo

**Rate Limiting:**
- Maximum 10 requests per minute per domain
- Implement exponential backoff on 429/503 errors
- Respect robots.txt guidelines

### 4.2 Twitter/X API Integration

**API Provider:** twitterapi.io

**Data to Collect:**
- Tweet Text Content
- Publication Timestamp
- Author Information
- Engagement Metrics (likes, retweets, replies, views)
- Hashtags and URLs

**Search Methods:**
- Keyword-based search
- Time range filtering
- Trending score sorting
- Language filtering

**Rate Limits:**
- Respect API rate limits
- Implement queuing for requests
- Cache results when possible

**Tweet Analysis:**
- Identify spam/bot tweets
- Calculate relevance to AI programming
- Extract key information via AI

### 4.3 Other Potential Sources (Future)

- HackerNews API
- Medium RSS/API
- YouTube API
- Reddit API
- Bilibili (Chinese video platform)
- WeChat Official Accounts

## 5. Data Models

### Keyword Model
```
- id (UUID)
- text (String, unique)
- category (String)
- isActive (Boolean)
- createdAt (DateTime)
- updatedAt (DateTime)
- hotspots (Relationship: many Hotspots)
```

### Hotspot Model
```
- id (UUID)
- title (String)
- content (String)
- url (String)
- source (String: twitter/bing/google/etc)
- sourceId (String: original ID from source)
- isReal (Boolean)
- relevance (Integer: 0-100)
- importance (String: low/medium/high/urgent)
- summary (String)
- viewCount (Integer)
- likeCount (Integer)
- retweetCount (Integer)
- publishedAt (DateTime)
- createdAt (DateTime)
- keywordId (FK to Keyword)
```

### Notification Model
```
- id (UUID)
- type (String: hotspot/alert)
- title (String)
- content (String)
- isRead (Boolean)
- hotspotId (FK to Hotspot)
- createdAt (DateTime)
```

### User Settings Model
```
- id (UUID)
- notificationsEnabled (Boolean)
- emailNotificationsEnabled (Boolean)
- emailAddress (String)
- updateFrequency (String: real-time/hourly/daily)
- theme (String: light/dark)
```

## 6. API Endpoints Overview

### Keywords
- `GET /api/keywords` - List all keywords
- `POST /api/keywords` - Create new keyword
- `PUT /api/keywords/:id` - Update keyword
- `DELETE /api/keywords/:id` - Delete keyword
- `PATCH /api/keywords/:id/toggle` - Toggle active status

### Hotspots
- `GET /api/hotspots` - List hotspots with filters
- `GET /api/hotspots/:id` - Get hotspot details
- `GET /api/hotspots/keyword/:keywordId` - Get hotspots for keyword
- `DELETE /api/hotspots/:id` - Delete hotspot

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## 7. WebSocket Events

### Client → Server
- `subscribe` - Subscribe to keyword updates
- `unsubscribe` - Unsubscribe from updates

### Server → Client
- `hotspot:new` - New hotspot discovered
- `notification:new` - New notification
- `keyword:updated` - Keyword status changed

## 8. Success Criteria

- ✅ Successfully collect hotspots every 30 minutes
- ✅ AI analysis accuracy > 85% on authenticity
- ✅ Zero data loss on unexpected shutdown
- ✅ Real-time notifications received within 1 second
- ✅ Page loads within 3 seconds on standard connection
- ✅ Support 100+ concurrent keywords
- ✅ Email notifications sent reliably
- ✅ No false positives from duplicate detection

## 9. Timeline & Milestones

| Phase | Duration | Tasks |
|-------|----------|-------|
| Planning | 1 week | Requirements, design, architecture |
| Backend MVP | 2 weeks | API, database, AI integration |
| Frontend MVP | 2 weeks | UI components, real-time updates |
| Integration | 1 week | Connect frontend and backend |
| Testing | 1 week | QA, bug fixes, optimization |
| Deployment | 1 week | Production setup, monitoring |

## 10. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|----------|
| API Rate Limiting | Medium | High | Implement queue, caching |
| Web Scraping Blocked | Medium | Medium | Proxy rotation, User-Agent variation |
| AI Analysis Cost | Medium | Medium | Batch requests, cache results |
| Database Performance | Low | High | Proper indexing, query optimization |
| WebSocket Stability | Low | High | Heartbeat, reconnection logic |

## 11. Future Enhancements (P3+)

- Mobile app (React Native/Flutter)
- Custom AI model fine-tuning
- Integration with Slack/Discord bots
- Predictive trending (ML model)
- User accounts and authentication
- Advanced analytics dashboard
- API for external integrations
- Commercial pricing tiers

## 5. AI Analysis Specifications

### 5.1 OpenRouter Integration

**Purpose:**
1. **Authenticity Identification** - Determine if the content is fake or clickbait.
2. **Trending Analysis** - Evaluate the value and relevance of hot topics.
3. **Content Summarization** - Generate short summaries for trending topics.

**Model Selection:**
- **Primary Model:** Claude or GPT-4
- **Backup Model:** Gemini

**Prompt Design:**
```
You are a trending analysis expert. Please analyze the following content:
1. Determine whether it is a real trending news item (exclude clickbait and fake news).
2. Evaluate the relevance of this trending topic to the designated field (0-100 points).
3. Evaluate the importance level of the trending topic (low/medium/high/urgent).
4. Generate a short summary (within 50 words).

Output JSON format:
{
  "isReal": true/false,
  "relevance": 0-100,
  "importance": "low/medium/high/urgent",
  "summary": "..."
}
```

## 6. Product Form

### 6.1 Web Page

**Page Structure:**
1. **Dashboard** - Overview of trending statistics.
2. **Keyword Management** - Add, edit, and delete keywords.
3. **Trending List** - Display collected hot topics.
4. **Settings Page** - Notification configuration and API configuration.

**UI Style:**
- Dynamic particle background
- Card-based layout
- Responsive adaptation

### 6.2 Agent Skills

**Skill Description:**
- Used as a Copilot Agent Skill.
- Can be invoked by other AIs.
- Supports keyword monitoring and trending topic queries.

## 7. Interface Design

### 7.1 RESTful API

```
# Keyword Management
GET    /api/keywords         # Get all keywords
POST   /api/keywords         # Add a keyword
PUT    /api/keywords/:id     # Update a keyword
DELETE /api/keywords/:id     # Delete a keyword

# Trending Data
GET    /api/hotspots         # Get trending list
GET    /api/hotspots/:id     # Get trending details
POST   /api/hotspots/search  # Manually search trending topics

# Settings
GET    /api/settings         # Get settings
PUT    /api/settings         # Update settings

# Notifications
GET    /api/notifications    # Get notification history
```

### 7.2 WebSocket Events

```
# Server -> Client
hotspot:new      # New trending topic discovered
hotspot:update   # Trending topic updated
notification     # Notification message

# Client -> Server
subscribe        # Subscribe to keywords
unsubscribe      # Unsubscribe from keywords
```

## 8. Acceptance Criteria

### 8.1 Functional Acceptance
- [ ] Able to add and manage monitored keywords.
- [ ] Able to automatically crawl trending topics from multiple data sources.
- [ ] AI can correctly identify fake or clickbait content.
- [ ] Able to receive real-time push notifications via the browser.
- [ ] Able to receive notifications via email.
- [ ] Page responsive adaptation functions normally.
- [ ] UI style is unique and visually appealing.

### 8.2 Performance Acceptance
- [ ] Page load time < 3s.
- [ ] Trending topic crawling function is stable.
- [ ] Notifications are sent in a timely manner.

### 8.3 Agent Skills Acceptance
- [ ] Skill file format is correct.
- [ ] Can be correctly invoked by AI.
- [ ] Returned data format is standardized.

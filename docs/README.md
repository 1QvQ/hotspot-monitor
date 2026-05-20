# 🔥 AI Hotspot Monitor Documentation

> An AI-powered tool that automatically discovers hotspots, intelligently identifies fake content, and sends real-time notifications

## 📋 Project Overview

- Automated monitoring of specified keywords for trending topics
- AI-powered identification of fake or misleading content
- Instant notifications when relevant hotspots are discovered
- Periodic collection of industry trending topics

## 🎯 Core Features

### 1. Keyword Monitoring
- Users input keywords to monitor for trending topics
- When related content appears, AI verifies authenticity
- Instant notifications are sent to users

### 2. Hotspot Collection
- Automatically collects trending topics within specified domains every 30 minutes
- Aggregates data from multiple sources to ensure comprehensive coverage
- AI analyzes hotspot value and credibility

### 3. Notification System
- Real-time browser push via WebSocket
- Email notifications via SMTP

## 🛠️ Technology Stack

| Layer | Technology | Description |
|-------|-----------|----------|
| Frontend | React + Vite + TailwindCSS | Responsive, cyberpunk-style UI |
| Backend | Node.js + Express | Lightweight API service |
| Database | SQLite + Prisma | Lightweight storage with ORM |
| AI Service | OpenRouter API | Hotspot verification and content analysis |
| Scheduled Jobs | node-cron | Scheduled hotspot collection |
| Real-time Communication | Socket.io | Browser push notifications |
| Email | Nodemailer | Email notifications |

## 📊 Data Sources

| Source | Method | Description |
|--------|--------|----------|
| Web Search | Bing/Google Web Scraping | No API required, frequency-controlled |
| Twitter/X | twitterapi.io | Official API integration |
| Aggregation | Multi-source deduplication + AI analysis | Ensures information quality |

## 📁 Project Structure

```
hotspot-monitor/
├── docs/                    # Documentation directory
│   ├── README.md           # Project overview
│   ├── REQUIREMENTS.md     # Requirements document
│   ├── LOCAL_SETUP.md      # Local development setup
│   └── API_INTEGRATION.md  # API integration guide
├── server/                  # Backend service
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── search.ts   # Search service
│   │   │   ├── twitter.ts  # Twitter service
│   │   │   ├── ai.ts       # AI analysis service
│   │   │   └── email.ts    # Email notification
│   │   ├── jobs/           # Scheduled tasks
│   │   ├── db.ts           # Database setup
│   │   ├── types.ts        # TypeScript types
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Prisma ORM
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── services/       # API integration
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── vite.config.ts      # Vite configuration
│   └── package.json
├── skills/                  # Agent Skills package
│   └── SKILL.md            # Skills documentation
└── README.md               # Main project readme
```

## ⚙️ Configuration Overview

```env
# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_key

# Twitter API (twitterapi.io)
TWITTER_API_KEY=your_twitter_api_key

# Email Notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_FROM=your_email@example.com

# Monitoring Configuration
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="file:./dev.db"
```

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/1QvQ/hotspot-monitor.git
cd hotspot-monitor

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Initialize database
cd server && npm run db:migrate

# 5. Start services
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

## 📚 Documentation

- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Complete local development setup guide
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Detailed functional and non-functional requirements
- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - API integration technical documentation

## 🔑 Key Technologies Explained

### Frontend
- **React 19**: Latest UI library for building interactive components
- **Vite**: Ultra-fast build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Socket.io Client**: Real-time WebSocket communication
- **Framer Motion**: Animation library for smooth transitions

### Backend
- **Express 5**: Lightweight and flexible web framework
- **Prisma**: Type-safe ORM for database operations
- **Socket.io**: Real-time bidirectional communication
- **node-cron**: Job scheduler for automated tasks
- **Nodemailer**: SMTP email sending
- **Cheerio**: Server-side HTML parsing for web scraping
- **Axios**: HTTP client for API requests

### AI & APIs
- **OpenRouter**: Unified API for accessing multiple AI models
- **twitterapi.io**: Simplified Twitter API wrapper
- **Bing/Google**: Web search for article discovery

## 🌟 Key Features Explained

### AI-Powered Content Analysis
Uses OpenRouter API to evaluate:
- Authenticity of hotspot claims
- Relevance to AI programming domain (0-100 score)
- Importance level (low/medium/high/urgent)
- Auto-generated summaries

### Multi-Source Aggregation
Collects information from:
- Twitter/X for real-time updates
- Web search for articles and news
- Deduplicates and ranks results using AI

### Real-time Notifications
- **WebSocket Push**: Instant browser notifications
- **Email Alerts**: SMTP-based email notifications
- **Configurable Settings**: Users control notification preferences

### Automated Monitoring
- Runs every 30 minutes by default
- Configurable keywords and categories
- Intelligent filtering to reduce noise

## 📖 Development Workflow

### Code Structure

```
server/src/
├── index.ts              # Server entry point
├── db.ts                 # Database client
├── types.ts              # Shared TypeScript types
├── routes/
│   ├── hotspots.ts       # Hotspot API endpoints
│   ├── keywords.ts       # Keyword management
│   ├── notifications.ts  # Notification endpoints
│   └── settings.ts       # User settings
├── services/
│   ├── ai.ts            # OpenRouter AI analysis
│   ├── search.ts        # Web search functionality
│   ├── twitter.ts       # Twitter API integration
│   └── email.ts         # Email notifications
├── jobs/
│   └── hotspotChecker.ts # Scheduled hotspot monitoring
└── utils/
    └── sortHotspots.ts  # Hotspot ranking logic
```

## 🔄 Data Flow

```
Keywords (User Input)
    ↓
Scheduled Job (Every 30 min)
    ↓
Data Collection (Twitter + Web Search)
    ↓
AI Analysis (OpenRouter)
    ↓
Filtering & Ranking
    ↓
Save to Database
    ↓
Real-time Notification (WebSocket + Email)
    ↓
User Receives & Reviews
```

## ✅ Testing & Validation

### Backend Tests
```bash
cd server
npm run test              # Run all tests
npm run test:watch      # Watch mode
```

### Frontend Linting
```bash
cd client
npm run lint             # Check code quality
```

## 📊 Performance Considerations

- **Database**: SQLite with indexed queries for fast lookups
- **API Calls**: Rate limiting to respect API quotas
- **Web Scraping**: Controlled frequency (5-10s intervals) to avoid blocking
- **Real-time Updates**: WebSocket for instant push (no polling)
- **Caching**: AI results cached to reduce redundant analysis

## 🔐 Security Best Practices

- Store all API keys in `.env` (never commit to git)
- Use HTTPS in production
- Validate and sanitize all user inputs
- Implement rate limiting on API endpoints
- Use prepared statements (Prisma handles this)
- Rotate API keys regularly

## 🚀 Deployment Considerations

- Use environment-specific configuration
- Implement health check endpoints
- Add structured logging
- Set up error tracking and monitoring
- Configure reverse proxy (nginx) for production
- Use process manager (PM2) for auto-restart


# 🚀 Local Setup Guide

This guide will help you set up the **AI Hotspot Monitor** project locally for development and testing.

## Prerequisites

Before getting started, ensure you have the following installed on your machine:

- **Node.js** >= 18.x (recommend 20.x or higher)
- **npm** >= 10.x or **yarn** >= 4.x
- **Git**
- **SQLite** (included with most systems) or configure another database
- A **code editor** (VS Code, WebStorm, etc.)

### Verify Installation

```bash
node --version
npm --version
git --version
```

## Project Structure Overview

```
hotspot-monitor/
├── client/              # React 19 + Vite frontend
├── server/              # Express 5 + Prisma backend
├── docs/                # Documentation
├── skills/              # Agent Skills package
└── README.md            # Project overview
```

## Step 1: Clone the Repository

```bash
git clone https://github.com/1QvQ/hotspot-monitor.git 
cd hotspot-monitor
```

## Step 2: Backend Setup

### 2.1 Install Dependencies

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

### 2.2 Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
TWITTER_API_KEY=your_twitter_api_key

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL
CLIENT_URL=http://localhost:5173
```

**Important Notes:**
- Replace placeholder values with your actual API keys
- For Gmail SMTP, generate an [App Password](https://myaccount.google.com/apppasswords)
- Obtain OpenRouter API key from [OpenRouter](https://openrouter.ai/)
- For Twitter API, use [twitterapi.io](https://twitterapi.io/)

### 2.3 Setup Database

Initialize the Prisma database:

```bash
# Generate Prisma client
npm run db:generate

# Create/migrate database
npm run db:migrate

# Optional: Open Prisma Studio for database visualization
npm run db:studio
```

### 2.4 Start Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

**Expected Output:**
```
Server is running on http://localhost:3000
```

## Step 3: Frontend Setup

### 3.1 Install Dependencies

In a **new terminal**, navigate to the client directory:

```bash
cd client
npm install
```

### 3.2 Configure Environment Variables

Create a `.env` file in the `client` directory (if needed):

```env
VITE_API_URL=http://localhost:3000
```

### 3.3 Start Development Server

```bash
npm run dev
```

The client will start on `http://localhost:5173`

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 4: Verify Everything Works

1. Open your browser and navigate to `http://localhost:5173`
2. You should see the AI Hotspot Monitor interface
3. Open browser DevTools (F12) and check the Console for any errors
4. Check the backend server logs for incoming requests

## Running Both Services

### Option 1: Two Terminal Windows

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Option 2: Using Concurrently (Optional)

Install concurrently globally or in the root:

```bash
npm install -g concurrently
```

From root directory:
```bash
concurrently "cd server && npm run dev" "cd client && npm run dev"
```

## Development Workflow

### Building for Production

**Backend:**
```bash
cd server
npm run build
npm run start
```

**Frontend:**
```bash
cd client
npm run build
```

### Running Tests

**Backend:**
```bash
cd server
npm run test              # Run tests once
npm run test:watch       # Run tests in watch mode
```

**Frontend:**
```bash
cd client
npm run lint             # Run ESLint
```

### Database Management

```bash
# Apply pending migrations
npm run db:migrate

# Push schema changes to database
npm run db:push

# Open Prisma Studio (GUI for database)
npm run db:studio

# Reset database (warning: destructive)
npx prisma migrate reset
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

**For Backend (port 3000):**
```bash
lsof -i :3000
kill -9 <PID>
```

**For Frontend (port 5173):**
```bash
lsof -i :5173
kill -9 <PID>
```

### Module Not Found Errors

Ensure all dependencies are installed:

```bash
# Backend
cd server && npm install

# Frontend
cd client && npm install
```

Clear npm cache if issues persist:
```bash
npm cache clean --force
```

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env` is correct
2. Ensure the database file has read/write permissions:
   ```bash
   chmod 666 server/dev.db
   ```
3. Reset the database:
   ```bash
   cd server
   npx prisma migrate reset
   ```

### API Key Errors

- Verify all API keys in `.env` are correct
- Ensure they have proper permissions/scopes
- Check that API services are not rate-limited
- Regenerate keys if necessary

### WebSocket Connection Issues

- Ensure server is running on port 3000
- Check that `CLIENT_URL` in backend `.env` matches your frontend URL
- Check browser console for CORS errors
- Verify CORS configuration in backend

### Email Notifications Not Working

- Test email credentials in `.env`
- For Gmail: use [App Passwords](https://myaccount.google.com/apppasswords) (not your regular password)
- Check SMTP settings match your email provider
- Verify firewall allows outbound SMTP connections (port 587)

## Environment Details

### Backend Technologies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `@prisma/client` | Database ORM |
| `socket.io` | Real-time WebSocket |
| `@openrouter/sdk` | AI API integration |
| `axios` | HTTP client |
| `nodemailer` | Email service |
| `node-cron` | Job scheduling |

### Frontend Technologies

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `vite` | Build tool |
| `socket.io-client` | WebSocket client |
| `tailwindcss` | CSS framework |
| `framer-motion` | Animation library |

## Next Steps

1. Review [API_INTEGRATION.md](./API_INTEGRATION.md) for API configuration details
2. Read [REQUIREMENTS.md](./REQUIREMENTS.md) for feature specifications
3. Check the main [README.md](../README.md) for project overview
4. Explore the [skills](../skills/) directory for Agent Skills setup



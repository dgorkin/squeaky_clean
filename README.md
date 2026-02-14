# Squeaky Clean 🏠✨

A house cleaning task tracker Progressive Web App (PWA). Installable on iPhone via Safari "Add to Home Screen" and works offline.

## Features

- **Task Management** — Create one-off or recurring tasks with flexible repeat options (daily, weekly, biweekly, monthly, quarterly, annually, custom interval)
- **Dashboard** — Today's tasks, upcoming 7-day view, overdue tasks, streak counter
- **Calendar** — Monthly view with color-coded task dots, tap-to-view daily breakdown
- **AI Helper** — Natural language schedule generation powered by Claude (via Cloudflare Worker)
- **Satisfying Completion UX** — Animations, randomized encouragement messages, haptic feedback, streak tracking
- **Achievements** — Milestone badges for 10, 25, 50, 100, 250, 500 completed tasks
- **Themes** — Light, Dark, and "Lemon Fresh" color themes
- **Offline Support** — Full PWA with service worker caching
- **Data Portability** — Export/import all data as JSON

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS
- **Storage:** IndexedDB via Dexie.js (all data on-device)
- **AI:** Cloudflare Worker proxying to Anthropic API (Claude claude-sonnet-4-20250514)
- **Hosting:** Cloudflare Pages (static) + Cloudflare Worker (API)

## Project Structure

```
squeaky-clean/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Tab views (Dashboard, Calendar, AddTask, AIHelper, Settings)
│   │   ├── hooks/      # App context and state management
│   │   ├── utils/      # Messages, haptics, helpers
│   │   ├── styles/     # Tailwind CSS
│   │   ├── db.js       # Dexie.js database layer
│   │   ├── App.jsx     # Root component
│   │   └── main.jsx    # Entry point
│   ├── public/         # Static assets (icons, manifest handled by vite-plugin-pwa)
│   └── vite.config.js  # Vite + PWA config
├── worker/             # Cloudflare Worker
│   ├── index.js        # API handler — proxies to Anthropic
│   └── wrangler.toml   # Worker configuration
├── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at `http://localhost:5173`. The dev server proxies `/api` requests to `http://localhost:8787` (the Worker).

### Cloudflare Worker (for AI features)

```bash
cd worker
npm install

# Set your Anthropic API key for local dev
npx wrangler secret put ANTHROPIC_API_KEY
# (paste your key when prompted)

npx wrangler dev
```

The Worker runs at `http://localhost:8787`.

## Deployment

### 1. Deploy the Worker

```bash
cd worker

# Set the API key secret
npx wrangler secret put ANTHROPIC_API_KEY

# Optional: Create KV namespace for rate limiting
npx wrangler kv:namespace create RATE_LIMIT
# Update wrangler.toml with the returned namespace ID

# Deploy
npx wrangler deploy
```

### 2. Deploy to Cloudflare Pages

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=squeaky-clean
```

Or connect your GitHub repo to Cloudflare Pages for automatic deployments.

### 3. Configure the Worker route

In your Cloudflare dashboard, set up a route so that `/api/*` on your Pages domain points to the Worker. Alternatively, use Cloudflare Pages Functions by placing the worker in a `functions/api/` directory.

## Setting the API Key

The Anthropic API key is stored as a Cloudflare Worker secret — never in code:

```bash
cd worker
npx wrangler secret put ANTHROPIC_API_KEY
```

## iOS Installation

1. Open the deployed URL in Safari on your iPhone
2. Tap the Share button (rectangle with arrow)
3. Tap "Add to Home Screen"
4. The app will appear as a standalone app with its own icon

## Easter Eggs

- **Konami Code:** On desktop, type ↑↑↓↓←→←→BA. On mobile, tap the app title 10 times.
- **Weekend vibes:** Check the dashboard on Saturday or Sunday for relaxation-themed messages.
- **Milestone celebrations:** Complete 10, 25, 50, 100, 250, or 500 tasks to unlock badges.

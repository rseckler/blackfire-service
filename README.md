# Blackfire Service

A comprehensive stock investment analysis platform with AI-powered insights, portfolio management, and real-time market data aggregation.

## 🚀 Features

- **Stock Analysis**: Visual analysis inspired by Simply Wall St with custom metrics
- **Portfolio Management**: Track multiple portfolios with performance analytics
- **Real-time Data**: Live stock prices and market updates via WebSocket
- **Information Aggregation**: Monitor 100+ sources (blogs, social media, news, YouTube)
- **Notes System**: Multi-level notes (per stock, sector, basket) with Markdown support
- **AI-Powered**: Automated insights using GPT-4, Claude, and Gemini
- **Stock Screener**: Filter stocks with 30+ criteria
- **Dividend Tracking**: Income forecasting and quality scoring

## 📋 Prerequisites

- Node.js 20+ and pnpm 8+
- Docker and Docker Compose
- Supabase account (or local Supabase setup)
- API keys for stock data and AI services

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Zustand
- **Charts**: Recharts + TradingView Lightweight Charts

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL + TimescaleDB)
- **Cache**: Upstash Redis
- **Queue**: BullMQ
- **Search**: MeiliSearch
- **Auth**: Supabase Auth

### External Services
- **Stock Data**: Alpha Vantage, Polygon.io (optional)
- **AI**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **Monitoring**: Sentry (errors), Vercel Analytics

## 🚀 Getting Started

**Choose your deployment option:**

### Option A: Cloud (Vercel + Supabase) - Recommended ⭐

**Cost**: €0/month (FREE)
**Time**: 15 minutes
**Perfect for**: 2-50 users, quick start, zero maintenance

📖 **[Quick Start Guide (15 min)](docs/QUICK-START-CLOUD.md)**
📚 **[Detailed Setup Guide](docs/SETUP-VERCEL-SUPABASE.md)**

```bash
1. Create Supabase project (5 min)
2. Push code to GitHub (2 min)
3. Deploy to Vercel (5 min)
4. You're live! 🎉
```

**Result**: `https://blackfire-service.vercel.app`

---

### Option B: VPS (Hostinger Self-Hosted)

**Cost**: €0 additional (using existing VPS)
**Time**: 30 minutes
**Perfect for**: Full control, always on, 100+ users

📖 **[Quick Start Guide (30 min)](docs/QUICK-START-VPS.md)**
📚 **[Detailed VPS Guide](docs/DEPLOYMENT-VPS.md)**

```bash
ssh root@your-vps-ip
bash <(curl -s https://raw.githubusercontent.com/.../setup-vps.sh)
# Follow prompts
```

**Result**: `https://yourdomain.com`

---

### Local Development Setup

\`\`\`bash
# 1. Clone repository
git clone <repository-url>
cd Blackfire_service

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start development server
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
Blackfire_service/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── stocks/            # Stock detail pages
│   │   ├── portfolio/         # Portfolio management
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── charts/           # Chart components
│   │   ├── stocks/           # Stock-specific components
│   │   └── layout/           # Layout components
│   ├── lib/                   # Utility functions
│   │   ├── supabase/         # Supabase clients
│   │   ├── api/              # API clients
│   │   └── utils.ts          # Helper functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── stores/                # Zustand stores
├── supabase/
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge functions
├── public/                    # Static assets
├── tests/                     # Test files
├── docs/                      # Documentation
│   ├── CLAUDE.md             # Claude Code guidance
│   ├── simplywall-st-analysis.md
│   ├── data-source-evaluation.md
│   └── technology-stack.md
└── docker-compose.yml         # Local services
\`\`\`

## 🧪 Development Commands

\`\`\`bash
# Development
pnpm dev                  # Start dev server
pnpm build               # Build for production
pnpm start               # Start production server

# Code Quality
pnpm lint                # Run ESLint
pnpm type-check          # TypeScript type checking
pnpm format              # Format with Prettier
pnpm format:check        # Check formatting

# Testing
pnpm test                # Run unit tests
pnpm test:ui             # Tests with UI
pnpm test:e2e            # End-to-end tests

# Database
pnpm supabase:start      # Start local Supabase
pnpm supabase:stop       # Stop local Supabase
pnpm supabase:reset      # Reset local database
pnpm supabase:migrate    # Run migrations
pnpm db:studio           # Open database studio

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs -f   # View logs
\`\`\`

## 🗄️ Database Schema

Key tables:
- \`companies\` - Company master data
- \`stock_prices\` - Time-series price data (TimescaleDB hypertable)
- \`portfolios\` - User portfolios
- \`holdings\` - Portfolio holdings
- \`transactions\` - Buy/sell/dividend transactions
- \`watchlists\` - User watchlists
- \`notes\` - User notes (stock/sector/basket)
- \`information_sources\` - External source registry
- \`source_content\` - Aggregated content archive

See \`supabase/migrations/\` for full schema.

## 🔐 Authentication

Supabase Auth provides:
- Email/password authentication
- OAuth providers (Google, GitHub)
- Magic links
- Row-level security (RLS)

Protected routes automatically redirect to login.

## 📊 API Endpoints

### Stock Data
- \`GET /api/stocks\` - List stocks with filters
- \`GET /api/stocks/[symbol]\` - Get stock details
- \`GET /api/stocks/[symbol]/prices\` - Historical prices
- \`GET /api/stocks/[symbol]/analysis\` - AI analysis

### Portfolio
- \`GET /api/portfolio\` - User portfolios
- \`POST /api/portfolio\` - Create portfolio
- \`GET /api/portfolio/[id]/holdings\` - Portfolio holdings
- \`POST /api/portfolio/[id]/transaction\` - Add transaction

### Notes
- \`GET /api/notes\` - User notes
- \`POST /api/notes\` - Create note
- \`PUT /api/notes/[id]\` - Update note
- \`DELETE /api/notes/[id]\` - Delete note

## 🌐 Deployment Options

### Cloud Deployment (Vercel + Supabase) - €0/month ✨

Perfect for getting started, 2-50 users, zero maintenance.

**Quick Deploy:**
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Push to GitHub
git push origin main

# 3. Import to Vercel at https://vercel.com
# 4. Add environment variables
# 5. Done! Auto-deploys on every push 🚀
```

📖 See: [SETUP-VERCEL-SUPABASE.md](docs/SETUP-VERCEL-SUPABASE.md)

---

### VPS Deployment (Docker) - €0 additional

Perfect for full control, always on, production scale.

**Quick Deploy:**
```bash
# On your VPS
ssh root@your-vps-ip
bash scripts/setup-vps.sh      # One-time setup
su - blackfire
bash scripts/deploy-vps.sh     # Deploy app
```

📖 See: [DEPLOYMENT-VPS.md](docs/DEPLOYMENT-VPS.md)

---

### Cost Comparison

| Users | Cloud (Vercel+Supabase) | VPS (Self-Hosted) |
|-------|------------------------|-------------------|
| 2-50 | **€0/month** | **€0 extra** |
| 50-200 | $25-45/month | **€0 extra** |
| 200+ | $45-125/month | €20-50/month (upgrade VPS) |

## 📈 Monitoring

- **Errors**: Sentry (https://sentry.io)
- **Analytics**: Vercel Analytics (built-in)
- **Database**: Supabase Dashboard
- **Logs**: Better Stack Logtail

## 🤝 Contributing

1. Create a feature branch: \`git checkout -b feature/amazing-feature\`
2. Commit changes: \`git commit -m 'Add amazing feature'\`
3. Push to branch: \`git push origin feature/amazing-feature\`
4. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Format with Prettier
- Write tests for new features
- Update documentation

## 📚 Documentation

- **[CLAUDE.md](docs/CLAUDE.md)** - Guidance for Claude Code
- **[Simply Wall St Analysis](docs/simplywall-st-analysis.md)** - Feature analysis
- **[Data Source Evaluation](docs/data-source-evaluation.md)** - Architecture decisions
- **[Technology Stack](docs/technology-stack.md)** - Tech stack details

## 🐛 Known Issues

- None yet! This is a fresh project.

## 📝 License

[Your License Here]

## 👥 Team

- [Your Team Here]

## 📞 Support

- Issues: [GitHub Issues](repository-url/issues)
- Discussions: [GitHub Discussions](repository-url/discussions)
- Email: [Your Email]

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies**

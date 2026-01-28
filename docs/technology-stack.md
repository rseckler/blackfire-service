# Blackfire Service - Technology Stack & Architecture

**Version**: 1.0
**Date**: 2026-01-28
**Status**: Recommended

---

## Executive Summary

Blackfire Service will be built as a modern, scalable web application capable of serving thousands of users with real-time stock data, portfolio management, and intelligent information aggregation.

**Core Technology Decisions**:
- **Framework**: Next.js 15+ (Full-stack React/TypeScript)
- **Database**: Supabase (PostgreSQL + Real-time)
- **Deployment**: Vercel (Frontend) + Supabase Cloud (Backend)
- **Search**: MeiliSearch
- **Cache/Queue**: Upstash Redis
- **Monitoring**: Vercel Analytics + Sentry

**Key Principles**:
1. **Developer Experience** - Fast iteration, TypeScript end-to-end
2. **Scalability** - Serverless where possible, horizontal scaling
3. **Cost-Efficiency** - Generous free tiers, pay-as-you-grow
4. **Real-time** - WebSocket support for live stock prices
5. **Modern Stack** - Latest stable versions, active communities

---

## 1. Frontend Stack

### 1.1 Framework: Next.js 15+ (App Router)

**Why Next.js:**
- ✅ React-based with server components for performance
- ✅ Built-in API routes (full-stack in one repo)
- ✅ File-based routing
- ✅ Excellent SEO with SSR/SSG
- ✅ Image optimization
- ✅ TypeScript native
- ✅ Deploys easily to Vercel
- ✅ Large community, excellent docs

**Alternatives Considered:**
- React (SPA) - No SSR, worse SEO
- Remix - Less mature ecosystem
- SvelteKit - Smaller community
- Vue/Nuxt - Team familiarity with React

### 1.2 Language: TypeScript 5+

**Benefits:**
- Type safety end-to-end
- Better IDE support
- Catch errors at compile time
- Self-documenting code
- Easier refactoring

### 1.3 UI Library: shadcn/ui + Tailwind CSS

**Component Library**: shadcn/ui
- Copy-paste components (not dependency)
- Built on Radix UI (accessibility)
- Customizable with Tailwind
- Modern, clean design

**Styling**: Tailwind CSS 4+
- Utility-first CSS
- Fast development
- Consistent design system
- Small bundle size with purging
- Dark mode built-in

**Alternatives**:
- Material-UI - Heavier, less flexible
- Chakra UI - Good but shadcn/ui more modern
- Ant Design - Too opinionated for custom design

### 1.4 State Management

**Server State**: TanStack Query (React Query)
- Cache management
- Automatic refetching
- Optimistic updates
- Perfect for API data

**Client State**: Zustand
- Lightweight (1KB)
- Simple API
- No boilerplate
- TypeScript-friendly

**Avoid**: Redux (too much boilerplate for this use case)

### 1.5 Charts & Visualizations

**Primary**: Recharts
- Built for React
- Declarative API
- Responsive
- Good documentation

**Alternative**: TradingView Lightweight Charts
- For advanced stock charts
- Professional trading UI
- Real-time updates
- Interactive

**Data Viz**: D3.js (if needed for custom viz)

### 1.6 Forms & Validation

**Forms**: React Hook Form
- Performant (uncontrolled)
- Minimal re-renders
- Easy validation

**Validation**: Zod
- TypeScript-first
- Runtime validation
- Type inference
- Works with React Hook Form

---

## 2. Backend Stack

### 2.1 Primary: Next.js API Routes

**Why:**
- Collocated with frontend
- TypeScript shared types
- Serverless by default
- Easy authentication
- Same deployment

**Use Cases:**
- BFF (Backend for Frontend) layer
- Authentication logic
- Third-party API orchestration
- Webhook handlers

### 2.2 Secondary: Standalone API Service (Optional)

**When to add:** If background jobs or complex processing needed

**Framework Options:**

**Option A: Node.js + Fastify**
- Fastest Node.js framework
- TypeScript support
- Schema validation
- Plugin ecosystem

**Option B: Python + FastAPI**
- If heavy ML/AI processing needed
- Excellent for data science workflows
- Type hints with Pydantic
- Auto-generated OpenAPI docs

**Recommendation**: Start with Next.js API routes, add standalone service only if needed

---

## 3. Database Stack

### 3.1 Primary Database: Supabase

**What is Supabase:**
- Managed PostgreSQL (AWS)
- Real-time subscriptions (WebSocket)
- Built-in authentication
- Row-level security
- Auto-generated REST/GraphQL APIs
- File storage
- Edge functions

**Why Supabase:**
- ✅ PostgreSQL (proven, scalable)
- ✅ Real-time perfect for live stock prices
- ✅ Auth out-of-the-box
- ✅ Excellent DX (developer experience)
- ✅ TypeScript client
- ✅ Generous free tier
- ✅ Open-source (can self-host)

**Pricing:**
- **Free**: 500MB DB, 50K MAUs (for development)
- **Pro**: $25/month + usage
- **At scale (1000 users)**: ~$100-300/month

**Schema Design:**
```
companies (id, name, symbol, wkn, isin, sector, market_cap, ...)
stock_prices (id, company_id, timestamp, open, high, low, close, volume) [TimescaleDB]
users (via Supabase Auth)
portfolios (id, user_id, name, created_at, ...)
holdings (id, portfolio_id, company_id, quantity, purchase_price, purchase_date, ...)
transactions (id, portfolio_id, company_id, type, quantity, price, date, ...)
information_sources (id, name, url, type, last_checked, ...)
notes (id, user_id, entity_type, entity_id, content, tags, created_at, ...)
watchlists (id, user_id, name, ...)
watchlist_items (id, watchlist_id, company_id, ...)
```

### 3.2 Time-Series: TimescaleDB Extension

**Add to Supabase PostgreSQL:**
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
SELECT create_hypertable('stock_prices', 'timestamp');
```

**Benefits:**
- Automatic partitioning by time
- 10x compression
- Fast time-range queries
- Continuous aggregates (pre-computed daily/weekly)

### 3.3 Alternative: Direct PostgreSQL + TimescaleDB

**When to use:**
- Want maximum control
- Have DevOps expertise
- Need specific Postgres features

**Hosting Options:**
- AWS RDS
- DigitalOcean Managed Databases
- Railway
- Render

**Cost**: ~$15-50/month for production-ready instance

---

## 4. Search

### 4.1 Full-Text Search: MeiliSearch

**Why MeiliSearch:**
- ✅ Fast (<50ms searches)
- ✅ Typo-tolerant
- ✅ Instant search (as-you-type)
- ✅ Relevance ranking
- ✅ Faceted search (filters)
- ✅ Easy to set up
- ✅ Cloud or self-hosted

**Use Cases:**
- Company search
- Stock symbol search
- Notes search
- Information source search

**Pricing:**
- Self-hosted: Free
- Meilisearch Cloud: $50-100/month

**Alternative**: Algolia (more expensive, $1/month per 1000 searches)

---

## 5. Caching & Queues

### 5.1 Redis: Upstash

**Why Upstash:**
- Serverless Redis
- HTTP-based (works in edge functions)
- Generous free tier
- Pay per request
- No connection limits

**Use Cases:**
- Cache stock prices (1-5 min TTL)
- Rate limiting
- Session storage
- Job queue (with BullMQ)

**Pricing:**
- Free: 10K requests/day
- Pro: $0.2 per 100K requests

**Alternative**: Redis Labs (traditional connection-based)

---

## 6. Background Jobs & Cron

### 6.1 Job Queue: BullMQ + Upstash Redis

**Why BullMQ:**
- Built on Redis
- Robust job queue
- Retries, priorities
- Scheduled jobs
- TypeScript support

**Use Cases:**
- Fetch stock prices (every 1-5 min)
- Scrape information sources (daily)
- AI enrichment jobs
- Send notifications
- Generate reports

**Alternative**: Inngest (serverless job runner, easier but more expensive)

### 6.2 Scheduled Jobs: Vercel Cron

**For simple recurring tasks:**
- Trigger Next.js API route on schedule
- Free on Vercel Pro
- Define in `vercel.json`

```json
{
  "crons": [{
    "path": "/api/cron/fetch-prices",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 7. External Integrations

### 7.1 Stock Market Data

**Primary**: Alpha Vantage
- Free tier: 500 requests/day
- Paid: From $50/month
- Comprehensive data

**Secondary**: Yahoo Finance (via yfinance library)
- Free, unofficial
- Good for development
- Less reliable for production

**Enterprise**: Polygon.io, IEX Cloud
- When need guaranteed SLA
- Real-time data
- $200-500/month

### 7.2 AI Services

**OpenAI GPT-4**:
- Data enrichment
- Content summarization
- Company research

**Anthropic Claude 3.5**:
- Long-context analysis
- Financial document parsing

**Google Gemini**:
- Alternative for cost optimization
- Multimodal capabilities

### 7.3 Notion API (Optional)

**For users who want Notion integration:**
- Free API access
- User provides their own API key
- Store references in PostgreSQL

### 7.4 Social Media & News

**Twitter/X API**: Company mentions, sentiment
**Reddit API**: Community discussions
**YouTube Data API**: Financial content monitoring
**RSS Parsers**: Blog and news aggregation

---

## 8. Authentication & Authorization

### 8.1 Auth Provider: Supabase Auth

**Built-in features:**
- Email/password
- OAuth providers (Google, GitHub, etc.)
- Magic links
- JWT tokens
- Row-level security
- User management

**Why not alternatives:**
- Auth0: More expensive ($240/month for 1000 MAUs)
- Clerk: Good but $25/month for features
- Firebase Auth: Vendor lock-in, less flexible

### 8.2 Authorization

**Row-Level Security (RLS) in Supabase:**
```sql
-- Users can only see their own portfolios
CREATE POLICY "Users can view own portfolios"
ON portfolios FOR SELECT
USING (auth.uid() = user_id);
```

**Role-Based Access Control:**
- User
- Premium User
- Admin

---

## 9. File Storage

### 9.1 Primary: Supabase Storage

**For:**
- User profile images
- Uploaded documents
- Exported reports (PDFs)

**Features:**
- S3-compatible
- CDN delivery
- Image transformations
- Free tier: 1GB

### 9.2 Alternative: Cloudinary

**For image-heavy use cases:**
- Advanced image optimization
- On-the-fly transformations
- Video support

---

## 10. Monitoring & Analytics

### 10.1 Application Monitoring: Sentry

**Error tracking:**
- Frontend errors
- Backend errors
- Performance monitoring
- Release tracking

**Pricing:** Free for 5K errors/month

### 10.2 Analytics: Vercel Analytics

**Built-in with Vercel deployment:**
- Page views
- User behavior
- Web vitals
- No cookies needed (privacy-friendly)

### 10.3 Database Monitoring: Supabase Dashboard

**Built-in:**
- Query performance
- Connection pooling stats
- Database size
- Slow query log

### 10.4 Logging: Better Stack (Logtail)

**Centralized logging:**
- API logs
- Background job logs
- Error logs

**Pricing:** Free tier available

---

## 11. Deployment & Infrastructure

### 11.1 Frontend Deployment: Vercel

**Why Vercel:**
- Built for Next.js
- Zero config deployment
- Edge network (CDN)
- Automatic HTTPS
- Preview deployments
- Excellent DX

**Pricing:**
- Hobby: Free (personal projects)
- Pro: $20/month
- Team: $20/user/month

### 11.2 Database: Supabase Cloud

**Managed hosting:**
- Automatic backups
- Point-in-time recovery
- Database snapshots
- Connection pooling

**Pricing:**
- Free: Development
- Pro: $25/month base + usage

### 11.3 CI/CD: GitHub Actions

**Workflow:**
1. Push to GitHub
2. Run tests
3. Deploy to Vercel (automatic)
4. Run E2E tests
5. Notify team

**Cost:** Free for public repos, free tier for private

### 11.4 Infrastructure as Code

**Terraform (Optional):**
- If self-hosting components
- Reproducible infrastructure
- Multi-environment

---

## 12. Development Tools

### 12.1 Package Manager: pnpm

**Why pnpm:**
- Faster than npm/yarn
- Efficient disk space usage
- Strict dependencies

### 12.2 Code Quality

**Linting**: ESLint + Prettier
- Consistent code style
- Auto-format on save

**Type Checking**: TypeScript strict mode
- Enforce type safety

**Git Hooks**: Husky
- Pre-commit: Lint and type-check
- Pre-push: Run tests

### 12.3 Testing

**Unit Tests**: Vitest
- Faster than Jest
- Compatible with Jest syntax
- ESM support

**Component Tests**: React Testing Library
- Test user behavior
- Not implementation details

**E2E Tests**: Playwright
- Cross-browser testing
- Parallel execution
- Screenshot/video capture

### 12.4 API Development

**Type-safe APIs**: tRPC
- End-to-end type safety
- No code generation
- Perfect for Next.js

**Alternative**: REST with Zod validation

### 12.5 Database Management

**Schema Migrations**: Supabase CLI
- SQL migration files
- Version controlled
- Rollback support

**Query Builder**: Drizzle ORM or Prisma
- Type-safe queries
- Migrations
- Schema introspection

**Recommendation**: Start with Supabase client, add ORM if needed

---

## 13. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 Frontend (React + TypeScript)                   │   │
│  │  • Pages: Home, Dashboard, Stock Details, Portfolio         │   │
│  │  • Components: shadcn/ui + Tailwind                         │   │
│  │  • State: React Query + Zustand                             │   │
│  │  • Charts: Recharts + TradingView                           │   │
│  │  Deployed on: Vercel Edge Network                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               │ HTTPS
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                        APPLICATION LAYER                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (Server Components)                     │   │
│  │  • /api/stocks - Stock data endpoints                       │   │
│  │  • /api/portfolio - Portfolio management                    │   │
│  │  • /api/cron - Background job triggers                      │   │
│  │  • /api/webhooks - External integrations                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────┬───────────────────────────┬───────────────────────────┘
                │                           │
                │                           │
        ┌───────▼────────┐         ┌────────▼────────┐
        │  Supabase Auth │         │  BullMQ Jobs    │
        │  • JWT tokens  │         │  (Redis Queue)  │
        │  • OAuth       │         │  • Price fetch  │
        │  • RLS         │         │  • Scraping     │
        └────────────────┘         │  • AI enrichm.  │
                                   └─────────────────┘
                                           │
┌──────────────────────────────────────────┼───────────────────────────┐
│                        DATA LAYER        │                           │
├──────────────────────────────────────────┴───────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL + TimescaleDB)                         │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │ • companies (master data)                           │    │  │
│  │  │ • stock_prices (hypertable - TimescaleDB)           │    │  │
│  │  │ • portfolios, holdings, transactions                │    │  │
│  │  │ • users (via Supabase Auth)                         │    │  │
│  │  │ • notes (markdown content)                          │    │  │
│  │  │ • information_sources                               │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  Real-time Subscriptions (WebSocket)                        │  │
│  │  Row-Level Security (RLS)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Upstash Redis                                               │  │
│  │  • Cache (stock prices TTL 1-5min)                          │  │
│  │  • Job queue state                                           │  │
│  │  • Rate limiting                                             │  │
│  │  • Session storage                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  MeiliSearch                                                 │  │
│  │  • Full-text search (companies, notes)                      │  │
│  │  • Instant search results                                    │  │
│  │  • Typo-tolerance                                            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                            │  │
│  │  • User uploads                                              │  │
│  │  • Generated reports (PDF)                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                               │
                               │ External APIs
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                        EXTERNAL SERVICES                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  • Alpha Vantage / Polygon.io (Stock prices)                        │
│  • OpenAI GPT-4, Anthropic Claude (AI enrichment)                   │
│  • Twitter/X, Reddit APIs (Social sentiment)                        │
│  • YouTube Data API (Video content)                                 │
│  • RSS Feeds (News aggregation)                                     │
│  • Notion API (Optional - user notes integration)                   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 14. Development Environment Setup

### 14.1 Required Tools

```bash
# Node.js and pnpm
node --version  # v20+
pnpm --version  # v8+

# Supabase CLI
supabase --version

# Git
git --version

# Docker (for local Supabase)
docker --version
```

### 14.2 Local Development Stack

```bash
# Start local Supabase (PostgreSQL, Auth, Storage)
supabase start

# Start Next.js dev server
pnpm dev

# Start Redis locally (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Start MeiliSearch locally (Docker)
docker run -d -p 7700:7700 getmeili/meilisearch:latest
```

### 14.3 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
MEILISEARCH_URL=
MEILISEARCH_API_KEY=
ALPHA_VANTAGE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 15. Estimated Costs (Production)

### 15.1 Monthly Operating Costs (1000 Users)

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Pro | $20/month | Frontend hosting |
| Supabase | Pro | $25 base + $50 usage | Database + Auth + Storage |
| Upstash Redis | Pay-as-you-go | $10-30/month | Cache + Queue |
| MeiliSearch | Cloud | $50-100/month | Search |
| Alpha Vantage | Premium | $50/month | Stock data |
| OpenAI | Pay-per-use | $50-200/month | AI enrichment |
| Sentry | Team | $26/month | Error tracking |
| **TOTAL** | | **$231-446/month** | |
| **Annual** | | **$2,772-5,352/year** | |

**Compare to Notion-only**: $172,000-240,000/year
**Savings**: **$166,228-237,228/year** ✅

### 15.2 Scaling Projections

**10,000 Users:**
- Supabase: ~$200-400/month
- Redis: ~$50-100/month
- Other services: Minimal increase
- **Total**: ~$500-800/month ($6,000-9,600/year)

**100,000 Users:**
- Need dedicated infrastructure
- Estimated: $2,000-5,000/month
- Still **95% cheaper** than Notion-only approach

---

## 16. Decision Summary

### ✅ Final Stack

**Frontend:**
- Next.js 15 + React + TypeScript
- shadcn/ui + Tailwind CSS
- React Query + Zustand
- Recharts + TradingView Charts

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + TimescaleDB)
- Upstash Redis (cache + queue)
- BullMQ (background jobs)

**Infrastructure:**
- Vercel (frontend deployment)
- Supabase Cloud (database)
- MeiliSearch (search)
- GitHub Actions (CI/CD)

**External:**
- Alpha Vantage (stock data)
- OpenAI + Claude (AI)
- Various APIs (social, news)

### 🎯 Why This Stack?

1. **Fast Development** - Integrated tools, minimal boilerplate
2. **Scalable** - Serverless where possible, proven at scale
3. **Cost-Effective** - 95% cheaper than Notion-only
4. **Real-time** - Built-in WebSocket support
5. **Type-Safe** - TypeScript end-to-end
6. **Modern** - Latest stable technologies
7. **Great DX** - Excellent developer experience

---

## 17. Next Steps

1. ✅ Technology stack defined
2. ⏭️ Create project structure
3. ⏭️ Set up Supabase project
4. ⏭️ Initialize Next.js app
5. ⏭️ Design database schema
6. ⏭️ Implement authentication
7. ⏭️ Build core features

Let's build Blackfire! 🚀

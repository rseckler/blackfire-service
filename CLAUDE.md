# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 IMPORTANT: Deployment Setup

**CRITICAL: Always deploy to Vercel, NOT to local or VPS for testing!**

### Primary Deployment Platform: Vercel ✅

**Production URL**: https://blackfire-service.vercel.app

**Deployment Process**:
1. Make changes locally
2. Commit to Git: `git add -A && git commit -m "message"`
3. Push to GitHub: `git push origin main`
4. Vercel auto-deploys (2-3 minutes)
5. Test at: https://blackfire-service.vercel.app

**DO NOT**:
- ❌ Test on `localhost:3000` (local dev often has issues)
- ❌ Deploy to VPS unless specifically requested
- ❌ Assume local = production

**Database**: Supabase (always production, shared across all environments)
- URL: https://lglvuiuwbrhiqvxcriwa.supabase.co
- Migrations: Apply via Supabase Dashboard SQL Editor

**After every feature implementation**:
1. Git commit + push to GitHub
2. Wait for Vercel deployment (check https://vercel.com/dashboard)
3. Test on Vercel URL (https://blackfire-service.vercel.app)
4. Share Vercel URL with user, NOT localhost

### VPS (Secondary, backup only)

**IP**: 72.62.148.205
**URL**: http://72.62.148.205:3000
**Use only when**: Vercel is down or user specifically requests VPS deployment
**Process Manager**: PM2

---

## 📝 Notes System (COMPLETED ✅)

**Status**: Fully implemented and deployed to Vercel (2026-01-30)

### Overview
Rich-text notes system replacing limited Info1-Info5 fields with unlimited, formatted notes on company detail pages.

### Implementation Details

**Database Schema** (`notes` table):
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users
- `entity_type` (TEXT) - 'company', 'sector', 'basket', 'general'
- `entity_id` (UUID) - Company/entity ID
- `title` (TEXT) - Note title (optional)
- `content` (TEXT) - Rich HTML content from TipTap
- `tags` (TEXT[]) - Array of tags
- `is_private` (BOOLEAN) - Private (only creator) or Shared (all users)
- `priority` (INTEGER) - 0=Normal, 1=Low, 2=Medium, 3=High
- `reminder_date` (TIMESTAMPTZ) - Optional reminder date
- `migrated_from` (TEXT) - Tracks migration from Info1-Info5 fields
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies** (Row Level Security):
```sql
-- Anyone can read shared notes
CREATE POLICY "Anyone can read shared notes" ON notes FOR SELECT
USING (is_private = false);

-- Users can read their own notes
CREATE POLICY "Users can read their own notes" ON notes FOR SELECT
USING (auth.uid() = user_id);
```

**Technology Stack**:
- **Rich-text editor**: TipTap (with extensions for bold, italic, underline, colors, highlight, headings, lists, alignment)
- **Form management**: react-hook-form + zod
- **Data fetching**: React Query (@tanstack/react-query)
- **UI Components**: Radix UI (Dialog, Select, Calendar, Popover)

**Key Components**:
- `src/components/notes/company-notes-section.tsx` - Main container
- `src/components/notes/notes-grid.tsx` - Card grid layout with filters
- `src/components/notes/note-card.tsx` - Individual note display (300 char preview)
- `src/components/notes/note-dialog.tsx` - Create/edit modal with full form
- `src/components/notes/note-editor.tsx` - TipTap rich-text editor
- `src/components/notes/note-filters.tsx` - Filter/sort controls
- `src/components/notes/hooks/use-notes.ts` - React Query hooks

**API Routes**:
- `GET /api/notes?companyId=X` - Get notes (shared for non-auth, private+shared for auth users)
- `POST /api/notes` - Create note (auth required)
- `PATCH /api/notes/[id]` - Update note (auth required)
- `DELETE /api/notes/[id]` - Delete note (auth required)
- `GET /api/notes/tags?companyId=X` - Get unique tags

**Features**:
- ✅ Unlimited notes per company (not limited to 5)
- ✅ Rich-text formatting (bold, italic, underline, colors, highlight, headings, lists)
- ✅ Card grid interface with edit dialogs
- ✅ Individual note editing with full formatting toolbar
- ✅ Migration from Info1-Info5 to editable notes (with "Migrated" tag)
- ✅ Privacy toggle: Private (only owner) OR Shared (all users)
- ✅ Tags for categorization (autocomplete from existing tags)
- ✅ Priority levels (None, Low, Medium, High with visual indicators)
- ✅ Reminder dates (optional, with date picker)
- ✅ Filter by tags, priority, visibility
- ✅ Sort by date, priority, title
- ✅ Non-authenticated users can view shared notes
- ✅ Text preview: 300 characters per note card

**Location on Detail Page**:
- Position: After StockPriceChart, before Profile card
- File: `src/app/(dashboard)/stocks/[id]/page.tsx` (line 177)

**Important Scripts**:
- `scripts/migrate-info-fields.ts` - Migrate Info1-Info5 to notes (ONLY run ONCE per company)
- `scripts/check-duplicate-notes.ts` - Check for duplicate notes
- `scripts/delete-duplicate-notes.ts` - Delete duplicate notes
- `scripts/check-rls-policies.ts` - Verify RLS policies work correctly

**Known Issues & Solutions**:
1. **Duplicates**: Migration script was run twice → Fixed by delete-duplicate-notes.ts
2. **RLS blocking shared notes**: Fixed by adding "Anyone can read shared notes" policy
3. **401 errors for non-auth users**: Fixed by allowing GET requests without authentication for shared notes

**Future Enhancements** (not implemented):
- Full-text search across note content
- Export notes to markdown/PDF
- Bulk operations
- Note attachments (images, files)
- Note history/versioning
- Email reminders for reminder_date
- Collaborative editing

---

## Project Overview

Blackfire_service is a web application for stock investment analysis and portfolio management, inspired by simplywall.st and theinformation.com. The service aims to identify high-growth potential stocks, including companies approaching IPO and undervalued stocks with recovery potential.

### Core Objectives

- Provide comprehensive information for making informed investment decisions in high-leverage growth stocks
- Aggregate data from multiple external sources and analyze using AI to identify optimal entry/exit points
- Manage portfolio lifecycle: tracking purchases, monitoring performance, planning exits
- Support a database of 1500+ companies that grows daily
- Scale to support thousands of users

## Data Architecture

### Primary Data Sources

- **Notion Database (Under Evaluation)**: Currently serves as core information repository (from Blackfire_automation project) with 1500+ companies
- **Important**: Evaluate Notion viability vs. alternatives before major development (see Critical Architectural Decisions)
- Company identifiers: Stock symbols, WKN, ISIN numbers (not all complete)
- Automated enrichment via ChatGPT, Claude, Gemini APIs to fill missing company data
- Continuous data collection: all new daily findings should be stored

### Data Requirements

- **Persistent storage**: Company fundamentals, financial metrics over time, user portfolios, transaction history, user notes, information sources registry, content archives
- **Ephemeral/cached data**: Live stock prices, 52-week high/low, trading volume, market cap, RSS feed content
- Design database schema to support growing information over time per company/stock
- Consider document database (MongoDB) or hybrid approach for notes with flexible schema
- Time-series database considerations for stock price history and source monitoring logs

## Feature Requirements

### Stock Overview Pages

- Table view with comprehensive filtering capabilities
- Interactive charts per stock: daily, weekly, monthly, yearly price movements
- Real-time price updates for exchange-traded stocks
- Standard metrics: 52-week range, volume, market capitalization

### Stock Detail Pages

- Aggregated data from multiple external sources
- Highly interactive price charts with hover tooltips showing point-in-time prices
- Company fundamentals and base data
- Multi-year financial metrics in table format
- Related information and analysis

### Portfolio Management

- Investment tracking: purchase date, price, quantity
- Performance monitoring: current price vs purchase price, unrealized gains/losses
- Exit strategy planning: target sell prices, stop-loss levels
- Notification system for all transaction-related events

### Admin Backend

- System configuration and settings
- User management
- Service control and monitoring
- Data source management

### Information Source Management

The system must manage and track hundreds of diverse information sources:

- **Web Sources**: Websites, blogs, online publications
- **Communication Channels**: Newsletters, forums, social media channels (Twitter/X, LinkedIn, Reddit, etc.)
- **Multimedia**: YouTube videos, podcasts, webinars
- **Personal Content**: User's own notes, research documents, bookmarks

#### Source Management Features

- Registry of all information sources with metadata (URL, type, update frequency, reliability rating)
- Automatic content monitoring and change detection
- RSS/feed integration where available
- Social media API integrations for relevant channels
- Tagging system to associate sources with specific stocks, sectors, or baskets
- Source credibility tracking and user feedback
- Duplicate detection across sources
- Archive of historical content from each source

### Notes & Knowledge Management System

Users need to create and organize notes at multiple levels:

- **Per Stock**: Company-specific observations, DD (due diligence) notes, thesis development
- **Per Sector/Industry**: Broader trends, regulatory changes, market dynamics
- **Per Basket/Watchlist**: Thematic investment ideas, comparison notes, strategy documentation

#### Notes System Considerations

**Option 1: Integrated Native System**
- Built-in rich text editor within the application
- Pros: Single interface, tight integration with stock data, easier cross-referencing
- Cons: More development effort, may not match feature richness of dedicated tools

**Option 2: Notion Integration**
- Leverage existing Notion DB setup
- Create standardized templates for stock/sector/basket notes
- Pros: User already familiar, powerful features, mobile apps, collaboration-ready
- Cons: API rate limits, requires Notion subscription, potential sync complexity

**Option 3: Hybrid Approach (Recommended)**
- Quick notes and annotations stored natively in the application database
- Long-form research and analysis in Notion with bidirectional linking
- Application maintains references to Notion pages with inline previews
- Pros: Best of both worlds - quick capture in-app, deep work in specialized tool
- Cons: Requires managing two systems, sync logic needed

#### Notes Features

- Markdown support with syntax highlighting
- Tagging system independent from but linkable to information sources
- Full-text search across all notes
- Version history and change tracking
- Attachments support (PDFs, spreadsheets, images, charts)
- Linking between notes and to specific stocks/sectors/baskets
- AI-powered summarization of long notes
- Export capabilities (Markdown, PDF, CSV for tabular data)
- Sharing and collaboration features for team use cases

## Technical Considerations

### Scalability

- Architecture must support thousands of concurrent users
- Design for extensibility: plan to significantly expand scope over time
- Consider multi-tenancy: users can connect different data sources (not just Notion)

### Data Collection & Enrichment

- Background jobs to search for missing company identifiers
- Automated daily information gathering from multiple sources
- AI-powered analysis for investment timing recommendations
- Update Notion DB automatically with discovered data

### External Integrations

- **Core Data**: Notion API for primary data source
- **Market Data**: Stock market data APIs for live prices (Alpha Vantage, Yahoo Finance, IEX Cloud, etc.)
- **AI Services**: ChatGPT, Claude, Gemini for data enrichment, analysis, and content summarization
- **Financial Data**: simplywall.st and theinformation.com as reference models
- **Content Aggregation**:
  - RSS/Atom feed parsers for blogs and news sites
  - YouTube Data API for video content monitoring
  - Social Media APIs: Twitter/X API, Reddit API, LinkedIn API
  - Newsletter parsing (email integration or services like Zapier/Make)
  - Web scraping framework for sites without APIs (consider legal/ToS implications)
- **Content Processing**: NLP services for sentiment analysis, entity extraction, summarization of information sources

## Critical Architectural Decisions

### Analyze Simply Wall St Features & Functionality

**Task**: Before defining detailed feature specifications, conduct comprehensive analysis of simplywall.st to identify and document essential features to incorporate.

**Analysis Areas**:

1. **Data Visualization**
   - Stock price charts: interactivity, timeframes, indicators
   - Snowflake visualization for company health metrics
   - Financial statement visualizations (income, balance sheet, cash flow)
   - Comparison charts (peer analysis, sector benchmarks)

2. **Company Analysis Features**
   - Valuation metrics and methodologies
   - Future performance indicators
   - Past performance tracking
   - Financial health assessment
   - Dividend analysis
   - Ownership structure display
   - Management quality indicators

3. **User Experience Patterns**
   - Navigation structure and information architecture
   - Filter and search functionality
   - Watchlist/portfolio organization
   - Alert and notification systems
   - Mobile vs. desktop experience differences

4. **Data Presentation**
   - How complex financial data is simplified for users
   - Use of visual indicators (colors, icons, scores)
   - Information hierarchy and prioritization
   - Tooltips and explanatory content

5. **Discovery & Screening**
   - Stock screener capabilities
   - Pre-built screens and categories
   - Custom screening criteria
   - Trending stocks and market movers

6. **Freemium Model Analysis**
   - What's available in free tier vs. paid
   - Premium feature justification
   - User conversion strategies

**Deliverables**:
- Feature comparison matrix (Simply Wall St vs. planned Blackfire features)
- UI/UX pattern library with screenshots
- Technical requirements derived from observed features
- Prioritized feature backlog based on analysis
- Identification of gaps where Blackfire can differentiate

**Integration into Design**:
- Update Feature Requirements section with specific features
- Create wireframes/mockups inspired by best practices
- Define data models needed to support identified features
- Plan API requirements for similar functionality

### Evaluate Notion as Primary Data Source

**Current Plan**: Use Notion Database as core information repository (from Blackfire_automation project)

**Task**: Before significant development, evaluate whether Notion is the optimal foundation or if alternatives would be better suited.

**Evaluation Criteria**:
- **API Limitations**: Rate limits (3 requests/second), pagination complexity, webhook reliability
- **Data Structure**: How well does Notion's database model fit stock data with 1500+ companies and growing?
- **Query Performance**: Can Notion handle complex filtering, sorting, and aggregations at scale?
- **Multi-user Scalability**: Will Notion API support thousands of users querying data simultaneously?
- **Cost**: Notion API pricing vs. self-hosted database costs at scale
- **Data Ownership**: Vendor lock-in concerns, export capabilities, backup strategies
- **Real-time Updates**: Latency for live data updates and synchronization
- **Integration Complexity**: How much overhead to sync between Notion and application database?

**Alternative Options to Consider**:

1. **PostgreSQL + Application Database**
   - Full control, unlimited queries, optimized for financial data
   - Cons: Lose Notion's user interface for data management

2. **Hybrid: Notion for Planning + PostgreSQL for Production**
   - Use Notion during research/discovery phase
   - Migrate vetted companies to production database
   - Keep Notion for notes/research, not operational data

3. **Airtable as Alternative**
   - Similar to Notion but API designed for programmatic access
   - Better performance for large datasets
   - More flexible formulas and automations

4. **Supabase (PostgreSQL + Real-time)**
   - Open-source, PostgreSQL-based
   - Built-in real-time subscriptions
   - User management and row-level security included

5. **Direct Database with Admin UI**
   - PostgreSQL/MySQL + Admin dashboard (Retool, Forest Admin, custom)
   - Maximum performance and control
   - Build only the management UI features you need

**Recommendation Process**:
1. Benchmark Notion API with current 1500+ company dataset
2. Test query performance for typical use cases (filtering, sorting, aggregation)
3. Calculate projected API costs for 1000+ users
4. Prototype data ingestion from alternative sources
5. Make decision before Phase 1 implementation begins

**Decision Impact**: This affects entire system architecture, so resolve early in development cycle.

## Development Priorities

Since this is a new project without existing code, prioritize:

1. ✅ **Analyze Simply Wall St features and functionality** (COMPLETED - see docs/simplywall-st-analysis.md)
2. ✅ **Evaluate Notion vs. alternatives** (COMPLETED - see docs/data-source-evaluation.md)
3. ✅ **Define technology stack** (COMPLETED - Next.js + Supabase + Vercel)
4. ✅ **Create project structure** (COMPLETED - Vercel + Docker backup)
5. ✅ **Database schema design** (COMPLETED - PostgreSQL via Supabase)
6. ✅ **Core stock detail page implementations** (COMPLETED - 2026-01-30)
7. ✅ **External API integrations for stock data** (COMPLETED - Alpha Vantage)
8. ✅ **Interactive chart components** (COMPLETED - lightweight-charts)
9. ✅ **Notes management system** (COMPLETED - TipTap rich-text editor)
10. 🔄 **Stock overview/list page** with filtering and sorting
11. 🔄 **Data ingestion pipeline** from Excel/Dropbox
12. 🔄 **User authentication** (NextAuth.js)
13. Portfolio management features
14. Watchlist enhancements (notifications, price alerts)
15. Information source registry and monitoring system
16. Notification system
17. Admin backend with source management tools

### Implementation Phases

**Phase 0: Research & Architecture Evaluation (COMPLETED ✅)**
- ✅ **Feature Analysis**: Comprehensive analysis of simplywall.st (UI/UX, features, data presentation)
- ✅ **Data Architecture**: Evaluated Notion vs alternatives - chose PostgreSQL self-hosted on VPS
- ✅ **Technology Stack**: Next.js + PostgreSQL + Redis + Docker on Hostinger VPS
- ✅ **Cost Strategy**: €0 additional costs using existing VPS, upgrade path defined
- ✅ **Documentation**: See docs/ folder for complete analysis
- ✅ **VPS Deployment**: Production environment set up on Hostinger VPS
- ✅ **Supabase Integration**: Database connected and configured

**Phase 1: Foundation (IN PROGRESS 🔄)**
- ✅ Core database schema for stocks, users, portfolios (PostgreSQL + Supabase)
- ✅ **Symbol Population Service** - Automated data enrichment
  - Deployed: 2026-01-30
  - Schedule: Every 4 hours via cron
  - Functionality: Populates `symbol` field from extra_data, WKN, ISIN
  - Container: blackfire-cron (Docker)
  - Documentation: SYMBOL-POPULATION.md
- ✅ **Stock Price Charts** - Interactive TradingView-style charts
  - Deployed: 2026-01-30
  - Library: lightweight-charts@4.2.3
  - API: Alpha Vantage (free tier)
  - Timeframes: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
  - Location: Company detail pages (after price card, before notes)
  - Components: src/components/charts/stock-price-chart.tsx
- ✅ **Notes System** - Rich-text notes replacing Info1-Info5
  - Deployed: 2026-01-30
  - See "Notes System (COMPLETED)" section above for full details
  - Location: Company detail pages (after chart, before profile)
  - Features: Rich-text editing, tags, priority, privacy, reminders
- ✅ Basic stock overview and detail pages
- 🔄 Data ingestion pipeline from Excel/Dropbox (scheduled every 12 hours)
- 🔄 Live price data integration (scheduled hourly during market hours)
- 🔄 User authentication (NextAuth.js)
- 🔄 Watchlist functionality

**Phase 2: Information Management**
- Information source registry and management UI
- RSS/feed aggregation
- Basic web scraping for select sources
- Content archiving system

**Phase 3: Advanced Knowledge Management**
- Full-text search across notes (Elasticsearch/MeiliSearch)
- Export notes to markdown/PDF
- Bulk note operations
- Note attachments (images, files)
- Note history/versioning
- AI-powered content summarization of notes
- Email reminders for reminder_date
- Notion integration for long-form notes (if hybrid approach)

**Phase 4: Social & Multimedia**
- Social media API integrations (Twitter/X, Reddit, LinkedIn)
- YouTube monitoring
- Newsletter integration
- Sentiment analysis on collected content

**Phase 5: Intelligence & Automation**
- AI-powered analysis of information sources
- Automated insights generation
- Pattern recognition across notes and sources
- Recommendation engine for investment timing

## Architecture Patterns

### Information Flow

```
External Sources → Source Monitors → Content Processor → Categorization Engine → Database
                                                              ↓
User Interface ← Search & Filter ← Notes System ← AI Analysis & Enrichment
```

### Key Architectural Decisions

**Information Source Management**
- Use job queue system (Celery, Bull, etc.) for asynchronous source monitoring
- Implement rate limiting and politeness policies for web scraping
- Store raw content separately from processed/analyzed content
- Use CDN or object storage (S3, etc.) for multimedia content (videos, images)

**Notes Storage Strategy**
- Relational DB (PostgreSQL) for structured metadata and relationships
- Document store (MongoDB, PostgreSQL JSONB) for flexible note content
- Full-text search engine (Elasticsearch, MeiliSearch) for performant search
- Consider graph database (Neo4j) for complex relationship modeling between stocks, sectors, baskets, sources, and notes

**Content Processing Pipeline**
- Ingest: Fetch content from various sources
- Parse: Extract text, metadata, entities
- Analyze: Sentiment analysis, topic extraction, relevance scoring
- Link: Connect to relevant stocks/sectors/baskets
- Notify: Alert users of high-priority information

**Caching Strategy**
- Redis for live stock prices and frequently accessed data
- CDN for static assets and multimedia content
- Application-level caching for computed analyses and AI summaries

## Reference Materials

### Project Documentation
- **blackfire_service Briefing.rtf** - Original German-language requirements
- **CLAUDE.md** - This file, guidance for Claude Code
- **README.md** - Developer documentation and setup guide

### Architecture & Analysis (docs/)
- **simplywall-st-analysis.md** - ✅ Complete feature analysis and comparison matrix
- **data-source-evaluation.md** - ✅ Notion vs PostgreSQL evaluation (saved €168K+/year)
- **technology-stack.md** - ✅ Full stack specification and costs
- **vps-deployment-strategy.md** - ✅ Self-hosting strategy for €0 additional costs
- **DEPLOYMENT-VPS.md** - ✅ Complete VPS deployment guide
- **QUICK-START-VPS.md** - ✅ 30-minute quick start guide

### External References
- Review Blackfire_automation project for initial data structure examples
- Simply Wall St for UI/UX patterns
- theinformation.com for content presentation patterns
- TradingView, Yahoo Finance for interactive charts

## Current Status

**Project Stage**: MVP Development - Core Features Deployed

**Completed (2026-01-30):**
- ✅ Research & Architecture (Phase 0)
- ✅ Technology stack defined
- ✅ Database schema designed (PostgreSQL + Supabase)
- ✅ Cost optimization (€0 additional vs €172K/year with Notion)
- ✅ **Symbol Population Service** - Deployed and Running
  - Automatically populates `symbol` field from existing data
  - Runs every 4 hours via cron
  - Sources: extra_data (Company Symbol, Ticker), WKN, ISIN
  - Success rate: ~67% (2/3 symbols found in test)
- ✅ **Stock Price Charts** - Interactive TradingView-style charts
  - Library: lightweight-charts@4.2.3
  - API: Alpha Vantage (free tier, API key: OQC14NN6ENR1LFZD)
  - Multiple timeframes: 1D, 1W, 1M, 3M, 6M, 1Y, ALL
  - Caching: Multi-layer (Redis → PostgreSQL → API)
  - Location: Company detail pages (line 167-185)
  - **CRITICAL**: DO NOT REMOVE - marked with prominent comment
- ✅ **Notes System** - Rich-text notes on company pages
  - Replaced Info1-Info5 with unlimited notes
  - Rich-text editor: TipTap with full formatting
  - Features: Tags, priority, privacy, reminders
  - Text preview: 300 characters per card
  - Migration: Info1-Info5 data migrated to editable notes
  - RLS policies: Shared notes visible to all, private to owner only
  - No duplicates: Verified and cleaned (2026-01-30)
- ✅ Company detail pages with full data display
- ✅ Watchlist functionality

**Currently Running Services:**
1. **Vercel Production** (PRIMARY)
   - URL: https://blackfire-service.vercel.app
   - Auto-deploys on git push to main
   - Status: ✅ Live and functional

2. **Symbol Population Cron** (VPS backup)
   - Schedule: Every 4 hours
   - Status: ✅ Live and functional
   - Last test: 2026-01-30, Success rate 66.7%

**Next Steps:**
1. ~~Stock price charts~~ ✅ COMPLETED
2. ~~Notes system~~ ✅ COMPLETED
3. Implement authentication (NextAuth.js) - IN PROGRESS
4. Build stock list/overview page with filtering
5. Data ingestion pipeline from Excel/Dropbox
6. Portfolio management features
7. User dashboard

**Deployment:**
- **Primary Platform**: Vercel (https://blackfire-service.vercel.app)
- **Database**: Supabase (https://lglvuiuwbrhiqvxcriwa.supabase.co)
- **Backup VPS**: Hostinger (72.62.148.205:3000)
- **Cost**: €0 additional monthly costs (Vercel free tier, Supabase free tier)
- **Process**: Git push → Vercel auto-deploy → Test on Vercel URL

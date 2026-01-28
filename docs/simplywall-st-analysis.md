# Simply Wall St - Comprehensive Feature Analysis

**Analysis Date**: 2026-01-28
**Purpose**: Extract essential features and patterns for Blackfire Service implementation

## Executive Summary

Simply Wall St is a visual stock analysis platform serving 7M+ investors globally, with coverage of 120,000+ stocks across 90 markets. The platform distinguishes itself through its visual-first approach, transforming complex financial data into intuitive graphics, particularly the signature "Snowflake" visualization.

**Core Value Proposition**: "Demystify the stock market by transforming financial data into visually engaging, easily digestible graphics"

**Data Source**: Institutional-grade data from S&P Global Market Intelligence

---

## 1. Core Features & Functionality

### 1.1 Snowflake Visualization (Signature Feature)

**The 5 Assessment Criteria:**
1. **Value** - Fair value vs. current price
2. **Future Growth** - Analyst forecasts and growth projections
3. **Past Performance** - Historical financial achievements
4. **Financial Health** - Balance sheet strength, debt servicing
5. **Dividends** - Sustainability and reliability

**Scoring Methodology:**
- 6 individual checks per criterion (30 total checks per stock)
- Binary scoring: 1 for pass, 0 for fail
- Score range: 0-6 per category
- Visual representation: Larger/greener = stronger fundamentals

**Technical Implementation:**
- Updates every 6 hours for DCF valuations
- Daily updates for health snapshots and key insights
- Color coding: Green (healthy), Red (problems)

### 1.2 Valuation Analysis

**Four DCF Model Variations:**
1. **2-Stage Free Cash Flow Model** - High-growth companies
2. **Dividend Discount Model** - Dividend-paying firms
3. **Excess Returns Model** - Financial institutions
4. **AFFO Model** - REITs

**Discount Rate Formula:**
```
Discount Rate = Risk Free Rate + (Levered Beta × Equity Risk Premium)
```
- Uses 5-year average of 10-year government bonds (reduces volatility)
- Provides fair value calculations updated every 6 hours

**Relative Valuation Metrics:**
- Price-to-Earnings (P/E) ratio
- Price/Earnings to Growth (PEG) ratio
- Price-to-Book (P/B) ratio
- Comparisons against industry and market averages

### 1.3 Stock Screener

**Basic Filters:**
- Market/Country selection
- Industry classification

**Advanced Filters (36+ parameters):**
- Market capitalization
- P/E, P/B, PEG ratios
- Dividend yield
- Risk score
- Revenue growth
- Buyback yield
- Insider ownership
- Past performance metrics
- Future growth indicators

**Screener Features:**
- Save custom screeners (Free: 0, Premium: 3, Unlimited: 10)
- Screener Alerts - weekly notifications for new matches
- Snowflake filtering by 5 criteria
- Multiple filter combinations

**Results Display:**
- Free: 4 screener results
- Premium: More results (not specified)
- Visual snowflake for each result

### 1.4 Portfolio Tracker

**Core Portfolio Features:**
- Track realized/unrealized gains
- Currency fluctuation monitoring
- Annualized returns (IRR calculation)
- Multi-portfolio support (Free: 1, Premium: 3, Unlimited: 5)
- Holdings limits (Free: 10, Premium: 30/portfolio, Unlimited: unlimited)
- Broker integration for automatic import
- Waterfall chart for returns breakdown

**Diversification Analysis:**
- Sector allocation breakdown
- Geographic distribution
- Company size analysis
- Interactive visualization charts
- Portfolio health score (Snowflake for entire portfolio)

**Performance Tracking:**
- Historical performance charts
- Benchmark comparisons
- Time-weighted returns
- Money-weighted returns

### 1.5 Dividend Tracker

**Income Tracking:**
- Annual and monthly dividend income (real-time)
- Current yield calculation
- Yield on cost (YoC)
- Historical dividend payments
- Automatic dividend detection

**Forecasting:**
- 3+ year dividend projections
- 12-month forward income estimates
- Visual forecast graphs
- Dividend quality score (SWS proprietary)

**Quality Assessment:**
- Dividend sustainability analysis
- Payout ratio evaluation
- Risk identification for unreliable payers

**Alerts:**
- Dividend declarations
- Payment changes
- Risk notifications

### 1.6 Stock Reports

**Report Coverage (per stock):**
- Valuation analysis
- Financial health assessment
- Management profiles
- Insider transactions
- Dividend quality
- Growth forecasts
- Balance sheet analysis (assets, liabilities, debt, equity, cash runway)

**Access Limits:**
- Free: 5 reports/month
- Premium: 30 reports/month
- Unlimited: No limit

**Export Options:**
- PDF reports (Unlimited only)
- CSV data exports (Unlimited only)
- Excel exports (Unlimited only)

### 1.7 Investing Ideas & Discovery

**Curated Collections (100+ pre-built):**
- Undervalued companies
- Dividend powerhouses
- Insider buying activity
- Sector-specific (AI stocks, nuclear energy, autonomous vehicles)
- Growth strategies
- Value strategies

**Smart Updates & Insights:**
- Fundamental change notifications
- Material information filtering (minimize noise)
- Targeted alerts based on user portfolios

---

## 2. User Experience & Design Patterns

### 2.1 Navigation & Information Architecture

**Primary Navigation:**
- Portfolio Tracker
- Dividend Tracker
- Stock Investing Ideas
- Stock Screener
- Watchlists
- Community Narratives

**Multi-language Support:**
- English, Japanese, Deutsch, Español, Korean

### 2.2 Visual Design Philosophy

**Key Principles:**
- Visual-first approach
- Minimal text, maximum graphics
- Intuitive color coding (green/red)
- Abundant whitespace
- Alternating feature sections
- Image-heavy explanations

**Interactive Elements:**
- Sankey diagrams for flow visualization
- Comparison charts
- Forecasting visualizations
- Hover tooltips on charts
- Fixed narrative panels on desktop

### 2.3 Mobile Experience

- Responsive design (works on desktop and mobile)
- Native iOS app (App Store)
- Native Android app (Google Play)
- App ratings: 4.6/5 on both platforms

### 2.4 User Onboarding

**Low Friction Conversion:**
- "No credit card required. Free forever"
- Demo portfolio available
- Interactive tutorials
- Robust help center

**Trust Signals:**
- Trustpilot: 4.3/5 from 4,684 reviews
- 7M+ global investors
- Institutional data provider credibility

---

## 3. Freemium Business Model

### 3.1 Pricing Tiers

| Feature | Free | Premium | Unlimited |
|---------|------|---------|-----------|
| **Price** | $0 | $10/mo (billed yearly) | $20-21.50/mo (billed yearly) |
| **Company Reports** | 5/month | 30/month | Unlimited |
| **Saved Screeners** | 0 | 3 | 10 |
| **Screener Results** | 4 | More | Full |
| **Portfolios** | 1 | 3 | 5 |
| **Holdings/Portfolio** | 10 max | 30 max | Unlimited |
| **Broker Linking** | No | Yes | Yes |
| **PDF/CSV Export** | No | No | Yes |
| **Excel Export** | No | No | Yes |

### 3.2 Conversion Strategy

**Free Tier Purpose:**
- Allow users to experience core value (Snowflake visualization)
- Limited access encourages upgrade for serious users
- Requires sign-up (capture leads)

**Premium Justification:**
- Multi-portfolio tracking (serious investors)
- Broker integration (convenience)
- More company research capacity

**Unlimited Justification:**
- Export capabilities (professional use)
- Unlimited research (active traders)
- Maximum portfolio complexity

---

## 4. Technical Architecture Insights

### 4.1 Data Processing

- Institutional data from S&P Global Market Intelligence
- DCF calculations updated every 6 hours
- Daily health snapshots and key insights
- Weekly screener alert checks
- Real-time portfolio calculations

### 4.2 Performance Considerations

- Must handle 120,000+ stocks across 90 markets
- Serving 7M+ users globally
- Real-time portfolio updates
- Responsive interactive charts

### 4.3 Third-party Integrations

- Broker API integrations for portfolio import
- App Store and Google Play distribution
- Trustpilot review integration
- S&P Global Market Intelligence data feed

---

## 5. Feature Comparison Matrix: Simply Wall St vs. Blackfire

| Feature Category | Simply Wall St | Blackfire Planned | Priority |
|-----------------|----------------|-------------------|----------|
| **Visual Analysis** | Snowflake (5 criteria) | Snowflake + custom metrics | HIGH |
| **Valuation** | 4 DCF models | DCF + custom AI models | HIGH |
| **Stock Screener** | 36+ filters | Enhanced filters + AI recommendations | HIGH |
| **Portfolio Tracking** | Multi-portfolio, broker sync | Multi-portfolio + investment tracking | HIGH |
| **Dividend Analysis** | 3-year forecasts | Extended forecasts + alerts | MEDIUM |
| **Company Reports** | Pre-generated reports | Dynamic + external source aggregation | HIGH |
| **Information Sources** | S&P Global only | **100+ sources (blogs, social, news, etc.)** | **HIGH** |
| **Notes System** | Not available | **Multi-level notes (stock/sector/basket)** | **HIGH** |
| **AI Analysis** | Automated scoring | **AI-powered timing recommendations** | **HIGH** |
| **IPO Tracking** | Not emphasized | **Pre-IPO company tracking** | **MEDIUM** |
| **Notification System** | Basic alerts | **Advanced transaction notifications** | MEDIUM |
| **Admin Backend** | Not visible | **User & system management** | MEDIUM |
| **Multi-tenancy** | Single platform | **Custom data sources per user** | MEDIUM |

---

## 6. Key Differentiators for Blackfire

### 6.1 Where Blackfire Should Match/Exceed

1. **Visual Analysis**: Implement similar snowflake or adopt unique visualization
2. **Stock Screener**: At least 36+ filters with save functionality
3. **Portfolio Tracking**: Multi-portfolio with performance analytics
4. **Dividend Tracking**: Income forecasting and quality scoring
5. **Mobile-first Design**: Responsive with potential native apps later

### 6.2 Where Blackfire Differentiates

1. **Information Source Management**:
   - Track 100+ external sources (blogs, YouTube, social media)
   - Aggregate news and insights from multiple channels
   - User-managed source registry

2. **Advanced Notes System**:
   - Multi-level organization (stock/sector/basket)
   - Rich text with markdown support
   - AI-powered summarization
   - Version history

3. **AI-Powered Timing**:
   - Entry/exit point recommendations
   - Pattern recognition across sources
   - Sentiment analysis integration

4. **Pre-IPO Focus**:
   - Track companies before public listing
   - IPO calendar and alerts
   - Early-stage opportunity identification

5. **Notion Integration**:
   - Hybrid notes system
   - Flexible data source options
   - User-controlled workflows

---

## 7. UI/UX Patterns to Adopt

### 7.1 Visual Hierarchy
- Lead with visuals, support with text
- Use color consistently (green = good, red = concerning)
- Fixed panels for continuous context while scrolling
- Waterfall charts for breakdown visualization

### 7.2 Onboarding
- Zero friction signup (no credit card)
- Demo portfolio for immediate value
- Interactive tutorials
- Comprehensive help center

### 7.3 Data Presentation
- Snowflake-style multi-criteria scoring
- Hover tooltips for detailed information
- Comparison charts against benchmarks
- Time-series with multiple timeframe options

### 7.4 Filtering & Search
- Basic + Advanced filter separation
- Save custom screens with alerts
- Visual results display (not just tables)
- Quick access to saved configurations

---

## 8. Implementation Recommendations

### 8.1 Phase 1 Priorities (Match Core Value)
1. Create signature visualization (Snowflake equivalent or better)
2. Implement stock screener with 30+ filters
3. Build portfolio tracker with basic analytics
4. Develop company detail pages with key metrics
5. Design mobile-responsive interface

### 8.2 Phase 2 Priorities (Differentiate)
1. Implement information source management system
2. Build notes system (quick notes native)
3. Add AI-powered content aggregation
4. Create advanced notification system
5. Develop admin backend

### 8.3 Phase 3 Priorities (Scale)
1. Add broker integrations
2. Implement advanced AI timing recommendations
3. Build community features
4. Create export capabilities
5. Develop native mobile apps

---

## 9. Sources & References

- [Simply Wall St Homepage](https://simplywall.st/)
- [Simply Wall St Review 2026 - The Stock Dork](https://www.thestockdork.com/simply-wall-st-review/)
- [Simply Wall St Review - TraderHQ](https://traderhq.com/simply-wall-st-review-best-investment-analysis-tool-for-all-investors/)
- [Company Analysis Model - GitHub](https://github.com/SimplyWallSt/Company-Analysis-Model/blob/master/MODEL.markdown)
- [How the Snowflake Works - Support Center](https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work)
- [Understanding Subscription Plan Limits](https://support.simplywall.st/hc/en-us/articles/10072135570063-Understanding-the-Subscription-Plan-Limits)
- [Stock Screener Features - Support Center](https://support.simplywall.st/hc/en-us/articles/10543502387727-Stock-Screener-Key-Features-and-How-to-s)
- [Dividend Tracker Features](https://simplywall.st/feature/dividend-tracker)
- [Portfolio Tracker Features](https://simplywall.st/features/portfolio)
- [Wall Street Zen Review](https://www.wallstreetzen.com/blog/simply-wall-st-review/)

---

## 10. Next Steps

1. ✅ Complete Simply Wall St analysis
2. ⏭️ Evaluate Notion vs. alternatives
3. ⏭️ Define Blackfire technology stack
4. ⏭️ Create detailed feature specifications
5. ⏭️ Design database schema
6. ⏭️ Develop UI wireframes/mockups

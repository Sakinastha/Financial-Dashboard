# Financial Dashboard

A single-page financial dashboard web application that allows users to search for any US-listed company by ticker symbol and view key financial metrics sourced directly from SEC EDGAR filings.

**Live Demo:** https://financial-dashboard-sigma-sand.vercel.app

---

## Features

### Core Requirements (Cat Rock Capital Case Study)

- **Ticker Search**: Enter any US-listed company ticker to generate a financial dashboard
- **SEC EDGAR Data**: All financial data sourced directly from official SEC XBRL filings
- **Key Metrics Displayed**:
  - Revenue
  - Operating Income
  - EBITDA (calculated as Operating Income + Depreciation & Amortization)
- **Calculated Metrics**:
  - Year-over-Year (Y/Y) Growth for all metrics
  - Operating Margin (Operating Income / Revenue)
  - EBITDA Margin (EBITDA / Revenue)
- **Time Periods**:
  - Last 8 Quarters (displayed on the left)
  - Last 3 Fiscal Years (displayed on the right)

### Additional Features

- **Autocomplete Search**: Real-time ticker suggestions as you type
- **Popular Stocks**: Quick access to AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA
- **Shareable URLs**: Bookmark or share links with ticker parameters (`?ticker=AAPL`)
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Reduced motion support, keyboard navigation, WCAG compliant

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Language | TypeScript 5 |
| Styling | styled-jsx (built into Next.js) |
| Data Source | SEC EDGAR XBRL API (no API key required) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd financial-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── financials/route.ts    # Fetch company financial data
│   │   └── tickers/route.ts       # Ticker autocomplete search
│   ├── globals.css                # Global styles, CSS variables
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard (all components inline)
├── lib/
│   └── sec-edgar.ts               # SEC EDGAR API integration
└── types/
    └── financials.ts              # TypeScript interfaces
```

**Note:** All UI components are defined inline in `page.tsx` for simplicity.

---

## Architecture (Simple Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│       ┌───────────────┐         ┌───────────────┐               │
│       │  Search Bar   │    →    │   Tables &    │               │
│       │  (React)      │         │   Cards       │               │
│       └───────────────┘         └───────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                    HTTP Request/Response
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /api/financials                                          │  │
│  │  - Converts ticker → CIK (SEC's company ID)               │  │
│  │  - Fetches raw XBRL data from SEC                         │  │
│  │  - Filters quarterly vs annual data                       │  │
│  │  - Calculates Q4 (FY - Q1 - Q2 - Q3)                      │  │
│  │  - Calculates EBITDA, growth rates, margins               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         HTTPS Fetch
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                       SEC EDGAR API                             │
│  - company_tickers.json (list of all US companies)              │
│  - companyfacts/CIK{id}.json (all financial data for a company) │
└─────────────────────────────────────────────────────────────────┘
```

**In plain English:**

1. **You type a ticker** (like "AAPL") in the search bar
2. **The browser asks our server** for financial data
3. **Our server asks SEC EDGAR** for the raw filing data
4. **Our server cleans up the data** — the SEC data is messy (has duplicates, cumulative totals mixed with quarterly, etc.) so we filter and calculate what we need
5. **Our server sends clean data** back to your browser
6. **Your browser displays it** in tables

---

## How It Works (Detailed)

### Data Pipeline

1. **User enters ticker** → Autocomplete fetches from cached SEC company list
2. **User selects company** → API converts ticker to CIK (Central Index Key)
3. **Fetch XBRL data** → Retrieves company facts from SEC EDGAR
4. **Extract metrics** → Parses revenue, operating income, depreciation from multiple XBRL tags
5. **Calculate derived values** → EBITDA, Y/Y growth, margins
6. **Display dashboard** → Tables show last 8 quarters + last 3 fiscal years

### SEC EDGAR Integration

The application fetches data from two SEC EDGAR endpoints:

- **Company Tickers**: `https://www.sec.gov/files/company_tickers.json`
- **Company Facts (XBRL)**: `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`

The XBRL data is parsed to extract financial metrics using multiple tag variations to handle differences in how companies report (e.g., `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax`, etc.).

### Calculations

```
EBITDA = Operating Income + Depreciation & Amortization

Y/Y Growth = ((Current Period - Prior Year Same Period) / |Prior Year|) × 100

Operating Margin = (Operating Income / Revenue) × 100

EBITDA Margin = (EBITDA / Revenue) × 100
```

---

## API Endpoints

### `GET /api/financials?ticker=AAPL`

Returns complete financial data for a company.

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "cik": "0000320193",
  "fiscalYearEnd": "September",
  "quarterly": [
    {
      "period": "Q4 2024",
      "endDate": "2024-09-28",
      "revenue": 94736000000,
      "operatingIncome": 28736000000,
      "ebitda": 32146000000,
      "revenueGrowth": 2.5,
      "operatingIncomeGrowth": 1.2,
      "ebitdaGrowth": 1.8,
      "operatingMargin": 30.35,
      "ebitdaMargin": 33.96
    }
  ],
  "annual": [...]
}
```

### `GET /api/tickers?q=apple`

Returns matching tickers for autocomplete (limited to 10 results).

**Response:**
```json
[
  { "ticker": "AAPL", "name": "Apple Inc." },
  { "ticker": "APLE", "name": "Apple Hospitality REIT Inc." }
]
```

---

## Deployment

This application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): Connect your GitHub repo for automatic deployments
- **Netlify**: Use the Next.js adapter
- **Railway/Render**: Deploy as a Node.js application
- **Docker**: Build and deploy containerized

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/financial-dashboard)

---

## Design Decisions & Finance Rationale

### Data Architecture

1. **SEC EDGAR XBRL over HTML scraping**
   - XBRL provides structured, machine-readable data with consistent field definitions
   - More reliable than parsing human-readable 10-K/10-Q documents
   - Future-proof: SEC mandates XBRL for all filers

2. **Multiple XBRL tags for each metric**
   - Companies use different tags inconsistently (e.g., Google uses `RevenueFromContractWithCustomer` in some quarters, `Revenues` in others)
   - The app tries 12+ tag variations for revenue alone
   - Tags are merged without duplicates to ensure complete coverage

3. **Q4 calculation from annual filings**
   - Q4 data is NOT filed separately—it's embedded in the annual 10-K
   - Calculated as: `Q4 = FY - Q1 - Q2 - Q3`
   - Ensures complete 8-quarter view for trend analysis

4. **Deduplication by filing date**
   - Companies may restate earnings due to accounting corrections
   - The most recent filing for each period is used (truth in restatements)

5. **SEC EDGAR `fy` field quirk**
   - Critical discovery: SEC's `fy` field represents the FILING year, not the DATA year
   - Example: Apple's Q2 FY2025 data appears in a filing with `fy=2026` (filed in 2026)
   - Solution: Use actual end dates to identify periods, not the fy-fp combination
   - This ensures correct Y/Y comparisons and avoids duplicate/mismatched data

6. **YTD vs Quarterly data filtering**
   - SEC filings contain BOTH quarterly (90-day) AND cumulative YTD figures
   - Both may have the same end date, causing confusion
   - Solution: Filter by duration (80-105 days for quarterly) before processing
   - This prevents showing inflated YTD numbers as quarterly data

### Finance-Specific Decisions

5. **Why EBITDA?**
   - EBITDA removes non-cash charges (depreciation/amortization) and shows operating cash generation
   - Allows comparison across companies with different capital structures
   - Standard metric for valuation multiples (EV/EBITDA)

6. **Y/Y Growth for sign changes shows "N/M"**
   - When a company goes from loss to profit (or vice versa), percentage growth is mathematically meaningless
   - "N/M" (Not Meaningful) is the standard finance convention
   - More informative than showing misleading percentages like "+500%"

7. **Fiscal year end display**
   - Apple's fiscal year ends in September, Walmart's in January
   - Critical context for interpreting Q4 comparisons
   - Avoids confusion when comparing companies with different fiscal calendars

8. **Operating Margin vs EBITDA Margin (both shown)**
   - Operating Margin: Shows profitability after operating expenses
   - EBITDA Margin: Shows cash profitability before capital structure effects
   - Investors use both for different analytical purposes

### UI/UX Decisions

9. **Left: Quarters / Right: Annual**
   - Matches the case study specification exactly
   - Quarters show operational momentum (short-term trends)
   - Annual shows strategic trajectory (long-term patterns)

10. **Color-coded growth indicators**
    - Green: Positive growth (improving)
    - Red: Negative growth (declining)
    - Gray: N/M or unavailable
    - Instant visual scanning for analysts

---

## Calculation Verification

The dashboard calculations have been verified against official Apple investor relations data:

| Metric | Dashboard | Official Apple IR | Status |
|--------|-----------|-------------------|--------|
| Q1 FY2025 Revenue | $124.3B | $124.3B | ✓ Match |
| Q1 FY2025 Operating Income | $42.8B | ~$42.9B | ✓ Match |
| Q1 FY2025 EBITDA | $45.9B | ~$45.8B (calculated) | ✓ Match |
| Q2 FY2025 Revenue | $95.4B | $95.4B | ✓ Match |
| FY2025 Revenue | $416.2B | $416.2B | ✓ Match |

**Verification sources:**
- [Apple Q1 FY2025 Earnings](https://www.apple.com/newsroom/2025/01/apple-reports-first-quarter-results/)
- SEC EDGAR 10-Q/10-K filings

**Note on EBITDA availability:** Quarterly EBITDA may show as "—" for some quarters when SEC EDGAR depreciation data is not available. This is intentional—showing null is preferable to showing incorrect calculated values.

---

## Known Limitations

- **Smaller companies**: Some may not have complete XBRL data (pre-2020 filings especially)
- **Banks & insurance**: Use different accounting standards; handled with alternative XBRL tags but may show fewer metrics
- **ADRs**: Foreign companies filing as ADRs may have inconsistent XBRL tagging
- **Real-time data**: SEC EDGAR updates within 24 hours of filing; not real-time

---

## Future Enhancements

With additional time, the following would add investor value:

- **EPS (Earnings Per Share)**: Critical for equity valuation
- **Free Cash Flow**: Important for DCF analysis
- **Revenue by segment**: Breakdown for diversified companies
- **Comparison to consensus estimates**: Shows beats/misses
- **Export to Excel**: Standard analyst workflow

---

## License

MIT

---

## Author

Built as a case study submission for Cat Rock Capital.

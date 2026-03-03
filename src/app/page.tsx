'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, ExternalLink } from 'lucide-react';
import { CompanyFinancials, FinancialData } from '@/types/financials';

interface TickerSuggestion {
  ticker: string;
  name: string;
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Dashboard />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <style jsx>{`
        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0a0a;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #333;
          border-top-color: #00d4aa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<CompanyFinancials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isClearing = useRef(false);

  const fetchData = useCallback(async (tickerSymbol: string, updateUrl = true) => {
    if (!tickerSymbol.trim()) return;
    setLoading(true);
    setError(null);
    setShowSuggestions(false);

    if (updateUrl) {
      router.push(`?ticker=${encodeURIComponent(tickerSymbol.trim())}`, { scroll: false });
    }

    try {
      const res = await fetch(`/api/financials?ticker=${encodeURIComponent(tickerSymbol.trim())}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to fetch');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (ticker.length < 1 || data || loading) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tickers?q=${encodeURIComponent(ticker)}`);
        const results = await res.json();
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [ticker, data, loading]);

  useEffect(() => {
    // Skip if we're intentionally clearing
    if (isClearing.current) {
      isClearing.current = false;
      return;
    }
    const urlTicker = searchParams.get('ticker');
    if (urlTicker && !data) {
      setTicker(urlTicker.toUpperCase());
      fetchData(urlTicker, false);
    }
  }, [searchParams, fetchData, data]);

  const handleSelect = (t: string) => {
    setTicker(t);
    setShowSuggestions(false);
    fetchData(t);
  };

  const handleClear = () => {
    isClearing.current = true;
    setTicker('');
    setData(null);
    setError(null);
    router.push('/', { scroll: false });
  };

  // Landing page
  if (!data && !loading && !error) {
    return <LandingPage
      ticker={ticker}
      setTicker={setTicker}
      onSearch={() => fetchData(ticker)}
      onSelect={handleSelect}
      suggestions={suggestions}
      showSuggestions={showSuggestions}
      setShowSuggestions={setShowSuggestions}
    />;
  }

  return (
    <div className="terminal">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          {data && (
            <>
              <span className="ticker">{data.ticker}</span>
              <span className="company-name">{data.companyName}</span>
              <span className="fy-end">FY END: {data.fiscalYearEnd.toUpperCase()}</span>
            </>
          )}
        </div>
        <div className="header-right">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && fetchData(ticker)}
              placeholder="TICKER"
            />
            {ticker && (
              <button onClick={handleClear} className="clear-btn">
                <X size={12} />
              </button>
            )}
          </div>
          <a
            href={data ? `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data.cik}&type=10-&dateb=&owner=include&count=40` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="source"
          >
            SEC EDGAR <ExternalLink size={10} style={{ marginLeft: 4 }} />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {error && (
          <div className="error-bar">
            <span>{error}</span>
            <button onClick={() => setError(null)}>DISMISS</button>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="loading-header">
              <div className="spinner" />
              <span>FETCHING SEC EDGAR DATA...</span>
            </div>
            <div className="skeleton-metrics">
              <div className="skeleton-box" />
              <div className="skeleton-box" />
              <div className="skeleton-box" />
            </div>
            <div className="skeleton-tables">
              <div className="skeleton-table" />
              <div className="skeleton-table" />
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Key Metrics Row */}
            <div className="metrics-row">
              <MetricBox
                label="REVENUE"
                value={data.quarterly[0]?.revenue}
                growth={data.quarterly[0]?.revenueGrowth}
                period={data.quarterly[0]?.period}
              />
              <MetricBox
                label="OPERATING INCOME"
                value={data.quarterly[0]?.operatingIncome}
                growth={data.quarterly[0]?.operatingIncomeGrowth}
                margin={data.quarterly[0]?.operatingMargin}
                period={data.quarterly[0]?.period}
              />
              <MetricBox
                label="EBITDA"
                value={data.quarterly[0]?.ebitda}
                growth={data.quarterly[0]?.ebitdaGrowth}
                margin={data.quarterly[0]?.ebitdaMargin}
                period={data.quarterly[0]?.period}
              />
            </div>

            {/* Data Tables - Side by Side */}
            <div className="tables-container">
              <div className="table-section">
                <div className="table-header">QUARTERLY DATA — LAST 8 QUARTERS</div>
                <DataTable data={data.quarterly} />
              </div>
              <div className="table-section">
                <div className="table-header">ANNUAL DATA — LAST 3 FISCAL YEARS</div>
                <DataTable data={data.annual} />
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        .terminal {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e5e5e5;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #1a1a1a;
          background: #0d0d0d;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ticker {
          font-size: 20px;
          font-weight: 700;
          color: #00d4aa;
          letter-spacing: 1px;
        }

        .company-name {
          font-size: 14px;
          color: #888;
          font-weight: 500;
        }

        .fy-end {
          font-size: 11px;
          color: #555;
          padding: 4px 8px;
          border: 1px solid #333;
          letter-spacing: 0.5px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: #111;
          border: 1px solid #333;
          padding: 0 12px;
          gap: 8px;
        }

        .search-box :global(.search-icon) {
          color: #555;
        }

        .search-box input {
          background: transparent;
          border: none;
          color: #e5e5e5;
          font-family: inherit;
          font-size: 13px;
          padding: 8px 0;
          width: 120px;
          outline: none;
          letter-spacing: 1px;
        }

        .search-box input::placeholder {
          color: #444;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #555;
          cursor: pointer;
          padding: 4px;
          display: flex;
        }

        .clear-btn:hover {
          color: #888;
        }

        .source {
          display: inline-flex;
          align-items: center;
          font-size: 10px;
          color: #00d4aa;
          letter-spacing: 1px;
          padding: 4px 10px;
          border: 1px solid #00d4aa33;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .source:hover {
          background: #00d4aa15;
          border-color: #00d4aa66;
        }

        .main {
          padding: 24px;
        }

        .error-bar {
          background: #1a0a0a;
          border: 1px solid #ff4444;
          color: #ff6666;
          padding: 12px 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .error-bar button {
          background: none;
          border: 1px solid #ff4444;
          color: #ff6666;
          padding: 4px 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .loading-state {
          padding: 0;
        }

        .loading-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 32px;
          color: #555;
          font-size: 11px;
          letter-spacing: 1px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #222;
          border-top-color: #00d4aa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .skeleton-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #252525;
          border: 1px solid #303030;
          margin-bottom: 24px;
        }

        .skeleton-box {
          height: 90px;
          background: linear-gradient(90deg, #0d0d0d 25%, #151515 50%, #0d0d0d 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-tables {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .skeleton-table {
          height: 320px;
          background: #0d0d0d;
          border: 1px solid #252525;
          position: relative;
          overflow: hidden;
        }

        .skeleton-table::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 25%, #15151520 50%, transparent 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #252525;
          border: 1px solid #303030;
          margin-bottom: 24px;
        }

        .tables-container {
          overflow: hidden;
        }

        .tables-container::after {
          content: '';
          display: table;
          clear: both;
        }

        .table-section {
          float: left;
          width: calc(50% - 12px);
          background: #0d0d0d;
          border: 1px solid #252525;
        }

        .table-section:last-child {
          float: right;
        }

        .table-header {
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 600;
          color: #888;
          letter-spacing: 1px;
          border-bottom: 1px solid #252525;
          background: #0a0a0a;
        }

        @media (max-width: 1024px) {
          .tables-container {
            grid-template-columns: 1fr;
          }
          .metrics-row {
            grid-template-columns: 1fr;
          }
          .header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

// Landing Page Component
function LandingPage({
  ticker,
  setTicker,
  onSearch,
  onSelect,
  suggestions,
  showSuggestions,
  setShowSuggestions
}: {
  ticker: string;
  setTicker: (t: string) => void;
  onSearch: () => void;
  onSelect: (t: string) => void;
  suggestions: TickerSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (s: boolean) => void;
}) {
  const quickTickers = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'JPM'];

  return (
    <div className="landing">
      <div className="landing-content">
        <div className="logo-container">
          <div className="logo-line" />
          <div className="logo">FINANCIAL TERMINAL</div>
          <div className="logo-line" />
        </div>
        <p className="tagline">SEC EDGAR DATA • REVENUE • OPERATING INCOME • EBITDA</p>

        <div className="search-container">
          <div className="search-wrapper">
            <input
              type="text"
              value={ticker}
              onChange={(e) => {
                setTicker(e.target.value.toUpperCase());
                if (e.target.value.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="ENTER TICKER"
            />
            <button onClick={onSearch}>GO</button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s.ticker} onClick={() => { onSelect(s.ticker); setShowSuggestions(false); }}>
                  <span className="s-ticker">{s.ticker}</span>
                  <span className="s-name">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="quick-links">
          {quickTickers.map((t) => (
            <button key={t} onClick={() => onSelect(t)}>{t}</button>
          ))}
        </div>

        <p className="footer-note">
          Real-time financial data from SEC EDGAR filings.<br />
          Last 8 quarters • Last 3 fiscal years • Y/Y growth • Margins
        </p>
      </div>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #0a0a0a;
          background-image: radial-gradient(circle, #222 1px, transparent 1px);
          background-size: 20px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 18vh;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          position: relative;
        }

        .landing::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, #0a0a0a 80%);
          pointer-events: none;
        }

        .landing-content {
          text-align: center;
          max-width: 520px;
          padding: 24px;
          position: relative;
          z-index: 1;
        }

        .logo-container {
          margin-bottom: 12px;
        }

        .logo-line {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #333 20%, #444 50%, #333 80%, transparent 100%);
        }

        .logo {
          font-size: 28px;
          font-weight: 700;
          color: #e5e5e5;
          letter-spacing: 4px;
          padding: 16px 0;
        }

        .tagline {
          font-size: 11px;
          color: #555;
          letter-spacing: 2px;
          margin-bottom: 48px;
        }

        .search-container {
          position: relative;
          margin-bottom: 32px;
        }

        .search-wrapper {
          display: flex;
          border: 1px solid #333;
          background: #0d0d0d;
        }

        .search-wrapper input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 16px 20px;
          color: #e5e5e5;
          font-family: inherit;
          font-size: 14px;
          letter-spacing: 2px;
          outline: none;
        }

        .search-wrapper input::placeholder {
          color: #444;
        }

        .search-wrapper button {
          background: transparent;
          border: none;
          border-left: 1px solid #333;
          color: #888;
          padding: 16px 32px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .search-wrapper button:hover {
          background: #1a1a1a;
          color: #e5e5e5;
        }

        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #111;
          border: 1px solid #333;
          border-top: none;
          z-index: 100;
        }

        .suggestions button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #1a1a1a;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }

        .suggestions button:hover {
          background: #1a1a1a;
        }

        .suggestions button:last-child {
          border-bottom: none;
        }

        .s-ticker {
          color: #00d4aa;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
        }

        .s-name {
          color: #666;
          font-size: 12px;
        }

        .quick-links {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: nowrap;
        }

        .quick-links button {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #555;
          padding: 10px 20px;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-links button:hover {
          border-color: #00d4aa;
          color: #00d4aa;
          background: rgba(0, 212, 170, 0.05);
          box-shadow: 0 0 20px rgba(0, 212, 170, 0.15);
        }

        .footer-note {
          margin-top: 48px;
          font-size: 10px;
          color: #3a3a3a;
          letter-spacing: 0.5px;
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
}

// Metric Box Component
function MetricBox({
  label,
  value,
  growth,
  margin,
  period
}: {
  label: string;
  value: number | null;
  growth: number | null;
  margin?: number | null;
  period: string;
}) {
  const formatValue = (v: number | null) => {
    if (v === null) return 'N/M';
    const abs = Math.abs(v);
    if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    return `$${v.toLocaleString()}`;
  };

  const formatGrowth = (g: number | null) => {
    if (g === null) return 'N/M';
    return `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`;
  };

  const growthColor = growth === null ? '#555' : growth >= 0 ? '#00d4aa' : '#ff4444';

  return (
    <div className="metric-box">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{formatValue(value)}</div>
      <div className="metric-details">
        <span className="growth" style={{ color: growthColor }}>
          {formatGrowth(growth)} Y/Y
        </span>
        {margin !== null && margin !== undefined && (
          <span className="margin">{margin.toFixed(1)}% MARGIN</span>
        )}
      </div>
      <div className="metric-period">{period}</div>

      <style jsx>{`
        .metric-box {
          background: #0d0d0d;
          padding: 14px 16px;
        }

        .metric-label {
          font-size: 10px;
          color: #555;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .metric-value {
          font-size: 26px;
          font-weight: 600;
          color: #e5e5e5;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .metric-details {
          display: flex;
          gap: 12px;
          margin-bottom: 4px;
        }

        .growth {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .margin {
          font-size: 11px;
          color: #555;
          letter-spacing: 0.5px;
        }

        .metric-period {
          font-size: 10px;
          color: #444;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}

// Data Table Component
function DataTable({ data }: { data: FinancialData[] }) {
  const formatVal = (v: number | null) => {
    if (v === null) return 'N/M';
    const abs = Math.abs(v);
    if (abs >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    return `$${v.toLocaleString()}`;
  };

  const formatGrowth = (g: number | null) => {
    if (g === null) return 'N/M';
    return `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`;
  };

  const formatMargin = (m: number | null) => {
    if (m === null) return 'N/M';
    return `${m.toFixed(1)}%`;
  };

  const growthClass = (g: number | null) => {
    if (g === null) return 'neutral';
    return g >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th className="left">PERIOD</th>
            <th>REVENUE</th>
            <th>Y/Y</th>
            <th>OP INC</th>
            <th>OP MGN</th>
            <th>EBITDA</th>
            <th>EBITDA MGN</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="left period">{row.period}</td>
              <td>{formatVal(row.revenue)}</td>
              <td className={growthClass(row.revenueGrowth)}>{formatGrowth(row.revenueGrowth)}</td>
              <td>{formatVal(row.operatingIncome)}</td>
              <td className="muted">{formatMargin(row.operatingMargin)}</td>
              <td>{formatVal(row.ebitda)}</td>
              <td className="muted">{formatMargin(row.ebitdaMargin)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .data-table {
          overflow-x: auto;
          height: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          height: auto;
        }

        th {
          text-align: right;
          padding: 10px 12px;
          font-weight: 600;
          color: #555;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #1a1a1a;
          font-size: 10px;
        }

        th.left {
          text-align: left;
        }

        td {
          text-align: right;
          padding: 10px 12px;
          color: #ccc;
          border-bottom: 1px solid #1f1f1f;
          font-variant-numeric: tabular-nums;
        }

        td.left {
          text-align: left;
        }

        td.period {
          color: #888;
          font-weight: 500;
        }

        td.positive {
          color: #00d4aa;
        }

        td.negative {
          color: #ff4444;
        }

        td.neutral {
          color: #555;
        }

        td.muted {
          color: #666;
        }

        tr:nth-child(even) td {
          background: #0c0c0c;
        }

        tr:hover td {
          background: #141414;
        }
      `}</style>
    </div>
  );
}

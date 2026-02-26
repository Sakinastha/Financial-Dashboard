/**
 * Financial Dashboard - Cat Rock Capital Case Study
 *
 * Requirements:
 * - Enter ticker for any US-listed company
 * - Display Revenue, Operating Income, EBITDA from SEC EDGAR
 * - Show Y/Y growth and margins
 * - Last 8 quarters (LEFT) | Last 3 fiscal years (RIGHT)
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import FinancialTable from '@/components/FinancialTable';
import { CompanyFinancials } from '@/types/financials';

interface TickerSuggestion {
  ticker: string;
  name: string;
}

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<CompanyFinancials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticker.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tickers?q=${encodeURIComponent(ticker)}`);
        const results = await response.json();
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ticker]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectSuggestion(suggestion: TickerSuggestion) {
    setTicker(suggestion.ticker);
    setShowSuggestions(false);
    fetchFinancialData(suggestion.ticker);
  }

  async function fetchFinancialData(tickerSymbol: string) {
    if (!tickerSymbol.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setShowSuggestions(false);

    try {
      const response = await fetch(`/api/financials?ticker=${encodeURIComponent(tickerSymbol.trim())}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchFinancialData(ticker);
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <header className="bg-[#0d1321] border-b border-gray-800">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Financial Dashboard</h1>
                  <p className="text-xs text-gray-500">SEC EDGAR Data • Real-time</p>
                </div>
              </div>
            </div>

            {/* Search Bar in Header */}
            <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Enter ticker symbol or company name..."
                  className="w-full pl-12 pr-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  disabled={loading}
                  autoComplete="off"
                />
                {searchLoading && (
                  <div className="absolute inset-y-0 right-12 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute inset-y-0 right-0 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-r-lg transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'Search'}
                </button>

                {/* Autocomplete */}
                {showSuggestions && suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-[#1a1f2e] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.ticker}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center justify-between transition-colors"
                      >
                        <span>
                          <span className="text-blue-400 font-semibold">{s.ticker}</span>
                          <span className="text-gray-400 ml-3 text-sm">{s.name}</span>
                        </span>
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="text-right">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected to SEC EDGAR
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-400 text-sm">Fetching data from SEC EDGAR...</p>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <>
            {/* Company Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">{data.companyName}</h2>
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-sm font-semibold rounded">
                    {data.ticker}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">CIK: {data.cik} • Data from SEC EDGAR 10-K and 10-Q filings</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-400">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Annual Revenue"
                value={data.annual[0]?.revenue}
                growth={data.annual[0]?.revenueGrowth}
                period={data.annual[0]?.period}
              />
              <MetricCard
                label="Operating Income"
                value={data.annual[0]?.operatingIncome}
                growth={data.annual[0]?.operatingIncomeGrowth}
                period={data.annual[0]?.period}
              />
              <MetricCard
                label="EBITDA"
                value={data.annual[0]?.ebitda}
                growth={data.annual[0]?.ebitdaGrowth}
                period={data.annual[0]?.period}
              />
              <MetricCard
                label="Operating Margin"
                value={data.annual[0]?.operatingMargin}
                isPercent
                period={data.annual[0]?.period}
              />
            </div>

            {/* Main Tables - LEFT: Quarters | RIGHT: Annual */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT SIDE - Last 8 Quarters */}
              <div className="lg:col-span-8">
                <FinancialTable
                  title="Quarterly Performance"
                  subtitle="Last 8 Quarters"
                  data={data.quarterly}
                  isQuarterly={true}
                />
              </div>

              {/* RIGHT SIDE - Last 3 Fiscal Years */}
              <div className="lg:col-span-4">
                <FinancialTable
                  title="Annual Performance"
                  subtitle="Last 3 Fiscal Years"
                  data={data.annual}
                  isQuarterly={false}
                />
              </div>
            </div>

            {/* Data Source Note */}
            <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Data Source:</strong> All financial data is sourced directly from SEC EDGAR filings (Form 10-K for annual reports, Form 10-Q for quarterly reports).
                EBITDA is calculated as Operating Income + Depreciation & Amortization. Y/Y Growth compares the same period in the prior year.
              </p>
            </div>
          </>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Search for a Company</h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
              Enter a stock ticker or company name to view financial metrics from SEC filings.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <p className="text-gray-600 text-sm mr-2">Try:</p>
              {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'TSLA'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTicker(t); fetchFinancialData(t); }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-md transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-auto">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <p>Financial Dashboard • Data from SEC EDGAR</p>
            <p>Built for Cat Rock Capital Developer Assessment</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  growth,
  period,
  isPercent = false
}: {
  label: string;
  value: number | null | undefined;
  growth?: number | null;
  period?: string;
  isPercent?: boolean;
}) {
  const formatValue = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    if (isPercent) return `${val.toFixed(1)}%`;
    const abs = Math.abs(val);
    if (abs >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    return `$${val.toLocaleString()}`;
  };

  const growthColor = growth !== null && growth !== undefined
    ? growth >= 0 ? 'text-green-400' : 'text-red-400'
    : 'text-gray-500';

  return (
    <div className="bg-[#0d1321] border border-gray-800 rounded-lg p-4">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{formatValue(value)}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-600">{period}</span>
        {growth !== undefined && growth !== null && (
          <span className={`text-xs font-medium ${growthColor}`}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% YoY
          </span>
        )}
      </div>
    </div>
  );
}

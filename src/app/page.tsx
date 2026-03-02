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

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import gsap from 'gsap';
import FinancialTable from '@/components/FinancialTable';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AnimatedSearchInput from '@/components/search/AnimatedSearchInput';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import ErrorAlert from '@/components/states/ErrorAlert';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { CompanyFinancials } from '@/types/financials';

interface TickerSuggestion {
  ticker: string;
  name: string;
}

// Wrapper component with Suspense for useSearchParams
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Dashboard />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #3b82f6, #8b5cf6, transparent)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            }}
          ></div>
        </div>
        <p className="mt-6 text-gray-400 text-sm">Loading Dashboard...</p>
      </div>
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
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const companyHeaderRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const tablesRef = useRef<HTMLDivElement>(null);

  // Fetch financial data function (defined first so it can be used in useEffects)
  const fetchFinancialData = useCallback(async (tickerSymbol: string, updateUrl: boolean = true) => {
    if (!tickerSymbol.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setShowSuggestions(false);

    // Update URL with ticker (shareable link)
    if (updateUrl) {
      router.push(`?ticker=${encodeURIComponent(tickerSymbol.trim())}`, { scroll: false });
    }

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
  }, [router]);

  // Page entrance animation
  useEffect(() => {
    if (!mainRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      mainRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  // Data loaded animations
  useEffect(() => {
    if (!data || !companyHeaderRef.current || !metricsRef.current || !tablesRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const tl = gsap.timeline();

    // Company header slide in
    tl.fromTo(
      companyHeaderRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    // Tables slide in
    tl.fromTo(
      tablesRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
      '-=0.2'
    );
  }, [data]);

  // Track if user is actively typing (vs programmatic ticker change)
  const isTypingRef = useRef(false);

  // Autocomplete search effect
  useEffect(() => {
    if (ticker.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't show suggestions if data is loaded or loading
    // This prevents dropdown from appearing after selection
    if (data || loading) {
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/tickers?q=${encodeURIComponent(ticker)}`);
        const results = await response.json();
        setSuggestions(results);
        // Only show suggestions if still no data loaded
        if (!data && !loading) {
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [ticker, data, loading]);

  // Load ticker from URL on page load (for shareable links)
  useEffect(() => {
    const urlTicker = searchParams.get('ticker');
    if (urlTicker && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setTicker(urlTicker.toUpperCase());
      fetchFinancialData(urlTicker, false);
    }
  }, [searchParams, fetchFinancialData]);

  // Handle click outside to close suggestions
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
    setSuggestions([]);
    fetchFinancialData(suggestion.ticker);
  }

  function handleSubmit() {
    setShowSuggestions(false);
    setSuggestions([]);
    fetchFinancialData(ticker);
  }

  function handleSelectTicker(t: string) {
    setTicker(t);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchFinancialData(t);
  }

  // Handle ticker input change - clear data to enable new search
  function handleTickerChange(newTicker: string) {
    setTicker(newTicker);
    // Clear existing data when user starts typing a new search
    if (data && newTicker !== data.ticker) {
      setData(null);
    }
  }

  // Handle clear button click
  function handleClear() {
    setTicker('');
    setData(null);
    setError(null);
    setSuggestions([]);
    setShowSuggestions(false);
    // Clear URL parameter
    router.push('/', { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Header */}
      <Header>
        <AnimatedSearchInput
          ref={inputRef}
          value={ticker}
          onChange={handleTickerChange}
          onSubmit={handleSubmit}
          onSelectSuggestion={handleSelectSuggestion}
          onClear={handleClear}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          loading={loading}
          searchLoading={searchLoading}
        />
      </Header>

      <main ref={mainRef} className="flex-1 max-w-[1800px] mx-auto px-6 py-8 w-full" style={{ opacity: 0 }}>
        {/* Error */}
        {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

        {/* Loading */}
        {loading && <LoadingState />}

        {/* Data Display */}
        {data && (
          <>
            {/* Company Header - Terminal Style */}
            <div ref={companyHeaderRef} className="mb-6" style={{ opacity: 0 }}>
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-2.5 py-1 bg-[#2196f3] text-white text-sm font-mono font-bold rounded">
                        {data.ticker}
                      </span>
                      <h2 className="text-xl font-semibold text-white">{data.companyName}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 font-mono">
                      <span>CIK: {data.cik}</span>
                      <span className="hidden sm:inline text-gray-700">|</span>
                      <span>FY End: <span className="text-gray-400">{data.fiscalYearEnd}</span></span>
                      <span className="hidden sm:inline text-gray-700">|</span>
                      <span>Source: <span className="text-[#2196f3]">SEC EDGAR</span></span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Last Updated</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Summary - Terminal Style */}
            <div ref={metricsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#111] border border-[#222] rounded-lg p-3">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Annual Revenue</p>
                <p className="text-lg font-bold text-white font-mono">
                  {data.annual[0]?.revenue ? `$${(data.annual[0].revenue / 1e9).toFixed(1)}B` : '—'}
                </p>
                {data.annual[0]?.revenueGrowth !== null && data.annual[0]?.revenueGrowth !== undefined && (
                  <p className={`text-xs font-mono ${data.annual[0].revenueGrowth >= 0 ? 'text-[#00c853]' : 'text-[#ff5252]'}`}>
                    {data.annual[0].revenueGrowth >= 0 ? '+' : ''}{data.annual[0].revenueGrowth.toFixed(1)}% Y/Y
                  </p>
                )}
              </div>
              <div className="bg-[#111] border border-[#222] rounded-lg p-3">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Operating Income</p>
                <p className="text-lg font-bold text-white font-mono">
                  {data.annual[0]?.operatingIncome ? `$${(data.annual[0].operatingIncome / 1e9).toFixed(1)}B` : '—'}
                </p>
                {data.annual[0]?.operatingIncomeGrowth !== null && data.annual[0]?.operatingIncomeGrowth !== undefined && (
                  <p className={`text-xs font-mono ${data.annual[0].operatingIncomeGrowth >= 0 ? 'text-[#00c853]' : 'text-[#ff5252]'}`}>
                    {data.annual[0].operatingIncomeGrowth >= 0 ? '+' : ''}{data.annual[0].operatingIncomeGrowth.toFixed(1)}% Y/Y
                  </p>
                )}
              </div>
              <div className="bg-[#111] border border-[#222] rounded-lg p-3">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">EBITDA</p>
                <p className="text-lg font-bold text-white font-mono">
                  {data.annual[0]?.ebitda ? `$${(data.annual[0].ebitda / 1e9).toFixed(1)}B` : '—'}
                </p>
                {data.annual[0]?.ebitdaGrowth !== null && data.annual[0]?.ebitdaGrowth !== undefined && (
                  <p className={`text-xs font-mono ${data.annual[0].ebitdaGrowth >= 0 ? 'text-[#00c853]' : 'text-[#ff5252]'}`}>
                    {data.annual[0].ebitdaGrowth >= 0 ? '+' : ''}{data.annual[0].ebitdaGrowth.toFixed(1)}% Y/Y
                  </p>
                )}
              </div>
              <div className="bg-[#111] border border-[#222] rounded-lg p-3">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-semibold mb-1">Operating Margin</p>
                <p className="text-lg font-bold text-white font-mono">
                  {data.annual[0]?.operatingMargin ? `${data.annual[0].operatingMargin.toFixed(1)}%` : '—'}
                </p>
                <p className="text-xs text-gray-500 font-mono">{data.annual[0]?.period || '—'}</p>
              </div>
            </div>

            {/* Main Tables - LEFT: Quarters | RIGHT: Annual */}
            <div ref={tablesRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ opacity: 0 }}>
              {/* LEFT SIDE - Last 8 Quarters (scrollable) */}
              <div className="min-w-0">
                <FinancialTable
                  title="Quarterly Performance"
                  subtitle="Last 8 Quarters"
                  data={data.quarterly}
                  isQuarterly={true}
                />
              </div>

              {/* RIGHT SIDE - Last 3 Fiscal Years */}
              <div className="min-w-0">
                <FinancialTable
                  title="Annual Performance"
                  subtitle="Last 3 Fiscal Years"
                  data={data.annual}
                  isQuarterly={false}
                />
              </div>
            </div>

            {/* Data Source Note - Terminal Style */}
            <div className="mt-6 bg-[#111] border border-[#222] rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#2196f3]/10 rounded flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#2196f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Methodology</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Data sourced from SEC EDGAR (10-K, 10-Q filings). EBITDA = Operating Income + D&A. Y/Y Growth = (Current - Prior) / |Prior|. N/M = Not Meaningful (sign change).
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <EmptyState onSelectTicker={handleSelectTicker} />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

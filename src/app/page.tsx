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
import MetricCard from '@/components/metrics/MetricCard';
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
    <div className="min-h-screen bg-[#050810] flex flex-col relative">
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
            {/* Company Header */}
            <div ref={companyHeaderRef} className="mb-8" style={{ opacity: 0 }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{data.companyName}</h2>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-lg">
                      {data.ticker}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    CIK: {data.cik}
                    <span className="mx-2 text-gray-700">|</span>
                    Fiscal Year End: {data.fiscalYearEnd}
                    <span className="mx-2 text-gray-700">|</span>
                    Data from SEC EDGAR 10-K and 10-Q filings
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Key Metrics Summary */}
            <div ref={metricsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                label="Annual Revenue"
                value={data.annual[0]?.revenue}
                growth={data.annual[0]?.revenueGrowth}
                period={data.annual[0]?.period}
                icon="revenue"
                delay={0}
              />
              <MetricCard
                label="Operating Income"
                value={data.annual[0]?.operatingIncome}
                growth={data.annual[0]?.operatingIncomeGrowth}
                period={data.annual[0]?.period}
                icon="income"
                delay={0.1}
              />
              <MetricCard
                label="EBITDA"
                value={data.annual[0]?.ebitda}
                growth={data.annual[0]?.ebitdaGrowth}
                period={data.annual[0]?.period}
                icon="ebitda"
                delay={0.2}
              />
              <MetricCard
                label="Operating Margin"
                value={data.annual[0]?.operatingMargin}
                isPercent
                period={data.annual[0]?.period}
                icon="margin"
                delay={0.3}
              />
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

            {/* Data Source Note */}
            <div className="mt-8 p-5 bg-[#0d1321]/50 backdrop-blur-sm border border-white/5 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Data Source</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    All financial data is sourced directly from SEC EDGAR filings (Form 10-K for annual reports, Form 10-Q for quarterly reports).
                    EBITDA is calculated as Operating Income + Depreciation & Amortization. Y/Y Growth compares the same period in the prior year.
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

/**
 * Main Dashboard Page
 *
 * Why 'use client'?
 * - We need useState for form input
 * - We need user interaction (onClick, onChange)
 * - Server components can't have state or event handlers
 *
 * In Next.js:
 * - Server Components (default): Good for static content, SEO
 * - Client Components ('use client'): Required for interactivity
 */
'use client';

import { useState } from 'react';
import FinancialTable from '@/components/FinancialTable';
import { CompanyFinancials } from '@/types/financials';

export default function Home() {
  // State management
  // Why useState?
  // - React needs to know when to re-render
  // - When state changes, the component updates
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<CompanyFinancials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch financial data from our API
   *
   * Why async/await?
   * - Fetch is asynchronous (takes time to get data)
   * - async/await makes async code look like sync code
   * - Easier to read than .then().then().catch()
   */
  async function handleSubmit(e: React.FormEvent) {
    // Prevent page refresh on form submit
    e.preventDefault();

    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/financials?ticker=${encodeURIComponent(ticker.trim())}`);
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Data sourced directly from SEC EDGAR filings
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label
                htmlFor="ticker"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Stock Ticker
              </label>
              <input
                type="text"
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, MSFT, GOOGL"
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Generate Dashboard'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Company Header */}
        {data && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {data.companyName}
            </h2>
            <p className="text-sm text-gray-500">
              Ticker: {data.ticker} | CIK: {data.cik}
            </p>
          </div>
        )}

        {/* Financial Tables - Side by Side */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quarterly Data - Left Side */}
            <div>
              <FinancialTable
                title="Quarterly Data (Last 8 Quarters)"
                data={data.quarterly}
              />
            </div>

            {/* Annual Data - Right Side */}
            <div>
              <FinancialTable
                title="Annual Data (Last 3 Fiscal Years)"
                data={data.annual}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No data to display
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Enter a stock ticker symbol above to generate a financial dashboard.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Data sourced from SEC EDGAR. EBITDA calculated as Operating Income + Depreciation & Amortization.
          </p>
        </div>
      </footer>
    </div>
  );
}

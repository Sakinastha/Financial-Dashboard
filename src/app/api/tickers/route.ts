/**
 * API Route: /api/tickers?q=apple
 *
 * Why a separate endpoint for ticker search?
 * - We can cache the ticker list (it doesn't change often)
 * - Fast autocomplete without fetching full financial data
 * - Better user experience
 */

import { NextRequest, NextResponse } from 'next/server';

// Cache the ticker data in memory
// Why cache? The SEC ticker list is ~10,000 companies and rarely changes
let tickerCache: { ticker: string; name: string; cik: number }[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

async function getTickerList() {
  // Return cached data if still valid
  if (tickerCache && Date.now() - cacheTime < CACHE_DURATION) {
    return tickerCache;
  }

  const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': 'FinancialDashboard contact@example.com' }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ticker list');
  }

  const data = await response.json();

  // Transform the data into a searchable array
  tickerCache = Object.values(data).map((item: unknown) => {
    const company = item as { ticker: string; title: string; cik_str: number };
    return {
      ticker: company.ticker,
      name: company.title,
      cik: company.cik_str
    };
  });

  cacheTime = Date.now();
  return tickerCache;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';

    if (query.length < 1) {
      return NextResponse.json([]);
    }

    const tickers = await getTickerList();

    // Search by ticker OR company name
    const results = tickers
      .filter(item =>
        item.ticker.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
      )
      .slice(0, 10) // Limit to 10 results for performance
      .map(item => ({
        ticker: item.ticker,
        name: item.name
      }));

    return NextResponse.json(results);

  } catch (error) {
    console.error('Error in /api/tickers:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}

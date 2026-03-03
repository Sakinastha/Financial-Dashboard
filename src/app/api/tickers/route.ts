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

    // Score and rank results by relevance
    // Priority: exact ticker > ticker starts with > name starts with > contains
    const scored = tickers
      .map(item => {
        const tickerLower = item.ticker.toLowerCase();
        const nameLower = item.name.toLowerCase();

        let score = 0;

        // Exact ticker match (highest priority)
        if (tickerLower === query) {
          score = 100;
        }
        // Ticker starts with query
        else if (tickerLower.startsWith(query)) {
          score = 80;
        }
        // Company name starts with query
        else if (nameLower.startsWith(query)) {
          score = 60;
        }
        // Ticker contains query
        else if (tickerLower.includes(query)) {
          score = 40;
        }
        // Name contains query (but filter out just matching "Inc." etc.)
        else if (nameLower.includes(query) && query.length >= 2) {
          score = 20;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => ({
        ticker: item.ticker,
        name: item.name
      }));

    return NextResponse.json(scored);

  } catch (error) {
    console.error('Error in /api/tickers:', error);
    return NextResponse.json(
      { error: 'Failed to search tickers' },
      { status: 500 }
    );
  }
}

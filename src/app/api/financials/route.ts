/**
 * API Route: /api/financials?ticker=AAPL
 *
 * Why an API route instead of fetching directly from the frontend?
 *
 * 1. CORS: SEC EDGAR doesn't allow browser requests (CORS blocked)
 *    - Our server can make the request, then send data to the browser
 *
 * 2. Security: API keys and sensitive logic stay on the server
 *    - Even though SEC doesn't need API keys, this is best practice
 *
 * 3. Data Processing: We can parse and clean data before sending to frontend
 *    - Frontend receives clean, ready-to-display data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  tickerToCik,
  fetchCompanyFacts,
  parseFinancialData,
  CompanyFinancials
} from '@/lib/sec-edgar';

// Force dynamic rendering - we always want fresh data
// Why? Financial data changes, we don't want stale cached data
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get ticker from query string: /api/financials?ticker=AAPL
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');

    // Validate input
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker symbol is required. Example: /api/financials?ticker=AAPL' },
        { status: 400 }
      );
    }

    // Clean the ticker (remove spaces, uppercase)
    const cleanTicker = ticker.trim().toUpperCase();

    // Validate ticker format (1-5 letters)
    if (!/^[A-Z]{1,5}$/.test(cleanTicker)) {
      return NextResponse.json(
        { error: 'Invalid ticker format. Ticker should be 1-5 letters.' },
        { status: 400 }
      );
    }

    // Step 1: Convert ticker to CIK
    const cikResult = await tickerToCik(cleanTicker);

    if (!cikResult) {
      return NextResponse.json(
        { error: `Ticker "${cleanTicker}" not found in SEC database.` },
        { status: 404 }
      );
    }

    // Step 2: Fetch company facts from SEC EDGAR
    const companyFacts = await fetchCompanyFacts(cikResult.cik);

    if (!companyFacts) {
      return NextResponse.json(
        { error: `No financial data found for "${cleanTicker}" (CIK: ${cikResult.cik}).` },
        { status: 404 }
      );
    }

    // Step 3: Parse and structure the financial data
    const financials: CompanyFinancials = parseFinancialData(
      companyFacts,
      cleanTicker,
      cikResult.companyName,
      cikResult.cik
    );

    // Return the structured data
    return NextResponse.json(financials);

  } catch (error) {
    console.error('Error in /api/financials:', error);

    // Don't expose internal error details to the client
    return NextResponse.json(
      { error: 'An error occurred while fetching financial data. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * SEC EDGAR API Utility Functions
 *
 * Why this file exists:
 * - Separates data fetching logic from API routes (clean code principle)
 * - Makes functions reusable and testable
 * - Single place to update if SEC changes their API
 */

// Types for our financial data
export interface FinancialData {
  period: string;           // e.g., "Q1 2024" or "FY 2023"
  endDate: string;          // e.g., "2024-03-31"
  revenue: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  revenueGrowth: number | null;      // Y/Y growth percentage
  operatingIncomeGrowth: number | null;
  ebitdaGrowth: number | null;
  operatingMargin: number | null;    // Operating Income / Revenue
  ebitdaMargin: number | null;       // EBITDA / Revenue
}

export interface CompanyFinancials {
  ticker: string;
  companyName: string;
  cik: string;
  quarterly: FinancialData[];  // Last 8 quarters
  annual: FinancialData[];     // Last 3 fiscal years
}

// SEC EDGAR API requires a User-Agent header with contact email
// Why: SEC wants to know who's accessing their data and contact them if there's an issue
const SEC_USER_AGENT = 'FinancialDashboard contact@example.com';

/**
 * Step 1: Convert stock ticker to CIK (Central Index Key)
 *
 * Why CIK?
 * - SEC uses CIK as the unique identifier for companies, not ticker symbols
 * - Ticker symbols can change or be reused, CIK is permanent
 */
export async function tickerToCik(ticker: string): Promise<{ cik: string; companyName: string } | null> {
  try {
    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: { 'User-Agent': SEC_USER_AGENT }
    });

    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }

    const data = await response.json();

    // The data is an object with numeric keys, each containing {cik_str, ticker, title}
    // We need to search through all entries to find our ticker
    const upperTicker = ticker.toUpperCase();

    for (const key in data) {
      if (data[key].ticker === upperTicker) {
        // CIK must be 10 digits with leading zeros for the API
        const cik = String(data[key].cik_str).padStart(10, '0');
        return {
          cik,
          companyName: data[key].title
        };
      }
    }

    return null; // Ticker not found
  } catch (error) {
    console.error('Error fetching ticker to CIK:', error);
    throw error;
  }
}

/**
 * Step 2: Fetch all company facts (financial data) from SEC EDGAR
 *
 * Why "company facts"?
 * - This endpoint returns ALL XBRL financial data for a company in one call
 * - More efficient than making multiple API calls for each metric
 */
export async function fetchCompanyFacts(cik: string): Promise<Record<string, unknown> | null> {
  try {
    const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;

    const response = await fetch(url, {
      headers: { 'User-Agent': SEC_USER_AGENT }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Company not found
      }
      throw new Error(`SEC API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching company facts:', error);
    throw error;
  }
}

/**
 * Extract a specific financial metric from company facts
 *
 * Why multiple tag names?
 * - Different companies use different XBRL tags for the same concept
 * - Revenue might be "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", etc.
 * - We try multiple tags until we find data
 */
interface FactData {
  val: number;
  end: string;      // End date of the period
  start?: string;   // Start date (for duration facts like revenue)
  fy: number;       // Fiscal year
  fp: string;       // Fiscal period (FY, Q1, Q2, Q3, Q4)
  form: string;     // Form type (10-K, 10-Q)
  accn: string;     // Accession number
  filed: string;    // Filing date
}

function extractMetric(
  companyData: Record<string, unknown>,
  tagNames: string[],
  unit: string = 'USD'
): FactData[] {
  // Data is nested: companyData.facts['us-gaap']
  const facts = companyData?.facts as Record<string, Record<string, unknown>> | undefined;
  const usGaap = facts?.['us-gaap'];
  if (!usGaap) return [];

  for (const tagName of tagNames) {
    const concept = usGaap[tagName] as Record<string, unknown> | undefined;
    if (concept) {
      const units = concept.units as Record<string, FactData[]> | undefined;
      if (units && units[unit]) {
        return units[unit];
      }
    }
  }

  return [];
}

/**
 * Filter facts to get only 10-K (annual) or 10-Q (quarterly) data
 *
 * Why filter by form type?
 * - Companies file multiple forms (8-K for events, S-1 for IPOs, etc.)
 * - We only want 10-K (annual reports) and 10-Q (quarterly reports)
 */
function filterByFormType(facts: FactData[], formTypes: string[]): FactData[] {
  return facts.filter(f => formTypes.includes(f.form));
}

/**
 * Get unique periods and their latest values
 *
 * Why deduplicate?
 * - Companies may restate numbers or file amendments
 * - We want the most recent filing for each period
 */
function deduplicateByPeriod(facts: FactData[]): FactData[] {
  const periodMap = new Map<string, FactData>();

  // Sort by filed date descending so later filings overwrite earlier ones
  const sorted = [...facts].sort((a, b) =>
    new Date(b.filed).getTime() - new Date(a.filed).getTime()
  );

  for (const fact of sorted) {
    const key = `${fact.fy}-${fact.fp}`;
    if (!periodMap.has(key)) {
      periodMap.set(key, fact);
    }
  }

  return Array.from(periodMap.values());
}

/**
 * Main function: Parse company facts into structured financial data
 */
export function parseFinancialData(
  facts: Record<string, unknown>,
  ticker: string,
  companyName: string,
  cik: string
): CompanyFinancials {
  // XBRL tags for each metric (in order of preference)
  const revenueTags = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
    'SalesRevenueGoodsNet',
    'TotalRevenuesAndOtherIncome',
    'RevenueFromContractWithCustomerIncludingAssessedTax'
  ];

  const operatingIncomeTags = [
    'OperatingIncomeLoss',
    'IncomeLossFromOperations',
    'OperatingIncome'
  ];

  // For EBITDA, we need Operating Income + Depreciation + Amortization
  const depreciationTags = [
    'DepreciationDepletionAndAmortization',
    'DepreciationAndAmortization',
    'Depreciation'
  ];

  // Extract raw data
  const revenueData = extractMetric(facts, revenueTags);
  const operatingIncomeData = extractMetric(facts, operatingIncomeTags);
  const depreciationData = extractMetric(facts, depreciationTags);

  // Process quarterly data (10-Q forms)
  const quarterlyRevenue = deduplicateByPeriod(
    filterByFormType(revenueData, ['10-Q'])
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp)); // Q4 is in 10-K

  const quarterlyOpIncome = deduplicateByPeriod(
    filterByFormType(operatingIncomeData, ['10-Q'])
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  const quarterlyDepreciation = deduplicateByPeriod(
    filterByFormType(depreciationData, ['10-Q'])
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  // Process annual data (10-K forms)
  const annualRevenue = deduplicateByPeriod(
    filterByFormType(revenueData, ['10-K'])
  ).filter(f => f.fp === 'FY');

  const annualOpIncome = deduplicateByPeriod(
    filterByFormType(operatingIncomeData, ['10-K'])
  ).filter(f => f.fp === 'FY');

  const annualDepreciation = deduplicateByPeriod(
    filterByFormType(depreciationData, ['10-K'])
  ).filter(f => f.fp === 'FY');

  // Build quarterly financial data
  const quarterly = buildFinancialDataArray(
    quarterlyRevenue,
    quarterlyOpIncome,
    quarterlyDepreciation,
    8,  // Last 8 quarters
    true // isQuarterly
  );

  // Build annual financial data
  const annual = buildFinancialDataArray(
    annualRevenue,
    annualOpIncome,
    annualDepreciation,
    3,  // Last 3 fiscal years
    false // isQuarterly
  );

  return {
    ticker,
    companyName,
    cik,
    quarterly,
    annual
  };
}

/**
 * Build the financial data array with calculations
 */
function buildFinancialDataArray(
  revenueData: FactData[],
  opIncomeData: FactData[],
  depreciationData: FactData[],
  limit: number,
  isQuarterly: boolean
): FinancialData[] {
  // Create maps for quick lookup
  const revenueMap = new Map(revenueData.map(f => [`${f.fy}-${f.fp}`, f]));
  const opIncomeMap = new Map(opIncomeData.map(f => [`${f.fy}-${f.fp}`, f]));
  const depreciationMap = new Map(depreciationData.map(f => [`${f.fy}-${f.fp}`, f]));

  // Get all unique periods
  const allPeriods = new Set([
    ...revenueData.map(f => `${f.fy}-${f.fp}`),
    ...opIncomeData.map(f => `${f.fy}-${f.fp}`)
  ]);

  // Sort periods by fiscal year and quarter (descending - most recent first)
  const sortedPeriods = Array.from(allPeriods).sort((a, b) => {
    const [yearA, fpA] = a.split('-');
    const [yearB, fpB] = b.split('-');

    if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);

    // Sort quarters: Q4 > Q3 > Q2 > Q1
    const qOrder: Record<string, number> = { 'FY': 5, 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
    return (qOrder[fpB] || 0) - (qOrder[fpA] || 0);
  });

  // Take only the most recent periods
  const recentPeriods = sortedPeriods.slice(0, limit + 4); // Extra for Y/Y calculation

  const results: FinancialData[] = [];

  for (let i = 0; i < Math.min(limit, recentPeriods.length); i++) {
    const periodKey = recentPeriods[i];
    const [fy, fp] = periodKey.split('-');

    const revenueFact = revenueMap.get(periodKey);
    const opIncomeFact = opIncomeMap.get(periodKey);
    const depreciationFact = depreciationMap.get(periodKey);

    const revenue = revenueFact?.val ?? null;
    const operatingIncome = opIncomeFact?.val ?? null;
    const depreciation = depreciationFact?.val ?? null;

    // Calculate EBITDA = Operating Income + Depreciation & Amortization
    const ebitda = (operatingIncome !== null && depreciation !== null)
      ? operatingIncome + depreciation
      : null;

    // Find prior year for Y/Y growth calculation
    const priorYearKey = `${parseInt(fy) - 1}-${fp}`;
    const priorRevenue = revenueMap.get(priorYearKey)?.val ?? null;
    const priorOpIncome = opIncomeMap.get(priorYearKey)?.val ?? null;
    const priorDepreciation = depreciationMap.get(priorYearKey)?.val ?? null;
    const priorEbitda = (priorOpIncome !== null && priorDepreciation !== null)
      ? priorOpIncome + priorDepreciation
      : null;

    // Calculate Y/Y growth percentages
    const revenueGrowth = calculateGrowth(revenue, priorRevenue);
    const operatingIncomeGrowth = calculateGrowth(operatingIncome, priorOpIncome);
    const ebitdaGrowth = calculateGrowth(ebitda, priorEbitda);

    // Calculate margins
    const operatingMargin = (operatingIncome !== null && revenue !== null && revenue !== 0)
      ? (operatingIncome / revenue) * 100
      : null;
    const ebitdaMargin = (ebitda !== null && revenue !== null && revenue !== 0)
      ? (ebitda / revenue) * 100
      : null;

    // Format period string
    const period = isQuarterly ? `${fp} ${fy}` : `FY ${fy}`;

    results.push({
      period,
      endDate: revenueFact?.end || opIncomeFact?.end || '',
      revenue,
      operatingIncome,
      ebitda,
      revenueGrowth,
      operatingIncomeGrowth,
      ebitdaGrowth,
      operatingMargin,
      ebitdaMargin
    });
  }

  return results;
}

/**
 * Calculate year-over-year growth percentage
 */
function calculateGrowth(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) {
    return null;
  }
  return ((current - prior) / Math.abs(prior)) * 100;
}

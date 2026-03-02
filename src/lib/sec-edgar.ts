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
  fiscalYearEnd: string;       // e.g., "September" - derived from annual filing end date
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

  // MERGE data from ALL matching tags
  // Why merge? Companies like Google use different tags for different periods:
  // - RevenueFromContractWithCustomer for Q1 2025
  // - Revenues for Q2/Q3 2025
  // Neither tag alone has complete coverage, so we combine them.
  const allData: FactData[] = [];
  const seenPeriods = new Set<string>();

  for (const tagName of tagNames) {
    const concept = usGaap[tagName] as Record<string, unknown> | undefined;
    if (concept) {
      const units = concept.units as Record<string, FactData[]> | undefined;
      if (units && units[unit]) {
        for (const fact of units[unit]) {
          // Create a unique key that includes BOTH start and end dates
          // CRITICAL: SEC EDGAR has both YTD cumulative and quarterly data with the SAME end date
          // Example: Q2 has both 181-day (YTD) and 90-day (quarterly) entries ending on the same date
          // We need to keep BOTH so the duration filter can select the right one later
          const periodKey = `${fact.fy}-${fact.fp}-${fact.form}-${fact.start || 'nostart'}-${fact.end}`;

          // Only add if we haven't seen this exact period before
          // This prevents duplicates while allowing different durations to be captured
          if (!seenPeriods.has(periodKey)) {
            seenPeriods.add(periodKey);
            allData.push(fact);
          }
        }
      }
    }
  }

  return allData;
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
 * Filter to keep only TRUE quarterly data (3-month periods), not YTD cumulative
 *
 * CRITICAL: SEC EDGAR contains BOTH:
 * - 3-month quarterly figures (what we want)
 * - 6-month and 9-month YTD cumulative figures (must exclude!)
 *
 * We identify quarterly data by checking the duration between start and end dates.
 * A true quarter is approximately 90 days (80-100 days to account for variations).
 */
function filterQuarterlyOnly(facts: FactData[]): FactData[] {
  return facts.filter(f => {
    if (!f.start || !f.end) return true; // Point-in-time facts (balance sheet items)

    const startDate = new Date(f.start);
    const endDate = new Date(f.end);
    const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // True quarterly data is approximately 90 days (3 months)
    // Allow 80-105 days to handle fiscal calendar variations
    // Some quarters can be 89-92 days depending on month lengths
    return durationDays >= 80 && durationDays <= 105;
  });
}

/**
 * Extract TRUE quarterly values from YTD cumulative data
 *
 * Some SEC EDGAR metrics (like Depreciation) are reported as YTD cumulative:
 * - Q1: 90-day (true quarterly)
 * - Q2: 181-day (6-month cumulative = Q1 + Q2)
 * - Q3: 272-day (9-month cumulative = Q1 + Q2 + Q3)
 *
 * This function extracts the true quarterly values by subtracting prior periods.
 * It works by finding date-based relationships rather than grouping by calendar year,
 * which makes it work correctly for companies with non-December fiscal year ends.
 */
function extractQuarterlyFromYTD(facts: FactData[]): FactData[] {
  const results: FactData[] = [];
  const seenEndDates = new Set<string>();

  // Calculate duration for each fact
  const withDuration = facts
    .filter(f => f.start && f.end)
    .map(f => {
      const start = new Date(f.start!);
      const end = new Date(f.end);
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return { fact: f, duration, endTime: end.getTime() };
    });

  // Separate by duration type
  const quarterly = withDuration.filter(d => d.duration >= 80 && d.duration <= 105);   // ~90 days
  const ytd6mo = withDuration.filter(d => d.duration >= 170 && d.duration <= 195);     // ~181 days
  const ytd9mo = withDuration.filter(d => d.duration >= 260 && d.duration <= 290);     // ~272 days

  // Add all true quarterly data (Q1s)
  for (const q of quarterly) {
    if (!seenEndDates.has(q.fact.end)) {
      seenEndDates.add(q.fact.end);
      results.push(q.fact);
    }
  }

  // For each 6-month YTD, find the Q1 that ends ~90 days before and calculate Q2
  for (const ytd of ytd6mo) {
    if (seenEndDates.has(ytd.fact.end)) continue;

    // Find Q1 ending approximately 90 days before this YTD ends
    const q1 = quarterly.find(q => {
      const daysDiff = (ytd.endTime - q.endTime) / (1000 * 60 * 60 * 24);
      return daysDiff >= 75 && daysDiff <= 110; // Q1 should end ~90 days before Q2
    });

    if (q1) {
      const q2Value = ytd.fact.val - q1.fact.val;
      seenEndDates.add(ytd.fact.end);
      results.push({
        ...ytd.fact,
        val: q2Value,
        fp: 'Q2',
        start: q1.fact.end
      });
    }
  }

  // For each 9-month YTD, find the 6-month YTD that ends ~90 days before and calculate Q3
  for (const ytd of ytd9mo) {
    if (seenEndDates.has(ytd.fact.end)) continue;

    // Find 6-month YTD ending approximately 90 days before this 9-month YTD ends
    const prior6mo = ytd6mo.find(y => {
      const daysDiff = (ytd.endTime - y.endTime) / (1000 * 60 * 60 * 24);
      return daysDiff >= 75 && daysDiff <= 110;
    });

    if (prior6mo) {
      const q3Value = ytd.fact.val - prior6mo.fact.val;
      seenEndDates.add(ytd.fact.end);
      results.push({
        ...ytd.fact,
        val: q3Value,
        fp: 'Q3',
        start: prior6mo.fact.end
      });
    }
  }

  return results;
}

/**
 * Extract a SINGLE metric tag from company facts (for iterating through fallbacks)
 */
function extractSingleMetric(
  companyData: Record<string, unknown>,
  tagName: string,
  unit: string = 'USD'
): FactData[] {
  const facts = companyData?.facts as Record<string, Record<string, unknown>> | undefined;
  const usGaap = facts?.['us-gaap'];
  if (!usGaap) return [];

  const concept = usGaap[tagName] as Record<string, unknown> | undefined;
  if (!concept) return [];

  const units = concept.units as Record<string, FactData[]> | undefined;
  if (!units || !units[unit]) return [];

  return units[unit];
}

/**
 * UNIVERSAL DEPRECIATION EXTRACTION
 *
 * This function handles ALL companies on SEC EDGAR by trying multiple strategies:
 *
 * 1. First checks if true quarterly data (90-day durations) exists - use it directly
 * 2. If not, checks for YTD cumulative data and converts to true quarterly
 * 3. If neither exists for primary tag, tries alternative XBRL tags
 * 4. Returns empty array if no depreciation data exists (EBITDA will show as N/A)
 *
 * Alternative tags tried (in order):
 * - DepreciationDepletionAndAmortization (most common)
 * - DepreciationAndAmortization
 * - Depreciation
 * - DepreciationAmortizationAndAccretionNet (financial companies)
 * - AmortizationOfIntangibleAssets (for companies that report separately)
 * - DepreciationNonproduction
 * - DepreciationDepletionAndAmortizationExcludingDiscontinuedOperations
 */
function extractDepreciationUniversal(
  companyData: Record<string, unknown>,
  formTypes: string[]
): { quarterly: FactData[]; annual: FactData[] } {
  // Comprehensive list of depreciation XBRL tags in order of preference
  const depreciationTags = [
    'DepreciationDepletionAndAmortization',
    'DepreciationAndAmortization',
    'Depreciation',
    'DepreciationAmortizationAndAccretionNet',
    'AmortizationOfIntangibleAssets',
    'DepreciationNonproduction',
    'DepreciationDepletionAndAmortizationExcludingDiscontinuedOperations',
    'DepreciationExpenseOnReclassifiedAssets',
    'DepreciationDepletionAndAmortizationPolicyTextBlock', // Rarely used but worth trying
  ];

  let bestQuarterlyData: FactData[] = [];
  let bestAnnualData: FactData[] = [];
  let bestQuarterlyCount = 0;
  let bestAnnualCount = 0;

  // Try each depreciation tag
  for (const tag of depreciationTags) {
    const rawData = extractSingleMetric(companyData, tag);
    if (rawData.length === 0) continue;

    // Process quarterly data (10-Q forms)
    const quarterlyFiltered = filterByFormType(rawData, ['10-Q']);

    // Strategy 1: Check for true quarterly data (90-day durations)
    const trueQuarterly = filterQuarterlyOnly(quarterlyFiltered);

    // Strategy 2: If true quarterly is sparse, try YTD extraction
    const ytdExtracted = extractQuarterlyFromYTD(quarterlyFiltered);

    // Use whichever strategy gives more data
    const quarterlyData = trueQuarterly.length >= ytdExtracted.length
      ? trueQuarterly
      : ytdExtracted;

    const q1q2q3 = deduplicateByPeriod(quarterlyData)
      .filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

    // Process annual data (10-K forms)
    const annualFiltered = filterByFormType(rawData, ['10-K']);
    const annualOnly = filterAnnualOnly(annualFiltered);
    const fyData = deduplicateByPeriod(annualOnly)
      .filter(f => f.fp === 'FY');

    // Keep track of the tag that gives us the most data
    if (q1q2q3.length > bestQuarterlyCount) {
      bestQuarterlyData = q1q2q3;
      bestQuarterlyCount = q1q2q3.length;
    }

    if (fyData.length > bestAnnualCount) {
      bestAnnualData = fyData;
      bestAnnualCount = fyData.length;
    }

    // If we have good coverage (6+ quarters), we can stop searching
    if (bestQuarterlyCount >= 6 && bestAnnualCount >= 2) {
      break;
    }
  }

  // If primary tags don't give complete data, try combining multiple tags
  // Some companies report Depreciation and AmortizationOfIntangibleAssets separately
  if (bestQuarterlyCount < 6) {
    const combinedQuarterly = tryCombineDepreciationSources(companyData, ['10-Q']);
    if (combinedQuarterly.length > bestQuarterlyCount) {
      bestQuarterlyData = combinedQuarterly;
    }
  }

  if (bestAnnualCount < 2) {
    const combinedAnnual = tryCombineDepreciationSourcesAnnual(companyData, ['10-K']);
    if (combinedAnnual.length > bestAnnualCount) {
      bestAnnualData = combinedAnnual;
    }
  }

  return {
    quarterly: bestQuarterlyData,
    annual: bestAnnualData
  };
}

/**
 * Try combining Depreciation + AmortizationOfIntangibleAssets
 * Some companies (like certain tech firms) report these separately
 */
function tryCombineDepreciationSources(
  companyData: Record<string, unknown>,
  formTypes: string[]
): FactData[] {
  const depreciation = extractSingleMetric(companyData, 'Depreciation');
  const amortization = extractSingleMetric(companyData, 'AmortizationOfIntangibleAssets');

  if (depreciation.length === 0 || amortization.length === 0) {
    return [];
  }

  // Process each separately
  const depQuarterly = deduplicateByPeriod(
    extractQuarterlyFromYTD(filterByFormType(depreciation, formTypes))
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  const amortQuarterly = deduplicateByPeriod(
    extractQuarterlyFromYTD(filterByFormType(amortization, formTypes))
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  // Combine by end date
  const depMap = new Map(depQuarterly.map(f => [f.end, f]));
  const results: FactData[] = [];

  for (const amort of amortQuarterly) {
    const dep = depMap.get(amort.end);
    if (dep) {
      results.push({
        ...dep,
        val: dep.val + amort.val
      });
    }
  }

  return results;
}

/**
 * Try combining Depreciation + AmortizationOfIntangibleAssets for annual data
 */
function tryCombineDepreciationSourcesAnnual(
  companyData: Record<string, unknown>,
  formTypes: string[]
): FactData[] {
  const depreciation = extractSingleMetric(companyData, 'Depreciation');
  const amortization = extractSingleMetric(companyData, 'AmortizationOfIntangibleAssets');

  if (depreciation.length === 0 || amortization.length === 0) {
    return [];
  }

  const depAnnual = deduplicateByPeriod(
    filterAnnualOnly(filterByFormType(depreciation, formTypes))
  ).filter(f => f.fp === 'FY');

  const amortAnnual = deduplicateByPeriod(
    filterAnnualOnly(filterByFormType(amortization, formTypes))
  ).filter(f => f.fp === 'FY');

  const depMap = new Map(depAnnual.map(f => [f.end, f]));
  const results: FactData[] = [];

  for (const amort of amortAnnual) {
    const dep = depMap.get(amort.end);
    if (dep) {
      results.push({
        ...dep,
        val: dep.val + amort.val
      });
    }
  }

  return results;
}

/**
 * Filter to keep only TRUE annual data (12-month periods)
 *
 * Similar to quarterly, SEC EDGAR may contain partial year data.
 * We only want full fiscal year figures (approximately 365 days).
 */
function filterAnnualOnly(facts: FactData[]): FactData[] {
  return facts.filter(f => {
    if (!f.start || !f.end) return true; // Point-in-time facts

    const startDate = new Date(f.start);
    const endDate = new Date(f.end);
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // True annual data is approximately 365 days (12 months)
    // Allow 350-380 days to handle fiscal calendar variations
    return durationDays >= 350 && durationDays <= 380;
  });
}

/**
 * Get unique periods and their latest values
 *
 * Why deduplicate?
 * - Companies may restate numbers or file amendments
 * - We want the most recent filing for each period
 *
 * CRITICAL: The SEC EDGAR `fy` field is the FILING year, not the DATA year!
 * Example: Apple's Q2 FY2025 10-Q (filed May 2025) includes BOTH:
 * - Q2 FY2025 data (Jan-Mar 2025) as current period
 * - Q2 FY2024 data (Jan-Mar 2024) as prior year comparison
 * Both have fy=2025 but they're different periods!
 *
 * Solution: Use the actual END DATE to identify unique periods, not fy-fp.
 */
function deduplicateByPeriod(facts: FactData[]): FactData[] {
  const periodMap = new Map<string, FactData>();

  // Sort by filed date descending so later filings overwrite earlier ones
  const sorted = [...facts].sort((a, b) =>
    new Date(b.filed).getTime() - new Date(a.filed).getTime()
  );

  for (const fact of sorted) {
    // Use end date as the unique identifier for a period
    // This correctly distinguishes between current period and prior year comparison data
    const key = `${fact.end}-${fact.fp}`;
    if (!periodMap.has(key)) {
      periodMap.set(key, fact);
    }
  }

  return Array.from(periodMap.values());
}

/**
 * Determine the fiscal year end month from annual filings
 *
 * Why is this important for investors?
 * - Apple's fiscal year ends in September (not December)
 * - Walmart's fiscal year ends in January
 * - Knowing this helps interpret quarterly comparisons correctly
 */
function determineFiscalYearEnd(annualData: FactData[]): string {
  if (annualData.length === 0) return 'December'; // Default assumption

  // Get the most recent annual filing
  const mostRecent = annualData.reduce((latest, current) =>
    new Date(current.end) > new Date(latest.end) ? current : latest
  );

  // Extract month from the end date
  const endDate = new Date(mostRecent.end);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return months[endDate.getMonth()];
}

/**
 * Calculate Q4 data from annual (FY) minus Q1+Q2+Q3
 *
 * Why is this needed?
 * - Companies don't file a separate 10-Q for Q4
 * - Q4 data is embedded in the annual 10-K filing
 * - To show complete quarterly data, we calculate: Q4 = FY - Q1 - Q2 - Q3
 *
 * We match quarters to annual data by checking if the quarterly end dates
 * fall within the same fiscal year period as the annual data.
 */
function calculateQ4Data(annualData: FactData[], quarterlyData: FactData[]): FactData[] {
  const q4Results: FactData[] = [];

  // For each annual period, find the three quarters that belong to it
  for (const annualFact of annualData) {
    const fyEndDate = new Date(annualFact.end);
    const fyStartDate = new Date(fyEndDate);
    fyStartDate.setFullYear(fyStartDate.getFullYear() - 1);

    // Find Q1, Q2, Q3 that fall within this fiscal year
    const fyQuarters = quarterlyData.filter(q => {
      const qEndDate = new Date(q.end);
      return qEndDate > fyStartDate && qEndDate < fyEndDate;
    });

    const q1 = fyQuarters.find(q => q.fp === 'Q1');
    const q2 = fyQuarters.find(q => q.fp === 'Q2');
    const q3 = fyQuarters.find(q => q.fp === 'Q3');

    // Only calculate Q4 if we have all three quarters
    if (q1 && q2 && q3) {
      const q4Value = annualFact.val - q1.val - q2.val - q3.val;

      // Create a synthetic Q4 fact
      const q4Fact: FactData = {
        val: q4Value,
        end: annualFact.end,        // Q4 ends on fiscal year end
        start: q3.end,               // Q4 starts after Q3 ends
        fy: annualFact.fy,
        fp: 'Q4',
        form: '10-K',                // Q4 is derived from 10-K
        accn: annualFact.accn,
        filed: annualFact.filed
      };

      q4Results.push(q4Fact);
    }
  }

  return q4Results;
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
  // Why so many tags? Different industries use different accounting:
  // - Regular companies: RevenueFromContractWithCustomer, Revenues
  // - Banks/Financial: RevenuesNetOfInterestExpense, InterestAndDividendIncomeOperating
  // - Insurance: PremiumsEarnedNet
  const revenueTags = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'Revenues',
    'RevenuesNetOfInterestExpense',           // Banks (Morgan Stanley, Goldman Sachs)
    'InterestAndNoninterestIncome',           // Banks
    'SalesRevenueNet',
    'SalesRevenueGoodsNet',
    'TotalRevenuesAndOtherIncome',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'NoninterestIncome',                       // Banks - fee income
    'InterestAndDividendIncomeOperating',     // Banks - interest income
    'PremiumsEarnedNet',                       // Insurance companies
    'TotalRevenues'
  ];

  const operatingIncomeTags = [
    'OperatingIncomeLoss',
    'IncomeLossFromOperations',
    'OperatingIncome',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest', // Banks
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
    'NetIncomeLoss',                           // Fallback for banks
    'IncomeLossBeforeIncomeTaxes'              // Banks often use this
  ];

  // Extract raw data for revenue and operating income
  const revenueData = extractMetric(facts, revenueTags);
  const operatingIncomeData = extractMetric(facts, operatingIncomeTags);

  // Use UNIVERSAL depreciation extraction
  // This handles ALL companies by trying multiple strategies and tags
  const depreciationResult = extractDepreciationUniversal(facts, ['10-Q', '10-K']);

  // Process quarterly data (10-Q forms for Q1-Q3)
  // CRITICAL: Filter to TRUE quarterly data only (3-month periods), not YTD cumulative!
  const q1q2q3Revenue = deduplicateByPeriod(
    filterQuarterlyOnly(filterByFormType(revenueData, ['10-Q']))
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  const q1q2q3OpIncome = deduplicateByPeriod(
    filterQuarterlyOnly(filterByFormType(operatingIncomeData, ['10-Q']))
  ).filter(f => ['Q1', 'Q2', 'Q3'].includes(f.fp));

  // Depreciation data is already processed by extractDepreciationUniversal
  const q1q2q3Depreciation = depreciationResult.quarterly;

  // Process annual data (10-K forms)
  // CRITICAL: Filter to TRUE annual data only (12-month periods)
  const annualRevenue = deduplicateByPeriod(
    filterAnnualOnly(filterByFormType(revenueData, ['10-K']))
  ).filter(f => f.fp === 'FY');

  const annualOpIncome = deduplicateByPeriod(
    filterAnnualOnly(filterByFormType(operatingIncomeData, ['10-K']))
  ).filter(f => f.fp === 'FY');

  // Annual depreciation is already processed by extractDepreciationUniversal
  const annualDepreciation = depreciationResult.annual;

  // Calculate Q4 data: Q4 = FY - Q1 - Q2 - Q3
  // This is necessary because Q4 is not filed separately - it's part of the annual 10-K
  const q4Revenue = calculateQ4Data(annualRevenue, q1q2q3Revenue);
  const q4OpIncome = calculateQ4Data(annualOpIncome, q1q2q3OpIncome);
  const q4Depreciation = calculateQ4Data(annualDepreciation, q1q2q3Depreciation);

  // Combine Q1-Q3 with calculated Q4 for complete quarterly data
  const quarterlyRevenue = [...q1q2q3Revenue, ...q4Revenue];
  const quarterlyOpIncome = [...q1q2q3OpIncome, ...q4OpIncome];
  const quarterlyDepreciation = [...q1q2q3Depreciation, ...q4Depreciation];


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

  // Determine fiscal year end from the most recent annual filing
  const fiscalYearEnd = determineFiscalYearEnd(annualRevenue);

  return {
    ticker,
    companyName,
    cik,
    fiscalYearEnd,
    quarterly,
    annual
  };
}

/**
 * Build the financial data array with calculations
 *
 * IMPORTANT: We use the actual END DATE to sort and identify periods,
 * not the SEC EDGAR `fy` field (which represents filing year, not data year).
 */
function buildFinancialDataArray(
  revenueData: FactData[],
  opIncomeData: FactData[],
  depreciationData: FactData[],
  limit: number,
  isQuarterly: boolean
): FinancialData[] {
  // Create maps using END DATE as key (more reliable than fy-fp)
  const revenueMap = new Map(revenueData.map(f => [f.end, f]));
  const opIncomeMap = new Map(opIncomeData.map(f => [f.end, f]));
  const depreciationMap = new Map(depreciationData.map(f => [f.end, f]));

  // Get all unique end dates
  const allEndDates = new Set([
    ...revenueData.map(f => f.end),
    ...opIncomeData.map(f => f.end)
  ]);

  // Sort by end date descending (most recent first)
  // Filter out future dates (some SEC filings contain projections)
  const today = new Date();
  const sortedEndDates = Array.from(allEndDates)
    .filter(d => d && new Date(d) <= today) // Remove empty dates and future dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Take only the most recent periods
  const recentEndDates = sortedEndDates.slice(0, limit + 8); // Extra for Y/Y calculation

  const results: FinancialData[] = [];

  for (let i = 0; i < Math.min(limit, recentEndDates.length); i++) {
    const endDate = recentEndDates[i];

    const revenueFact = revenueMap.get(endDate);
    const opIncomeFact = opIncomeMap.get(endDate);
    const depreciationFact = depreciationMap.get(endDate);

    const revenue = revenueFact?.val ?? null;
    const operatingIncome = opIncomeFact?.val ?? null;
    const depreciation = depreciationFact?.val ?? null;

    // Calculate EBITDA = Operating Income + Depreciation & Amortization
    const ebitda = (operatingIncome !== null && depreciation !== null)
      ? operatingIncome + depreciation
      : null;

    // Find prior year (approximately 365 days earlier) for Y/Y growth
    const currentDate = new Date(endDate);
    const priorYearTarget = new Date(currentDate);
    priorYearTarget.setFullYear(priorYearTarget.getFullYear() - 1);

    // Find the closest date to 1 year ago (within 30 days)
    const priorEndDate = recentEndDates.find(d => {
      const diff = Math.abs(new Date(d).getTime() - priorYearTarget.getTime());
      return diff < 30 * 24 * 60 * 60 * 1000; // Within 30 days
    });

    const priorRevenue = priorEndDate ? revenueMap.get(priorEndDate)?.val ?? null : null;
    const priorOpIncome = priorEndDate ? opIncomeMap.get(priorEndDate)?.val ?? null : null;
    const priorDepreciation = priorEndDate ? depreciationMap.get(priorEndDate)?.val ?? null : null;
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

    // Format period string from the actual quarter designation
    const fp = revenueFact?.fp || opIncomeFact?.fp || 'Q?';
    const periodYear = deriveFiscalYear(endDate, fp);
    const period = isQuarterly ? `${fp} ${periodYear}` : `FY ${periodYear}`;

    results.push({
      period,
      endDate,
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
 * Derive the fiscal year from the end date
 * Most companies have fiscal years ending in December, but some (like Apple) end in other months.
 * For simplicity, we use the calendar year of the end date as the fiscal year.
 */
function deriveFiscalYear(endDate: string, fp: string): number {
  const date = new Date(endDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // For Q4/FY, the fiscal year is the year of the end date
  // For Q1/Q2/Q3, we need to check if this is a company with non-calendar fiscal year
  // Simple heuristic: if Q1 ends in Dec/Jan, the FY is the next calendar year
  if (fp === 'Q1' && month >= 9) { // Oct, Nov, Dec
    return year + 1; // This Q1 belongs to next fiscal year
  }

  return year;
}

/**
 * Calculate year-over-year growth percentage
 *
 * Returns null for:
 * - Missing data (current or prior is null)
 * - Division by zero (prior is 0)
 * - Sign changes (e.g., loss to profit) - shown as "N/M" in finance
 */
function calculateGrowth(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) {
    return null;
  }

  // Handle sign changes - when a company goes from loss to profit or vice versa,
  // percentage growth is not meaningful (standard finance practice to show "N/M")
  const currentSign = current >= 0 ? 1 : -1;
  const priorSign = prior >= 0 ? 1 : -1;
  if (currentSign !== priorSign) {
    return null; // Will display as "N/M" (Not Meaningful)
  }

  return ((current - prior) / Math.abs(prior)) * 100;
}

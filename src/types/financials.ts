/**
 * Type Definitions for Financial Data
 *
 * Why a separate types file?
 * - Single source of truth for data shapes
 * - Shared between frontend and backend
 * - TypeScript can catch errors if types don't match
 */

export interface FinancialData {
  period: string;
  endDate: string;
  revenue: number | null;
  operatingIncome: number | null;
  ebitda: number | null;
  revenueGrowth: number | null;
  operatingIncomeGrowth: number | null;
  ebitdaGrowth: number | null;
  operatingMargin: number | null;
  ebitdaMargin: number | null;
}

export interface CompanyFinancials {
  ticker: string;
  companyName: string;
  cik: string;
  quarterly: FinancialData[];
  annual: FinancialData[];
}

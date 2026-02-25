/**
 * FinancialTable Component
 *
 * Why a reusable component?
 * - Same structure for quarterly and annual data
 * - Change once, updates everywhere
 * - DRY (Don't Repeat Yourself) principle
 */

import { FinancialData } from '@/types/financials';

interface FinancialTableProps {
  title: string;
  data: FinancialData[];
}

/**
 * Format large numbers for display
 *
 * Why format numbers?
 * - "383285000000" is hard to read
 * - "$383.3B" is instantly understood
 */
function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}$${(absValue / 1e12).toFixed(1)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
  } else {
    return `${sign}$${absValue.toLocaleString()}`;
  }
}

/**
 * Format percentage values
 */
function formatPercent(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get color class for growth values
 *
 * Why color coding?
 * - Positive growth = green (good)
 * - Negative growth = red (concerning)
 * - Visual scanning is faster than reading numbers
 */
function getGrowthColorClass(value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

export default function FinancialTable({ title, data }: FinancialTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              {data.map((item) => (
                <th
                  key={item.period}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {item.period}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {/* Revenue Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                Revenue
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(item.revenue)}
                </td>
              ))}
            </tr>

            {/* Revenue Y/Y Growth Row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right ${getGrowthColorClass(item.revenueGrowth)}`}
                >
                  {formatPercent(item.revenueGrowth)}
                </td>
              ))}
            </tr>

            {/* Operating Income Row */}
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                Operating Income
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(item.operatingIncome)}
                </td>
              ))}
            </tr>

            {/* Operating Income Y/Y Growth Row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right ${getGrowthColorClass(item.operatingIncomeGrowth)}`}
                >
                  {formatPercent(item.operatingIncomeGrowth)}
                </td>
              ))}
            </tr>

            {/* Operating Margin Row */}
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-600">
                  {item.operatingMargin !== null ? `${item.operatingMargin.toFixed(1)}%` : 'N/A'}
                </td>
              ))}
            </tr>

            {/* EBITDA Row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                EBITDA
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-900">
                  {formatCurrency(item.ebitda)}
                </td>
              ))}
            </tr>

            {/* EBITDA Y/Y Growth Row */}
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right ${getGrowthColorClass(item.ebitdaGrowth)}`}
                >
                  {formatPercent(item.ebitdaGrowth)}
                </td>
              ))}
            </tr>

            {/* EBITDA Margin Row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600 pl-8">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-600">
                  {item.ebitdaMargin !== null ? `${item.ebitdaMargin.toFixed(1)}%` : 'N/A'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

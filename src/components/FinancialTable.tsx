/**
 * FinancialTable Component - Professional Dark Theme
 */

import { FinancialData } from '@/types/financials';

interface FinancialTableProps {
  title: string;
  subtitle?: string;
  data: FinancialData[];
  isQuarterly?: boolean;
}

function formatCurrency(value: number | null): string {
  if (value === null) return '—';

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

function formatPercent(value: number | null): string {
  if (value === null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatMargin(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function getGrowthColor(value: number | null): string {
  if (value === null) return 'text-slate-500';
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export default function FinancialTable({ title, subtitle, data, isQuarterly = true }: FinancialTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        <p className="text-slate-500 mt-4">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-800/50 sticky left-0">
                Metric
              </th>
              {data.map((item) => (
                <th
                  key={item.period}
                  className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {item.period}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-700/30">
            {/* Revenue Section */}
            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-white bg-slate-800/30 sticky left-0">
                <div className="flex items-center">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full mr-3"></span>
                  Revenue
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.revenue)}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-400 bg-slate-800/30 sticky left-0 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right font-medium whitespace-nowrap ${getGrowthColor(item.revenueGrowth)}`}
                >
                  {formatPercent(item.revenueGrowth)}
                </td>
              ))}
            </tr>

            {/* Operating Income Section */}
            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-white bg-slate-800/30 sticky left-0">
                <div className="flex items-center">
                  <span className="w-1 h-4 bg-cyan-500 rounded-full mr-3"></span>
                  Operating Income
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.operatingIncome)}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-400 bg-slate-800/30 sticky left-0 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right font-medium whitespace-nowrap ${getGrowthColor(item.operatingIncomeGrowth)}`}
                >
                  {formatPercent(item.operatingIncomeGrowth)}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-400 bg-slate-800/30 sticky left-0 pl-8">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-slate-300 whitespace-nowrap">
                  {formatMargin(item.operatingMargin)}
                </td>
              ))}
            </tr>

            {/* EBITDA Section */}
            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-white bg-slate-800/30 sticky left-0">
                <div className="flex items-center">
                  <span className="w-1 h-4 bg-violet-500 rounded-full mr-3"></span>
                  EBITDA
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.ebitda)}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-400 bg-slate-800/30 sticky left-0 pl-8">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className={`px-4 py-3 text-sm text-right font-medium whitespace-nowrap ${getGrowthColor(item.ebitdaGrowth)}`}
                >
                  {formatPercent(item.ebitdaGrowth)}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-700/20 transition-colors">
              <td className="px-4 py-3 text-sm text-slate-400 bg-slate-800/30 sticky left-0 pl-8">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-slate-300 whitespace-nowrap">
                  {formatMargin(item.ebitdaMargin)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

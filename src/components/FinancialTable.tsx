'use client';

/**
 * FinancialTable Component - Bloomberg Terminal Style
 * Professional, data-dense financial data display
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
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
    return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
  } else {
    return `${sign}$${absValue.toLocaleString()}`;
  }
}

function formatPercent(value: number | null): string {
  if (value === null) return 'N/M';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatMargin(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function getGrowthColor(value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (value > 0) return 'text-[#00c853]'; // Terminal green
  if (value < 0) return 'text-[#ff5252]'; // Terminal red
  return 'text-gray-400';
}

function getGrowthBg(value: number | null): string {
  if (value === null) return 'bg-gray-500/5';
  if (value > 0) return 'bg-[#00c853]/8';
  if (value < 0) return 'bg-[#ff5252]/8';
  return 'bg-gray-500/5';
}

export default function FinancialTable({ title, subtitle, data, isQuarterly = true }: FinancialTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (!containerRef.current || !tableRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { opacity: 1 });
      return;
    }

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    const rows = tableRef.current.querySelectorAll('tbody tr');
    gsap.fromTo(
      rows,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, delay: 0.15, ease: 'power2.out' }
    );
  }, [data]);

  if (data.length === 0) {
    return (
      <div ref={containerRef} className="bg-[#111] border border-[#222] rounded-lg p-4" style={{ opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        <div className="mt-4 py-6 text-center text-gray-600 text-sm">No data available</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#111] border border-[#222] rounded-lg overflow-hidden"
      style={{ opacity: 0 }}
    >
      {/* Header - Terminal style */}
      <div className="px-4 py-3 border-b border-[#222] bg-[#0d0d0d]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isQuarterly ? 'bg-[#2196f3]' : 'bg-[#ff9800]'}`} />
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
              {subtitle && <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{subtitle}</p>}
            </div>
          </div>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
            {isQuarterly ? 'QTR' : 'FY'}
          </span>
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full min-w-max">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-[#0d0d0d] sticky left-0 z-10 min-w-[140px]">
                Metric
              </th>
              {data.map((item) => (
                <th
                  key={item.period}
                  className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[90px]"
                >
                  {item.period}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#1a1a1a]">
            {/* Revenue */}
            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2.5 text-xs font-medium text-white bg-[#0d0d0d] sticky left-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#00c853] rounded-sm"></span>
                  Revenue
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2.5 text-right">
                  <span className="text-sm font-semibold text-white font-mono tracking-tight">
                    {formatCurrency(item.revenue)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2 text-[11px] text-gray-500 bg-[#0d0d0d] sticky left-0 z-10 pl-6">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2 text-right">
                  <span className={`text-xs font-semibold font-mono px-1.5 py-0.5 rounded ${getGrowthColor(item.revenueGrowth)} ${getGrowthBg(item.revenueGrowth)}`}>
                    {formatPercent(item.revenueGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Operating Income */}
            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2.5 text-xs font-medium text-white bg-[#0d0d0d] sticky left-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#2196f3] rounded-sm"></span>
                  Operating Income
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2.5 text-right">
                  <span className="text-sm font-semibold text-white font-mono tracking-tight">
                    {formatCurrency(item.operatingIncome)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2 text-[11px] text-gray-500 bg-[#0d0d0d] sticky left-0 z-10 pl-6">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2 text-right">
                  <span className={`text-xs font-semibold font-mono px-1.5 py-0.5 rounded ${getGrowthColor(item.operatingIncomeGrowth)} ${getGrowthBg(item.operatingIncomeGrowth)}`}>
                    {formatPercent(item.operatingIncomeGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2 text-[11px] text-gray-500 bg-[#0d0d0d] sticky left-0 z-10 pl-6">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2 text-right">
                  <span className="text-xs text-gray-400 font-mono">
                    {formatMargin(item.operatingMargin)}
                  </span>
                </td>
              ))}
            </tr>

            {/* EBITDA */}
            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2.5 text-xs font-medium text-white bg-[#0d0d0d] sticky left-0 z-10">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#ff9800] rounded-sm"></span>
                  EBITDA
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2.5 text-right">
                  <span className="text-sm font-semibold text-white font-mono tracking-tight">
                    {formatCurrency(item.ebitda)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2 text-[11px] text-gray-500 bg-[#0d0d0d] sticky left-0 z-10 pl-6">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2 text-right">
                  <span className={`text-xs font-semibold font-mono px-1.5 py-0.5 rounded ${getGrowthColor(item.ebitdaGrowth)} ${getGrowthBg(item.ebitdaGrowth)}`}>
                    {formatPercent(item.ebitdaGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-[#151515] transition-colors">
              <td className="px-3 py-2 text-[11px] text-gray-500 bg-[#0d0d0d] sticky left-0 z-10 pl-6">
                Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-3 py-2 text-right">
                  <span className="text-xs text-gray-400 font-mono">
                    {formatMargin(item.ebitdaMargin)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Data density indicator */}
      <div className="px-3 py-2 border-t border-[#1a1a1a] bg-[#0d0d0d] flex items-center justify-between">
        <span className="text-[9px] text-gray-600 uppercase tracking-wider">
          {data.length} periods
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-600">
            <span className="inline-block w-1.5 h-1.5 bg-[#00c853] rounded-full mr-1"></span>
            +Growth
          </span>
          <span className="text-[9px] text-gray-600">
            <span className="inline-block w-1.5 h-1.5 bg-[#ff5252] rounded-full mr-1"></span>
            -Growth
          </span>
          <span className="text-[9px] text-gray-600">
            <span className="inline-block w-1.5 h-1.5 bg-gray-500 rounded-full mr-1"></span>
            N/M
          </span>
        </div>
      </div>
    </div>
  );
}

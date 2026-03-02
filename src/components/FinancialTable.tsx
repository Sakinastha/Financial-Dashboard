'use client';

/**
 * FinancialTable Component - Professional Glassmorphism Design with GSAP Animations
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
  if (value === null) return 'N/M'; // "Not Meaningful" - standard finance term for unavailable growth
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatMargin(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(1)}%`;
}

function getGrowthColor(value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
}

function getGrowthBgColor(value: number | null): string {
  if (value === null) return '';
  if (value > 0) return 'bg-emerald-500/10';
  if (value < 0) return 'bg-red-500/10';
  return '';
}

export default function FinancialTable({ title, subtitle, data, isQuarterly = true }: FinancialTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Entrance animations
  useEffect(() => {
    if (!containerRef.current || !tableRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { opacity: 1 });
      return;
    }

    // Container fade in
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );

    // Stagger row animations
    const rows = tableRef.current.querySelectorAll('tbody tr');
    gsap.fromTo(
      rows,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.4,
        stagger: 0.05,
        delay: 0.2,
        ease: 'power2.out',
      }
    );
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        ref={containerRef}
        className="glass-card p-6"
        style={{ opacity: 0 }}
      >
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        <div className="mt-6 flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-[#0d1321]/70 backdrop-blur-xl border border-white/8 rounded-2xl"
      style={{ opacity: 0 }}
    >
      {/* Header */}
      <div ref={headerRef} className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isQuarterly ? 'bg-cyan-500' : 'bg-violet-500'}`} />
            <span className="text-xs text-gray-500">{isQuarterly ? 'Quarterly' : 'Annual'}</span>
          </div>
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="overflow-x-auto">
        <table ref={tableRef} className="w-full min-w-max">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider bg-[#0a0e17]/50 sticky left-0 z-10">
                Metric
              </th>
              {data.map((item) => (
                <th
                  key={item.period}
                  className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {item.period}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {/* Revenue Section */}
            <tr className="table-row-hover group">
              <td className="px-4 py-3.5 text-sm font-medium text-white bg-[#0a0e17]/30 sticky left-0 z-10">
                <div className="flex items-center">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full mr-3 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-shadow"></span>
                  Revenue
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3.5 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.revenue)}
                </td>
              ))}
            </tr>

            <tr className="table-row-hover">
              <td className="px-4 py-3 text-sm text-gray-400 bg-[#0a0e17]/30 sticky left-0 z-10 pl-9">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className="px-4 py-3 text-sm text-right whitespace-nowrap"
                >
                  <span className={`px-2 py-0.5 rounded-md font-medium ${getGrowthColor(item.revenueGrowth)} ${getGrowthBgColor(item.revenueGrowth)}`}>
                    {formatPercent(item.revenueGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Operating Income Section */}
            <tr className="table-row-hover group">
              <td className="px-4 py-3.5 text-sm font-medium text-white bg-[#0a0e17]/30 sticky left-0 z-10">
                <div className="flex items-center">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full mr-3 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-shadow"></span>
                  Operating Income
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3.5 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.operatingIncome)}
                </td>
              ))}
            </tr>

            <tr className="table-row-hover">
              <td className="px-4 py-3 text-sm text-gray-400 bg-[#0a0e17]/30 sticky left-0 z-10 pl-9">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className="px-4 py-3 text-sm text-right whitespace-nowrap"
                >
                  <span className={`px-2 py-0.5 rounded-md font-medium ${getGrowthColor(item.operatingIncomeGrowth)} ${getGrowthBgColor(item.operatingIncomeGrowth)}`}>
                    {formatPercent(item.operatingIncomeGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="table-row-hover">
              <td className="px-4 py-3 text-sm text-gray-400 bg-[#0a0e17]/30 sticky left-0 z-10 pl-9">
                Operating Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-300 whitespace-nowrap">
                  {formatMargin(item.operatingMargin)}
                </td>
              ))}
            </tr>

            {/* EBITDA Section */}
            <tr className="table-row-hover group">
              <td className="px-4 py-3.5 text-sm font-medium text-white bg-[#0a0e17]/30 sticky left-0 z-10">
                <div className="flex items-center">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-violet-400 to-violet-600 rounded-full mr-3 group-hover:shadow-lg group-hover:shadow-violet-500/30 transition-shadow"></span>
                  EBITDA
                </div>
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3.5 text-sm text-right text-white font-medium whitespace-nowrap">
                  {formatCurrency(item.ebitda)}
                </td>
              ))}
            </tr>

            <tr className="table-row-hover">
              <td className="px-4 py-3 text-sm text-gray-400 bg-[#0a0e17]/30 sticky left-0 z-10 pl-9">
                Y/Y Growth
              </td>
              {data.map((item) => (
                <td
                  key={item.period}
                  className="px-4 py-3 text-sm text-right whitespace-nowrap"
                >
                  <span className={`px-2 py-0.5 rounded-md font-medium ${getGrowthColor(item.ebitdaGrowth)} ${getGrowthBgColor(item.ebitdaGrowth)}`}>
                    {formatPercent(item.ebitdaGrowth)}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="table-row-hover">
              <td className="px-4 py-3 text-sm text-gray-400 bg-[#0a0e17]/30 sticky left-0 z-10 pl-9">
                EBITDA Margin
              </td>
              {data.map((item) => (
                <td key={item.period} className="px-4 py-3 text-sm text-right text-gray-300 whitespace-nowrap">
                  {formatMargin(item.ebitdaMargin)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scroll fade indicator */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0d1321] to-transparent pointer-events-none opacity-50" />
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface EmptyStateProps {
  onSelectTicker: (ticker: string) => void;
}

const popularTickers = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
];

export default function EmptyState({ onSelectTicker }: EmptyStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set([terminalRef.current, buttonsRef.current], { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();

    // Terminal entrance
    tl.fromTo(
      terminalRef.current,
      { scale: 0.95, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    // Buttons stagger
    tl.fromTo(
      buttonsRef.current?.querySelectorAll('button') || [],
      { scale: 0.9, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' },
      '-=0.2'
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-12 px-4">
      {/* Terminal-style welcome */}
      <div
        ref={terminalRef}
        className="w-full max-w-2xl bg-[#111] border border-[#222] rounded-lg overflow-hidden"
        style={{ opacity: 0 }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0d0d0d] border-b border-[#1a1a1a]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
          </div>
          <span className="text-[10px] text-gray-600 font-mono ml-2">financeflow — terminal</span>
        </div>

        {/* Terminal content */}
        <div className="p-6 font-mono text-sm">
          <div className="text-gray-500 mb-2">
            <span className="text-[#2196f3]">$</span> welcome to financeflow
          </div>
          <div className="text-white mb-4">
            Real-time financial data from <span className="text-[#00c853]">SEC EDGAR</span>
          </div>

          <div className="border-t border-[#1a1a1a] pt-4 mt-4">
            <div className="text-gray-500 mb-2">
              <span className="text-[#2196f3]">$</span> available metrics:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-[#00c853] rounded-sm"></span>
                <span className="text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-[#2196f3] rounded-sm"></span>
                <span className="text-gray-400">Operating Income</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-[#ff9800] rounded-sm"></span>
                <span className="text-gray-400">EBITDA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-[#7c4dff] rounded-sm"></span>
                <span className="text-gray-400">Y/Y Growth & Margins</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1a1a1a] pt-4 mt-4">
            <div className="text-gray-500 mb-1">
              <span className="text-[#2196f3]">$</span> coverage:
            </div>
            <div className="text-gray-400 text-xs">
              Last <span className="text-white">8 quarters</span> + Last <span className="text-white">3 fiscal years</span>
            </div>
          </div>

          <div className="mt-6 flex items-center text-gray-600 text-xs">
            <span className="text-[#2196f3]">$</span>
            <span className="ml-2">Enter a ticker symbol above to begin</span>
            <span className="ml-1 w-2 h-4 bg-[#2196f3] animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Quick access tickers */}
      <div ref={buttonsRef} className="mt-8 w-full max-w-2xl">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-3 text-center">
          Quick Access
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {popularTickers.map((ticker) => (
            <button
              key={ticker.symbol}
              onClick={() => onSelectTicker(ticker.symbol)}
              className="
                group px-3 py-2
                bg-[#111] hover:bg-[#1a1a1a]
                border border-[#222] hover:border-[#333]
                rounded transition-all duration-150
              "
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#2196f3] font-mono text-xs font-bold group-hover:text-[#64b5f6] transition-colors">
                  {ticker.symbol}
                </span>
                <span className="text-gray-600 text-[10px] hidden sm:inline">{ticker.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

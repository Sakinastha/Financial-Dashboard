'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Fetching data from SEC EDGAR' }: LoadingStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { opacity: 1 });
      return;
    }

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-20" style={{ opacity: 0 }}>
      {/* Terminal-style loading */}
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 min-w-[300px]">
        {/* Terminal header */}
        <div className="flex items-center gap-2 pb-4 border-b border-[#1a1a1a] mb-4">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ff5f57]"></div>
            <div className="w-2 h-2 rounded-full bg-[#febc2e]"></div>
            <div className="w-2 h-2 rounded-full bg-[#28c840]"></div>
          </div>
          <span className="text-[9px] text-gray-600 font-mono ml-2">loading</span>
        </div>

        {/* Loading animation */}
        <div className="flex items-center gap-3">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-[#222] rounded-full" />
            <div className="absolute inset-0 border-2 border-[#2196f3] rounded-full animate-spin border-t-transparent" />
          </div>
          <div className="font-mono text-sm text-gray-400">
            <span className="text-[#2196f3]">$</span> {message}
            <span className="inline-block w-2 h-4 bg-[#2196f3] ml-1 animate-pulse"></span>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#00c853]">✓</span>
            <span className="text-gray-500">Connecting to SEC EDGAR API</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-3 h-3 border border-[#2196f3] rounded-full animate-pulse"></span>
            <span className="text-gray-400">Parsing XBRL data...</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-600">○</span>
            <span className="text-gray-600">Calculating metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface EmptyStateProps {
  onSelectTicker: (ticker: string) => void;
}

const popularTickers = [
  { symbol: 'AAPL', name: 'Apple', color: 'from-gray-400 to-gray-600' },
  { symbol: 'MSFT', name: 'Microsoft', color: 'from-blue-400 to-blue-600' },
  { symbol: 'GOOGL', name: 'Google', color: 'from-red-400 to-yellow-500' },
  { symbol: 'AMZN', name: 'Amazon', color: 'from-orange-400 to-orange-600' },
  { symbol: 'NVDA', name: 'NVIDIA', color: 'from-green-400 to-green-600' },
  { symbol: 'TSLA', name: 'Tesla', color: 'from-red-400 to-red-600' },
];

export default function EmptyState({ onSelectTicker }: EmptyStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const illustrationRef = useRef<SVGSVGElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set([illustrationRef.current, titleRef.current, descRef.current, buttonsRef.current], { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();

    // Illustration entrance
    tl.fromTo(
      illustrationRef.current,
      { scale: 0.5, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.4)' }
    );

    // Animate illustration elements
    const bars = illustrationRef.current?.querySelectorAll('.chart-bar');
    const line = illustrationRef.current?.querySelector('.chart-line');
    const dots = illustrationRef.current?.querySelectorAll('.chart-dot');

    if (bars) {
      tl.fromTo(
        bars,
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      );
    }

    if (line) {
      tl.fromTo(
        line,
        { strokeDashoffset: 200 },
        { strokeDashoffset: 0, duration: 1, ease: 'power2.out' },
        '-=0.5'
      );
    }

    if (dots) {
      tl.fromTo(
        dots,
        { scale: 0, transformOrigin: 'center' },
        { scale: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(2)' },
        '-=0.3'
      );
    }

    // Title slide up
    tl.fromTo(
      titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.4'
    );

    // Description fade in
    tl.fromTo(
      descRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.3'
    );

    // Buttons stagger
    tl.fromTo(
      buttonsRef.current?.querySelectorAll('button') || [],
      { scale: 0.8, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'back.out(1.5)' },
      '-=0.2'
    );

    // Continuous floating animation for illustration
    gsap.to(illustrationRef.current, {
      y: -10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      tl.kill();
    };
  }, []);

  const handleTickerClick = (ticker: string) => {
    onSelectTicker(ticker);
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated Illustration */}
      <div className="relative mb-10">
        {/* Glow effect behind illustration */}
        <div className="absolute inset-0 blur-3xl opacity-30">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full" />
        </div>

        <svg
          ref={illustrationRef}
          className="relative w-64 h-48 md:w-80 md:h-60"
          viewBox="0 0 320 240"
          fill="none"
          style={{ opacity: 0 }}
        >
          {/* Background card */}
          <rect
            x="20"
            y="30"
            width="280"
            height="180"
            rx="16"
            fill="url(#cardGradient)"
            stroke="url(#cardBorder)"
            strokeWidth="1"
          />

          {/* Inner glow */}
          <rect
            x="25"
            y="35"
            width="270"
            height="170"
            rx="14"
            fill="url(#innerGlow)"
            opacity="0.5"
          />

          {/* Chart bars */}
          <rect className="chart-bar" x="60" y="140" width="24" height="50" rx="4" fill="url(#barGrad1)" />
          <rect className="chart-bar" x="100" y="110" width="24" height="80" rx="4" fill="url(#barGrad2)" />
          <rect className="chart-bar" x="140" y="80" width="24" height="110" rx="4" fill="url(#barGrad3)" />
          <rect className="chart-bar" x="180" y="100" width="24" height="90" rx="4" fill="url(#barGrad2)" />
          <rect className="chart-bar" x="220" y="60" width="24" height="130" rx="4" fill="url(#barGrad1)" />

          {/* Trend line */}
          <path
            className="chart-line"
            d="M72 135 L112 105 L152 75 L192 95 L232 55"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="200"
          />

          {/* Data points */}
          <circle className="chart-dot" cx="72" cy="135" r="6" fill="#3b82f6" />
          <circle className="chart-dot" cx="112" cy="105" r="6" fill="#8b5cf6" />
          <circle className="chart-dot" cx="152" cy="75" r="6" fill="#ec4899" />
          <circle className="chart-dot" cx="192" cy="95" r="6" fill="#8b5cf6" />
          <circle className="chart-dot" cx="232" cy="55" r="6" fill="#3b82f6" />

          {/* Glowing dots */}
          <circle cx="72" cy="135" r="10" fill="#3b82f6" opacity="0.3">
            <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="232" cy="55" r="10" fill="#3b82f6" opacity="0.3">
            <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" begin="0.5s" />
          </circle>

          {/* Search icon */}
          <g transform="translate(260, 45)">
            <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" fill="none" />
            <line x1="19" y1="19" x2="26" y2="26" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
            <animateTransform
              attributeName="transform"
              type="translate"
              values="260,45; 260,42; 260,45"
              dur="3s"
              repeatCount="indefinite"
            />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <radialGradient id="innerGlow" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.2)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="barGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="barGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="barGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Title */}
      <h3
        ref={titleRef}
        className="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
        style={{ opacity: 0 }}
      >
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Explore Financial Data
        </span>
      </h3>

      {/* Description */}
      <p
        ref={descRef}
        className="text-gray-400 text-center max-w-lg mb-10 text-lg leading-relaxed"
        style={{ opacity: 0 }}
      >
        Search for any publicly traded company to view revenue, operating income,
        EBITDA, and growth metrics sourced directly from SEC filings.
      </p>

      {/* Popular tickers */}
      <div ref={buttonsRef}>
        <p className="text-gray-500 text-sm mb-4 text-center">Popular searches</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {popularTickers.map((ticker) => (
            <button
              key={ticker.symbol}
              onClick={() => handleTickerClick(ticker.symbol)}
              className="
                group relative px-5 py-3
                bg-[#0d1321] hover:bg-[#141b2d]
                border border-white/10 hover:border-white/20
                rounded-xl transition-all duration-300
                hover:shadow-lg hover:shadow-purple-500/10
                hover:-translate-y-1
              "
              style={{ opacity: 0 }}
            >
              {/* Gradient hover effect */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${ticker.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

              <div className="relative flex items-center gap-3">
                <span className={`text-sm font-bold bg-gradient-to-r ${ticker.color} bg-clip-text text-transparent`}>
                  {ticker.symbol}
                </span>
                <span className="text-gray-500 text-sm">{ticker.name}</span>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

interface HeaderProps {
  children?: ReactNode;
}

export default function Header({ children }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Entrance animation
  useEffect(() => {
    if (!headerRef.current || !brandRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(headerRef.current, { opacity: 1 });
      return;
    }

    gsap.fromTo(
      headerRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );

    gsap.fromTo(
      brandRef.current,
      { x: -10, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.3, delay: 0.1, ease: 'power2.out' }
    );
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`
        sticky top-0 z-50
        border-b transition-all duration-200
        ${isScrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-sm border-[#222] shadow-lg shadow-black/50'
          : 'bg-[#0a0a0a] border-[#1a1a1a]'
        }
      `}
      style={{ opacity: 0 }}
    >
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Brand - Terminal Style */}
          <div ref={brandRef} className="flex items-center gap-2 flex-shrink-0" style={{ opacity: 0 }}>
            <Link href="/" className="flex items-center gap-2">
              {/* Terminal-style logo */}
              <div className="w-8 h-8 bg-[#111] border border-[#333] rounded flex items-center justify-center">
                <span className="text-[#2196f3] font-mono font-bold text-sm">F</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  FinanceFlow
                </h1>
                <p className="text-[9px] text-gray-600 uppercase tracking-wider font-mono">Terminal</p>
              </div>
            </Link>
          </div>

          {/* Search (children slot) */}
          {children}

          {/* Status indicator - Terminal Style */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-[#111] border border-[#222]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c853] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00c853]"></span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider hidden sm:inline">Connected</span>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider sm:hidden">Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

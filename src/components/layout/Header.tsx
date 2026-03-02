'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import gsap from 'gsap';
import Logo from '../ui/Logo';

interface HeaderProps {
  children?: ReactNode;
}

export default function Header({ children }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

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
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    );

    gsap.fromTo(
      brandRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power2.out' }
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
        backdrop-blur-xl
        border-b transition-all duration-300
        ${isScrolled
          ? 'bg-[#050810]/90 border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent border-transparent'
        }
      `}
      style={{ opacity: 0 }}
    >
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Brand */}
          <div ref={brandRef} className="flex items-center gap-6 flex-shrink-0" style={{ opacity: 0 }}>
            <Link href="/" className="flex items-center gap-4">
              <Logo size="md" animated={true} />
              <div>
                <h1 className="text-lg font-bold">
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    FinanceFlow
                  </span>
                </h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">SEC EDGAR Data</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link
                href="/"
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${pathname === '/'
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Search (children slot) */}
          {children}

          {/* Status indicator */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

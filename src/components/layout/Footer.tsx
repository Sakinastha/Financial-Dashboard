'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              footerRef.current,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(footerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="relative mt-auto" style={{ opacity: 0 }}>
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500/50 to-purple-600/50 rounded-lg flex items-center justify-center">
              <svg
                className="w-3.5 h-3.5 text-white/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-xs text-gray-500">
              Financial Dashboard
              <span className="text-gray-600 mx-2">|</span>
              Data from SEC EDGAR
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-600">
              Built for Cat Rock Capital Developer Assessment
            </p>
            <div className="hidden sm:block w-px h-3 bg-gray-700" />
            <p className="text-xs text-gray-600">
              {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

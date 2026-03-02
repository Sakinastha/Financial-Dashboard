'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Fetching data from SEC EDGAR...' }: LoadingStateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !spinnerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Fade in container
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );

    // Pulse animation for spinner glow
    gsap.to(spinnerRef.current, {
      boxShadow: '0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Animate dots
    if (dotsRef.current) {
      const dots = dotsRef.current.querySelectorAll('.dot');
      gsap.to(dots, {
        y: -5,
        duration: 0.4,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }

    return () => {
      gsap.killTweensOf(spinnerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center py-32" style={{ opacity: 0 }}>
      {/* Spinner */}
      <div
        ref={spinnerRef}
        className="relative w-20 h-20 rounded-full"
        style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}
      >
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-white/5 rounded-full" />

        {/* Gradient spinning ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #3b82f6, #8b5cf6, transparent)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
          }}
        />

        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
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
        </div>
      </div>

      {/* Message with animated dots */}
      <div className="mt-6 flex items-center gap-1">
        <p className="text-gray-400 text-sm">{message}</p>
        <div ref={dotsRef} className="flex gap-0.5 ml-1">
          <span className="dot w-1 h-1 bg-blue-400 rounded-full" />
          <span className="dot w-1 h-1 bg-purple-400 rounded-full" />
          <span className="dot w-1 h-1 bg-pink-400 rounded-full" />
        </div>
      </div>

      {/* Skeleton preview */}
      <div className="mt-8 w-full max-w-lg">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton h-20 rounded-xl"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

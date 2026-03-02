'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function Logo({ size = 'md', animated = true }: LogoProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<SVGGElement>(null);

  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { container: 'w-11 h-11', icon: 'w-6 h-6' },
    lg: { container: 'w-16 h-16', icon: 'w-9 h-9' },
  };

  useEffect(() => {
    if (!animated || !logoRef.current || !barsRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Entrance animation
    gsap.fromTo(
      logoRef.current,
      { scale: 0, rotate: -180 },
      { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );

    // Bars animation
    const bars = barsRef.current.querySelectorAll('rect');
    gsap.fromTo(
      bars,
      { scaleY: 0, transformOrigin: 'bottom' },
      { scaleY: 1, duration: 0.5, stagger: 0.1, delay: 0.3, ease: 'power2.out' }
    );

    // Continuous subtle pulse on hover area
    const handleMouseEnter = () => {
      gsap.to(bars, {
        scaleY: 1.1,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(bars, {
        scaleY: 1,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power2.out',
      });
    };

    logoRef.current.addEventListener('mouseenter', handleMouseEnter);
    logoRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      logoRef.current?.removeEventListener('mouseenter', handleMouseEnter);
      logoRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [animated]);

  return (
    <div
      ref={logoRef}
      className={`
        ${sizes[size].container}
        relative rounded-xl
        bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500
        p-[1px] cursor-pointer
        shadow-lg shadow-purple-500/25
        hover:shadow-xl hover:shadow-purple-500/40
        transition-shadow duration-300
      `}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 opacity-50 blur-sm" />

      {/* Background */}
      <div className="relative w-full h-full rounded-[10px] bg-[#0d1321] flex items-center justify-center overflow-hidden">
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        />

        {/* Chart icon */}
        <svg
          className={`${sizes[size].icon} relative z-10`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <defs>
            <linearGradient id="barGradient1" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="barGradient2" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="barGradient3" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <g ref={barsRef}>
            <rect x="4" y="14" width="4" height="6" rx="1" fill="url(#barGradient1)" />
            <rect x="10" y="8" width="4" height="12" rx="1" fill="url(#barGradient2)" />
            <rect x="16" y="4" width="4" height="16" rx="1" fill="url(#barGradient3)" />
          </g>
          {/* Trend line */}
          <path
            d="M5 13 L12 7 L18 3"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
          <circle cx="5" cy="13" r="1.5" fill="white" opacity="0.9" />
          <circle cx="12" cy="7" r="1.5" fill="white" opacity="0.9" />
          <circle cx="18" cy="3" r="1.5" fill="white" opacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

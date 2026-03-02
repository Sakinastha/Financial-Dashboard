'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface IconProps {
  className?: string;
  animated?: boolean;
}

export function RevenueIcon({ className = '', animated = true }: IconProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animated || !pathRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      pathRef.current,
      { strokeDashoffset: 100 },
      { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }
    );
  }, [animated]);

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="revenueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      <path
        ref={pathRef}
        d="M3 17L9 11L13 15L21 7"
        stroke="url(#revenueGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100"
      />
      <path
        d="M17 7H21V11"
        stroke="url(#revenueGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="7" r="2" fill="#34d399" opacity="0.5">
        <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function IncomeIcon({ className = '', animated = true }: IconProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!animated || !circleRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      circleRef.current,
      { scale: 0, transformOrigin: 'center' },
      { scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
    );
  }, [animated]);

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="incomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <circle
        ref={circleRef}
        cx="12"
        cy="12"
        r="9"
        stroke="url(#incomeGrad)"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 7V17M12 7L8 11M12 7L16 11"
        stroke="url(#incomeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated ring */}
      <circle cx="12" cy="12" r="11" stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.3">
        <animate attributeName="r" values="9;12;9" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function EbitdaIcon({ className = '', animated = true }: IconProps) {
  const barsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!animated || !barsRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const bars = barsRef.current.querySelectorAll('rect');
    gsap.fromTo(
      bars,
      { scaleY: 0, transformOrigin: 'bottom' },
      { scaleY: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
    );
  }, [animated]);

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ebitdaGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="ebitdaGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="ebitdaGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <g ref={barsRef}>
        <rect x="3" y="13" width="5" height="8" rx="1" fill="url(#ebitdaGrad1)" />
        <rect x="9.5" y="8" width="5" height="13" rx="1" fill="url(#ebitdaGrad2)" />
        <rect x="16" y="3" width="5" height="18" rx="1" fill="url(#ebitdaGrad3)" />
      </g>
      {/* Sparkle */}
      <circle cx="18.5" cy="5" r="1" fill="white">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function MarginIcon({ className = '', animated = true }: IconProps) {
  const arcRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!animated || !arcRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      arcRef.current,
      { strokeDashoffset: 100 },
      { strokeDashoffset: 30, duration: 1.2, ease: 'power2.out' }
    );
  }, [animated]);

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="marginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Background arc */}
      <path
        d="M4 18 A 8 8 0 1 1 20 18"
        stroke="#374151"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Progress arc */}
      <path
        ref={arcRef}
        d="M4 18 A 8 8 0 1 1 20 18"
        stroke="url(#marginGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="100"
      />
      {/* Percentage indicator */}
      <text x="12" y="15" textAnchor="middle" fill="#f472b6" fontSize="6" fontWeight="bold">%</text>
      {/* Glow dot */}
      <circle cx="18" cy="10" r="2" fill="#ec4899">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

interface AnimatedCounterProps {
  value: number | null | undefined;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1.5,
  decimals = 0,
  formatValue,
  className = '',
}: AnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState<string>('—');

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayValue('—');
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(formatValue ? formatValue(value) : value.toFixed(decimals));
      return;
    }

    const counter = { value: 0 };

    gsap.to(counter, {
      value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (formatValue) {
          setDisplayValue(formatValue(counter.value));
        } else {
          setDisplayValue(counter.value.toFixed(decimals));
        }
      },
    });

    return () => {
      gsap.killTweensOf(counter);
    };
  }, [value, duration, decimals, formatValue]);

  return (
    <span ref={counterRef} className={className}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

// Utility function to format currency values
export function formatCurrencyValue(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e12) {
    return `${sign}$${(absValue / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}$${(absValue / 1e6).toFixed(1)}M`;
  }
  return `${sign}$${absValue.toLocaleString()}`;
}

// Utility function to format percentage values
export function formatPercentValue(value: number): string {
  return `${value.toFixed(1)}%`;
}

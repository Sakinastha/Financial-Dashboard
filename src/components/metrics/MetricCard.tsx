'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import AnimatedCounter, { formatCurrencyValue, formatPercentValue } from '../ui/AnimatedCounter';
import { RevenueIcon, IncomeIcon, EbitdaIcon, MarginIcon } from '../ui/MetricIcons';

interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  growth?: number | null;
  period?: string;
  isPercent?: boolean;
  delay?: number;
  icon?: 'revenue' | 'income' | 'ebitda' | 'margin';
}

const iconComponents = {
  revenue: RevenueIcon,
  income: IncomeIcon,
  ebitda: EbitdaIcon,
  margin: MarginIcon,
};

const gradientColors = {
  revenue: 'from-emerald-500/20 to-teal-500/20',
  income: 'from-cyan-500/20 to-blue-500/20',
  ebitda: 'from-violet-500/20 to-purple-500/20',
  margin: 'from-pink-500/20 to-rose-500/20',
};

const borderColors = {
  revenue: 'hover:border-emerald-500/30',
  income: 'hover:border-cyan-500/30',
  ebitda: 'hover:border-violet-500/30',
  margin: 'hover:border-pink-500/30',
};

const glowColors = {
  revenue: 'hover:shadow-emerald-500/20',
  income: 'hover:shadow-cyan-500/20',
  ebitda: 'hover:shadow-violet-500/20',
  margin: 'hover:shadow-pink-500/20',
};

export default function MetricCard({
  label,
  value,
  growth,
  period,
  isPercent = false,
  delay = 0,
  icon,
}: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    if (!cardRef.current || !contentRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set(cardRef.current, { opacity: 1 });
      return;
    }

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay,
        ease: 'back.out(1.4)',
      }
    );

    // Content stagger
    const elements = contentRef.current.children;
    gsap.fromTo(
      elements,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: delay + 0.3,
        ease: 'power2.out',
      }
    );
  }, [delay]);

  // Spotlight effect
  useEffect(() => {
    if (!cardRef.current || !spotlightRef.current) return;

    const card = cardRef.current;
    const spotlight = spotlightRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(spotlight, {
        x: x - 200,
        y: y - 200,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      gsap.to(spotlight, { opacity: 1, duration: 0.3 });
      gsap.to(card, {
        y: -6,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(spotlight, { opacity: 0, duration: 0.3 });
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const growthColor =
    growth !== null && growth !== undefined
      ? growth >= 0
        ? 'text-emerald-400'
        : 'text-red-400'
      : 'text-gray-500';

  const growthBgColor =
    growth !== null && growth !== undefined
      ? growth >= 0
        ? 'bg-emerald-500/10 border-emerald-500/20'
        : 'bg-red-500/10 border-red-500/20'
      : 'bg-gray-500/10';

  const IconComponent = icon ? iconComponents[icon] : null;

  return (
    <div
      ref={cardRef}
      className={`
        relative overflow-hidden
        bg-gradient-to-br from-[#0d1321] to-[#080c14]
        border border-white/10 rounded-2xl p-6
        transition-all duration-300
        ${icon ? borderColors[icon] : ''}
        ${icon ? glowColors[icon] : ''}
        hover:shadow-xl
      `}
      style={{ opacity: 0 }}
    >
      {/* Background gradient */}
      {icon && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[icon]} opacity-0 group-hover:opacity-100 transition-opacity`} />
      )}

      {/* Spotlight effect */}
      <div
        ref={spotlightRef}
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          opacity: 0,
        }}
      />

      {/* Content */}
      <div ref={contentRef} className="relative z-10">
        {/* Header with icon */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          {IconComponent && (
            <div className="w-10 h-10">
              <IconComponent className="w-full h-full" animated={true} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-4">
          <AnimatedCounter
            value={value}
            formatValue={isPercent ? formatPercentValue : formatCurrencyValue}
            className="text-3xl md:text-4xl font-bold text-white tracking-tight"
            duration={1.5}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{period || '—'}</span>
          {growth !== undefined && growth !== null && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${growthColor} ${growthBgColor}`}
            >
              {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
        <div className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${icon ? gradientColors[icon] : 'from-blue-500/20 to-purple-500/20'} rounded-full blur-2xl`} />
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  spotlight?: boolean;
  hoverLift?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className = '',
  elevated = false,
  spotlight = false,
  hoverLift = true,
  animate = true,
  delay = 0,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !animate) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay,
        ease: 'power2.out',
      }
    );
  }, [animate, delay]);

  // Spotlight mouse follow effect
  useEffect(() => {
    if (!spotlight || !cardRef.current || !spotlightRef.current) return;

    const card = cardRef.current;
    const spotlightEl = spotlightRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.to(spotlightEl, {
        x: x - 150,
        y: y - 150,
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseEnter = () => {
      gsap.to(spotlightEl, { opacity: 1, duration: 0.3 });
    };

    const handleMouseLeave = () => {
      gsap.to(spotlightEl, { opacity: 0, duration: 0.3 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [spotlight]);

  // Hover lift animation
  useEffect(() => {
    if (!hoverLift || !cardRef.current) return;

    const card = cardRef.current;

    const handleMouseEnter = () => {
      gsap.to(card, {
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)',
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        y: 0,
        boxShadow: elevated
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
          : 'none',
        duration: 0.3,
        ease: 'power2.out',
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverLift, elevated]);

  const baseClass = elevated ? 'glass-card-elevated' : 'glass-card';

  return (
    <div
      ref={cardRef}
      className={`${baseClass} relative overflow-hidden ${className}`}
      style={{ opacity: animate ? 0 : 1 }}
    >
      {spotlight && (
        <div
          ref={spotlightRef}
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
            opacity: 0,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

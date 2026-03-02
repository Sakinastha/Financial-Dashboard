'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const orbs = containerRef.current.querySelectorAll('.orb');

    orbs.forEach((orb, index) => {
      // Random floating animation
      gsap.to(orb, {
        x: `random(-100, 100)`,
        y: `random(-100, 100)`,
        duration: `random(15, 25)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 2,
      });

      // Pulsing glow
      gsap.to(orb, {
        scale: `random(0.8, 1.2)`,
        opacity: `random(0.3, 0.7)`,
        duration: `random(4, 8)`,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 1.5,
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Gradient orbs */}
      <div
        className="orb absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
          top: '-20%',
          left: '-10%',
        }}
      />
      <div
        className="orb absolute w-[600px] h-[600px] rounded-full blur-[100px] opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)',
          top: '30%',
          right: '-15%',
        }}
      />
      <div
        className="orb absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
          bottom: '-10%',
          left: '20%',
        }}
      />
      <div
        className="orb absolute w-[400px] h-[400px] rounded-full blur-[60px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, transparent 70%)',
          top: '60%',
          left: '50%',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(5, 8, 16, 0.8) 70%)',
        }}
      />
    </div>
  );
}

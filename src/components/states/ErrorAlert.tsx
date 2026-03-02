'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertRef.current || !iconRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      gsap.set(alertRef.current, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();

    // Slide in from right
    tl.fromTo(
      alertRef.current,
      { x: 50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    );

    // Shake animation
    tl.to(alertRef.current, {
      x: -4,
      duration: 0.08,
      ease: 'power2.inOut',
    });
    tl.to(alertRef.current, {
      x: 4,
      duration: 0.08,
      ease: 'power2.inOut',
    });
    tl.to(alertRef.current, {
      x: -4,
      duration: 0.08,
      ease: 'power2.inOut',
    });
    tl.to(alertRef.current, {
      x: 0,
      duration: 0.08,
      ease: 'power2.out',
    });

    // Icon pulse
    gsap.to(iconRef.current, {
      scale: 1.1,
      duration: 0.5,
      repeat: 2,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      tl.kill();
    };
  }, [message]);

  const handleDismiss = () => {
    if (!alertRef.current || !onDismiss) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onDismiss();
      return;
    }

    gsap.to(alertRef.current, {
      x: 50,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: onDismiss,
    });
  };

  return (
    <div
      ref={alertRef}
      className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4 backdrop-blur-sm"
      style={{ opacity: 0 }}
      role="alert"
    >
      {/* Icon */}
      <div
        ref={iconRef}
        className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center"
      >
        <svg
          className="w-5 h-5 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-red-400 text-sm font-medium">Error</p>
        <p className="text-red-300/80 text-sm mt-0.5 truncate">{message}</p>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
          aria-label="Dismiss error"
        >
          <svg
            className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

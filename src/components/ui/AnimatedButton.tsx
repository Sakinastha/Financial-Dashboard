'use client';

import { useRef, ReactNode, ButtonHTMLAttributes } from 'react';
import gsap from 'gsap';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export default function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    if (!buttonRef.current || disabled || loading) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.to(buttonRef.current, {
      y: -2,
      scale: 1.02,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current || disabled || loading) return;

    gsap.to(buttonRef.current, {
      y: 0,
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !rippleRef.current || disabled || loading) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.set(rippleRef.current, {
        x,
        y,
        scale: 0,
        opacity: 0.5,
      });

      gsap.to(rippleRef.current, {
        scale: 4,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
      });

      // Button press effect
      gsap.to(buttonRef.current, {
        scale: 0.98,
        duration: 0.1,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            duration: 0.1,
            ease: 'power2.out',
          });
        },
      });
    }

    props.onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25',
    secondary: 'bg-[#141b2d] border border-white/10 text-gray-300 hover:bg-[#1a2236] hover:border-white/20 hover:text-white',
    ghost: 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white',
  };

  return (
    <button
      ref={buttonRef}
      className={`
        relative overflow-hidden rounded-lg font-medium
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effect */}
      <span
        ref={rippleRef}
        className="absolute w-8 h-8 bg-white/30 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0 }}
      />

      {/* Button content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </span>
    </button>
  );
}

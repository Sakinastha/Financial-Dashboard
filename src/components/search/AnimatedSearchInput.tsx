'use client';

import { useRef, useEffect, forwardRef, useState } from 'react';
import gsap from 'gsap';

interface TickerSuggestion {
  ticker: string;
  name: string;
}

interface AnimatedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelectSuggestion: (suggestion: TickerSuggestion) => void;
  onClear?: () => void;
  suggestions: TickerSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  loading?: boolean;
  searchLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const AnimatedSearchInput = forwardRef<HTMLInputElement, AnimatedSearchInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onSelectSuggestion,
      onClear,
      suggestions,
      showSuggestions,
      setShowSuggestions,
      loading = false,
      searchLoading = false,
      disabled = false,
      placeholder = 'Enter ticker symbol or company name...',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Dropdown animation
    useEffect(() => {
      if (!dropdownRef.current) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (showSuggestions && suggestions.length > 0) {
        if (prefersReducedMotion) {
          gsap.set(dropdownRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            dropdownRef.current,
            { opacity: 0, y: -10 },
            { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
          );

          // Stagger animate suggestion items
          const items = dropdownRef.current.querySelectorAll('.suggestion-item');
          gsap.fromTo(
            items,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.2, stagger: 0.03, ease: 'power2.out', delay: 0.1 }
          );
        }
      }
    }, [showSuggestions, suggestions]);

    // Focus glow animation
    useEffect(() => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      if (isFocused) {
        gsap.to(containerRef.current, {
          boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.15)',
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        gsap.to(containerRef.current, {
          boxShadow: 'none',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }, [isFocused]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    };

    const handleSuggestionClick = (suggestion: TickerSuggestion) => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion && containerRef.current) {
        gsap.to(containerRef.current, {
          scale: 0.98,
          duration: 0.1,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(containerRef.current, {
              scale: 1,
              duration: 0.1,
              ease: 'power2.out',
            });
          },
        });
      }

      onSelectSuggestion(suggestion);
    };

    return (
      <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-8">
        <div ref={containerRef} className="relative rounded-xl transition-all">
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className={`h-5 w-5 transition-colors ${isFocused ? 'text-blue-400' : 'text-gray-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            onFocus={() => {
              setIsFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              w-full pl-12 pr-32 py-3.5
              bg-[#0d1321] border border-white/10
              rounded-xl text-white placeholder-gray-500
              focus:outline-none focus:border-blue-500/50
              transition-all text-sm
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={disabled || loading}
            autoComplete="off"
          />

          {/* Loading spinner */}
          {searchLoading && (
            <div className="absolute inset-y-0 right-28 flex items-center">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full" />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-spin border-t-transparent" />
              </div>
            </div>
          )}

          {/* Clear button */}
          {value && !loading && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                onClear?.();
              }}
              className="absolute inset-y-0 right-24 flex items-center px-2 group"
              aria-label="Clear search"
            >
              <div className="w-5 h-5 rounded-full bg-gray-600/50 hover:bg-gray-500/70 flex items-center justify-center transition-colors">
                <svg
                  className="w-3 h-3 text-gray-300 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </button>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || disabled}
            className={`
              absolute inset-y-0 right-0 px-5
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-600 hover:to-purple-700
              text-white text-sm font-medium
              rounded-r-xl transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-blue-500/20
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              'Search'
            )}
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-2 bg-[#0d1321] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              style={{ opacity: 0 }}
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.ticker}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item w-full px-4 py-3.5 text-left hover:bg-blue-500/10 flex items-center justify-between transition-colors group"
                  style={{ opacity: 0 }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                      {suggestion.ticker}
                    </span>
                    <span className="text-gray-400 text-sm truncate max-w-[200px]">
                      {suggestion.name}
                    </span>
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    );
  }
);

AnimatedSearchInput.displayName = 'AnimatedSearchInput';

export default AnimatedSearchInput;

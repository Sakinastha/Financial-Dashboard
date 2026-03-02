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
      placeholder = 'Enter ticker (AAPL, MSFT, GOOGL...)',
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
            { opacity: 0, y: -8 },
            { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' }
          );

          const items = dropdownRef.current.querySelectorAll('.suggestion-item');
          gsap.fromTo(
            items,
            { opacity: 0, x: -8 },
            { opacity: 1, x: 0, duration: 0.15, stagger: 0.02, ease: 'power2.out', delay: 0.05 }
          );
        }
      }
    }, [showSuggestions, suggestions]);

    // Focus effect
    useEffect(() => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      if (isFocused) {
        gsap.to(containerRef.current, {
          boxShadow: '0 0 0 1px rgba(33, 150, 243, 0.5), 0 0 20px rgba(33, 150, 243, 0.15)',
          duration: 0.2,
          ease: 'power2.out',
        });
      } else {
        gsap.to(containerRef.current, {
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.06)',
          duration: 0.2,
          ease: 'power2.out',
        });
      }
    }, [isFocused]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit();
    };

    const handleSuggestionClick = (suggestion: TickerSuggestion) => {
      onSelectSuggestion(suggestion);
    };

    return (
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-4 md:mx-8">
        <div
          ref={containerRef}
          className="relative rounded-lg transition-all bg-[#111] border border-[#222]"
          style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.06)' }}
        >
          {/* Terminal prompt indicator */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[#2196f3] font-mono text-sm font-bold mr-1">$</span>
            <svg
              className={`h-4 w-4 transition-colors ${isFocused ? 'text-[#2196f3]' : 'text-gray-600'}`}
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
              w-full pl-14 pr-28 py-3
              bg-transparent text-white placeholder-gray-600
              focus:outline-none
              font-mono text-sm tracking-wide
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={disabled || loading}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Loading spinner */}
          {searchLoading && (
            <div className="absolute inset-y-0 right-24 flex items-center">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-[#2196f3]/30 rounded-full" />
                <div className="absolute inset-0 border-2 border-[#2196f3] rounded-full animate-spin border-t-transparent" />
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
              className="absolute inset-y-0 right-20 flex items-center px-2 group"
              aria-label="Clear search"
            >
              <div className="w-5 h-5 rounded bg-[#222] hover:bg-[#333] flex items-center justify-center transition-colors">
                <svg
                  className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || disabled}
            className={`
              absolute inset-y-0 right-0 px-4
              bg-[#2196f3] hover:bg-[#1976d2]
              text-white text-xs font-semibold uppercase tracking-wider
              rounded-r-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center gap-2
            `}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Search</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </>
            )}
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-[#111] border border-[#222] rounded-lg shadow-2xl overflow-hidden"
              style={{ opacity: 0 }}
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.ticker}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item w-full px-3 py-2.5 text-left hover:bg-[#1a1a1a] flex items-center justify-between transition-colors group border-b border-[#1a1a1a] last:border-b-0"
                  style={{ opacity: 0 }}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[#2196f3] font-mono font-bold text-sm group-hover:text-[#64b5f6] transition-colors">
                      {suggestion.ticker}
                    </span>
                    <span className="text-gray-500 text-xs truncate max-w-[180px] md:max-w-[280px]">
                      {suggestion.name}
                    </span>
                  </span>
                  <svg
                    className="w-3 h-3 text-gray-700 group-hover:text-[#2196f3] group-hover:translate-x-0.5 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

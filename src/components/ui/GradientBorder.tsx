'use client';

import { ReactNode } from 'react';

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  animate?: boolean;
  borderWidth?: number;
}

export default function GradientBorder({
  children,
  className = '',
  glow = false,
  animate = true,
  borderWidth = 1,
}: GradientBorderProps) {
  return (
    <div
      className={`
        relative rounded-2xl p-[${borderWidth}px]
        ${animate ? 'gradient-border' : ''}
        ${glow ? 'gradient-border-glow' : ''}
        ${className}
      `}
      style={{
        background: animate
          ? undefined
          : 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
        padding: `${borderWidth}px`,
      }}
    >
      <div className="relative bg-[#0d1321] rounded-[calc(1rem-1px)] h-full">
        {children}
      </div>
    </div>
  );
}

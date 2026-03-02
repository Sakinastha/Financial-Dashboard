'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClass = 'skeleton';
  const variantClass = variant === 'circular' ? 'skeleton-circle' : variant === 'text' ? 'skeleton-text' : '';

  const style: React.CSSProperties = {
    width: width,
    height: variant === 'text' ? height || '1em' : height,
  };

  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantClass}`}
            style={{
              ...style,
              width: i === lines - 1 ? '70%' : width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return <div className={`${baseClass} ${variantClass} ${className}`} style={style} />;
}

// Skeleton Card Component
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <Skeleton variant="text" width="40%" height="0.75rem" className="mb-3" />
      <Skeleton variant="text" width="60%" height="1.5rem" className="mb-2" />
      <div className="flex justify-between items-center mt-3">
        <Skeleton variant="text" width="30%" height="0.75rem" />
        <Skeleton variant="text" width="25%" height="0.75rem" />
      </div>
    </div>
  );
}

// Skeleton Table Component
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <Skeleton variant="text" width="30%" height="1.25rem" />
      </div>

      {/* Table rows */}
      <div className="p-4">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  width={colIndex === 0 ? '25%' : '20%'}
                  height="1rem"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton Metric Cards
export function SkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

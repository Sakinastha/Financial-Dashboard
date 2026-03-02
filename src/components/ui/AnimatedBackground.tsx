'use client';

/**
 * Minimal terminal-style background
 * Subtle grid pattern without distracting animations
 */
export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(33, 150, 243, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(33, 150, 243, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle corner glows */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#2196f3]/[0.03] rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#ff9800]/[0.02] rounded-full blur-3xl" />
    </div>
  );
}

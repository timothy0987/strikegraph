import React from 'react';

/**
 * StrikeGraph lockup — a crisp inline-SVG mark (a soccer ball drawn as a
 * node graph with a "strike" vector) plus the Orbitron wordmark.
 * Vector, transparent, theme-aware — replaces the old baked PNG.
 *
 * `compact` (used in the top nav) hides the wordmark on narrow screens so the
 * bar never overflows; the full lockup still shows in the mobile menu.
 */
const Logo = ({ onClick, className = '', size = 'md', compact = false }) => {
  const icon = size === 'lg' ? 'h-11' : size === 'sm' ? 'h-7' : 'h-9';
  const text = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <svg viewBox="0 0 44 44" className={`${icon} w-auto shrink-0`} fill="none" aria-hidden="true">
        {/* ball */}
        <circle cx="20" cy="24" r="14" stroke="currentColor" strokeWidth="2.4" opacity="0.85" />
        {/* graph edges */}
        <g stroke="#39FF14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 24 L12.5 18" />
          <path d="M20 24 L28 19" />
          <path d="M20 24 L16.5 32.5" />
          <path d="M12.5 18 L28 19" />
          <path d="M16.5 32.5 L28 19" />
        </g>
        {/* graph nodes */}
        <g fill="#39FF14">
          <circle cx="20" cy="24" r="2.6" />
          <circle cx="12.5" cy="18" r="2.1" />
          <circle cx="28" cy="19" r="2.1" />
          <circle cx="16.5" cy="32.5" r="2.1" />
        </g>
        {/* strike vector */}
        <path d="M29 14 L39 4" stroke="#7dd320" strokeWidth="3" strokeLinecap="round" />
        <path d="M33 4 L39 4 L39 10" stroke="#7dd320" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <span
        className={`font-arcade font-black tracking-tight leading-none text-white ${text} ${
          compact ? 'hidden sm:inline' : 'inline'
        }`}
      >
        Strike<span className="text-neonGreen">Graph</span>
      </span>
    </div>
  );
};

export default Logo;

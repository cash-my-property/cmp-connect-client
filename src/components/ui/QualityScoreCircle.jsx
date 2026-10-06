import React from 'react';

export default function QualityScoreCircle({ score = 0, size = 20, strokeWidth = 3 }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const validScore = Math.min(100, Math.max(0, score));
  const strokeDash = (validScore / 100) * circumference;

  const color =
    validScore >= 80
      ? 'var(--cmp-success)'
      : validScore >= 60
      ? 'var(--cmp-warning)'
      : 'var(--cmp-danger)';

  return (
    <span
      role="img"
      aria-label={`${validScore}%`}
      style={{
        position: 'relative',
        display: 'inline-grid',
        placeItems: 'center',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0
      }}
    >
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cmp-border)"
          strokeWidth={strokeWidth}
        />
        {/* Dynamic Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
        />
      </svg>
    </span>
  );
}

"use client";

// The "Voice accuracy" indicator — a small radial gauge that visibly climbs
// as the profile learns from samples and feedback.
export function AccuracyRing({
  value,
  size = 44,
}: {
  value: number;
  size?: number;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" title={`Voice accuracy: ${Math.round(value)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="var(--brand)"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <span
        className="absolute font-semibold tabular-nums"
        style={{ fontSize: size * 0.28 }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

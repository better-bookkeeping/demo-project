import { useMediaQuery } from "@/hooks/use-media-query";

interface CalorieProgressCircleProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieProgressCircle({
  current,
  goal,
  size = 250,
  strokeWidth = 16,
}: CalorieProgressCircleProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const actualSize = isMobile ? 200 : size;
  const actualStrokeWidth = isMobile ? 12 : strokeWidth;

  const radius = actualSize / 2 - actualStrokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / goal, 1);
  const offset = circumference - progress * circumference;
  const remaining = Math.max(goal - current, 0);

  return (
    <div className="relative flex items-center justify-center" style={{ width: actualSize, height: actualSize }}>
      <svg width={actualSize} height={actualSize} className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="oklch(75% 0.18 45)" />
          </linearGradient>
        </defs>
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke="var(--color-steel-800)"
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={radius}
          fill="none"
          stroke={progress >= 1 ? "var(--color-success)" : "url(#progressGradient)"}
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 500ms ease-out",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xs font-bold text-steel-500 uppercase tracking-widest">Consumed</p>
        <p className="text-2xl md:text-3xl font-heading font-black text-white tabular-nums">
          {current}
        </p>
        <p className="text-xs text-steel-500 mt-1">of {goal} kcal</p>
        {remaining > 0 && (
          <p className="text-xs text-steel-600 mt-1">{remaining} remaining</p>
        )}
      </div>
    </div>
  );
}

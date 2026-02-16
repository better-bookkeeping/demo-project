import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "All"] as const;
export type TimeRange = (typeof RANGES)[number];

const RANGE_DAYS: Record<Exclude<TimeRange, "All">, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

function getCutoffDate(range: TimeRange): Date | null {
  if (range === "All") return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);
  return cutoff;
}

export function useChartRangeFilter<T>(
  data: T[],
  getDate: (item: T) => Date | string,
  defaultRange: TimeRange = "1W",
) {
  const [range, setRange] = useState<TimeRange>(defaultRange);

  const filteredData = useMemo(() => {
    const cutoff = getCutoffDate(range);
    if (!cutoff) return data;
    return data.filter((item) => new Date(getDate(item)) >= cutoff);
  }, [data, range, getDate]);

  return { range, setRange, filteredData };
}

export function ChartRangeFilter({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <div className="flex gap-1">
      {RANGES.map((r) => (
        <Button
          key={r}
          variant={value === r ? "default" : "ghost"}
          size="sm"
          aria-pressed={value === r}
          className={`h-7 px-2.5 text-xs ${value === r ? "bg-primary text-white hover:bg-primary/90" : ""}`}
          onClick={() => onChange(r)}
        >
          {r}
        </Button>
      ))}
    </div>
  );
}

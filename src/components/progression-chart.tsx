import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Target } from "lucide-react";
import { MetricDataPoint, MetricType } from "@/lib/progression.server";
import { parseLocalDate } from "@/lib/utils";

interface ProgressionChartProps {
  data: MetricDataPoint[];
  metricType: MetricType;
}

const metricConfig: Record<MetricType, { label: string; color: string; unit: string }> = {
  maxWeight: { label: "Max Weight", color: "var(--color-primary)", unit: "lbs" },
  totalReps: { label: "Total Reps", color: "var(--color-success)", unit: "reps" },
  totalVolume: { label: "Total Volume", color: "var(--color-primary)", unit: "lbs" },
};

export function ProgressionChart({ data, metricType }: ProgressionChartProps) {
  const config = metricConfig[metricType];

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex flex-col items-center justify-center text-steel-600 space-y-3">
        <Target className="w-12 h-12 opacity-20" />
        <p className="font-heading font-bold uppercase italic text-sm">No data yet</p>
        <p className="text-xs text-steel-500">Complete workouts to track progress</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${metricType}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontWeight: 700 }}
          tickFormatter={(v) => parseLocalDate(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-text-muted)", fontSize: 10, fontWeight: 700 }} width={45} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
          }}
          itemStyle={{ color: "var(--color-text-primary)", fontWeight: 700 }}
          labelStyle={{ color: "var(--color-text-muted)", fontSize: "11px", marginBottom: "4px" }}
          labelFormatter={(v) =>
            parseLocalDate(v).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          }
          formatter={(v) => [`${metricType === "totalReps" ? v : Number(v).toFixed(1)} ${config.unit}`, config.label]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          fill={`url(#gradient-${metricType})`}
          dot={{ fill: config.color, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-text-primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

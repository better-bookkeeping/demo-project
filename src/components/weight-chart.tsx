import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/hooks/use-media-query";

interface WeightChartProps {
  data: Array<{ date: string; weight: number }>;
}

export function WeightChart({ data }: WeightChartProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (data.length === 0) {
    return <div className="h-full flex items-center justify-center text-steel-500">No weight data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? -15 : 10, bottom: 5 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "var(--color-text-muted)", fontSize: isMobile ? 10 : 12 }}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
          stroke="var(--color-border)"
          interval={isMobile ? "preserveStartEnd" : 0}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "var(--color-text-muted)", fontSize: isMobile ? 10 : 12 }}
          domain={["dataMin - 5", "dataMax + 5"]}
          tickFormatter={(value) => `${value}`}
          stroke="var(--color-border)"
          width={isMobile ? 35 : 45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-card-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "0.5rem",
            boxShadow: "var(--shadow-lg)",
            fontSize: isMobile ? 12 : 14,
          }}
          labelStyle={{ color: "var(--color-text-primary)", fontWeight: 700, fontFamily: "var(--font-heading)" }}
          itemStyle={{ color: "var(--color-primary)" }}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          }
          formatter={(value) => [`${value} lbs`, "Weight"]}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="var(--color-primary)"
          strokeWidth={isMobile ? 2 : 3}
          fill="url(#weightGradient)"
          dot={{ fill: "var(--color-primary)", r: isMobile ? 3 : 4, strokeWidth: 0 }}
          activeDot={{ r: isMobile ? 5 : 6, fill: "var(--color-primary)", stroke: "var(--color-page-bg)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

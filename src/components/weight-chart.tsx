import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMediaQuery } from "@/hooks/use-media-query";

interface WeightChartProps {
  data: Array<{ date: string; weight: number }>;
}

export function WeightChart({ data }: WeightChartProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (data.length === 0) {
    return <div className="h-48 sm:h-64 flex items-center justify-center text-stone-400">No weight data available.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
      <AreaChart data={data} margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? -15 : 10, bottom: 5 }}>
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(45% 0.12 145)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="oklch(45% 0.12 145)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(92% 0.012 80)" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "oklch(55% 0.02 65)", fontSize: isMobile ? 10 : 12 }}
          tickFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
          stroke="oklch(92% 0.012 80)"
          interval={isMobile ? "preserveStartEnd" : 0}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "oklch(55% 0.02 65)", fontSize: isMobile ? 10 : 12 }}
          domain={["dataMin - 5", "dataMax + 5"]}
          tickFormatter={(value) => `${value}`}
          stroke="oklch(92% 0.012 80)"
          width={isMobile ? 35 : 45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(99% 0.003 80)",
            border: "none",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px oklch(35% 0.015 55 / 0.1), 0 2px 4px -2px oklch(35% 0.015 55 / 0.1)",
            fontSize: isMobile ? 12 : 14,
          }}
          labelStyle={{ color: "oklch(18% 0.01 45)", fontWeight: 500 }}
          itemStyle={{ color: "oklch(45% 0.12 145)" }}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          }
          formatter={(value) => [`${value} lbs`, "Weight"]}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="oklch(45% 0.12 145)"
          strokeWidth={isMobile ? 2 : 2.5}
          fill="url(#weightGradient)"
          dot={{ fill: "oklch(45% 0.12 145)", r: isMobile ? 3 : 4, strokeWidth: 0 }}
          activeDot={{ r: isMobile ? 5 : 6, fill: "oklch(65% 0.14 55)", stroke: "white", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

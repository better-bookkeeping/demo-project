import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { useMediaQuery } from "@/hooks/use-media-query";

interface NutritionChartProps {
  data: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number }>;
  metric?: "calories" | "protein" | "carbs" | "fat" | "all";
}

const COLORS = {
  calories: "var(--color-primary)",
  protein: "#10b981",
  carbs: "#3b82f6",
  fat: "#f59e0b",
};

const LABELS = {
  calories: "Calories",
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fat: "Fat (g)",
};

export function NutritionChart({ data, metric = "all" }: NutritionChartProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  if (data.length === 0) {
    return <div className="h-full flex items-center justify-center text-steel-500">No nutrition data available.</div>;
  }

  const metricsToShow = metric === "all" ? ["calories", "protein", "carbs", "fat"] : [metric];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? -15 : 10, bottom: 5 }}>
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
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          }
        />
        {metricsToShow.includes("calories") && (
          <Line
            type="monotone"
            dataKey="calories"
            stroke={COLORS.calories}
            strokeWidth={isMobile ? 2 : 3}
            dot={{ fill: COLORS.calories, r: isMobile ? 3 : 4, strokeWidth: 0 }}
            activeDot={{ r: isMobile ? 5 : 6, stroke: "var(--color-page-bg)", strokeWidth: 2 }}
            name={LABELS.calories}
          />
        )}
        {metricsToShow.includes("protein") && (
          <Line
            type="monotone"
            dataKey="protein"
            stroke={COLORS.protein}
            strokeWidth={isMobile ? 2 : 3}
            dot={{ fill: COLORS.protein, r: isMobile ? 3 : 4, strokeWidth: 0 }}
            activeDot={{ r: isMobile ? 5 : 6, stroke: "var(--color-page-bg)", strokeWidth: 2 }}
            name={LABELS.protein}
          />
        )}
        {metricsToShow.includes("carbs") && (
          <Line
            type="monotone"
            dataKey="carbs"
            stroke={COLORS.carbs}
            strokeWidth={isMobile ? 2 : 3}
            dot={{ fill: COLORS.carbs, r: isMobile ? 3 : 4, strokeWidth: 0 }}
            activeDot={{ r: isMobile ? 5 : 6, stroke: "var(--color-page-bg)", strokeWidth: 2 }}
            name={LABELS.carbs}
          />
        )}
        {metricsToShow.includes("fat") && (
          <Line
            type="monotone"
            dataKey="fat"
            stroke={COLORS.fat}
            strokeWidth={isMobile ? 2 : 3}
            dot={{ fill: COLORS.fat, r: isMobile ? 3 : 4, strokeWidth: 0 }}
            activeDot={{ r: isMobile ? 5 : 6, stroke: "var(--color-page-bg)", strokeWidth: 2 }}
            name={LABELS.fat}
          />
        )}
        {metric === "all" && (
          <Legend
            wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
            iconType="circle"
            formatter={(value) => <span style={{ color: "var(--color-text-primary)" }}>{value}</span>}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMediaQuery } from "@/hooks/use-media-query";

interface MacroDonutChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
  innerRatio?: number;
}

const MACRO_COLORS = {
  protein: "#10b981",
  carbs: "#3b82f6",
  fat: "#f59e0b",
};

interface MacroData {
  name: string;
  value: number;
  color: string;
}

export function MacroDonutChart({
  protein,
  carbs,
  fat,
  size = 250,
  innerRatio = 0.6,
}: MacroDonutChartProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const actualSize = isMobile ? 200 : size;

  const data: MacroData[] = [];
  if (protein > 0) data.push({ name: "Protein", value: protein, color: MACRO_COLORS.protein });
  if (carbs > 0) data.push({ name: "Carbs", value: carbs, color: MACRO_COLORS.carbs });
  if (fat > 0) data.push({ name: "Fat", value: fat, color: MACRO_COLORS.fat });

  const totalKcal = protein * 4 + carbs * 4 + fat * 9;
  const hasData = data.length > 0;

  const outerRadius = actualSize / 2;
  const innerRadius = outerRadius * innerRatio;

  return (
    <div className="relative" style={{ width: actualSize, height: actualSize }}>
      {hasData ? (
        <>
          <ResponsiveContainer width={actualSize} height={actualSize}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                cursor="pointer"
                animationBegin={0}
                animationDuration={500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.5rem",
                  boxShadow: "var(--shadow-lg)",
                  fontSize: isMobile ? 12 : 14,
                }}
                itemStyle={{ color: "var(--color-text-primary)" }}
                formatter={(value: number | undefined, name: string | undefined) => [`${value ?? 0}g`, name ?? ""]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="text-xs font-bold text-steel-500 uppercase tracking-widest">Macros</p>
            <p className="text-2xl md:text-3xl font-heading font-black text-white tabular-nums">
              {totalKcal}
            </p>
            <p className="text-xs text-steel-500 mt-1">kcal from macros</p>
          </div>
        </>
      ) : (
        <div className="relative" style={{ width: actualSize, height: actualSize }}>
          <svg width={actualSize} height={actualSize}>
            <circle
              cx={actualSize / 2}
              cy={actualSize / 2}
              r={(outerRadius + innerRadius) / 2}
              fill="none"
              stroke="var(--color-steel-800)"
              strokeWidth={outerRadius - innerRadius}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="text-xs font-bold text-steel-500 uppercase tracking-widest">No macros logged</p>
            <p className="text-sm text-steel-600 mt-1">0 kcal</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface WeightChartProps {
  data: Array<{ date: string; weight: number }>;
}

export function WeightChart({ data }: WeightChartProps) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-400">No weight data available.</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "#64748b" }}
          tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "#64748b" }}
          domain={["dataMin - 5", "dataMax + 5"]}
          tickFormatter={(value) => `${value} lbs`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
          }}
          labelFormatter={(value) =>
            new Date(value).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          }
          formatter={(value) => [`${value} lbs`, "Weight"]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

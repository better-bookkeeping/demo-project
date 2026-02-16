import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addWeightServerFn } from "@/lib/weight.server";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightHistoryQueryOptions } from "./-queries/weight";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartRangeFilter, type TimeRange } from "@/components/chart-range-filter";

export const Route = createFileRoute("/__index/_layout/weight/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(weightHistoryQueryOptions());
  },
  component: WeightPage,
});

function WeightPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<TimeRange>("1W");
  const { data: weightHistory = [] } = useQuery(weightHistoryQueryOptions(range));
  const [weight, setWeight] = useState("");

  const addWeightMutation = useMutation({
    mutationFn: (weight: number) => addWeightServerFn({ data: { weight } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight-history"] });
      setWeight("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(weight);
    if (isNaN(parsed) || parsed <= 0) return;
    addWeightMutation.mutate(parsed);
  };

  const latestWeight = weightHistory[0];

  const chartData = useMemo(
    () =>
      [...weightHistory].reverse().map((entry) => ({
        timestamp: new Date(entry.recordedAt).getTime(),
        weight: entry.weight,
      })),
    [weightHistory],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Weight</h1>

      <Card>
        <CardHeader>
          <CardTitle>Log Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <Input
              type="number"
              placeholder="Weight (lbs)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="1"
              max="1500"
              className="w-40"
            />
            <Button type="submit" disabled={!weight || addWeightMutation.isPending}>
              {addWeightMutation.isPending ? "Logging..." : "Log"}
            </Button>
          </form>
          {latestWeight && (
            <p className="text-sm text-slate-500">
              Current: <span className="font-medium text-slate-700">{latestWeight.weight} lbs</span>
              <span className="ml-2 text-slate-400">
                ({new Date(latestWeight.recordedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })})
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weight History</CardTitle>
          <ChartRangeFilter value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500">No weight entries yet. Log your first entry above!</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(ts: number) =>
                    new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                  fontSize={12}
                  tickLine={false}
                  stroke="#94a3b8"
                />
                <YAxis fontSize={12} tickLine={false} stroke="#94a3b8" domain={["auto", "auto"]} unit=" lbs" />
                <Tooltip
                  labelFormatter={(ts: number) =>
                    new Date(ts).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                  }}
                  formatter={(value: number) => [`${value} lbs`, "Weight"]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="oklch(37.8% 0.077 168.94)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

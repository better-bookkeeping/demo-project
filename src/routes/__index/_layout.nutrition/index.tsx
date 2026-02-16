import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addNutritionLogServerFn, updateCalorieGoalServerFn } from "@/lib/nutrition.server";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nutritionHistoryQueryOptions, dailyNutritionQueryOptions } from "./-queries/nutrition";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ChartRangeFilter, useChartRangeFilter } from "@/components/chart-range-filter";

export const Route = createFileRoute("/__index/_layout/nutrition/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(nutritionHistoryQueryOptions()),
      context.queryClient.ensureQueryData(dailyNutritionQueryOptions()),
    ]);
  },
  component: NutritionPage,
});

const MACRO_COLORS = {
  carbs: "#3b82f6",
  protein: "#ef4444",
  fat: "#f59e0b",
};

function NutritionPage() {
  const queryClient = useQueryClient();
  const { data: history } = useSuspenseQuery(nutritionHistoryQueryOptions());
  const { data: dailySummary } = useSuspenseQuery(dailyNutritionQueryOptions());

  const [calories, setCalories] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [fatG, setFatG] = useState("");
  const [goalInput, setGoalInput] = useState(dailySummary.calorieGoal?.toString() ?? "");

  useEffect(() => {
    setGoalInput(dailySummary.calorieGoal?.toString() ?? "");
  }, [dailySummary.calorieGoal]);

  const addLogMutation = useMutation({
    mutationFn: (data: { calories: number; carbsG: number; proteinG: number; fatG: number }) =>
      addNutritionLogServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionHistoryQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: dailyNutritionQueryOptions().queryKey });
      setCalories("");
      setCarbsG("");
      setProteinG("");
      setFatG("");
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: (calorieGoal: number | null) => updateCalorieGoalServerFn({ data: { calorieGoal } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNutritionQueryOptions().queryKey });
    },
  });

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseInt(calories);
    const carbs = parseFloat(carbsG);
    const protein = parseFloat(proteinG);
    const fat = parseFloat(fatG);
    if (isNaN(c) || isNaN(carbs) || isNaN(protein) || isNaN(fat)) return;
    addLogMutation.mutate({ calories: c, carbsG: carbs, proteinG: protein, fatG: fat });
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal = goalInput.trim() ? parseInt(goalInput) : null;
    if (goal !== null && isNaN(goal)) return;
    updateGoalMutation.mutate(goal);
  };

  const macroData = useMemo(() => {
    const total = dailySummary.carbsG + dailySummary.proteinG + dailySummary.fatG;
    if (total === 0) return [];
    return [
      { name: "Carbs", value: Math.round(dailySummary.carbsG), color: MACRO_COLORS.carbs },
      { name: "Protein", value: Math.round(dailySummary.proteinG), color: MACRO_COLORS.protein },
      { name: "Fat", value: Math.round(dailySummary.fatG), color: MACRO_COLORS.fat },
    ];
  }, [dailySummary]);

  const deficit =
    dailySummary.calorieGoal !== null ? dailySummary.calories - dailySummary.calorieGoal : null;

  const getLoggedAt = useCallback((entry: (typeof history)[number]) => entry.loggedAt, []);
  const { range, setRange, filteredData } = useChartRangeFilter(history, getLoggedAt, "1M");

  const calorieChartData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    for (const entry of filteredData) {
      const day = new Date(entry.loggedAt).toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + entry.calories);
    }
    return Array.from(dailyMap.entries())
      .map(([isoDate, cals]) => ({
        timestamp: new Date(isoDate + "T00:00:00").getTime(),
        calories: cals,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nutrition</h1>

      <Card>
        <CardHeader>
          <CardTitle>Log a Meal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogSubmit} className="flex gap-3 items-center flex-wrap">
            <Input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-28"
              min="0"
            />
            <Input
              type="number"
              placeholder="Carbs (g)"
              value={carbsG}
              onChange={(e) => setCarbsG(e.target.value)}
              className="w-28"
              min="0"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Protein (g)"
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
              className="w-28"
              min="0"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Fat (g)"
              value={fatG}
              onChange={(e) => setFatG(e.target.value)}
              className="w-28"
              min="0"
              step="0.1"
            />
            <Button
              type="submit"
              disabled={calories === "" || carbsG === "" || proteinG === "" || fatG === "" || addLogMutation.isPending}>
              {addLogMutation.isPending ? "Logging..." : "Log"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Calories</p>
                <p className="text-2xl font-semibold text-slate-900">{dailySummary.calories}</p>
                {deficit !== null && (
                  <p className={`text-xs ${deficit > 0 ? "text-amber-600" : "text-green-600"}`}>
                    {deficit > 0 ? `+${deficit} surplus` : deficit < 0 ? `${deficit} deficit` : "On target"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-500">Meals</p>
                <p className="text-2xl font-semibold text-slate-900">{dailySummary.entryCount}</p>
              </div>
              <div>
                <p className="text-slate-500">Carbs</p>
                <p className="font-medium text-slate-700">{Math.round(dailySummary.carbsG)}g</p>
              </div>
              <div>
                <p className="text-slate-500">Protein</p>
                <p className="font-medium text-slate-700">{Math.round(dailySummary.proteinG)}g</p>
              </div>
              <div>
                <p className="text-slate-500">Fat</p>
                <p className="font-medium text-slate-700">{Math.round(dailySummary.fatG)}g</p>
              </div>
            </div>
            <form onSubmit={handleGoalSubmit} className="flex gap-2 items-center pt-2 border-t border-slate-200">
              <Input
                type="number"
                placeholder="Calorie goal"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-32"
                min="0"
              />
              <Button type="submit" variant="outline" size="sm" disabled={updateGoalMutation.isPending}>
                {updateGoalMutation.isPending ? "Saving..." : "Set Goal"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {macroData.length === 0 ? (
              <p className="text-sm text-slate-500">No meals logged today.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {macroData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: number, name: string) => [`${value}g`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Calorie Trend</CardTitle>
          <ChartRangeFilter value={range} onChange={setRange} />
        </CardHeader>
        <CardContent>
          {calorieChartData.length === 0 ? (
            <p className="text-sm text-slate-500">No nutrition data yet. Log your first meal above!</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={calorieChartData}>
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
                <YAxis fontSize={12} tickLine={false} stroke="#94a3b8" domain={["auto", "auto"]} unit=" cal" />
                <Tooltip
                  labelFormatter={(ts: number) =>
                    new Date(ts).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "14px",
                  }}
                  formatter={(value: number) => [`${value} cal`, "Calories"]}
                />
                <Line
                  type="monotone"
                  dataKey="calories"
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

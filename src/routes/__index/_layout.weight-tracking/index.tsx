import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Plus, TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightHistoryQueryOptions, latestWeightQueryOptions } from "./-queries/weights";
import { createWeightServerFn, deleteWeightServerFn } from "@/lib/weights.server";
import { WeightChart } from "@/components/weight-chart";

export const Route = createFileRoute("/__index/_layout/weight-tracking/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(weightHistoryQueryOptions()),
      context.queryClient.ensureQueryData(latestWeightQueryOptions()),
    ]);
  },
  component: WeightTrackingPage,
});

function calculateTrend(history: Array<{ value: number; recordedAt: Date }>): {
  direction: "up" | "down" | "neutral";
  percentage: number;
} | null {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  const latest = sorted[0].value;
  const previous = sorted[1].value;

  if (latest === previous) return { direction: "neutral", percentage: 0 };

  const change = ((latest - previous) / previous) * 100;
  return {
    direction: change > 0 ? "up" : "down",
    percentage: Math.abs(change),
  };
}

function getChangeFromPrevious(
  currentIndex: number,
  history: Array<{ value: number }>,
): { change: number; direction: "up" | "down" | "neutral" } | null {
  if (currentIndex >= history.length - 1) return null;
  const current = history[currentIndex].value;
  const previous = history[currentIndex + 1].value;
  const change = current - previous;
  return {
    change: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

function WeightTrackingPage() {
  const queryClient = useQueryClient();
  const { data: weightHistory } = useSuspenseQuery(weightHistoryQueryOptions());
  const { data: latestWeight } = useSuspenseQuery(latestWeightQueryOptions());
  const [weight, setWeight] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split("T")[0]);

  const createWeightMutation = useMutation({
    mutationFn: (data: { value: number; recordedAt?: Date }) => createWeightServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightHistoryQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: latestWeightQueryOptions().queryKey });
      setWeight("");
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: (id: string) => deleteWeightServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightHistoryQueryOptions().queryKey });
      queryClient.invalidateQueries({ queryKey: latestWeightQueryOptions().queryKey });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) return;
    createWeightMutation.mutate({
      value: parseFloat(weight),
      recordedAt: new Date(recordedAt + "T00:00:00"),
    });
  };

  const chartData = weightHistory
    .map((entry) => ({
      date: entry.recordedAt.toISOString(),
      weight: entry.value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const trend = calculateTrend(weightHistory);
  const reversedHistory = weightHistory.slice().reverse();

  const stats = useMemo(() => {
    if (weightHistory.length === 0) return null;
    const weights = weightHistory.map((e) => e.value);
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
      avg: weights.reduce((a, b) => a + b, 0) / weights.length,
    };
  }, [weightHistory]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Weight Tracking</h1>

      {latestWeight && (
        <Card variant="stat">
          <CardContent className="py-6">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">Latest Weight</p>
            <div className="flex flex-wrap items-end gap-2 sm:gap-4">
              <p className="text-5xl sm:text-hero font-bold text-stone-900">{latestWeight.value}</p>
              <span className="text-xl sm:text-2xl font-medium text-stone-400 mb-1">lbs</span>
              {trend && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium mb-1 sm:mb-2 ${
                    trend.direction === "up"
                      ? "bg-error/10 text-error"
                      : trend.direction === "down"
                        ? "bg-success/10 text-success"
                        : "bg-stone-100 text-stone-500"
                  }`}>
                  {trend.direction === "up" ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : trend.direction === "down" ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {trend.percentage.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-stone-400 mt-2">
              {new Date(latestWeight.recordedAt).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 sm:items-end bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50">
        <div className="hidden sm:flex items-center">
          <Scale className="w-5 h-5 text-stone-400" />
        </div>
        <div className="flex-1">
          <label htmlFor="weight" className="text-xs font-medium text-stone-500 block mb-1">
            Weight (lbs)
          </label>
          <Input
            id="weight"
            type="number"
            placeholder="150"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            step="0.1"
            min="0"
            className="h-9"
            data-testid="weight-input"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="date" className="text-xs font-medium text-stone-500 block mb-1">
            Date
          </label>
          <Input
            id="date"
            type="date"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="h-9"
            data-testid="weight-date-input"
          />
        </div>
        <Button
          type="submit"
          disabled={!weight || parseFloat(weight) <= 0}
          className="w-full sm:w-auto"
          data-testid="add-weight-button">
          <Plus className="w-4 h-4 mr-1.5" />
          {createWeightMutation.isPending ? "Adding..." : "Log Weight"}
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-stone-100">
              <div className="text-center">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Lowest</p>
                <p className="text-xl font-bold text-success tabular-nums">{stats.min}</p>
                <p className="text-xs text-stone-400">lbs</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Average</p>
                <p className="text-xl font-bold text-stone-700 tabular-nums">{stats.avg.toFixed(1)}</p>
                <p className="text-xs text-stone-400">lbs</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Highest</p>
                <p className="text-xl font-bold text-error tabular-nums">{stats.max}</p>
                <p className="text-xs text-stone-400">lbs</p>
              </div>
            </div>
          )}
          <WeightChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {weightHistory.length === 0 ? (
            <p className="text-sm text-stone-500 px-6">No weight entries yet. Log your first weight above!</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {reversedHistory.map((entry, index) => {
                const changeInfo = getChangeFromPrevious(index, reversedHistory);
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-6">
                      <span className="text-lg sm:text-xl font-bold text-stone-900 tabular-nums">{entry.value}</span>
                      {changeInfo && changeInfo.direction !== "neutral" && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs font-medium ${
                            changeInfo.direction === "up" ? "text-error" : "text-success"
                          }`}>
                          {changeInfo.direction === "up" ? (
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          ) : (
                            <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          )}
                          {changeInfo.change.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm text-stone-400">
                        {new Date(entry.recordedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWeightMutation.mutate(entry.id)}
                        className="h-8 w-8 text-stone-300 hover:text-error">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

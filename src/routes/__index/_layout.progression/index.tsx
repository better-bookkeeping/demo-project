import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Calendar, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ProgressionChart } from "@/components/progression-chart";
import { movementsForProgressionQueryOptions, movementMetricsQueryOptions } from "./-queries/progression";
import { MetricType, DateRange } from "@/lib/progression.server";
import { cn, parseLocalDate } from "@/lib/utils";

export const Route = createFileRoute("/__index/_layout/progression/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(movementsForProgressionQueryOptions());
  },
  component: ProgressionPage,
});

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
  { value: "all", label: "All time" },
];

function ProgressionPage() {
  const { data: movements } = useSuspenseQuery(movementsForProgressionQueryOptions());
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [metricType, setMetricType] = useState<MetricType>("maxWeight");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data: metrics = [] } = useQuery(movementMetricsQueryOptions(selectedMovementId, metricType, dateRange));

  const stats = useMemo(() => {
    if (metrics.length === 0) return null;
    const values = metrics.map((m) => m.value);
    const latest = values[values.length - 1];
    const first = values[0];
    const change = latest - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    return {
      current: latest,
      best: Math.max(...values),
      total: metrics.length,
      change,
      changePercent,
      trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    };
  }, [metrics]);

  const selectedMovement = movements.find((m) => m.id === selectedMovementId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto md:pt-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Activity className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-heading font-black text-white uppercase italic tracking-wide">Progression</h1>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Exercise</label>
          <Select value={selectedMovementId} onValueChange={setSelectedMovementId}>
            <SelectTrigger data-testid="exercise-select" className="bg-steel-900/50 border-steel-700 h-12">
              <SelectValue placeholder="Select an exercise..." />
            </SelectTrigger>
            <SelectContent>
              {movements.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Metric</label>
          <Select value={metricType} onValueChange={(v) => setMetricType(v as MetricType)}>
            <SelectTrigger data-testid="metric-select" className="bg-steel-900/50 border-steel-700 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maxWeight">Max Weight</SelectItem>
              <SelectItem value="totalReps">Total Reps</SelectItem>
              <SelectItem value="totalVolume">Total Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Period</label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger data-testid="period-select" className="bg-steel-900/50 border-steel-700 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && selectedMovementId && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Current</p>
            <p className="text-xl font-heading font-bold text-white tabular-nums">
              {metricType === "totalReps" ? stats.current : stats.current.toFixed(1)}
            </p>
          </div>
          <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Best</p>
            <p className="text-xl font-heading font-bold text-success tabular-nums">
              {metricType === "totalReps" ? stats.best : stats.best.toFixed(1)}
            </p>
          </div>
          <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
            <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Progress</p>
            <div
              className={cn(
                "flex items-center justify-center gap-1",
                stats.trend === "up" && "text-success",
                stats.trend === "down" && "text-error",
                stats.trend === "neutral" && "text-steel-400",
              )}>
              {stats.trend === "up" && <ArrowUp className="w-4 h-4" />}
              {stats.trend === "down" && <ArrowDown className="w-4 h-4" />}
              {stats.trend === "neutral" && <Minus className="w-4 h-4" />}
              <span className="text-xl font-heading font-bold tabular-nums">{stats.changePercent.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Card */}
      <Card data-testid="progression-chart" className="bg-card border-steel-800">
        <CardHeader className="pb-2">
          <CardTitle data-testid="chart-title" className="text-sm text-steel-400">
            {selectedMovement ? selectedMovement.name : "Select an exercise"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressionChart data={metrics} metricType={metricType} />
        </CardContent>
      </Card>

      {/* History List */}
      {metrics.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-steel-400 uppercase tracking-wider">
              Data Points ({metrics.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-steel-700">
            {[...metrics].reverse().map((point) => (
              <div
                key={point.date}
                className="group flex items-center justify-between p-3 rounded-lg bg-card border border-transparent hover:border-steel-700 hover:bg-card-elevated transition-all">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-steel-600" />
                  <span className="text-xs font-bold text-steel-500">
                    {parseLocalDate(point.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span className="text-lg font-heading font-bold text-white tabular-nums">
                  {metricType === "totalReps" ? point.value : point.value.toFixed(1)}
                  <span className="text-xs text-steel-500 ml-1">{metricType === "totalReps" ? "reps" : "lbs"}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

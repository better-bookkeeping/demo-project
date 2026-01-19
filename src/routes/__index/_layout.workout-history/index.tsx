import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteWorkoutsServerFn } from "@/lib/workouts.server";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { workoutHistoryQueryOptions, weightUnitQueryOptions } from "./-queries/workout-history";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  calculateProgressionData,
  getUniqueMovements,
  getMetricLabel,
  type ProgressionMetric,
} from "./-utils/progression-data";

const PAGE_SIZE = 10;

export const Route = createFileRoute("/__index/_layout/workout-history/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(workoutHistoryQueryOptions(context.user.id)),
      context.queryClient.ensureQueryData(weightUnitQueryOptions(context.user.id)),
    ]);
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: workouts } = useSuspenseQuery(workoutHistoryQueryOptions(user.id));
  const { data: weightUnit } = useSuspenseQuery(weightUnitQueryOptions(user.id));
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [selectedMovement, setSelectedMovement] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<ProgressionMetric>("max_weight");
  const [selectedDays, setSelectedDays] = useState<number | null>(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Memoized computations to avoid recalculating on every render
  const chartMovements = useMemo(() => getUniqueMovements(workouts), [workouts]);

  const chartData = useMemo(
    () =>
      calculateProgressionData(
        workouts,
        selectedMovement === "all" ? null : selectedMovement,
        selectedMetric,
        selectedDays,
      ),
    [workouts, selectedMovement, selectedMetric, selectedDays],
  );

  const uniqueMovements = useMemo(
    () =>
      Array.from(
        new Map(workouts.flatMap((w) => w.sets.map((s) => [s.movement.id, s.movement.name]))).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [workouts],
  );

  // Pagination
  const totalPages = Math.ceil(workouts.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedWorkouts = workouts.slice(startIndex, startIndex + PAGE_SIZE);

  const deleteWorkoutsMutation = useMutation({
    mutationFn: (workoutIds: string[]) => deleteWorkoutsServerFn({ data: { workoutIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutHistoryQueryOptions(user.id).queryKey });
      setSelectedWorkouts(new Set());
      // Reset to page 1 if current page would be empty after deletion
      setCurrentPage(1);
    },
  });

  const toggleWorkout = (id: string) => {
    setSelectedWorkouts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allPageWorkoutsSelected = paginatedWorkouts.every((w) => selectedWorkouts.has(w.id));

  const toggleAll = () => {
    setSelectedWorkouts((prev) => {
      const next = new Set(prev);
      if (allPageWorkoutsSelected) {
        // Deselect all on current page
        paginatedWorkouts.forEach((w) => next.delete(w.id));
      } else {
        // Select all on current page
        paginatedWorkouts.forEach((w) => next.add(w.id));
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedWorkouts.size === 0) return;
    deleteWorkoutsMutation.mutate(Array.from(selectedWorkouts));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Workout History</h1>

      {workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Select
                data-testid="movement-select"
                value={selectedMovement}
                onChange={(e) => setSelectedMovement(e.target.value)}
                className="w-full sm:w-40"
              >
                <option value="all">All Movements</option>
                {chartMovements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Select
                data-testid="metric-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as ProgressionMetric)}
                className="w-full sm:w-36"
              >
                <option value="max_weight">Max Weight</option>
                <option value="total_reps">Total Reps</option>
                <option value="total_volume">Total Volume</option>
              </Select>
              <Select
                data-testid="days-select"
                value={selectedDays?.toString() ?? "all"}
                onChange={(e) => setSelectedDays(e.target.value === "all" ? null : parseInt(e.target.value, 10))}
                className="w-full sm:w-32"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </Select>
            </div>
            {chartData.length > 0 ? (
              <div data-testid="progression-chart" className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 250)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                      stroke="oklch(25% 0.01 250)"
                      tickLine={false}
                    />
                    <YAxis
                      domain={["dataMin - 5", "dataMax + 5"]}
                      tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                      stroke="oklch(25% 0.01 250)"
                      tickLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(16% 0.012 250)",
                        border: "1px solid oklch(25% 0.01 250)",
                        borderRadius: "8px",
                        color: "oklch(95% 0.01 80)",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "oklch(65% 0.01 250)" }}
                      formatter={(value) => [value, getMetricLabel(selectedMetric, weightUnit)]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="oklch(65% 0.18 25)"
                      strokeWidth={2}
                      dot={{ fill: "oklch(65% 0.18 25)", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: "oklch(65% 0.18 25)", stroke: "oklch(95% 0.01 80)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-6">No data for selected filters</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Completed Workouts</CardTitle>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedWorkouts.size === 0}
          >
            <Trash2 className="w-4 h-4" />
            {deleteWorkoutsMutation.isPending ? "Deleting..." : `Delete Selected (${selectedWorkouts.size})`}
          </Button>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No completed workouts yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-2 px-2 w-8">
                      <Checkbox
                        checked={allPageWorkoutsSelected && paginatedWorkouts.length > 0}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-text-muted">Date</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-text-muted">Sets</th>
                    {uniqueMovements.map(([id, name]) => (
                      <th key={id} className="text-right py-2 px-3 text-xs font-medium text-text-muted">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkouts.map((workout) => {
                    const setsByMovement = new Map<string, typeof workout.sets>();
                    workout.sets.forEach((set) => {
                      const existing = setsByMovement.get(set.movement.id) || [];
                      setsByMovement.set(set.movement.id, [...existing, set]);
                    });

                    const isSelected = selectedWorkouts.has(workout.id);
                    return (
                      <tr
                        key={workout.id}
                        className={`border-b border-border-subtle transition-colors ${isSelected ? "bg-primary-muted" : "hover:bg-surface-elevated"}`}
                      >
                        <td className="py-2.5 px-2">
                          <Checkbox
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => toggleWorkout(workout.id)}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-text-secondary text-xs">
                          {workout.completedAt
                            ? new Date(workout.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-text-primary">{workout.sets.length}</td>
                        {uniqueMovements.map(([movementId]) => {
                          const movementSets = setsByMovement.get(movementId);
                          if (!movementSets || movementSets.length === 0) {
                            return (
                              <td key={movementId} className="py-2.5 px-3 text-right text-text-muted">
                                -
                              </td>
                            );
                          }
                          const maxWeight = Math.max(...movementSets.map((s) => s.weight));
                          const avgReps = Math.round(
                            movementSets.reduce((sum, s) => sum + s.reps, 0) / movementSets.length,
                          );
                          const numSets = movementSets.length;
                          return (
                            <td key={movementId} className="py-2.5 px-3 text-right text-xs">
                              <span className="text-primary font-mono">{maxWeight}</span>
                              <span className="text-text-secondary ml-0.5">{weightUnit}</span>
                              <span className="text-text-muted mx-1">·</span>
                              <span className="font-mono text-text-primary">{avgReps}</span>
                              <span className="text-text-secondary ml-0.5">reps</span>
                              <span className="text-text-muted mx-1">·</span>
                              <span className="font-mono text-text-primary">{numSets}</span>
                              <span className="text-text-secondary ml-0.5">sets</span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {workouts.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-4">
              <p className="text-xs text-text-muted">
                Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, workouts.length)} of {workouts.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <span className="text-xs text-text-secondary px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

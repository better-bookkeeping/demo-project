import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { deleteWorkoutsServerFn } from "@/lib/workouts.server";
import { Trash2 } from "lucide-react";
import { workoutHistoryQueryOptions } from "./-queries/workout-history";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChartRangeFilter, type TimeRange } from "@/components/chart-range-filter";

type Metric = "max-weight" | "total-reps" | "total-volume";

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "max-weight", label: "Max Weight" },
  { value: "total-reps", label: "Total Reps" },
  { value: "total-volume", label: "Total Volume" },
];

export const Route = createFileRoute("/__index/_layout/workout-history/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workoutHistoryQueryOptions());
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<TimeRange>("All");
  const { data: workouts = [] } = useQuery(workoutHistoryQueryOptions(range));
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [selectedMovement, setSelectedMovement] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("max-weight");

  const deleteWorkoutsMutation = useMutation({
    mutationFn: (workoutIds: string[]) => deleteWorkoutsServerFn({ data: { workoutIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-history"] });
      setSelectedWorkouts(new Set());
    },
  });

  // Get all unique movements across all workouts
  const uniqueMovements = Array.from(
    new Map(workouts.flatMap((w) => w.sets.map((s) => [s.movement.id, s.movement.name]))).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  // Compute chart data from workouts containing the selected movement
  const progressionData = useMemo(() => {
    if (!selectedMovement) return [];
    return workouts
      .filter((w) => w.completedAt && w.sets.some((s) => s.movement.id === selectedMovement))
      .map((w) => {
        const movementSets = w.sets.filter((s) => s.movement.id === selectedMovement);
        let value = 0;
        switch (selectedMetric) {
          case "max-weight":
            value = Math.max(...movementSets.map((s) => s.weight));
            break;
          case "total-reps":
            value = movementSets.reduce((sum, s) => sum + s.reps, 0);
            break;
          case "total-volume":
            value = movementSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
            break;
        }
        return { completedAt: w.completedAt!, value };
      })
      .reverse(); // chronological order
  }, [workouts, selectedMovement, selectedMetric]);

  const chartData = useMemo(
    () =>
      progressionData.map((entry) => ({
        timestamp: new Date(entry.completedAt).getTime(),
        value: entry.value,
      })),
    [progressionData],
  );

  const metricLabel = METRIC_OPTIONS.find((m) => m.value === selectedMetric)?.label ?? "";
  const metricUnit = selectedMetric === "max-weight" ? " lbs" : selectedMetric === "total-volume" ? " lbs" : "";

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

  const toggleAll = () => {
    if (selectedWorkouts.size === workouts.length) {
      setSelectedWorkouts(new Set());
    } else {
      setSelectedWorkouts(new Set(workouts.map((w) => w.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedWorkouts.size === 0) return;
    deleteWorkoutsMutation.mutate(Array.from(selectedWorkouts));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Workout History</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Progression</CardTitle>
          <ChartRangeFilter value={range} onChange={setRange} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select
              value={selectedMovement}
              onChange={(e) => setSelectedMovement(e.target.value)}
            >
              <option value="">Select movement</option>
              {uniqueMovements.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as Metric)}
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          {!selectedMovement ? (
            <p className="text-sm text-slate-500">Select a movement to view progression.</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-slate-500">No data for this movement in the selected range.</p>
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
                <YAxis fontSize={12} tickLine={false} stroke="#94a3b8" domain={["auto", "auto"]} unit={metricUnit} />
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
                  formatter={(value: number) => [`${value}${metricUnit}`, metricLabel]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Completed Workouts</CardTitle>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={selectedWorkouts.size === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteWorkoutsMutation.isPending ? "Deleting..." : `Delete Selected (${selectedWorkouts.size})`}
          </Button>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-sm text-slate-500">No completed workouts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="py-3 px-4">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={selectedWorkouts.size === workouts.length}
                        onChange={toggleAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th scope="col" className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th scope="col" className="text-right py-3 px-4 font-medium text-slate-600">Sets</th>
                    {uniqueMovements.map(([id, name]) => (
                      <th scope="col" key={id} className="text-right py-3 px-4 font-medium text-slate-600">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((workout) => {
                    const setsByMovement = new Map<string, typeof workout.sets>();
                    workout.sets.forEach((set) => {
                      const existing = setsByMovement.get(set.movement.id) || [];
                      setsByMovement.set(set.movement.id, [...existing, set]);
                    });

                    const isSelected = selectedWorkouts.has(workout.id);
                    return (
                      <tr
                        key={workout.id}
                        className={`border-b border-slate-100 ${isSelected ? "bg-primary/10" : "hover:bg-slate-50"}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            aria-label={`Select workout from ${workout.completedAt ? new Date(workout.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "unknown date"}`}
                            checked={selectedWorkouts.has(workout.id)}
                            onChange={() => toggleWorkout(workout.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {workout.completedAt
                            ? new Date(workout.completedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">{workout.sets.length}</td>
                        {uniqueMovements.map(([movementId]) => {
                          const movementSets = setsByMovement.get(movementId);
                          if (!movementSets || movementSets.length === 0) {
                            return (
                              <td key={movementId} className="py-3 px-4 text-right text-slate-300">
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
                            <td key={movementId} className="py-3 px-4 text-right text-slate-600">
                              {maxWeight} lbs / {avgReps} reps / {numSets} sets
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
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Weight Tracking</h1>

      {latestWeight && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">Latest Weight</p>
            <p className="text-3xl font-bold text-slate-900">{latestWeight.value} lbs</p>
            <p className="text-xs text-slate-400 mt-1">
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

      <Card>
        <CardHeader>
          <CardTitle>Log Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="weight" className="text-sm font-medium text-slate-700 block mb-1">
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
                data-testid="weight-input"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="date" className="text-sm font-medium text-slate-700 block mb-1">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                data-testid="weight-date-input"
              />
            </div>
            <Button type="submit" disabled={!weight || parseFloat(weight) <= 0} data-testid="add-weight-button">
              <Plus className="w-4 h-4 mr-2" />
              {createWeightMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight History Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {weightHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No weight entries yet. Log your first weight above!</p>
          ) : (
            <ul className="space-y-2">
              {weightHistory
                .slice()
                .reverse()
                .map((entry) => (
                  <li
                    key={entry.id}
                    className="px-3 py-2 bg-slate-50 rounded-lg text-sm flex items-center justify-between">
                    <div>
                      <span className="font-medium text-slate-700">{entry.value} lbs</span>
                      <span className="text-slate-500 ml-2">
                        {new Date(entry.recordedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWeightMutation.mutate(entry.id)}
                      className="h-8 w-8 text-slate-400">
                      <X className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

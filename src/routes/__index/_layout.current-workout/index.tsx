import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createWorkoutServerFn,
  completeWorkoutServerFn,
  addSetServerFn,
  deleteSetServerFn,
} from "@/lib/workouts.server";
import { Play, Check, Plus, X, Dumbbell } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { currentWorkoutQueryOptions, movementsQueryOptions } from "./-queries/current-workout";

export const Route = createFileRoute("/__index/_layout/current-workout/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(currentWorkoutQueryOptions()),
      context.queryClient.ensureQueryData(movementsQueryOptions()),
    ]);
  },
  component: CurrentWorkoutPage,
});

type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;
  movement: { id: string; name: string };
};

function groupSetsByMovement(sets: WorkoutSet[]): Map<string, { name: string; sets: WorkoutSet[] }> {
  const grouped = new Map<string, { name: string; sets: WorkoutSet[] }>();
  for (const set of sets) {
    const existing = grouped.get(set.movement.id);
    if (existing) {
      existing.sets.push(set);
    } else {
      grouped.set(set.movement.id, { name: set.movement.name, sets: [set] });
    }
  }
  return grouped;
}

function calculateTotalVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
}

function CurrentWorkoutPage() {
  const queryClient = useQueryClient();
  const { data: workout } = useSuspenseQuery(currentWorkoutQueryOptions());
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const [selectedMovement, setSelectedMovement] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  const createWorkoutMutation = useMutation({
    mutationFn: () => createWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: () => completeWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: (data: { movementId: string; reps: number; weight: number }) => addSetServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      setReps("");
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSetServerFn({ data: { setId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
    },
  });

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement || !reps || !weight) return;
    addSetMutation.mutate({
      movementId: selectedMovement,
      reps: parseInt(reps),
      weight: parseInt(weight),
    });
  };

  if (!workout) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-stone-900">Current Workout</h1>
        <Card variant="elevated" className="text-center">
          <CardContent className="py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-6">No active workout. Ready to start?</p>
            <Button onClick={() => createWorkoutMutation.mutate()} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {createWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedSets = groupSetsByMovement(workout.sets);
  const totalSets = workout.sets.length;
  const totalVolume = calculateTotalVolume(workout.sets);
  const uniqueMovements = groupedSets.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-900">Current Workout</h1>
        <Button variant="outline" onClick={() => completeWorkoutMutation.mutate()} className="w-full sm:w-auto">
          <Check className="w-4 h-4 mr-2" />
          {completeWorkoutMutation.isPending ? "Completing..." : "Complete Workout"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="stat">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Total Sets</p>
            <p className="text-stat">{totalSets}</p>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Volume</p>
            <p className="text-stat tabular-nums">
              {totalVolume.toLocaleString()}
              <span className="text-lg text-stone-400 ml-1">lbs</span>
            </p>
          </CardContent>
        </Card>
        <Card variant="stat">
          <CardContent className="py-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Movements</p>
            <p className="text-stat">{uniqueMovements}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Set</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSet} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-stone-600 block mb-1.5">Movement</label>
              <Select value={selectedMovement} onChange={(e) => setSelectedMovement(e.target.value)}>
                <option value="">Select movement</option>
                {movements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:contents">
              <div className="sm:w-28">
                <label className="text-sm font-medium text-stone-600 block mb-1.5">Weight (lbs)</label>
                <Input
                  type="number"
                  placeholder="135"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min={0}
                />
              </div>
              <div className="sm:w-24">
                <label className="text-sm font-medium text-stone-600 block mb-1.5">Reps</label>
                <Input type="number" placeholder="10" value={reps} onChange={(e) => setReps(e.target.value)} min={1} />
              </div>
            </div>
            <Button type="submit" disabled={!selectedMovement || !reps || !weight} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" />
              {addSetMutation.isPending ? "Adding..." : "Add Set"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {workout.sets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-stone-500">No sets yet. Add exercises to your workout!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedSets.entries()).map(([movementId, { name, sets }]) => (
            <Card key={movementId}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{name}</span>
                  <span className="text-sm font-normal text-stone-500">{sets.length} sets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sets.map((set, index) => (
                    <li
                      key={set.id}
                      className="px-4 py-2.5 bg-stone-50 rounded-lg text-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-stone-900 tabular-nums">{set.weight} lbs</span>
                        <span className="text-stone-500">×</span>
                        <span className="font-medium text-stone-700 tabular-nums">{set.reps} reps</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSetMutation.mutate(set.id)}
                        className="h-7 w-7 text-stone-400 hover:text-error">
                        <X className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

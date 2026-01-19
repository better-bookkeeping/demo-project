import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Play, Check, Plus, X, AlertCircle, Dumbbell } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { currentWorkoutQueryOptions, movementsQueryOptions, latestWeightQueryOptions, weightUnitQueryOptions } from "./-queries/current-workout";

export const Route = createFileRoute("/__index/_layout/current-workout/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(currentWorkoutQueryOptions(context.user.id)),
      context.queryClient.ensureQueryData(movementsQueryOptions(context.user.id)),
      context.queryClient.ensureQueryData(latestWeightQueryOptions(context.user.id)),
      context.queryClient.ensureQueryData(weightUnitQueryOptions(context.user.id)),
    ]);
  },
  component: CurrentWorkoutPage,
});

function CurrentWorkoutPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: workout } = useSuspenseQuery(currentWorkoutQueryOptions(user.id));
  const { data: movements } = useSuspenseQuery(movementsQueryOptions(user.id));
  const { data: latestWeight } = useSuspenseQuery(latestWeightQueryOptions(user.id));
  const { data: weightUnit } = useSuspenseQuery(weightUnitQueryOptions(user.id));
  const [selectedMovement, setSelectedMovement] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);

  const selectedMovementData = movements.find((m) => m.id === selectedMovement);
  const isBodyWeightMovement = selectedMovementData?.isBodyWeight ?? false;

  const handleMovementChange = (movementId: string) => {
    setSelectedMovement(movementId);
    const movement = movements.find((m) => m.id === movementId);
    if (movement?.isBodyWeight) {
      if (latestWeight) {
        setWeight(String(Math.round(latestWeight.weight)));
        setShowWeightPrompt(false);
      } else {
        setWeight("");
        setShowWeightPrompt(true);
      }
    } else {
      setWeight("");
      setShowWeightPrompt(false);
    }
  };

  const createWorkoutMutation = useMutation({
    mutationFn: () => createWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions(user.id).queryKey });
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: () => completeWorkoutServerFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions(user.id).queryKey });
    },
  });

  const addSetMutation = useMutation({
    mutationFn: (data: { movementId: string; reps: number; weight: number }) =>
      addSetServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions(user.id).queryKey });
      setReps("");
      // Reset weight based on movement type
      if (isBodyWeightMovement && latestWeight) {
        setWeight(String(Math.round(latestWeight.weight)));
      } else {
        setWeight("");
      }
    },
  });

  const deleteSetMutation = useMutation({
    mutationFn: (setId: string) => deleteSetServerFn({ data: { setId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions(user.id).queryKey });
    },
  });

  const handleAddSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement || !reps || !weight) return;
    addSetMutation.mutate({
      movementId: selectedMovement,
      reps: parseInt(reps),
      weight: parseFloat(weight),
    });
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!workout) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">Current Workout</h1>
          <p className="text-sm text-text-muted mt-1">{formattedDate}</p>
        </div>

        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-muted flex items-center justify-center mb-5">
              <Dumbbell className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Ready to Train?
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">
              No active workout. Start your session and track every set, rep, and pound.
            </p>
            <Button onClick={() => createWorkoutMutation.mutate()} size="athletic">
              <Play className="w-4 h-4" />
              {createWorkoutMutation.isPending ? "Starting..." : "Start Workout"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Current Workout</h1>
          <p className="text-sm text-text-muted mt-0.5">{formattedDate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => completeWorkoutMutation.mutate()}
          disabled={workout.sets.length === 0}
          title={workout.sets.length === 0 ? "Add at least one set to complete workout" : undefined}
        >
          <Check className="w-4 h-4" />
          {completeWorkoutMutation.isPending ? "Completing..." : "Complete Workout"}
        </Button>
      </div>

      {/* Add Set Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Set</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSet} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px] gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Movement</label>
                <Select value={selectedMovement} onChange={(e) => handleMovementChange(e.target.value)}>
                  <option value="">Select movement</option>
                  {movements.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">Weight ({weightUnit})</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">Reps</label>
                <Input
                  type="number"
                  placeholder="Reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  min={1}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!selectedMovement || !reps || !weight} size="sm">
                <Plus className="w-4 h-4" />
                {addSetMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>

            {showWeightPrompt && isBodyWeightMovement && (
              <div className="flex items-start gap-2.5 p-3 bg-warning/10 border border-warning/20 rounded-lg text-sm text-warning">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Record your weight to auto-fill body-weight exercises.{" "}
                  <Link to="/weight" className="underline font-medium hover:no-underline">
                    Record weight
                  </Link>
                </span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Sets List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sets
            {workout.sets.length > 0 && (
              <span className="ml-1.5 text-text-muted font-normal">({workout.sets.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workout.sets.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-6">
              No sets yet. Add exercises to your workout!
            </p>
          ) : (
            <ul className="space-y-2">
              {workout.sets.map((set, index) => (
                <li
                  key={set.id}
                  className="flex items-center gap-3 p-3 bg-surface-elevated rounded-lg border border-border-subtle hover:border-border transition-colors"
                >
                  <div className="w-7 h-7 rounded-md bg-primary-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary">{index + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{set.movement.name}</p>
                    <p className="text-xs text-text-secondary">
                      <span className="font-mono">{set.weight}</span> {weightUnit} · <span className="font-mono">{set.reps}</span> reps
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSetMutation.mutate(set.id)}
                    disabled={deleteSetMutation.isPending}
                    className="h-7 w-7 text-text-muted hover:text-destructive flex-shrink-0"
                  >
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

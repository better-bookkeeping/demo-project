import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createWorkoutServerFn,
  getCurrentWorkoutServerFn,
  completeWorkoutServerFn,
  addSetServerFn,
  deleteSetServerFn,
} from "@/lib/workouts.server";
import { getMovementsServerFn } from "@/lib/movements.server";
import { Play, Check, Plus, X } from "lucide-react";

export const Route = createFileRoute("/__index/_layout/current-workout/")({
  loader: async () => {
    const [workout, movements] = await Promise.all([getCurrentWorkoutServerFn(), getMovementsServerFn()]);
    return { workout, movements };
  },
  component: CurrentWorkoutPage,
});

function CurrentWorkoutPage() {
  const { workout: initialWorkout, movements } = Route.useLoaderData();
  const [workout, setWorkout] = useState(initialWorkout);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [isAddingSet, setIsAddingSet] = useState(false);

  const handleStartWorkout = async () => {
    setIsLoading(true);
    try {
      const result = await createWorkoutServerFn();
      if (result.success) {
        setWorkout({ ...result.workout, sets: [] });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteWorkout = async () => {
    setIsLoading(true);
    try {
      const result = await completeWorkoutServerFn();
      if (result.success) {
        setWorkout(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovement || !reps || !weight) return;
    setIsAddingSet(true);
    try {
      const result = await addSetServerFn({
        data: { movementId: selectedMovement, reps: parseInt(reps), weight: parseInt(weight) },
      });
      if (result.success && result.set && workout) {
        setWorkout({ ...workout, sets: [...workout.sets, result.set] });
        setReps("");
      }
    } finally {
      setIsAddingSet(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!workout) return;
    const result = await deleteSetServerFn({ data: { setId } });
    if (result.success) {
      setWorkout({ ...workout, sets: workout.sets.filter((s) => s.id !== setId) });
    }
  };

  if (!workout) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">No active workout. Ready to start?</p>
            <Button onClick={handleStartWorkout} disabled={isLoading} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? "Starting..." : "Start Workout"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Current Workout</h1>
        <Button variant="outline" onClick={handleCompleteWorkout} disabled={isLoading}>
          <Check className="w-4 h-4 mr-2" />
          {isLoading ? "Completing..." : "Complete Workout"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddSet} className="flex gap-2 items-center">
            <Select value={selectedMovement} onChange={(e) => setSelectedMovement(e.target.value)}>
              <option value="">Select movement</option>
              {movements.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              placeholder="Weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-24"
              min={0}
            />
            <Input
              type="number"
              placeholder="Reps"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-24"
              min={1}
            />
            <Button type="submit" disabled={isAddingSet || !selectedMovement || !reps || !weight} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {isAddingSet ? "Adding..." : "Add"}
            </Button>
          </form>
          {workout.sets.length === 0 ? (
            <p className="text-sm text-slate-500">No sets yet. Add exercises to your workout!</p>
          ) : (
            <ul className="space-y-2">
              {workout.sets.map((set) => (
                <li key={set.id} className="px-3 py-2 bg-slate-50 rounded-lg text-sm flex items-center justify-between">
                  <div>
                    <span className="font-medium">{set.movement.name}</span>
                    <span className="text-slate-500 ml-2">
                      {set.reps} reps × {set.weight} lbs
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSet(set.id)}
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

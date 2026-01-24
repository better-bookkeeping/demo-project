import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { deleteWorkoutsServerFn } from "@/lib/workouts.server";
import { Trash2, History, Calendar, Edit2, X, Check, Dumbbell } from "lucide-react";
import { workoutHistoryQueryOptions } from "./-queries/workout-history";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/__index/_layout/workout-history/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workoutHistoryQueryOptions());
  },
  component: WorkoutHistoryPage,
});

function WorkoutHistoryPage() {
  const queryClient = useQueryClient();
  const { data: workouts } = useSuspenseQuery(workoutHistoryQueryOptions());
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);

  const deleteWorkoutsMutation = useMutation({
    mutationFn: (workoutIds: string[]) => deleteWorkoutsServerFn({ data: { workoutIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutHistoryQueryOptions().queryKey });
      setSelectedWorkouts(new Set());
      setIsEditMode(false);
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

  const handleDeleteSelected = () => {
    if (selectedWorkouts.size === 0) return;
    deleteWorkoutsMutation.mutate(Array.from(selectedWorkouts));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between sticky top-0 z-20 bg-page-bg/80 backdrop-blur-md py-4 -my-4 px-2">
        <h1 className="text-3xl font-heading font-black text-white tracking-wide uppercase italic">
          Logbook
        </h1>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditMode(false);
                  setSelectedWorkouts(new Set());
                }}
                className="h-9 w-9 p-0 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedWorkouts.size === 0}
                className="h-9 px-4 rounded-full font-bold"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {selectedWorkouts.size}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditMode(true)}
              disabled={workouts.length === 0}
              className="h-9 px-4 rounded-full border-steel-700 hover:bg-steel-800"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
          <div className="w-20 h-20 rounded-full bg-steel-800/50 flex items-center justify-center mb-6 border-2 border-dashed border-steel-700">
            <History className="w-10 h-10 text-steel-500" />
          </div>
          <p className="text-xl font-heading font-bold text-steel-400 uppercase tracking-wide">
            No history recorded
          </p>
          <p className="text-sm text-steel-500 mt-2">
            Complete a workout to see it here
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-steel-800 ml-4 md:ml-6 space-y-8 py-4">
          {workouts.map((workout) => {
            const date = new Date(workout.completedAt || new Date());
            const isSelected = selectedWorkouts.has(workout.id);

            const setsByMovement = new Map<string, typeof workout.sets>();
            workout.sets.forEach((set) => {
              const existing = setsByMovement.get(set.movement.name) || [];
              setsByMovement.set(set.movement.name, [...existing, set]);
            });

            return (
              <div
                key={workout.id}
                className={cn(
                  "relative pl-6 md:pl-8 transition-all duration-300",
                  isEditMode && "cursor-pointer"
                )}
                onClick={() => isEditMode && toggleWorkout(workout.id)}
              >
                {/* Timeline Node */}
                <div className={cn(
                  "absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 transition-colors duration-300 z-10",
                  isSelected
                    ? "bg-primary border-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                    : "bg-page-bg border-steel-600 group-hover:border-primary"
                )} />

                <Card
                  className={cn(
                    "group overflow-hidden transition-all duration-300 border-l-4",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-l-steel-700 hover:border-l-primary hover:bg-card-elevated"
                  )}
                >
                  <CardHeader className="pb-3 border-b border-white/5 bg-black/20">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {date.toLocaleDateString("en-US", { weekday: 'long' })}
                        </span>
                        <CardTitle className="text-2xl">
                          {date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                        </CardTitle>
                      </div>

                      <div className={cn("text-right", isEditMode && "mr-8")}>
                        <div className="text-xs font-medium text-steel-500 uppercase tracking-wider mb-0.5">
                          Volume
                        </div>
                        <div className="text-xl font-bold font-heading tabular-nums text-white">
                          {(workout.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0) / 1000).toFixed(1)}k
                          <span className="text-xs text-steel-600 ml-1">lbs</span>
                        </div>
                      </div>

                      {isEditMode && (
                        <div className={cn(
                          "absolute top-6 right-4 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "border-steel-600 text-transparent"
                        )}>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      {Array.from(setsByMovement.entries()).map(([name, sets]) => {
                        const maxWeight = Math.max(...sets.map(s => s.weight));
                        const totalReps = sets.reduce((acc, s) => acc + s.reps, 0);

                        return (
                          <div key={name} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-1 h-8 bg-steel-800 rounded-full group-hover/item:bg-primary transition-colors" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm text-steel-200 truncate pr-2">{name}</span>
                                <span className="text-xs text-steel-500 font-medium">{sets.length} sets</span>
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <span className="text-sm font-bold text-white tabular-nums">{maxWeight}</span>
                              <span className="text-xs text-steel-600 ml-0.5">lbs</span>
                              <span className="text-steel-700 mx-1.5">/</span>
                              <span className="text-sm font-medium text-steel-400 tabular-nums">{totalReps}</span>
                              <span className="text-xs text-steel-600 ml-0.5">reps</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

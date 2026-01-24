import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  createWorkoutServerFn,
  completeWorkoutServerFn,
  addSetServerFn,
  deleteSetServerFn,
  getWorkoutHistoryServerFn,
} from "@/lib/workouts.server";
import { Play, Check, Plus, X, Dumbbell, Trophy, Zap, Activity, Weight, AlertTriangle } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { currentWorkoutQueryOptions, movementsQueryOptions } from "./-queries/current-workout";
import { usePersonalRecords, checkForPR, isBetterSet } from "@/hooks/use-personal-records";
import { cn } from "@/lib/utils";
import { getLatestWeightServerFn } from "@/lib/weights.server";

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
  const { data: workoutHistory } = useQuery({
    queryKey: ["workout-history"],
    queryFn: () => getWorkoutHistoryServerFn(),
  });
  const [selectedMovement, setSelectedMovement] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [celebratingSetId, setCelebratingSetId] = useState<string | null>(null);
  const [showPRBanner, setShowPRBanner] = useState(false);
  const [showFinishAlert, setShowFinishAlert] = useState(false);

  const historicalSets = workoutHistory?.flatMap((w) => w.sets) || [];
  const personalRecords = usePersonalRecords(historicalSets);

  useEffect(() => {
    if (celebratingSetId) {
      const timer = setTimeout(() => {
        setCelebratingSetId(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [celebratingSetId]);

  useEffect(() => {
    if (showPRBanner) {
      const timer = setTimeout(() => {
        setShowPRBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPRBanner]);

  const handleMovementChange = async (movementId: string) => {
    setSelectedMovement(movementId);

    if (!movementId) {
      setWeight("");
      return;
    }

    const movement = movements.find((m) => m.id === movementId);
    if (movement?.isBodyWeight) {
      try {
        const latestWeight = await getLatestWeightServerFn();
        if (latestWeight) {
          setWeight(latestWeight.value.toString());
        }
      } catch {
        // Silently fail - user can still enter weight manually
      }
    } else {
      setWeight("");
    }
  };

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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: currentWorkoutQueryOptions().queryKey });
      setReps("");

      if (result.success && result.set && workout) {
        const prCheck = checkForPR(
          { weight: result.set.weight, reps: result.set.reps, movementId: result.set.movementId },
          personalRecords,
        );

        const previousSets = workout.sets.filter((s) => s.movement.id === result.set!.movementId);
        const isSessionBest = previousSets.every((s) =>
          isBetterSet({ weight: result.set!.weight, reps: result.set!.reps }, { weight: s.weight, reps: s.reps }),
        );

        if (prCheck.isPR && isSessionBest) {
          setCelebratingSetId(result.set.id);
          setShowPRBanner(true);
        }
      }
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
      weight: parseFloat(weight),
    });
  };

  const handleFinish = () => {
    if (!workout) return;
    if (workout.sets.length === 0) {
      setShowFinishAlert(true);
    } else {
      completeWorkoutMutation.mutate();
    }
  };

  const confirmFinish = () => {
    completeWorkoutMutation.mutate();
    setShowFinishAlert(false);
  };

  if (!workout) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 rounded-full border-4 border-steel-800 bg-black/50 flex items-center justify-center shadow-2xl">
            <Dumbbell className="w-16 h-16 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-heading font-black text-white uppercase tracking-wider italic">
            Ready to Lift?
          </h1>
          <p className="text-steel-400 font-medium">Focus. Intensity. Execution.</p>
        </div>

        <Button
          onClick={() => createWorkoutMutation.mutate()}
          size="lg"
          className="h-16 px-12 text-xl skew-x-[-10deg] shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all">
          <div className="skew-x-[10deg] flex items-center">
            <Play className="w-6 h-6 mr-3 fill-current" />
            {createWorkoutMutation.isPending ? "Initializing..." : "Start Session"}
          </div>
        </Button>
      </div>
    );
  }

  const groupedSets = groupSetsByMovement(workout.sets);
  const totalSets = workout.sets.length;
  const totalVolume = calculateTotalVolume(workout.sets);
  const uniqueMovements = groupedSets.size;

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto pb-20 md:pt-8">
      {showPRBanner && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-gradient-to-l from-primary to-orange-600 pl-6 pr-8 py-4 rounded-l-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center gap-4 text-white border-y border-l border-white/20">
            <div className="bg-white/20 p-2 rounded-full">
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <p className="font-heading font-black text-xl uppercase italic">New PR!</p>
              <p className="text-xs font-bold opacity-90">Keep crushing it</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Session
            </div>
            <h1 className="text-3xl font-heading font-black text-white italic tracking-wide uppercase">
              Current Workout
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleFinish}
            className="h-12 w-full sm:w-auto border-primary/50 text-primary hover:bg-primary hover:text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <Check className="w-5 h-5 mr-2" />
            {completeWorkoutMutation.isPending ? "Finishing..." : "Finish Workout"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-black/40 border border-steel-800 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-5 h-5 text-steel-500 mb-2 group-hover:text-primary transition-colors" />
            <p className="text-2xl sm:text-4xl font-heading font-bold text-white tabular-nums">{totalSets}</p>
            <p className="text-[10px] sm:text-xs font-bold text-steel-500 uppercase tracking-wider">Total Sets</p>
          </div>

          <div className="bg-black/40 border border-steel-800 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Weight className="w-5 h-5 text-steel-500 mb-2 group-hover:text-primary transition-colors" />
            <p className="text-2xl sm:text-4xl font-heading font-bold text-white tabular-nums">
              {(totalVolume / 1000).toFixed(1)}
              <span className="text-base sm:text-lg text-steel-600">k</span>
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-steel-500 uppercase tracking-wider">Volume (lbs)</p>
          </div>

          <div className="bg-black/40 border border-steel-800 rounded-lg p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Zap className="w-5 h-5 text-steel-500 mb-2 group-hover:text-primary transition-colors" />
            <p className="text-2xl sm:text-4xl font-heading font-bold text-white tabular-nums">{uniqueMovements}</p>
            <p className="text-[10px] sm:text-xs font-bold text-steel-500 uppercase tracking-wider">Movements</p>
          </div>
        </div>
      </div>

      <Card className="border-steel-700 bg-card-elevated shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-2 bg-black/20 border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Log Set
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleAddSet} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-steel-400 uppercase tracking-wider ml-1">Movement</label>
              <Select value={selectedMovement} onValueChange={handleMovementChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select movement..." />
                </SelectTrigger>
                <SelectContent>
                  {movements.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        {m.name}

                        {m.isBodyWeight && <span className="text-[10px] text-primary">(BW)</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-steel-400 uppercase tracking-wider ml-1">Weight (lbs)</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-14 text-2xl font-bold bg-black/30 border-steel-700 focus:border-primary pl-4"
                    placeholder="0"
                    min={0}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1"></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-steel-400 uppercase tracking-wider ml-1">Reps</label>
                <Input
                  type="number"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="h-14 text-2xl font-bold bg-black/30 border-steel-700 focus:border-primary pl-4"
                  placeholder="0"
                  min={1}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!selectedMovement || !reps || !weight}
              className="w-full h-12 text-lg shadow-lg shadow-primary/10">
              <Plus className="w-5 h-5 mr-2" />
              {addSetMutation.isPending ? "Logging..." : "Log Set"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {workout.sets.length > 0 &&
          Array.from(groupedSets.entries()).map(([movementId, { name, sets }]) => {
            const pr = personalRecords.get(movementId);

            const sessionBestSet = sets.reduce((best, current) => {
              return isBetterSet(current, best) ? current : best;
            }, sets[0]);

            const isNewRecord = !pr || isBetterSet(sessionBestSet, pr.bestSet);

            return (
              <div key={movementId} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-heading font-bold text-white uppercase italic tracking-wide flex items-center gap-3">
                    {name}
                    {isNewRecord && <Trophy className="w-5 h-5 text-primary animate-pulse" />}
                  </h3>
                  <span className="text-xs font-bold text-steel-500 bg-steel-900 px-3 py-1 rounded-full border border-steel-800">
                    {sets.length} SETS
                  </span>
                </div>

                <div className="space-y-1">
                  {sets.map((set, index) => {
                    const isPR = isNewRecord && set.id === sessionBestSet.id;
                    const isCelebrating = celebratingSetId === set.id;

                    return (
                      <div
                        key={set.id}
                        className={cn(
                          "relative overflow-hidden group transition-all duration-300",
                          "bg-card border-l-4 border-y border-r border-y-steel-800 border-r-steel-800",
                          isPR ? "border-l-primary" : "border-l-steel-600",
                          isCelebrating && "pr-celebration z-10 scale-[1.02]",
                          "hover:translate-x-1",
                        )}>
                        <div className="flex items-center p-3 sm:p-4">
                          <div className="w-8 h-8 flex items-center justify-center bg-steel-900 rounded font-mono text-sm text-steel-500 mr-4 font-bold border border-steel-800">
                            {index + 1}
                          </div>

                          <div className="flex-1 flex items-baseline gap-1">
                            <span className="text-2xl font-heading font-bold text-white tabular-nums">
                              {set.weight}
                            </span>
                            <span className="text-xs font-bold text-steel-500 uppercase mr-4">lbs</span>

                            <span className="text-steel-600 mx-2 text-lg">×</span>

                            <span className="text-2xl font-heading font-bold text-white tabular-nums">{set.reps}</span>
                            <span className="text-xs font-bold text-steel-500 uppercase">reps</span>
                          </div>

                          {isPR && (
                            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded border border-primary/20 mr-4">
                              <Trophy className="w-3 h-3 text-primary" />
                              <span className="text-[10px] font-bold text-primary uppercase">PR</span>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSetMutation.mutate(set.id)}
                            className="text-steel-600 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-l from-black/20 to-transparent" />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {showFinishAlert && (
        <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-steel-700 p-6 rounded-lg max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500">
              <div className="bg-amber-500/10 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Empty Workout</h3>
            </div>

            <p className="text-steel-400">
              You haven't logged any sets. This empty session will be discarded and not saved to history.
            </p>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowFinishAlert(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={confirmFinish} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white border-none">
                Finish Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

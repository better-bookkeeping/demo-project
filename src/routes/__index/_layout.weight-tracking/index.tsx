import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, TrendingUp, TrendingDown, Minus, Scale, Target } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightHistoryQueryOptions, latestWeightQueryOptions, weightGoalQueryOptions } from "./-queries/weights";
import { createWeightServerFn, deleteWeightServerFn, updateUserWeightGoalServerFn } from "@/lib/weights.server";
import { WeightChart } from "@/components/weight-chart";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/datetime-picker";

export const Route = createFileRoute("/__index/_layout/weight-tracking/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(weightHistoryQueryOptions()),
      context.queryClient.ensureQueryData(latestWeightQueryOptions()),
      context.queryClient.ensureQueryData(weightGoalQueryOptions()),
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

function calculateBMI(weightLbs: number | undefined, feet: number, inches: number): string {
  if (!weightLbs) return "---";

  const totalInches = feet * 12 + inches;
  const weightKg = weightLbs * 0.453592;
  const heightM = totalInches * 0.0254;

  const bmi = weightKg / (heightM * heightM);
  return bmi.toFixed(1);
}

function WeightTrackingPage() {
  const queryClient = useQueryClient();
  const { data: weightHistory } = useSuspenseQuery(weightHistoryQueryOptions());
  const { data: latestWeight } = useSuspenseQuery(latestWeightQueryOptions());
  const { data: weightGoal } = useSuspenseQuery(weightGoalQueryOptions());
  const [weight, setWeight] = useState("");
  const [recordedAt, setRecordedAt] = useState<Date | undefined>(new Date());
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalWeight, setGoalWeight] = useState("");
  const [goalType, setGoalType] = useState<"cutting" | "bulking" | "maintenance">("maintenance");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");

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

  const updateGoalMutation = useMutation({
    mutationFn: (data: {
      goalWeight?: number;
      goalType?: "cutting" | "bulking" | "maintenance";
      heightFeet?: number;
      heightInches?: number;
    }) => updateUserWeightGoalServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightGoalQueryOptions().queryKey });
      setEditingGoal(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || parseFloat(weight) <= 0) return;
    const now = new Date();
    const effectiveRecordedAt = recordedAt ? new Date(recordedAt) : now;

    // The picker is day-granularity; keep the selected day but give each log a unique timestamp
    // so "latest" ordering and trend calculations are deterministic.
    if (recordedAt) {
      effectiveRecordedAt.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    }
    createWeightMutation.mutate({
      value: parseFloat(weight),
      recordedAt: effectiveRecordedAt,
    });
  };

  const chartData = weightHistory
    .map((entry) => ({
      date: entry.recordedAt.toISOString(),
      weight: entry.value,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const trend = calculateTrend(weightHistory);
  const history = weightHistory;

  const stats = useMemo(() => {
    if (weightHistory.length === 0) return null;
    const weights = weightHistory.map((e) => e.value);
    return {
      min: Math.min(...weights),
      max: Math.max(...weights),
      avg: weights.reduce((a, b) => a + b, 0) / weights.length,
    };
  }, [weightHistory]);

  const getTrendColor = (direction: "up" | "down" | "neutral"): string => {
    if (!weightGoal?.goalType) {
      return direction === "up" ? "success" : direction === "down" ? "error" : "steel-400";
    }

    if (weightGoal.goalType === "cutting") {
      return direction === "down" ? "success" : direction === "up" ? "error" : "steel-400";
    } else if (weightGoal.goalType === "bulking") {
      return direction === "up" ? "success" : direction === "down" ? "error" : "steel-400";
    } else {
      if (!latestWeight || !weightGoal.goalWeight) return "steel-400";
      const diff = Math.abs(latestWeight.value - weightGoal.goalWeight);
      if (diff <= 3) return "success";
      return diff > 10 ? "error" : "warning";
    }
  };

  const trendColor = getTrendColor(trend?.direction ?? "neutral");

  return (
    <div className="space-y-6 max-w-4xl mx-auto pt-6 md:pt-8">
      <div className="flex items-center gap-3 mb-8">
        <Scale className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-heading font-black text-white uppercase italic tracking-wide">
          Weight Room
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Input "Digital Scale" & Quick Stats */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-card-elevated to-card border-none ring-1 ring-white/5 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                 <p className="text-xs font-bold text-steel-500 uppercase tracking-widest">Current Weight</p>
                 <div className="flex items-baseline justify-center gap-2">
                   {latestWeight ? (
                     <>
                        <span className="text-7xl font-heading font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                          {latestWeight.value}
                        </span>
                        <span className="text-2xl font-bold text-steel-500">lbs</span>
                     </>
                   ) : (
                     <span className="text-5xl font-heading font-bold text-steel-600">---</span>
                   )}
                 </div>
                 {trend && (
                   <div
                     data-testid="trend-indicator"
                     className={cn(
                       "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                       `bg-${trendColor}/10 text-${trendColor}`
                     )}
                   >
                      {trend.direction === "up" ? <TrendingUp className="w-3 h-3" /> :
                       trend.direction === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span>{trend.percentage.toFixed(1)}%</span>
                      <span className="opacity-70">from last</span>
                   </div>
                 )}
              </div>

              <form onSubmit={handleSubmit} className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Date</label>
                    <DateTimePicker value={recordedAt} onChange={setRecordedAt} granularity="day" className="font-bold" />
                  </div>
                  <div className="space-y-1 text-left">
                     <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">New Entry</label>
                     <Input
                        type="number"
                        placeholder="0.0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="bg-steel-900/50 border-steel-700 text-xl font-bold h-10 text-center focus:border-primary"
                        step="0.1"
                     />
                  </div>
                </div>
                <Button
                   type="submit"
                   className="w-full font-bold uppercase tracking-wider"
                   disabled={!weight || createWeightMutation.isPending}
                >
                  {createWeightMutation.isPending ? "Logging..." : "Log Weight"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {weightGoal?.goalType && !editingGoal && (
            <Card data-testid="goal-status-card" className="bg-gradient-to-br from-card-elevated to-card border-none ring-1 ring-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-steel-400">Goal Status</CardTitle>
                <Button
                  data-testid="edit-goal-button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingGoal(true);
                    setGoalWeight(weightGoal.goalWeight?.toString() ?? "");
                    setGoalType(weightGoal.goalType as "cutting" | "bulking" | "maintenance");
                    setHeightFeet(weightGoal.heightFeet?.toString() ?? "");
                    setHeightInches(weightGoal.heightInches?.toString() ?? "");
                  }}
                  className="h-7 text-xs text-steel-500 hover:text-white"
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-steel-500 uppercase">Goal Type</span>
                    </div>
                    <span className="text-sm font-bold text-white uppercase">
                      {weightGoal.goalType === "cutting" && (
                        <span className="text-error">Cutting</span>
                      )}
                      {weightGoal.goalType === "bulking" && (
                        <span className="text-success">Bulking</span>
                      )}
                      {weightGoal.goalType === "maintenance" && (
                        <span className="text-warning">Maintenance</span>
                      )}
                    </span>
                  </div>

                  {weightGoal.goalWeight && latestWeight && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-steel-500 uppercase">Progress</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {latestWeight.value} / {weightGoal.goalWeight} lbs
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {weightGoal.goalType === "cutting" && (
                            <>
                              {latestWeight.value > weightGoal.goalWeight ? (
                                <span className="text-xs text-error font-bold">
                                  {(latestWeight.value - weightGoal.goalWeight).toFixed(1)} lbs to lose
                                </span>
                              ) : latestWeight.value < weightGoal.goalWeight ? (
                                <span className="text-xs text-error font-bold">
                                  {(weightGoal.goalWeight - latestWeight.value).toFixed(1)} lbs under goal
                                </span>
                              ) : (
                                <span className="text-xs text-success font-bold">
                                  Goal achieved!
                                </span>
                              )}
                            </>
                          )}
                          {weightGoal.goalType === "bulking" && (
                            <>
                              {latestWeight.value < weightGoal.goalWeight ? (
                                <span className="text-xs text-success font-bold">
                                  {(weightGoal.goalWeight - latestWeight.value).toFixed(1)} lbs to gain
                                </span>
                              ) : latestWeight.value > weightGoal.goalWeight ? (
                                <span className="text-xs text-success font-bold">
                                  {(latestWeight.value - weightGoal.goalWeight).toFixed(1)} lbs over goal
                                </span>
                              ) : (
                                <span className="text-xs text-success font-bold">
                                  Goal achieved!
                                </span>
                              )}
                            </>
                          )}
                          {weightGoal.goalType === "maintenance" && (
                            <>
                              {Math.abs(latestWeight.value - weightGoal.goalWeight) <= 3 ? (
                                <span className="text-xs text-success font-bold">
                                  On target
                                </span>
                              ) : (
                                <span className="text-xs text-warning font-bold">
                                  {Math.abs(latestWeight.value - weightGoal.goalWeight).toFixed(1)} lbs from goal
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {weightGoal.heightFeet && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-steel-500 uppercase">Height</span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {weightGoal.heightFeet}'{weightGoal.heightInches ?? 0}"
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!weightGoal?.goalType && !editingGoal && (
            <Card className="bg-card/50 border-steel-800">
              <CardContent className="p-6 text-center">
                <p className="text-steel-400 mb-4">Set your weight goals to track progress</p>
                <Button data-testid="set-goals-button" onClick={() => setEditingGoal(true)} className="font-bold uppercase tracking-wider">
                  <Target className="w-4 h-4 mr-2" />
                  Set Goals
                </Button>
              </CardContent>
            </Card>
          )}

          {editingGoal && (
            <Card className="bg-gradient-to-br from-card-elevated to-card border-none ring-1 ring-white/5">
              <CardHeader>
                <CardTitle className="text-lg text-white">Set Weight Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateGoalMutation.mutate({
                      ...(goalWeight && { goalWeight: parseFloat(goalWeight) }),
                      goalType,
                      ...(heightFeet && { heightFeet: parseInt(heightFeet) }),
                      ...(heightInches !== undefined && { heightInches: parseInt(heightInches) || 0 }),
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Goal Type</label>
                    <Select value={goalType} onValueChange={(v) => setGoalType(v as typeof goalType)} data-testid="goal-type-select">
                      <SelectTrigger className="bg-steel-900/50 border-steel-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cutting">Cutting (Lose Weight)</SelectItem>
                        <SelectItem value="bulking">Bulking (Gain Weight)</SelectItem>
                        <SelectItem value="maintenance">Maintenance (Maintain Weight)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Goal Weight (lbs)</label>
                    <Input
                      data-testid="goal-weight-input"
                      type="number"
                      placeholder="150"
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(e.target.value)}
                      step="0.1"
                      className="bg-steel-900/50 border-steel-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Height</label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="height-feet-input"
                        type="number"
                        placeholder="5"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(e.target.value)}
                        min="3"
                        max="8"
                        className="bg-steel-900/50 border-steel-700"
                      />
                      <span className="text-steel-500 self-center">feet</span>
                      <Input
                        data-testid="height-inches-input"
                        type="number"
                        placeholder="9"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        min="0"
                        max="11"
                        className="bg-steel-900/50 border-steel-700"
                      />
                      <span className="text-steel-500 self-center">inches</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-testid="save-goals-button"
                      type="submit"
                      className="flex-1 font-bold uppercase tracking-wider"
                      disabled={updateGoalMutation.isPending}
                    >
                      {updateGoalMutation.isPending ? "Saving..." : "Save Goals"}
                    </Button>
                    <Button
                      data-testid="cancel-edit-button"
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingGoal(false)}
                      disabled={updateGoalMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
                 <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Lowest</p>
                 <p className="text-xl font-heading font-bold text-white tabular-nums">{stats.min}</p>
               </div>
               <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
                 <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Average</p>
                 <p className="text-xl font-heading font-bold text-white tabular-nums">{stats.avg.toFixed(1)}</p>
               </div>
               <div className="bg-card border border-steel-800 rounded-lg p-3 text-center">
                 <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">Highest</p>
                 <p className="text-xl font-heading font-bold text-success tabular-nums">{stats.max}</p>
               </div>
               {weightGoal?.heightFeet && (
                 <div data-testid="bmi-display" className="bg-card border border-steel-800 rounded-lg p-3 text-center">
                   <p className="text-[10px] font-bold text-steel-500 uppercase mb-1">BMI</p>
                   <p className="text-xl font-heading font-bold text-primary tabular-nums">
                     {calculateBMI(latestWeight?.value, weightGoal.heightFeet, weightGoal.heightInches ?? 0)}
                   </p>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Right Column: Chart & History */}
        <div className="space-y-6">
           <Card className="border-steel-800 bg-card/50">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm text-steel-400">Trend Analysis</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="h-[200px] w-full">
                 <WeightChart data={chartData} />
               </div>
             </CardContent>
           </Card>

           <div className="space-y-3">
             <h3 className="text-sm font-bold text-steel-400 uppercase tracking-wider px-2">History</h3>
             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-steel-700">
               {history.map((entry, index) => {
                  const changeInfo = getChangeFromPrevious(index, history);
                  const trendColor = changeInfo ? getTrendColor(changeInfo.direction) : "steel-400";
                  return (
                    <div key={entry.id} data-testid="weight-entry" data-entry-id={entry.id.toString()} className="group flex items-center justify-between p-3 rounded-lg bg-card border border-transparent hover:border-steel-700 hover:bg-card-elevated transition-all">
                       <div className="flex items-center gap-3">
                         {changeInfo && changeInfo.direction !== 'neutral' && (
                           <div className={cn(
                             "w-8 h-8 rounded-full flex items-center justify-center",
                             trendColor === "success" ? "bg-success/10" :
                             trendColor === "error" ? "bg-error/10" :
                             trendColor === "warning" ? "bg-warning/10" :
                             "bg-steel-800"
                           )}>
                             {changeInfo.direction === 'up' ? (
                               <TrendingUp className={cn(
                                 "w-4 h-4",
                                 trendColor === "success" ? "text-success" :
                                 trendColor === "error" ? "text-error" :
                                 trendColor === "warning" ? "text-warning" :
                                 "text-steel-400"
                               )} />
                             ) : (
                               <TrendingDown className={cn(
                                 "w-4 h-4",
                                 trendColor === "success" ? "text-success" :
                                 trendColor === "error" ? "text-error" :
                                 trendColor === "warning" ? "text-warning" :
                                 "text-steel-400"
                               )} />
                             )}
                           </div>
                         )}
                         {!changeInfo || changeInfo.direction === 'neutral' ? (
                           <div className="w-8 h-8 rounded-full flex items-center justify-center bg-steel-800">
                             <Minus className="w-4 h-4 text-steel-400" />
                           </div>
                         ) : null}
                         <span className="text-xs font-bold text-steel-500 w-12">
                           {new Date(entry.recordedAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                         </span>
                         <span className="text-lg font-heading font-bold text-white tabular-nums">
                           {entry.value}
                         </span>
                       </div>

                       <div className="flex items-center gap-4">
                          {changeInfo && changeInfo.direction !== 'neutral' && (
                            <span className={cn(
                              "text-xs font-bold flex items-center gap-1",
                              trendColor === "success" ? "text-success" :
                              trendColor === "error" ? "text-error" :
                              trendColor === "warning" ? "text-warning" :
                              "text-steel-400"
                            )}>
                              {changeInfo.direction === 'up' ? "+" : "-"}{changeInfo.change.toFixed(1)}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWeightMutation.mutate(entry.id)}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-steel-600 hover:text-error"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                       </div>
                    </div>
                  )
               })}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

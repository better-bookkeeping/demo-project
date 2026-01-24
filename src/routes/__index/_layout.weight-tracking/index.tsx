import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { weightHistoryQueryOptions, latestWeightQueryOptions } from "./-queries/weights";
import { createWeightServerFn, deleteWeightServerFn } from "@/lib/weights.server";
import { WeightChart } from "@/components/weight-chart";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/datetime-picker";

export const Route = createFileRoute("/__index/_layout/weight-tracking/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(weightHistoryQueryOptions()),
      context.queryClient.ensureQueryData(latestWeightQueryOptions()),
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

function WeightTrackingPage() {
  const queryClient = useQueryClient();
  const { data: weightHistory } = useSuspenseQuery(weightHistoryQueryOptions());
  const { data: latestWeight } = useSuspenseQuery(latestWeightQueryOptions());
  const [weight, setWeight] = useState("");
  const [recordedAt, setRecordedAt] = useState<Date | undefined>(new Date());

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
      recordedAt: recordedAt || new Date(),
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto md:pt-8">
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
                   <div className={cn(
                     "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                     trend.direction === "up" ? "bg-success/10 text-success" :
                     trend.direction === "down" ? "bg-error/10 text-error" : "bg-steel-800 text-steel-400"
                   )}>
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
                    <DateTimePicker value={recordedAt} onChange={setRecordedAt} granularity="day" />
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

          {stats && (
            <div className="grid grid-cols-3 gap-3">
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
                  return (
                    <div key={entry.id} className="group flex items-center justify-between p-3 rounded-lg bg-card border border-transparent hover:border-steel-700 hover:bg-card-elevated transition-all">
                       <div className="flex items-center gap-4">
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
                              changeInfo.direction === 'up' ? "text-success" : "text-error"
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

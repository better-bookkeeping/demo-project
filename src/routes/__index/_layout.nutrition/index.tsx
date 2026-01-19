import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { createFoodEntryServerFn, deleteFoodEntryServerFn, updateCalorieGoalServerFn } from "@/lib/nutrition.server";
import { Apple, Trash2, ChevronLeft, ChevronRight, Target, Check } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foodEntriesQueryOptions, calorieGoalQueryOptions } from "./-queries/nutrition";
import { aggregateDailyMacros, calculateDailyTotals, getMealTypeLabel } from "./-utils/nutrition-data";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/__index/_layout/nutrition/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(foodEntriesQueryOptions(context.user.id)),
      context.queryClient.ensureQueryData(calorieGoalQueryOptions(context.user.id)),
    ]);
  },
  component: NutritionPage,
});

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

function NutritionPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: entries } = useSuspenseQuery(foodEntriesQueryOptions(user.id));
  const { data: calorieGoal } = useSuspenseQuery(calorieGoalQueryOptions(user.id));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  // Form state
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [note, setNote] = useState("");

  // Calorie goal state
  const [goalInput, setGoalInput] = useState(calorieGoal?.toString() ?? "");
  const [goalSuccess, setGoalSuccess] = useState(false);

  // Chart range state
  const [daysRange, setDaysRange] = useState<7 | 30>(7);

  const createEntryMutation = useMutation({
    mutationFn: (data: {
      mealType: MealType;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      note?: string;
      loggedAt?: string;
    }) => createFoodEntryServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodEntriesQueryOptions(user.id).queryKey });
      resetForm();
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteFoodEntryServerFn({ data: { entryId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foodEntriesQueryOptions(user.id).queryKey });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: (goal: number | null) => updateCalorieGoalServerFn({ data: { calorieGoal: goal } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calorieGoalQueryOptions(user.id).queryKey });
      setGoalSuccess(true);
      setTimeout(() => setGoalSuccess(false), 2000);
    },
  });

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = goalInput ? parseInt(goalInput) : null;
    if (goalInput && (isNaN(parsed!) || parsed! < 0)) return;
    updateGoalMutation.mutate(parsed);
  };

  const resetForm = () => {
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setNote("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCalories = parseInt(calories);
    const parsedProtein = parseFloat(protein);
    const parsedCarbs = parseFloat(carbs);
    const parsedFat = parseFloat(fat);

    if (isNaN(parsedCalories) || parsedCalories < 0) return;
    if (isNaN(parsedProtein) || parsedProtein < 0) return;
    if (isNaN(parsedCarbs) || parsedCarbs < 0) return;
    if (isNaN(parsedFat) || parsedFat < 0) return;

    createEntryMutation.mutate({
      mealType,
      calories: parsedCalories,
      protein: parsedProtein,
      carbs: parsedCarbs,
      fat: parsedFat,
      note: note || undefined,
      loggedAt: selectedDate.toISOString(),
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const dailyTotals = calculateDailyTotals(entries, selectedDate);
  const chartData = aggregateDailyMacros(entries, daysRange);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateDisplay = isToday
    ? "Today"
    : selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  // Filter entries for selected date
  const selectedDateStr = selectedDate.toISOString().split("T")[0];
  const todaysEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.loggedAt).toISOString().split("T")[0];
    return entryDate === selectedDateStr;
  });

  const isFormValid =
    calories !== "" &&
    protein !== "" &&
    carbs !== "" &&
    fat !== "" &&
    parseInt(calories) >= 0 &&
    parseFloat(protein) >= 0 &&
    parseFloat(carbs) >= 0 &&
    parseFloat(fat) >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header with date selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary">Nutrition Tracking</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-text-secondary min-w-[100px] text-center">{dateDisplay}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDate("next")}
            disabled={isToday}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log Food Form */}
      <Card>
        <CardHeader>
          <CardTitle>Log Food</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  aria-label="Meal type"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </Select>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  placeholder="Calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">kcal</span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Protein"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Carbs"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Fat"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
              </div>

              <div className="col-span-2">
                <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} />
              </div>
            </div>

            <Button type="submit" disabled={!isFormValid || createEntryMutation.isPending} size="sm" className="w-full">
              <Apple className="w-4 h-4 mr-2" />
              {createEntryMutation.isPending ? "Logging..." : "Log Food"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-surface-elevated rounded-lg">
              <p className="text-xs text-text-muted mb-1">Calories</p>
              <p data-testid="daily-calories" className="text-lg font-semibold text-primary">
                {dailyTotals.calories}
              </p>
            </div>
            <div className="text-center p-3 bg-surface-elevated rounded-lg">
              <p className="text-xs text-text-muted mb-1">Protein</p>
              <p data-testid="daily-protein" className="text-lg font-semibold text-text-primary">
                {dailyTotals.protein.toFixed(0)}g
              </p>
            </div>
            <div className="text-center p-3 bg-surface-elevated rounded-lg">
              <p className="text-xs text-text-muted mb-1">Carbs</p>
              <p data-testid="daily-carbs" className="text-lg font-semibold text-text-primary">
                {dailyTotals.carbs.toFixed(0)}g
              </p>
            </div>
            <div className="text-center p-3 bg-surface-elevated rounded-lg">
              <p className="text-xs text-text-muted mb-1">Fat</p>
              <p data-testid="daily-fat" className="text-lg font-semibold text-text-primary">
                {dailyTotals.fat.toFixed(0)}g
              </p>
            </div>
          </div>

          {/* Calorie Goal & Surplus/Deficit */}
          <div className="border-t border-border-subtle pt-4">
            <form onSubmit={handleGoalSubmit} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Target className="w-4 h-4 text-text-secondary" />
                <span className="text-sm text-text-primary">Daily Goal:</span>
                <div className="relative w-24">
                  <Input
                    type="number"
                    min="0"
                    max="10000"
                    placeholder="kcal"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="pr-10 h-8 text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">kcal</span>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  disabled={updateGoalMutation.isPending}
                  className="h-8 px-2 text-text-primary"
                >
                  {goalSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : "Set"}
                </Button>
              </div>

              {calorieGoal && (
                <div className="text-right">
                  {(() => {
                    const diff = dailyTotals.calories - calorieGoal;
                    const isDeficit = diff < 0;
                    const isSurplus = diff > 0;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary">
                          {dailyTotals.calories} / {calorieGoal}
                        </span>
                        <span
                          data-testid="calorie-balance"
                          className={`text-sm font-semibold ${
                            isDeficit ? "text-emerald-400" : isSurplus ? "text-red-400" : "text-text-primary"
                          }`}
                        >
                          {isDeficit ? `${Math.abs(diff)} deficit` : isSurplus ? `+${diff} surplus` : "On target"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Calorie Trend Chart */}
      {entries.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Calorie Trend</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={daysRange === 7 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDaysRange(7)}
                className="h-7 text-xs"
              >
                7 days
              </Button>
              <Button
                variant={daysRange === 30 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDaysRange(30)}
                className="h-7 text-xs"
              >
                30 days
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div data-testid="calorie-chart" className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 250)" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
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
                    formatter={(value) => [`${value} kcal`, "Calories"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="oklch(65% 0.18 25)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(65% 0.18 25)", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "oklch(65% 0.18 25)", stroke: "oklch(95% 0.01 80)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Macros Bar Chart */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Macros Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="macros-chart" className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 250)" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(45% 0.01 250)" }}
                    stroke="oklch(25% 0.01 250)"
                    tickLine={false}
                    tickFormatter={(value) => `${value}g`}
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
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="protein" name="Protein" stackId="macros" fill="oklch(65% 0.15 145)" />
                  <Bar dataKey="carbs" name="Carbs" stackId="macros" fill="oklch(65% 0.15 220)" />
                  <Bar dataKey="fat" name="Fat" stackId="macros" fill="oklch(65% 0.15 30)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food Log List */}
      <Card>
        <CardHeader>
          <CardTitle>Food Log</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysEntries.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">
              No food entries for {isToday ? "today" : dateDisplay}. Log your first meal above!
            </p>
          ) : (
            <div className="space-y-3">
              {todaysEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        {getMealTypeLabel(entry.mealType)}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">{entry.calories} kcal</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      P: {entry.protein.toFixed(0)}g | C: {entry.carbs.toFixed(0)}g | F: {entry.fat.toFixed(0)}g
                    </p>
                    {entry.note && <p className="text-xs text-text-secondary mt-1 truncate">{entry.note}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEntryMutation.mutate(entry.id)}
                    disabled={deleteEntryMutation.isPending}
                    className="h-8 w-8 text-text-muted hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

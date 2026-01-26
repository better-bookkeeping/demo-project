import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Apple, Plus } from "lucide-react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyNutritionQueryOptions, nutritionHistoryQueryOptions } from "./-queries/nutrition";
import { nutritionGoalQueryOptions } from "./-queries/goals";
import {
  createNutritionServerFn,
  deleteNutritionServerFn,
  createOrUpdateNutritionGoalServerFn,
} from "@/lib/nutrition.server";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NutritionProgressDisplay } from "@/components/nutrition/nutrition-progress-display";
import { FoodAutocomplete, type Food } from "@/components/food-autocomplete";

const MEAL_TYPES = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
] as const;

type MealType = (typeof MEAL_TYPES)[number]["value"];

export const Route = createFileRoute("/__index/_layout/nutrition/")({
  loader: async ({ context }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Promise.all([
      context.queryClient.ensureQueryData(dailyNutritionQueryOptions(today)),
      context.queryClient.ensureQueryData(nutritionHistoryQueryOptions()),
      context.queryClient.ensureQueryData(nutritionGoalQueryOptions()),
    ]);
  },
  component: NutritionPage,
});

function NutritionPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const { data: dailyNutrition } = useSuspenseQuery(dailyNutritionQueryOptions(today));
  const { data: nutritionGoal } = useSuspenseQuery(nutritionGoalQueryOptions());

  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [manualFoodName, setManualFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [recordedAt, setRecordedAt] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalCalories, setGoalCalories] = useState("");
  const [goalProtein, setGoalProtein] = useState("");
  const [goalCarbs, setGoalCarbs] = useState("");
  const [goalFat, setGoalFat] = useState("");

  useEffect(() => {
    if (selectedFood) {
      setCalories(selectedFood.calories.toString());
      setProtein(selectedFood.protein.toString());
      setCarbs(selectedFood.carbs.toString());
      setFat(selectedFood.fat.toString());
    }
  }, [selectedFood]);

  const createMutation = useMutation({
    mutationFn: (data: {
      food: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      mealType: MealType;
      recordedAt?: Date;
    }) => createNutritionServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNutritionQueryOptions(today).queryKey });
      queryClient.invalidateQueries({ queryKey: nutritionHistoryQueryOptions().queryKey });
      setSelectedFoodId(null);
      setSelectedFood(null);
      setManualFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setIsManualEntry(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNutritionServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyNutritionQueryOptions(today).queryKey });
      queryClient.invalidateQueries({ queryKey: nutritionHistoryQueryOptions().queryKey });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: (data: { calories: number; protein?: number; carbs?: number; fat?: number }) =>
      createOrUpdateNutritionGoalServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionGoalQueryOptions().queryKey });
      setEditingGoal(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foodName = selectedFood?.name || manualFoodName;
    if (!foodName || !calories || parseFloat(calories) <= 0) return;

    createMutation.mutate({
      food: foodName,
      calories: parseFloat(calories),
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      mealType,
      recordedAt: recordedAt || new Date(),
    });
  };

  const handleFoodChange = (food: Food | null) => {
    setSelectedFood(food);
    setSelectedFoodId(food?.id ?? null);
    setManualFoodName("");
    setIsManualEntry(false);
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedFood(null);
    setSelectedFoodId(null);
    setManualFoodName("");
    inputRef.current?.focus();
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalCalories || parseFloat(goalCalories) <= 0) return;

    updateGoalMutation.mutate({
      calories: parseFloat(goalCalories),
      protein: goalProtein ? parseFloat(goalProtein) : undefined,
      carbs: goalCarbs ? parseFloat(goalCarbs) : undefined,
      fat: goalFat ? parseFloat(goalFat) : undefined,
    });
  };

  const entriesByMeal = useMemo(() => {
    const grouped: Record<MealType, typeof dailyNutrition.entries> = {
      BREAKFAST: [],
      LUNCH: [],
      DINNER: [],
      SNACK: [],
    };
    dailyNutrition.entries.forEach((entry) => {
      if (grouped[entry.mealType as MealType]) {
        grouped[entry.mealType as MealType].push(entry);
      }
    });
    return grouped;
  }, [dailyNutrition.entries]);

  const { totals } = dailyNutrition;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pt-6 md:pt-8">
      <div className="flex items-center gap-3 mb-8">
        <Apple className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-heading font-black text-white uppercase italic tracking-wide">Nutrition</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/20 ring-1 ring-orange-500/10">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Calories</p>
            <p className="text-4xl font-heading font-black text-white tabular-nums">{totals.calories}</p>
            {nutritionGoal && (
              <p className="text-sm text-orange-400/70 mt-1">of {nutritionGoal.calories} goal</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 ring-1 ring-emerald-500/10">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Protein</p>
            <p className="text-4xl font-heading font-black text-white tabular-nums">
              {totals.protein.toFixed(0)}g
            </p>
            {nutritionGoal?.protein && (
              <p className="text-sm text-emerald-400/70 mt-1">of {nutritionGoal.protein}g goal</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/20 ring-1 ring-blue-500/10">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Carbs</p>
            <p className="text-4xl font-heading font-black text-white tabular-nums">
              {totals.carbs.toFixed(0)}g
            </p>
            {nutritionGoal?.carbs && (
              <p className="text-sm text-blue-400/70 mt-1">of {nutritionGoal.carbs}g goal</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border-amber-500/20 ring-1 ring-amber-500/10">
          <CardContent className="p-6 text-center">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Fat</p>
            <p className="text-4xl font-heading font-black text-white tabular-nums">
              {totals.fat.toFixed(0)}g
            </p>
            {nutritionGoal?.fat && (
              <p className="text-sm text-amber-400/70 mt-1">of {nutritionGoal.fat}g goal</p>
            )}
          </CardContent>
        </Card>
      </div>

      {nutritionGoal && (
        <NutritionProgressDisplay
          totals={totals}
          goal={nutritionGoal}
          onEditGoals={() => {
            setEditingGoal(true);
            setGoalCalories(nutritionGoal.calories.toString());
            setGoalProtein(nutritionGoal.protein?.toString() ?? "");
            setGoalCarbs(nutritionGoal.carbs?.toString() ?? "");
            setGoalFat(nutritionGoal.fat?.toString() ?? "");
          }}
        />
      )}

      {!nutritionGoal && !editingGoal && (
        <Card className="bg-card/50 border-steel-800">
          <CardContent className="p-6 text-center">
            <p className="text-steel-400 mb-4">Set your daily nutrition goals to track progress</p>
            <Button onClick={() => setEditingGoal(true)} className="font-bold uppercase tracking-wider">
              <Plus className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </CardContent>
        </Card>
      )}

      {editingGoal && (
        <Card className="bg-gradient-to-br from-card-elevated to-card border-none ring-1 ring-white/5">
          <CardHeader>
            <CardTitle className="text-lg text-white">Set Nutrition Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Calories</label>
                  <Input
                    type="number"
                    placeholder="2000"
                    value={goalCalories}
                    onChange={(e) => setGoalCalories(e.target.value)}
                    required
                    className="bg-steel-900/50 border-steel-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Protein (g)</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={goalProtein}
                    onChange={(e) => setGoalProtein(e.target.value)}
                    step="0.1"
                    className="bg-steel-900/50 border-steel-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Carbs (g)</label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={goalCarbs}
                    onChange={(e) => setGoalCarbs(e.target.value)}
                    step="0.1"
                    className="bg-steel-900/50 border-steel-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Fat (g)</label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={goalFat}
                    onChange={(e) => setGoalFat(e.target.value)}
                    step="0.1"
                    className="bg-steel-900/50 border-steel-700"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 font-bold uppercase tracking-wider"
                  disabled={!goalCalories || updateGoalMutation.isPending}
                >
                  {updateGoalMutation.isPending ? "Saving..." : "Save Goals"}
                </Button>
                <Button
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

      <Card className="bg-gradient-to-br from-card-elevated to-card border-none ring-1 ring-white/5">
        <CardHeader>
          <CardTitle className="text-lg text-white">Log Food</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Date</label>
                <DateTimePicker value={recordedAt} onChange={setRecordedAt} granularity="day" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Meal</label>
                <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                  <SelectTrigger className="bg-steel-900/50 border-steel-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Food</label>
                {!isManualEntry ? (
                  <FoodAutocomplete
                    value={selectedFoodId ?? ""}
                    onChange={handleFoodChange}
                    onManualEntry={handleManualEntry}
                    placeholder="Search for a food..."
                  />
                ) : (
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Enter food name manually"
                      value={manualFoodName}
                      onChange={(e) => setManualFoodName(e.target.value)}
                      required
                      className="bg-steel-900/50 border-steel-700 flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsManualEntry(false)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Calories</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  required
                  min="1"
                  className="bg-steel-900/50 border-steel-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Protein (g)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  min="0"
                  step="0.1"
                  className="bg-steel-900/50 border-steel-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Carbs (g)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  min="0"
                  step="0.1"
                  className="bg-steel-900/50 border-steel-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-steel-500 uppercase ml-1">Fat (g)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  min="0"
                  step="0.1"
                  className="bg-steel-900/50 border-steel-700"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-bold uppercase tracking-wider"
              disabled={(!selectedFood && !manualFoodName) || !calories || parseFloat(calories) <= 0 || createMutation.isPending}
            >
              {createMutation.isPending ? "Logging..." : "Log Food"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {MEAL_TYPES.map(
          (type) =>
            entriesByMeal[type.value].length > 0 && (
              <div key={type.value} className="space-y-3">
                <h3 className="text-sm font-bold text-steel-400 uppercase tracking-wider px-2">
                  {type.label}
                </h3>
                <div className="space-y-2">
                  {entriesByMeal[type.value].map((entry) => (
                    <div
                      key={entry.id}
                      data-testid="nutrition-entry"
                      data-entry-id={entry.id}
                      className="group flex items-center justify-between p-4 rounded-lg bg-card border border-transparent hover:border-steel-700 hover:bg-card-elevated transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-base font-bold text-white">{entry.food}</p>
                        <div className="flex gap-4 mt-1 text-sm text-steel-400">
                          <span>{entry.calories} cal</span>
                          {entry.protein && <span>{entry.protein}g protein</span>}
                          {entry.carbs && <span>{entry.carbs}g carbs</span>}
                          {entry.fat && <span>{entry.fat}g fat</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-steel-600 hover:text-error"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}

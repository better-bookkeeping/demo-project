import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { CalorieProgressCircle } from "./calorie-progress-circle";
import { MacroDonutChart } from "./macro-donut-chart";

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionGoal {
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

interface NutritionProgressDisplayProps {
  totals: NutritionTotals;
  goal: NutritionGoal;
  onEditGoals: () => void;
}

export function NutritionProgressDisplay({
  totals,
  goal,
  onEditGoals,
}: NutritionProgressDisplayProps) {
  return (
    <Card className="bg-card/50 border-steel-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-steel-400">Daily Progress</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onEditGoals}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col items-center">
            <CalorieProgressCircle current={totals.calories} goal={goal.calories} />
            <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-[250px]">
              <div className="text-center">
                <p className="text-xs font-bold text-steel-600 uppercase tracking-wider mb-1">Protein</p>
                <p className="text-sm font-heading font-bold text-white tabular-nums">
                  {totals.protein.toFixed(0)}g
                </p>
                {goal.protein && (
                  <p className="text-xs text-steel-600">/ {goal.protein}g</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-steel-600 uppercase tracking-wider mb-1">Carbs</p>
                <p className="text-sm font-heading font-bold text-white tabular-nums">
                  {totals.carbs.toFixed(0)}g
                </p>
                {goal.carbs && (
                  <p className="text-xs text-steel-600">/ {goal.carbs}g</p>
                )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-steel-600 uppercase tracking-wider mb-1">Fat</p>
                <p className="text-sm font-heading font-bold text-white tabular-nums">
                  {totals.fat.toFixed(0)}g
                </p>
                {goal.fat && (
                  <p className="text-xs text-steel-600">/ {goal.fat}g</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <MacroDonutChart
              protein={totals.protein}
              carbs={totals.carbs}
              fat={totals.fat}
            />
            <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-[250px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <div>
                  <p className="text-xs font-bold text-steel-600 uppercase">Protein</p>
                  <p className="text-sm text-white tabular-nums">{(totals.protein * 4).toFixed(0)} kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                <div>
                  <p className="text-xs font-bold text-steel-600 uppercase">Carbs</p>
                  <p className="text-sm text-white tabular-nums">{(totals.carbs * 4).toFixed(0)} kcal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <div>
                  <p className="text-xs font-bold text-steel-600 uppercase">Fat</p>
                  <p className="text-sm text-white tabular-nums">{(totals.fat * 9).toFixed(0)} kcal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

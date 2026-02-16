import { getNutritionHistoryServerFn, getDailyNutritionSummaryServerFn } from "@/lib/nutrition.server";
import { queryOptions } from "@tanstack/react-query";

export const nutritionHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-history"],
    queryFn: () => getNutritionHistoryServerFn(),
  });

export const dailyNutritionQueryOptions = () =>
  queryOptions({
    queryKey: ["daily-nutrition"],
    queryFn: () => getDailyNutritionSummaryServerFn(),
  });

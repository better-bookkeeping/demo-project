import { getDailyNutritionServerFn, getNutritionHistoryServerFn } from "@/lib/nutrition.server";
import { queryOptions } from "@tanstack/react-query";

export const dailyNutritionQueryOptions = (date: Date) =>
  queryOptions({
    queryKey: ["daily-nutrition", date.toISOString()],
    queryFn: async () => getDailyNutritionServerFn({ data: { date } }),
  });

export const nutritionHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-history"],
    queryFn: async () => getNutritionHistoryServerFn(),
  });

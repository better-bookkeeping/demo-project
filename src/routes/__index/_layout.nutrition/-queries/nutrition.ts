import { getNutritionHistoryServerFn, getDailyNutritionSummaryServerFn } from "@/lib/nutrition.server";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import type { TimeRange } from "@/components/chart-range-filter";

export const nutritionHistoryQueryOptions = (range?: TimeRange) =>
  queryOptions({
    queryKey: ["nutrition-history", range ?? "All"],
    queryFn: () => getNutritionHistoryServerFn({ data: { range } }),
    placeholderData: keepPreviousData,
  });

export const dailyNutritionQueryOptions = () =>
  queryOptions({
    queryKey: ["daily-nutrition"],
    queryFn: () => getDailyNutritionSummaryServerFn(),
  });

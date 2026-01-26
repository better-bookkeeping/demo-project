import { getNutritionGoalServerFn } from "@/lib/nutrition.server";
import { queryOptions } from "@tanstack/react-query";

export const nutritionGoalQueryOptions = () =>
  queryOptions({
    queryKey: ["nutrition-goal"],
    queryFn: async () => getNutritionGoalServerFn(),
  });

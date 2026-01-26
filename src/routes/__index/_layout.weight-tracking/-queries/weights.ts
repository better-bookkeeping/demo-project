import { getLatestWeightServerFn, getWeightHistoryServerFn, getWeightGoalServerFn } from "@/lib/weights.server";
import { queryOptions } from "@tanstack/react-query";

export const weightHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["weightHistory"],
    queryFn: async () => getWeightHistoryServerFn(),
  });

export const latestWeightQueryOptions = () =>
  queryOptions({
    queryKey: ["latestWeight"],
    queryFn: async () => getLatestWeightServerFn(),
  });

export const weightGoalQueryOptions = () =>
  queryOptions({
    queryKey: ["weightGoal"],
    queryFn: async () => getWeightGoalServerFn(),
  });

import { getWorkoutHistoryServerFn } from "@/lib/workouts.server";
import { getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const workoutHistoryQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["workout-history", userId],
    queryFn: () => getWorkoutHistoryServerFn(),
  });

export const weightUnitQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["weightUnit", userId],
    queryFn: () => getWeightUnitServerFn(),
  });

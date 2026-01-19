import { getCurrentWorkoutServerFn } from "@/lib/workouts.server";
import { getMovementsServerFn } from "@/lib/movements.server";
import { getLatestWeightServerFn, getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const currentWorkoutQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["current-workout", userId],
    queryFn: () => getCurrentWorkoutServerFn(),
  });

export const movementsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["movements", userId],
    queryFn: () => getMovementsServerFn(),
  });

export const latestWeightQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["latestWeight", userId],
    queryFn: () => getLatestWeightServerFn(),
  });

export const weightUnitQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["weightUnit", userId],
    queryFn: () => getWeightUnitServerFn(),
  });

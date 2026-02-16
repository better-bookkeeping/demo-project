import { getWorkoutHistoryServerFn } from "@/lib/workouts.server";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import type { TimeRange } from "@/components/chart-range-filter";

export const workoutHistoryQueryOptions = (range?: TimeRange) =>
  queryOptions({
    queryKey: ["workout-history", range ?? "All"],
    queryFn: () => getWorkoutHistoryServerFn({ data: { range } }),
    placeholderData: keepPreviousData,
  });

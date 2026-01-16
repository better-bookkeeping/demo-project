import { getWorkoutHistoryServerFn } from "@/lib/workouts.server";
import { queryOptions } from "@tanstack/react-query";

export const workoutHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["workout-history"],
    queryFn: () => getWorkoutHistoryServerFn(),
  });

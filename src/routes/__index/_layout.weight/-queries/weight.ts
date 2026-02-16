import { getWeightHistoryServerFn } from "@/lib/weight.server";
import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import type { TimeRange } from "@/components/chart-range-filter";

export const weightHistoryQueryOptions = (range?: TimeRange) =>
  queryOptions({
    queryKey: ["weight-history", range ?? "All"],
    queryFn: () => getWeightHistoryServerFn({ data: { range } }),
    placeholderData: keepPreviousData,
  });

import { getWeightHistoryServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const weightHistoryQueryOptions = () =>
  queryOptions({
    queryKey: ["weight-history"],
    queryFn: () => getWeightHistoryServerFn(),
  });

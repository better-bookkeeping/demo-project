import { getWeightHistoryServerFn, getWeightUnitServerFn } from "@/lib/weight.server";
import { queryOptions } from "@tanstack/react-query";

export const weightHistoryQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["weightHistory", userId],
    queryFn: () => getWeightHistoryServerFn(),
  });

export const weightUnitQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["weightUnit", userId],
    queryFn: () => getWeightUnitServerFn(),
  });

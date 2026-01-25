import { getMovementsServerFn } from "@/lib/movements.server";
import { getMovementMetricsServerFn, MetricType, DateRange } from "@/lib/progression.server";
import { queryOptions } from "@tanstack/react-query";

export const movementsForProgressionQueryOptions = () =>
  queryOptions({
    queryKey: ["movements-for-progression"],
    queryFn: () => getMovementsServerFn(),
  });

export const movementMetricsQueryOptions = (movementId: string, metricType: MetricType, dateRange: DateRange) =>
  queryOptions({
    queryKey: ["movement-metrics", movementId, metricType, dateRange],
    queryFn: () => getMovementMetricsServerFn({ data: { movementId, metricType, dateRange } }),
    enabled: !!movementId,
  });

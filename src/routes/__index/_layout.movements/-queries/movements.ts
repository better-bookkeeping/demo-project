import { getMovementsServerFn } from "@/lib/movements.server";
import { queryOptions } from "@tanstack/react-query";

export const movementsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["movements", userId],
    queryFn: () => getMovementsServerFn(),
  });

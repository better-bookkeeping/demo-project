import { searchFoodsServerFn, getFoodByIdServerFn, getCustomFoodsServerFn } from "@/lib/food.server";
import { queryOptions } from "@tanstack/react-query";

export const searchFoodsQueryOptions = (query: string) =>
  queryOptions({
    queryKey: ["foods", "search", query],
    queryFn: async () => searchFoodsServerFn({ data: { query } }),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });

export const foodByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["foods", id],
    queryFn: async () => getFoodByIdServerFn({ data: { id } }),
  });

export const customFoodsQueryOptions = () =>
  queryOptions({
    queryKey: ["foods", "custom"],
    queryFn: async () => getCustomFoodsServerFn(),
    staleTime: 5 * 60 * 1000,
  });

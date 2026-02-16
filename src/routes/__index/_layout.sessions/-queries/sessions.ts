import { getActiveSessionsServerFn, getCurrentSessionIdServerFn } from "@/lib/auth.server";
import { queryOptions } from "@tanstack/react-query";

export const activeSessionsQueryOptions = () =>
  queryOptions({
    queryKey: ["active-sessions"],
    queryFn: () => getActiveSessionsServerFn(),
  });

export const currentSessionIdQueryOptions = () =>
  queryOptions({
    queryKey: ["current-session-id"],
    queryFn: () => getCurrentSessionIdServerFn(),
  });

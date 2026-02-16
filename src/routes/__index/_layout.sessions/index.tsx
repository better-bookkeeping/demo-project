import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activeSessionsQueryOptions, currentSessionIdQueryOptions } from "./-queries/sessions";
import { revokeSessionServerFn } from "@/lib/auth.server";
import { Monitor, Smartphone, Globe } from "lucide-react";

export const Route = createFileRoute("/__index/_layout/sessions/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(activeSessionsQueryOptions()),
      context.queryClient.ensureQueryData(currentSessionIdQueryOptions()),
    ]);
  },
  component: SessionsPage,
});

function parseUserAgent(ua: string | null): { label: string; isMobile: boolean } {
  if (!ua) return { label: "Unknown device", isMobile: false };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  // Extract browser
  let browser = "Unknown browser";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  // Extract OS
  let os = "";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { label: os ? `${browser} on ${os}` : browser, isMobile };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SessionsPage() {
  const queryClient = useQueryClient();
  const { data: sessions } = useSuspenseQuery(activeSessionsQueryOptions());
  const { data: currentSessionId } = useSuspenseQuery(currentSessionIdQueryOptions());

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeSessionServerFn({ data: { sessionId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activeSessionsQueryOptions().queryKey });
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: async () => {
      const otherSessions = sessions.filter((s) => s.id !== currentSessionId);
      await Promise.all(otherSessions.map((s) => revokeSessionServerFn({ data: { sessionId: s.id } })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activeSessionsQueryOptions().queryKey });
    },
  });

  const otherSessionCount = sessions.filter((s) => s.id !== currentSessionId).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Active Sessions</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Sessions</CardTitle>
          {otherSessionCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}>
              {revokeAllMutation.isPending ? "Revoking..." : `Revoke All Other (${otherSessionCount})`}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No active sessions.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((session) => {
                const { label, isMobile } = parseUserAgent(session.userAgent);
                const isCurrent = session.id === currentSessionId;
                const DeviceIcon = isMobile ? Smartphone : Monitor;

                return (
                  <div key={session.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="shrink-0 p-2 bg-slate-100 rounded-lg">
                      <DeviceIcon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                        {isCurrent && (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {session.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {session.ipAddress}
                          </span>
                        )}
                        <span>Created {formatRelativeTime(new Date(session.createdAt))}</span>
                        <span>
                          Expires{" "}
                          {new Date(session.expiresAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(session.id)}
                        disabled={revokeMutation.isPending}>
                        Revoke
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

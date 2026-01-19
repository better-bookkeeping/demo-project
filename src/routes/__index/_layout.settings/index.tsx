import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserNameServerFn, logoutServerFn } from "@/lib/auth.server";
import { updateWeightUnitServerFn, getWeightUnitServerFn } from "@/lib/weight.server";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { Check, LogOut } from "lucide-react";

const weightUnitQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["weightUnit", userId],
    queryFn: () => getWeightUnitServerFn(),
  });

export const Route = createFileRoute("/__index/_layout/settings/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(weightUnitQueryOptions(context.user.id));
  },
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: weightUnit } = useSuspenseQuery(weightUnitQueryOptions(user.id));

  const [name, setName] = useState(user.name ?? "");
  const [nameSuccess, setNameSuccess] = useState(false);

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => updateUserNameServerFn({ data: { name } }),
    onSuccess: () => {
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
      router.invalidate();
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: (unit: "lbs" | "kg") => updateWeightUnitServerFn({ data: { unit } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightUnitQueryOptions(user.id).queryKey });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutServerFn(),
    onSuccess: () => {
      router.navigate({ to: "/sign-in" });
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName === user.name) return;
    updateNameMutation.mutate(trimmedName);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleNameSubmit} className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-text-muted">
              Name
            </label>
            <div className="flex gap-2">
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!name.trim() || name.trim() === user.name || updateNameMutation.isPending}
              >
                {nameSuccess ? <Check className="w-4 h-4" /> : null}
                {updateNameMutation.isPending ? "Saving..." : nameSuccess ? "Saved" : "Save"}
              </Button>
            </div>
          </form>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-text-muted">Email</label>
            <Input id="email" type="email" value={user.email} disabled className="opacity-60" />
            <p className="text-[10px] text-text-muted">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-muted">Weight Unit</label>
            <div className="flex gap-0.5 rounded-lg border border-border p-0.5 bg-surface-elevated w-fit">
              <button
                type="button"
                onClick={() => updateUnitMutation.mutate("lbs")}
                disabled={updateUnitMutation.isPending}
                data-state={weightUnit === "lbs" ? "on" : "off"}
                className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=off]:text-text-muted data-[state=off]:hover:text-text-secondary disabled:opacity-50"
              >
                lbs
              </button>
              <button
                type="button"
                onClick={() => updateUnitMutation.mutate("kg")}
                disabled={updateUnitMutation.isPending}
                data-state={weightUnit === "kg" ? "on" : "off"}
                className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 data-[state=on]:bg-primary data-[state=on]:text-white data-[state=off]:text-text-muted data-[state=off]:hover:text-text-secondary disabled:opacity-50"
              >
                kg
              </button>
            </div>
            <p className="text-[10px] text-text-muted">Used for recording weights and displaying data</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            <LogOut className="w-4 h-4" />
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

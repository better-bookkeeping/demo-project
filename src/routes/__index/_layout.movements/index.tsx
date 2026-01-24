import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMovementServerFn } from "@/lib/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementsQueryOptions } from "./-queries/movements";
import { Dumbbell, Plus, BicepsFlexed } from "lucide-react";

export const Route = createFileRoute("/__index/_layout/movements/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(movementsQueryOptions());
  },
  component: MovementsPage,
});

function MovementsPage() {
  const queryClient = useQueryClient();
  const { data: movements } = useSuspenseQuery(movementsQueryOptions());
  const [name, setName] = useState("");

  const createMovementMutation = useMutation({
    mutationFn: (name: string) => createMovementServerFn({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMovementMutation.mutate(name.trim());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-900">Movements</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Movement name (e.g. Bench Press)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!name.trim()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {createMovementMutation.isPending ? "Adding..." : "Add Movement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {movements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <Dumbbell className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-sm text-stone-500">No movements yet. Add one above!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movements.map((movement) => (
            <Card key={movement.id} className="hover:shadow-[var(--shadow-warm-md)] transition-shadow">
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BicepsFlexed className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-stone-900 text-sm truncate">{movement.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMovementsServerFn } from "@/lib/movements.server";
import { createMovementServerFn } from "@/lib/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/__index/_layout/movements/")({
  loader: async () => {
    const movements = await getMovementsServerFn();
    return { movements };
  },
  component: MovementsPage,
});

function MovementsPage() {
  const { movements: initialMovements } = Route.useLoaderData();
  const [movements, setMovements] = useState(initialMovements);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await createMovementServerFn({ data: { name: name.trim() } });
      if (result.success) {
        setMovements([...movements, result.movement].sort((a, b) => a.name.localeCompare(b.name)));
        setName("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Movements</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add New Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              placeholder="Movement name (e.g. Bench Press)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">No movements yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {movements.map((movement) => (
                <li key={movement.id} className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-700">
                  {movement.name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

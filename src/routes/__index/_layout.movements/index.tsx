import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { createMovementServerFn, updateMovementServerFn, deleteMovementServerFn } from "@/lib/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementsQueryOptions } from "./-queries/movements";
import { Pencil, Check, X, Trash2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/__index/_layout/movements/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(movementsQueryOptions(context.user.id));
  },
  component: MovementsPage,
});

function MovementsPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: movements } = useSuspenseQuery(movementsQueryOptions(user.id));
  const [name, setName] = useState("");
  const [isBodyWeight, setIsBodyWeight] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsBodyWeight, setEditIsBodyWeight] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createMovementMutation = useMutation({
    mutationFn: (data: { name: string; isBodyWeight: boolean }) => createMovementServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions(user.id).queryKey });
      setName("");
      setIsBodyWeight(false);
    },
  });

  const updateMovementMutation = useMutation({
    mutationFn: (data: { id: string; name: string; isBodyWeight: boolean }) =>
      updateMovementServerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions(user.id).queryKey });
      setEditingId(null);
    },
  });

  const deleteMovementMutation = useMutation({
    mutationFn: (id: string) => deleteMovementServerFn({ data: { id } }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: movementsQueryOptions(user.id).queryKey });
        setDeleteError(null);
      } else {
        setDeleteError(result.error ?? "Failed to delete movement");
        setTimeout(() => setDeleteError(null), 5000);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMovementMutation.mutate({ name: name.trim(), isBodyWeight });
  };

  const startEdit = (movement: { id: string; name: string; isBodyWeight: boolean }) => {
    setEditingId(movement.id);
    setEditName(movement.name);
    setEditIsBodyWeight(movement.isBodyWeight);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIsBodyWeight(false);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateMovementMutation.mutate({ id: editingId, name: editName.trim(), isBodyWeight: editIsBodyWeight });
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Movements</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Movement name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!name.trim()} size="sm">
                {createMovementMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
            <Checkbox
              checked={isBodyWeight}
              onChange={(e) => setIsBodyWeight(e.target.checked)}
              label="Body-weight"
            />
          </form>
        </CardContent>
      </Card>

      {deleteError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-4">No movements yet. Add one above!</p>
          ) : (
            <ul className="space-y-2">
              {movements.map((movement) => (
                <li
                  key={movement.id}
                  className="p-3 bg-surface-elevated rounded-lg border border-border-subtle hover:border-border transition-colors"
                >
                  {editingId === movement.id ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                          aria-label="Name"
                        />
                        <Button size="icon" onClick={saveEdit} disabled={!editName.trim() || updateMovementMutation.isPending} className="h-9 w-9">
                          <Check className="w-4 h-4" />
                          <span className="sr-only">Save</span>
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-9 w-9">
                          <X className="w-4 h-4" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </div>
                      <Checkbox
                        checked={editIsBodyWeight}
                        onChange={(e) => setEditIsBodyWeight(e.target.checked)}
                        label="Body-weight"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">{movement.name}</span>
                        {movement.isBodyWeight && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-muted text-primary rounded">
                            BW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(movement)}
                          className="h-7 w-7 text-text-muted hover:text-text-primary"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMovementMutation.mutate(movement.id)}
                          disabled={deleteMovementMutation.isPending}
                          className="h-7 w-7 text-text-muted hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

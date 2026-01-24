import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMovementServerFn, deleteMovementServerFn } from "@/lib/movements.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementsQueryOptions } from "./-queries/movements";
import { Dumbbell, Plus, Search, Sparkles, X, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

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
  const [search, setSearch] = useState("");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null);

  const createMovementMutation = useMutation({
    mutationFn: (name: string) => createMovementServerFn({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      setName("");
      toast.success("Movement added to arsenal");
    },
  });

  const deleteMovementMutation = useMutation({
    mutationFn: (id: string) => deleteMovementServerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsQueryOptions().queryKey });
      toast.success("Movement removed from arsenal");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete movement");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMovementMutation.mutate(name.trim());
  };

  const filteredMovements = movements.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto md:pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-white uppercase italic tracking-wide">
            Movement Arsenal
          </h1>
          <p className="text-steel-400 font-medium mt-1">Manage your exercises and equipment.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-500" />
           <Input
             placeholder="Search movements..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="pl-9 bg-black/20 border-steel-800 focus:border-primary"
           />
        </div>
      </div>

      <Card className="border-steel-800 bg-card-elevated shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary transition-all group-hover:w-1.5" />
        <CardHeader className="pb-2 bg-black/20 border-b border-white/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-primary" />
            Add New Movement
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Movement name (e.g. Incline Bench Press)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg bg-black/40 border-steel-700"
              />
            </div>
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-12 w-full sm:w-auto px-8 font-bold uppercase tracking-wider"
            >
              {createMovementMutation.isPending ? "Adding..." : "Add to Arsenal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {filteredMovements.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
          <div className="w-20 h-20 rounded-full bg-steel-800/50 flex items-center justify-center mb-6 border-2 border-dashed border-steel-700">
            <Dumbbell className="w-10 h-10 text-steel-500" />
          </div>
          <p className="text-xl font-heading font-bold text-steel-400 uppercase tracking-wide">
            {search ? "No matches found" : "Arsenal Empty"}
          </p>
          <p className="text-sm text-steel-500 mt-2">
            {search ? "Try a different search term" : "Start building your library above"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMovements.map((movement) => (
            <div
              key={movement.id}
              className="group relative bg-card border border-steel-800 hover:border-primary/50 transition-all duration-200 rounded-lg overflow-hidden hover:shadow-[0_0_20px_rgba(249,115,22,0.1)] hover:-translate-y-1"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-steel-500 hover:text-error hover:bg-error/10"
                  onClick={(e) => {
                    e.preventDefault();
                    setMovementToDelete(movement.id);
                    setShowDeleteAlert(true);
                  }}
                  disabled={deleteMovementMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-5 flex items-start gap-4 h-full">
                <div className="w-12 h-12 rounded bg-steel-900 border border-steel-800 flex items-center justify-center text-steel-500 group-hover:text-primary group-hover:border-primary/30 transition-colors shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 flex flex-col h-full justify-center">
                  <h3 className="font-heading font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {movement.name}
                  </h3>
                  <div className="h-0.5 w-8 bg-steel-800 mt-2 group-hover:w-full group-hover:bg-primary/30 transition-all duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDeleteAlert && (
        <div className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-steel-700 p-6 rounded-lg max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-error">
              <div className="bg-error/10 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-white">Delete Movement?</h3>
            </div>

            <p className="text-steel-400">
              This action cannot be undone. This will permanently remove this movement from your arsenal.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteAlert(false);
                  setMovementToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (movementToDelete) {
                    deleteMovementMutation.mutate(movementToDelete);
                    setShowDeleteAlert(false);
                    setMovementToDelete(null);
                  }
                }}
                className="flex-1 bg-error hover:bg-error/90 text-white border-none"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

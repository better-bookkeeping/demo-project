type WorkoutSet = {
  weight: number;
  reps: number;
  movement: {
    id: string;
    name: string;
  };
};

type Workout = {
  id: string;
  completedAt: Date | null;
  sets: WorkoutSet[];
};

export type ProgressionMetric = "max_weight" | "total_reps" | "total_volume";

export type ProgressionDataPoint = {
  date: string;
  value: number;
};

/**
 * Calculate progression data for charting
 * @param daysRange - Number of days to include, or null for all time
 */
export function calculateProgressionData(
  workouts: Workout[],
  movementId: string | null,
  metric: ProgressionMetric,
  daysRange: number | null = 30,
): ProgressionDataPoint[] {
  const cutoffDate = daysRange !== null ? new Date() : null;
  if (cutoffDate) {
    cutoffDate.setDate(cutoffDate.getDate() - daysRange!);
  }

  return workouts
    .filter((workout) => {
      if (!workout.completedAt) return false;
      if (!cutoffDate) return true;
      return new Date(workout.completedAt) >= cutoffDate;
    })
    .map((workout) => {
      const relevantSets = movementId
        ? workout.sets.filter((set) => set.movement.id === movementId)
        : workout.sets;

      if (relevantSets.length === 0) return null;

      let value: number;
      switch (metric) {
        case "max_weight":
          value = Math.max(...relevantSets.map((s) => s.weight));
          break;
        case "total_reps":
          value = relevantSets.reduce((sum, s) => sum + s.reps, 0);
          break;
        case "total_volume":
          value = relevantSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          break;
      }

      const completedDate = new Date(workout.completedAt!);
      return {
        date: completedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }) + " " + completedDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        value,
      };
    })
    .filter((point): point is ProgressionDataPoint => point !== null)
    .reverse();
}

/**
 * Extract unique movements from workout history
 */
export function getUniqueMovements(workouts: Workout[]): Array<{ id: string; name: string }> {
  const movementMap = new Map<string, string>();

  workouts.forEach((workout) => {
    workout.sets.forEach((set) => {
      if (!movementMap.has(set.movement.id)) {
        movementMap.set(set.movement.id, set.movement.name);
      }
    });
  });

  return Array.from(movementMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get label for metric
 */
export function getMetricLabel(metric: ProgressionMetric, weightUnit: string = "lbs"): string {
  switch (metric) {
    case "max_weight":
      return `Max Weight (${weightUnit})`;
    case "total_reps":
      return "Total Reps";
    case "total_volume":
      return `Total Volume (${weightUnit})`;
  }
}

import { useMemo } from "react";

interface Set {
  id: string;
  weight: number;
  reps: number;
  movement: { id: string; name: string };
}

export interface PersonalRecord {
  movementId: string;
  movementName: string;
  bestSet: {
    weight: number;
    reps: number;
  };
}

export interface PRCheckResult {
  isPR: boolean;
  previousBest: PersonalRecord | null;
}

export function isBetterSet(newSet: { weight: number; reps: number }, oldSet: { weight: number; reps: number }): boolean {
  if (newSet.weight > oldSet.weight) return true;
  if (newSet.weight === oldSet.weight && newSet.reps > oldSet.reps) return true;
  return false;
}

export function usePersonalRecords(historicalSets: Set[]): Map<string, PersonalRecord> {
  return useMemo(() => {
    const records = new Map<string, PersonalRecord>();

    for (const set of historicalSets) {
      const existing = records.get(set.movement.id);

      if (!existing) {
        records.set(set.movement.id, {
          movementId: set.movement.id,
          movementName: set.movement.name,
          bestSet: { weight: set.weight, reps: set.reps },
        });
      } else {
        if (isBetterSet({ weight: set.weight, reps: set.reps }, existing.bestSet)) {
          records.set(set.movement.id, {
            ...existing,
            bestSet: { weight: set.weight, reps: set.reps },
          });
        }
      }
    }

    return records;
  }, [historicalSets]);
}

export function checkForPR(
  newSet: { weight: number; reps: number; movementId: string },
  records: Map<string, PersonalRecord>,
): PRCheckResult {
  const previousBest = records.get(newSet.movementId) || null;

  if (!previousBest) {
    return {
      isPR: true,
      previousBest: null,
    };
  }

  return {
    isPR: isBetterSet(newSet, previousBest.bestSet),
    previousBest,
  };
}

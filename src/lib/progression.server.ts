import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth.server";
import { z } from "zod";
import { getServerSidePrismaClient } from "./db.server";
import { formatLocalDate } from "./utils";

export type MetricType = "maxWeight" | "totalReps" | "totalVolume";
export type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

export interface MetricDataPoint {
  date: string;
  value: number;
}

function getDateRangeStart(range: DateRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[range];
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export const getMovementMetricsServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      movementId: z.string(),
      metricType: z.enum(["maxWeight", "totalReps", "totalVolume"]),
      dateRange: z.enum(["7d", "30d", "90d", "1y", "all"]).optional().default("all"),
    }),
  )
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const dateStart = getDateRangeStart(data.dateRange);

    const sets = await prisma.set.findMany({
      where: {
        movementId: data.movementId,
        workout: {
          userId: context.user.id,
          completedAt: dateStart ? { gte: dateStart } : { not: null },
        },
      },
      include: { workout: { select: { completedAt: true } } },
      orderBy: { workout: { completedAt: "asc" } },
    });

    const setsByDate = new Map<string, typeof sets>();
    for (const set of sets) {
      const dateKey = formatLocalDate(new Date(set.workout.completedAt!));
      const existing = setsByDate.get(dateKey) || [];
      setsByDate.set(dateKey, [...existing, set]);
    }

    const result: MetricDataPoint[] = [];
    for (const [date, dateSets] of setsByDate) {
      let value: number;
      switch (data.metricType) {
        case "maxWeight":
          value = Math.max(...dateSets.map((s) => s.weight));
          break;
        case "totalReps":
          value = dateSets.reduce((sum, s) => sum + s.reps, 0);
          break;
        case "totalVolume":
          value = dateSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          break;
      }
      result.push({ date, value });
    }

    return result;
  });

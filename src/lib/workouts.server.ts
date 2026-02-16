import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { csrfMiddleware } from "@/lib/csrf.server";
import { z } from "zod";

export const createWorkoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const workout = await prisma.workout.create({
      data: {
        userId: context.user.id,
      },
    });
    return { success: true, workout };
  });

export const getCurrentWorkoutServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    // Get the most recent workout for the user
    const workout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
      orderBy: { id: "desc" },
      include: {
        sets: {
          include: { movement: true },
        },
      },
    });
    return workout;
  });

export const completeWorkoutServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const workout = await prisma.workout.findFirst({
      where: { userId: context.user.id, completedAt: null },
    });
    if (!workout) {
      return { success: false, error: "No active workout to complete" };
    }
    await prisma.workout.update({
      where: { id: workout.id },
      data: { completedAt: new Date() },
    });
    return { success: true };
  });

export const addSetServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ movementId: z.string(), reps: z.number().min(1), weight: z.number().min(0) }))
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { movementId: string; reps: number; weight: number };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const [workout, movement] = await Promise.all([
        prisma.workout.findFirst({
          where: { userId: context.user.id, completedAt: null },
        }),
        prisma.movement.findFirst({
          where: { id: data.movementId, userId: context.user.id },
        }),
      ]);
      if (!workout) {
        return { success: false, error: "No active workout" };
      }
      if (!movement) {
        return { success: false, error: "Movement not found" };
      }
      const set = await prisma.set.create({
        data: {
          workoutId: workout.id,
          movementId: data.movementId,
          reps: data.reps,
          weight: data.weight,
        },
        include: { movement: true },
      });
      return { success: true, set };
    },
  );

export const deleteSetServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ setId: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { setId: string } }) => {
    const prisma = await getServerSidePrismaClient();
    // Verify the set belongs to the user's active workout
    const set = await prisma.set.findFirst({
      where: { id: data.setId, workout: { userId: context.user.id, completedAt: null } },
    });
    if (!set) {
      return { success: false, error: "Set not found" };
    }
    await prisma.set.delete({ where: { id: data.setId } });
    return { success: true };
  });

const timeRangeSchema = z.enum(["1W", "1M", "3M", "6M", "1Y", "All"]).optional();

export const getWorkoutHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ range: timeRangeSchema }).optional())
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const range = data?.range;
    let completedAtFilter: { not: null; gte?: Date } = { not: null };
    if (range && range !== "All") {
      const days: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days[range]);
      completedAtFilter = { not: null, gte: cutoff };
    }
    console.log(`[workout-history] range=${range ?? "All"} cutoff=${completedAtFilter.gte?.toISOString() ?? "none"}`);
    const workouts = await prisma.workout.findMany({
      where: { userId: context.user.id, completedAt: completedAtFilter },
      orderBy: { completedAt: "desc" },
      include: {
        sets: {
          include: { movement: true },
        },
      },
    });
    console.log(`[workout-history] returned ${workouts.length} rows`);
    return workouts;
  });

export const deleteWorkoutsServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ workoutIds: z.array(z.string()) }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { workoutIds: string[] } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.$transaction(async (tx) => {
      await tx.set.deleteMany({
        where: { workout: { id: { in: data.workoutIds }, userId: context.user.id } },
      });
      await tx.workout.deleteMany({
        where: { id: { in: data.workoutIds }, userId: context.user.id },
      });
    });
    return { success: true };
  });

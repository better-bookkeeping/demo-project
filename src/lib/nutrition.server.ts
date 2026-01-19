import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const createFoodEntryServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      mealType: mealTypeSchema,
      calories: z.number().int().min(0),
      protein: z.number().min(0),
      carbs: z.number().min(0),
      fat: z.number().min(0),
      note: z.string().trim().max(100).optional(),
      loggedAt: z.string().datetime().optional(),
    }),
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: {
        mealType: "breakfast" | "lunch" | "dinner" | "snack";
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        note?: string;
        loggedAt?: string;
      };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const entry = await prisma.foodEntry.create({
        data: {
          userId: context.user.id,
          mealType: data.mealType,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          note: data.note,
          loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
        },
      });
      return { success: true, entry };
    },
  );

export const getFoodEntriesServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const entries = await prisma.foodEntry.findMany({
      where: { userId: context.user.id },
      orderBy: { loggedAt: "desc" },
    });
    return entries;
  });

export const deleteFoodEntryServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ entryId: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { entryId: string } }) => {
    const prisma = await getServerSidePrismaClient();
    const result = await prisma.foodEntry.deleteMany({
      where: { id: data.entryId, userId: context.user.id },
    });
    if (result.count === 0) {
      return { success: false, error: "Entry not found" };
    }
    return { success: true };
  });

export const getDailyNutritionServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { date: string } }) => {
    const prisma = await getServerSidePrismaClient();
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const whereClause = {
      userId: context.user.id,
      loggedAt: { gte: startOfDay, lte: endOfDay },
    };

    const [entries, aggregates] = await Promise.all([
      prisma.foodEntry.findMany({ where: whereClause }),
      prisma.foodEntry.aggregate({
        where: whereClause,
        _sum: { calories: true, protein: true, carbs: true, fat: true },
      }),
    ]);

    return {
      entries,
      totals: {
        calories: aggregates._sum.calories ?? 0,
        protein: aggregates._sum.protein ?? 0,
        carbs: aggregates._sum.carbs ?? 0,
        fat: aggregates._sum.fat ?? 0,
      },
    };
  });

export const getCalorieGoalServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: { calorieGoal: true },
    });
    return user?.calorieGoal ?? null;
  });

export const updateCalorieGoalServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ calorieGoal: z.number().int().min(0).max(10000).nullable() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { calorieGoal: number | null } }) => {
    const prisma = await getServerSidePrismaClient();
    await prisma.user.update({
      where: { id: context.user.id },
      data: { calorieGoal: data.calorieGoal },
    });
    return { success: true };
  });

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
      note: z.string().max(100).optional(),
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
    const entry = await prisma.foodEntry.findFirst({
      where: { id: data.entryId, userId: context.user.id },
    });
    if (!entry) {
      return { success: false, error: "Entry not found" };
    }
    await prisma.foodEntry.delete({ where: { id: data.entryId } });
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

    const entries = await prisma.foodEntry.findMany({
      where: {
        userId: context.user.id,
        loggedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return { entries, totals };
  });

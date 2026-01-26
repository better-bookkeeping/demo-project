import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
type MealType = (typeof MEAL_TYPES)[number];

export const createNutritionServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      food: z.string().min(1),
      calories: z.number().positive(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
      mealType: z.enum(MEAL_TYPES),
      recordedAt: z.date().optional(),
    })
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: {
        food: string;
        calories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        mealType: MealType;
        recordedAt?: Date;
      };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const nutrition = await prisma.nutrition.create({
        data: {
          userId: context.user.id,
          food: data.food,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          mealType: data.mealType,
          recordedAt: data.recordedAt ?? new Date(),
        },
      });
      return { success: true, nutrition };
    }
  );

export const getNutritionHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();
    const nutritions = await prisma.nutrition.findMany({
      where: { userId: context.user.id },
      orderBy: { recordedAt: "desc" },
    });
    return nutritions;
  });

export const getDailyNutritionServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      date: z.date(),
    })
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { date: Date };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const startOfDay = new Date(data.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(data.date);
      endOfDay.setHours(23, 59, 59, 999);

      const entries = await prisma.nutrition.findMany({
        where: {
          userId: context.user.id,
          recordedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { recordedAt: "asc" },
      });

      const totals = entries.reduce(
        (acc, entry) => ({
          calories: acc.calories + entry.calories,
          protein: acc.protein + (entry.protein ?? 0),
          carbs: acc.carbs + (entry.carbs ?? 0),
          fat: acc.fat + (entry.fat ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      return { entries, totals };
    }
  );

export const deleteNutritionServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(
    async ({ context, data }: { context: { user: { id: string } }; data: { id: string } }) => {
      const prisma = await getServerSidePrismaClient();
      await prisma.nutrition.deleteMany({
        where: { id: data.id, userId: context.user.id },
      });
      return { success: true };
    }
  );

export const getNutritionGoalServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();
    const goal = await prisma.nutritionGoal.findUnique({
      where: { userId: context.user.id },
    });
    return goal;
  });

export const createOrUpdateNutritionGoalServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      calories: z.number().positive(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    })
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: {
        calories: number;
        protein?: number;
        carbs?: number;
        fat?: number;
      };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const goal = await prisma.nutritionGoal.upsert({
        where: { userId: context.user.id },
        update: {
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        },
        create: {
          userId: context.user.id,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        },
      });
      return { success: true, goal };
    }
  );

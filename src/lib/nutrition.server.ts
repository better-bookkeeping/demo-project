import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { csrfMiddleware } from "@/lib/csrf.server";
import { z } from "zod";

export const addNutritionLogServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(
    z.object({
      calories: z.number().int().min(0).max(50000),
      carbsG: z.number().min(0).max(10000),
      proteinG: z.number().min(0).max(10000),
      fatG: z.number().min(0).max(10000),
    }),
  )
  .handler(
    async ({
      context,
      data,
    }: {
      context: { user: { id: string } };
      data: { calories: number; carbsG: number; proteinG: number; fatG: number };
    }) => {
      const prisma = await getServerSidePrismaClient();
      const entry = await prisma.nutritionLog.create({
        data: {
          userId: context.user.id,
          calories: data.calories,
          carbsG: data.carbsG,
          proteinG: data.proteinG,
          fatG: data.fatG,
        },
      });
      return { success: true as const, entry };
    },
  );

const timeRangeSchema = z.enum(["1W", "1M", "3M", "6M", "1Y", "All"]).optional();

export const getNutritionHistoryServerFn = createServerFn()
  .middleware([authMiddleware])
  .inputValidator(z.object({ range: timeRangeSchema }).optional())
  .handler(async ({ context, data }) => {
    const prisma = await getServerSidePrismaClient();
    const range = data?.range;
    let loggedAtFilter: { gte: Date } | undefined;
    if (range && range !== "All") {
      const days: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days[range]);
      loggedAtFilter = { gte: cutoff };
    }
    console.log(`[nutrition-history] range=${range ?? "All"} cutoff=${loggedAtFilter?.gte?.toISOString() ?? "none"}`);
    const results = await prisma.nutritionLog.findMany({
      where: { userId: context.user.id, ...(loggedAtFilter && { loggedAt: loggedAtFilter }) },
      orderBy: { loggedAt: "desc" },
    });
    console.log(`[nutrition-history] returned ${results.length} rows`);
    return results;
  });

export const getDailyNutritionSummaryServerFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const prisma = await getServerSidePrismaClient();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayEntries = await prisma.nutritionLog.findMany({
      where: {
        userId: context.user.id,
        loggedAt: { gte: startOfDay },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: { calorieGoal: true },
    });

    const totals = todayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        carbsG: acc.carbsG + entry.carbsG,
        proteinG: acc.proteinG + entry.proteinG,
        fatG: acc.fatG + entry.fatG,
      }),
      { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 },
    );

    return {
      ...totals,
      calorieGoal: user?.calorieGoal ?? null,
      entryCount: todayEntries.length,
    };
  });

export const updateCalorieGoalServerFn = createServerFn({ method: "POST" })
  .middleware([csrfMiddleware, authMiddleware])
  .inputValidator(z.object({ calorieGoal: z.number().int().min(0).nullable() }))
  .handler(
    async ({ context, data }: { context: { user: { id: string } }; data: { calorieGoal: number | null } }) => {
      const prisma = await getServerSidePrismaClient();
      await prisma.user.update({
        where: { id: context.user.id },
        data: { calorieGoal: data.calorieGoal },
      });
      return { success: true as const };
    },
  );
